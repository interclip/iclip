#!/usr/bin/env node

const figlet = require('figlet');
const validator = require('validator');
const qrcode = require('qrcode-terminal');
const dashdash = require('dashdash');
const clipboardy = require('clipboardy');

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
];
 
const parser = dashdash.createParser({options: options});
try {
    var opts = parser.parse(process.argv);
} catch (e) {
    console.error('Error: %s', e.message);
    process.exit(1);
}

!opts.clear && console.log(figlet.textSync(`Interclip`,  {horizontalLayout: 'full'}));

if (validator.isURL(argument)) {
    !opts.clear && console.log(`Creating clip from ${argument}`);
    fetch(`https://interclip.app/includes/api?url=${argument}`).then((res) => {
        if (res.ok) {
            return res.json();
        } else {
            return null;
        }
    }).then(res => {
        if (res) {
            console.log(opts.clear ? `${argument} => ${res.result}` : `Code: ${res.result}`);
            if (opts.qrcode) {
                qrcode.generate(`https://interclip.app/${res.result}`);
            }
            opts.copy && clipboardy.writeSync(res.result);
        } else {
            console.log(`Error: ${res}`);
        }
    });
} else if (argument.length === 5) {
    !opts.clear && console.log(`Getting clip from code ${argument}`);
    fetch(`https://interclip.app/includes/get-api?code=${argument}`).then((res) => {
        if (res.ok) {
            return res.json();
        } else {
            return null;
        }
    }).then(res => {
        if (res) {
            console.log(opts.clear ? `${argument} => ${res.result}` : `URL: ${res.result}`);
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