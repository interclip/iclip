#!/usr/bin/env node

const figlet = require('figlet');
const validator = require('validator');
const qrcode = require('qrcode-terminal');
const dashdash = require('dashdash');
const clipboardy = require('clipboardy');
const fs = require('fs');
const FormData = require('form-data');

const fetch = require("node-fetch");

const cliArguments = process.argv;
const argument = cliArguments[2];

const options = [
    {
        names: ['qrcode', 'q'],
        type: 'bool',
        help: 'Print a QR code in every new clip.'
    },
    {
        names: ['copy', 'p'],
        type: 'bool',
        help: 'Copy the output to the clipboard.'
    },
    {
        names: ['clear', 'c'],
        type: 'bool',
        help: 'Make the output simple and clear.'
    },
    {
        names: ['endpoint', 'e'],
        type: 'string',
        help: 'Change the base URL of Interclip.'
    },
    {
        names: ['file', 'f'],
        type: 'string',
        help: 'A file to upload'
    },
];

const parser = dashdash.createParser({ options });

try {
    var opts = parser.parse(process.argv);
} catch (e) {
    console.error('Error: %s', e.message);
    process.exit(1);
}

const endpoint = opts.endpoint || "https://8080-teal-nightingale-r7f5pbt6.ws-eu13.gitpod.io";

!opts.clear && console.log(figlet.textSync(`Interclip`, { horizontalLayout: 'full' }));

if (argument && fs.existsSync(argument)) {
    const formData = new FormData();
    const buffer = fs.readFileSync(argument);

    formData.append("uploaded_file", buffer, "package.json");

    // Check if the file does not exceed 100MB
    if (buffer.length > 100000000) {
        console.log("File is too big!");
        process.exit(1);
    } else {
        // Output the human readable file size
        console.log(`File size: ${(fs.statSync(argument).size / 1000).toFixed(2)} KB`);
    }

    // Upload the provided file to Interclip (endpoint: https://interclip.app/upload/)
    console.log(`Uploading ${argument}... to ${endpoint}/upload/`);
    fetch(`${endpoint}/upload/?api`, {
        method: 'POST',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        body: formData
    }).then(response => {
        return response.json();
    }).then(json => {
        console.log(json);
        /*
        const url = json.url;

        console.log(`File uploaded to ${url}`);

        if (opts.qrcode) {
            qrcode.generate(url, {
                small: true,
                quiet: true
            });
        }

        if (opts.copy) {
            clipboardy.writeSync(url);
        }
        */
    });

} else if (argument && validator.isURL(argument)) {
    !opts.clear && console.log(`Creating clip from ${argument}`);
    fetch(`${endpoint}/includes/api?url=${argument}`).then((res) => {
        if (res.ok) {
            return res.json();
        } else {
            return null;
        }
    }).then(res => {
        if (res) {
            console.log(opts.clear ? `${argument} => ${res.result}` : `Code: ${res.result} ${opts.copy ? "(copied)" : ""}`);
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
    fetch(`${endpoint}/includes/get-api?code=${argument}`).then((res) => {
        if (res.ok) {
            return res.json();
        } else {
            return null;
        }
    }).then(res => {
        if (res) {
            console.log(opts.clear ? `${argument} => ${res.result}` : `URL: ${res.result} ${opts.copy ? "(copied)" : ""}`);
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