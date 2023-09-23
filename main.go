package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"

	"github.com/atotto/clipboard"
	"github.com/spf13/cobra"
)

var verbose bool
var uploadOnly bool
var copyOnCreate bool

func main() {
	var rootCmd = &cobra.Command{
		Use:   "<path_to_file>",
		Short: "Upload a file to Interclip",
		Args:  cobra.ExactArgs(1),
		Run:   detectInputAndRun,
	}

	rootCmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")
	rootCmd.Flags().BoolVarP(&uploadOnly, "upload-only", "u", false, "only upload the file, don't create a clip")
	rootCmd.Flags().BoolVarP(&copyOnCreate, "copy-on-create", "c", false, "copy the result to clipboard")

	rootCmd.Execute()
}

func fileExists(filename string) bool {
	_, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return err == nil
}

func isURL(str string) bool {
	u, err := url.Parse(str)
	return err == nil && u.Scheme != "" && u.Host != ""
}

func isClipCode(s string) bool {
	match, _ := regexp.MatchString(`(?i)^[a-z0-9]{5}$`, s)
	return match
}

func exit(result string) {
	fmt.Print(result)
	if copyOnCreate {
		clipboard.WriteAll(result)
		fmt.Print(" (copied to clipboard)")
	}
	fmt.Println()
	os.Exit(0)
}

func detectInputAndRun(cmd *cobra.Command, args []string) {
	argument := args[0]
	if fileExists(argument) {
		fileURL := uploadFile(argument)
		if fileURL != "" {
			if uploadOnly {
				exit(fileURL)
			} else {
				clipURL, err := createClip(fileURL)
				if err != nil {
					fmt.Println("Error creating clip for file:", err)
					os.Exit(1)
				}
				exit(clipURL)
			}
		} else {
			os.Exit(1)
		}
	} else if isURL(argument) {
		clipURL, err := createClip(argument)
		if err != nil {
			fmt.Println("Error creating clip:", err)
			os.Exit(1)
		}
		exit(clipURL)
	} else if isClipCode(argument) {
		clipURL, err := retrieveClip(argument)
		if err != nil {
			fmt.Println("Error retrieving clip:", err)
			os.Exit(1)
		}
		exit(clipURL)
	}

	fmt.Println("Failed to detect input type. Please use a URL, clip code or a file path.")
	os.Exit(1)
}

type Response struct {
	Status string `json:"status"`
	Result string `json:"result"`
}

func createClip(urlToSubmit string) (string, error) {
	apiEndpoint := "https://interclip.app/api/set"

	data := url.Values{}
	data.Set("url", urlToSubmit)

	resp, err := http.PostForm(apiEndpoint, data)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var response Response
	err = json.Unmarshal(respBody, &response)
	if err != nil {
		return "", err
	}

	if response.Status == "success" {
		return response.Result, nil
	}

	return "", fmt.Errorf("API response: %s", response.Result)
}

func retrieveClip(code string) (string, error) {
	apiEndpoint := "https://interclip.app/api/get"

	u, err := url.Parse(apiEndpoint)
	if err != nil {
		return "", err
	}
	q := u.Query()
	q.Set("code", code)
	u.RawQuery = q.Encode()

	resp, err := http.Get(u.String())
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var response Response
	err = json.Unmarshal(respBody, &response)
	if err != nil {
		return "", err
	}

	if response.Status == "success" {
		return response.Result, nil
	}

	return "", fmt.Errorf("API response: %s", response.Result)
}

func detectMIMEType(file *os.File) string {
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil {
		return "application/octet-stream"
	}

	file.Seek(0, 0)

	return http.DetectContentType(buffer)
}

func uploadFile(filePath string) string {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return ""
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		fmt.Println("Error fetching file info:", err)
		return ""
	}

	mimeType := detectMIMEType(file)

	if verbose {
		fmt.Println("Preparing upload...")
	}

	// Get the S3 presigned URL
	urlToFetch := "https://iclip.vercel.app/api/uploadFile"
	req, err := http.NewRequest(http.MethodGet, urlToFetch, nil)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return ""
	}

	q := req.URL.Query()
	q.Add("name", fileInfo.Name())
	q.Add("type", mimeType)
	q.Add("size", fmt.Sprintf("%d", fileInfo.Size()))
	req.URL.RawQuery = q.Encode()

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error fetching presigned URL:", err)
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Println("Failed to get presigned URL:", resp.Status)
		return ""
	}

	var presignedData struct {
		URL    string            `json:"url"`
		Fields map[string]string `json:"fields"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&presignedData); err != nil {
		fmt.Println("Error decoding response:", err)
		return ""
	}

	if verbose {
		fmt.Println("Got presigned URL. Uploading file...")
	}

	// Upload the file to the presigned URL
	var b bytes.Buffer
	writer := multipart.NewWriter(&b)

	for key, value := range presignedData.Fields {
		_ = writer.WriteField(key, value)
	}

	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		fmt.Println("Error creating form file:", err)
		return ""
	}
	io.Copy(part, file)

	writer.Close()

	uploadReq, err := http.NewRequest(http.MethodPost, presignedData.URL, &b)
	if err != nil {
		fmt.Println("Error creating upload request:", err)
		return ""
	}
	uploadReq.Header.Set("Content-Type", writer.FormDataContentType())

	uploadResp, err := http.DefaultClient.Do(uploadReq)
	if err != nil {
		fmt.Println("Error uploading file:", err)
		return ""
	}
	defer uploadResp.Body.Close()

	if uploadResp.StatusCode >= 400 {
		fmt.Println("Upload failed with HTTP", uploadResp.Status)
		return ""
	}

	if verbose {
		fmt.Println("File uploaded successfully!")
	}
	return fmt.Sprintf("https://files.interclip.app/%s", presignedData.Fields["key"])
}
