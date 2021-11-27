#!/usr/bin/env node

import figlet from "figlet";
import validator from "validator";
import qrcode from "qrcode-terminal";
import dashdash from "dashdash";
import clipboardy from "clipboardy";
import { SetGetResponse } from "../types";

import fetch from "node-fetch";

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
];

const parser = dashdash.createParser({ options: options });
const opts = parser.parse(process.argv);

const endpoint: string = opts.endpoint || "https://interclip.app";

!opts.clear &&
  console.log(figlet.textSync(`Interclip`, { horizontalLayout: "full" }));

if (argument && validator.isURL(argument)) {
  !opts.clear && console.log(`Creating clip from ${argument}`);
  fetch(`${endpoint}/api/set?url=${argument}`)
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        return null;
      }
    })
    .then((res: SetGetResponse | null) => {
      if (res && res.status === "success") {
        console.log(
          opts.clear
            ? `${argument} => ${res.result}`
            : `Code: ${res.result} ${opts.copy ? "(copied)" : ""}`
        );
        if (opts.qrcode) {
          qrcode.generate(`${endpoint}/${res.result}`);
        }
        opts.copy && clipboardy.writeSync(res.result);
      } else {
        console.log(`Error: ${res}`);
      }
    });
} else if (argument && argument.length === 5) {
  !opts.clear && console.log(`Getting clip from code ${argument}`);
  fetch(`${endpoint}/api/get?code=${argument}`)
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        return null;
      }
    })
    .then((res: SetGetResponse | null) => {
      if (res && res.status === "success") {
        console.log(
          opts.clear
            ? `${argument} => ${res.result}`
            : `URL: ${res.result} ${opts.copy ? "(copied)" : ""}`
        );
        if (opts.qrcode) {
          qrcode.generate(`${argument}`);
        }
        opts.copy && clipboardy.writeSync(res.result);
      } else {
        console.log(`Error: ${res}`);
      }
    });
} else {
  console.log("Nothing to do!");
}
