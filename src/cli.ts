#!/usr/bin/env node

import figlet from "figlet";
import validator from "validator";
import qrcode from "qrcode-terminal";
import dashdash from "dashdash";
import clipboardy from "clipboardy";
import fs from "node:fs";
import path from "node:path";
import FormData from "form-data";
import type { S3 } from 'aws-sdk';
import mime from "mime-types";
import { convertXML } from "simple-xml-to-json";
import fetch from "node-fetch";
import { APIError, requestClip } from ".";
import formatBytes from "./lib/formatBytes";

const cliArguments = process.argv;
const argument = cliArguments[2];

const options = [
  {
    names: ["qrcode", "q"],
    type: "bool",
    help: "Print a QR code in every new clip.",
  },
  {
    names: ["copy", "p"],
    type: "bool",
    help: "Copy the output to the clipboard.",
  },
  {
    names: ["clear", "c"],
    type: "bool",
    help: "Make the output simple and clear.",
  },
  {
    names: ["endpoint", "e"],
    type: "string",
    help: "Change the base URL of Interclip.",
  },
  {
    names: ["file", "f"],
    type: "string",
    help: "A file to upload",
  },
];

const parser = dashdash.createParser({ options: options });
const opts = parser.parse(process.argv);

const endpoint: string = opts.endpoint || "https://beta.interclip.app";
const filesEndpoint: string = opts.filesEndpoint || "https://files.interclip.app";

if (argument && fs.existsSync(argument)) {
  const buffer = fs.readFileSync(argument);

  const fileName = path.basename(argument);
  const fileType = mime.lookup(argument);

  // Check if the file does not exceed 100MB
  if (buffer.length > 100_000_000) {
    console.error("File is too big!");
    process.exit(1);
  } else {
    // Output the human readable file size
    console.log(
      `File size: ${(fs.statSync(argument).size / 1000).toFixed(2)} KB`
    );
  }

  fetch(`${endpoint}/api/uploadFile?name=${fileName}&type=${fileType}`)
    .then(async (response) => {
      if (!response.ok) {
        switch (response.status) {
          case 404:
            throw new APIError('API Endpoint not found');
          case 500:
            throw new APIError('Generic fail');
          case 503:
            throw new APIError((await response.json()).result);
        }
      }
      return response.json();
    })
    .then(async (data) => {
      const { url, fields }: S3.PresignedPost = data;
      const formData = new FormData();
      // eslint-disable-next-line unicorn/no-array-for-each
      Object.entries({ ...fields, file: buffer }).forEach(
        ([key, value]: [key: string, value: any]) => {
          formData.append(key, value);
        }
      );
      const upload = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (upload.ok) {
        const fileURL = `${filesEndpoint}/${fields.key}`;;
        console.log(`File uploaded to ${fileURL}`);

        const clipData = await requestClip(fileURL, endpoint);
        
        if (clipData.status === "error") {
          console.error(`Error: ${clipData.result}`);
          process.exit(-1);
        }
        const miniCode = clipData.result.code.slice(0, clipData.result.hashLength);

        if (opts.qrcode) {
          qrcode.generate(miniCode, {
            small: true,
          });
        }
        if (opts.copy) {
          clipboardy.writeSync(miniCode);
        }

        console.log(`Code: ${miniCode}`);
      } else {
        const plainText = await upload.text();
        const jsonResponse = convertXML(plainText);
        const erorrMsg = jsonResponse.Error.children[0].Code.content;

        switch (erorrMsg) {
          case 'EntityTooLarge':
            const fileSize = jsonResponse.Error.children[2].ProposedSize.content;
            throw new APIError(`File too large (${formatBytes(fileSize)})`);
          case 'AccessDenied':
            throw new APIError('Access Denied to the bucket');
          default:
            throw new APIError('Upload failed.');
        }
      }
    })
} else if (argument && validator.isURL(argument)) {
  !opts.clear && console.log(`Creating clip from ${argument}`);
  fetch(`${endpoint}/api/clip/set?url=${argument}`)
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        return null;
      }
    })
    .then((res: ClipData | null) => {
      if (res && res.status === "success") {
        console.log(
          opts.clear
            ? `${argument} => ${res.result}`
            : `Code: ${res.result} ${opts.copy ? "(copied)" : ""}`
        );
        if (opts.qrcode) {
          qrcode.generate(`${endpoint}/${res.result.code}`);
        }
        opts.copy && clipboardy.writeSync(res.result.code);
      } else {
        console.log(`Error: ${res}`);
      }
    });
} else if (argument && argument.length === 5) {
  !opts.clear && console.log(`Getting clip from code ${argument}`);
  fetch(`${endpoint}/api/clip/get?code=${argument}`)
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        return null;
      }
    })
    .then((res: ClipData | null) => {
      if (res && res.status === "success") {
        console.log(
          opts.clear
            ? `${argument} => ${res.result}`
            : `URL: ${res.result} ${opts.copy ? "(copied)" : ""}`
        );
        if (opts.qrcode) {
          qrcode.generate(`${argument}`);
        }
        opts.copy && clipboardy.writeSync(res.result.url);
      } else {
        console.log(`Error: ${res}`);
      }
    });
} else {
  console.log("Nothing to do!");
}
