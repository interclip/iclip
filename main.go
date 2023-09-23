package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

var verbose bool

func main() {
	var rootCmd = &cobra.Command{
		Use:   "<path_to_file>",
		Short: "Upload a file to Interclip",
		Args:  cobra.ExactArgs(1),
		Run:   uploadFile,
	}

	rootCmd.Flags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")
	rootCmd.Execute()
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

func uploadFile(cmd *cobra.Command, args []string) {
	filePath := args[0]

	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		fmt.Println("Error fetching file info:", err)
		return
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
		return
	}

	q := req.URL.Query()
	q.Add("name", fileInfo.Name())
	q.Add("type", mimeType)
	q.Add("size", fmt.Sprintf("%d", fileInfo.Size()))
	req.URL.RawQuery = q.Encode()

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error fetching presigned URL:", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Println("Failed to get presigned URL:", resp.Status)
		return
	}

	var presignedData struct {
		URL    string            `json:"url"`
		Fields map[string]string `json:"fields"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&presignedData); err != nil {
		fmt.Println("Error decoding response:", err)
		return
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
		return
	}
	io.Copy(part, file)

	writer.Close()

	uploadReq, err := http.NewRequest(http.MethodPost, presignedData.URL, &b)
	if err != nil {
		fmt.Println("Error creating upload request:", err)
		return
	}
	uploadReq.Header.Set("Content-Type", writer.FormDataContentType())

	uploadResp, err := http.DefaultClient.Do(uploadReq)
	if err != nil {
		fmt.Println("Error uploading file:", err)
		return
	}
	defer uploadResp.Body.Close()

	if uploadResp.StatusCode >= 400 {
		fmt.Println("Upload failed with HTTP", uploadResp.Status)
		return
	}

	if verbose {
		fmt.Println("File uploaded successfully!")
	}
	fmt.Printf("https://files.interclip.app/%s\n", presignedData.Fields["key"])
}
