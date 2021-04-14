#!/usr/bin/env node

const figlet = require('figlet');
const validator = require('validator');
const qrcode = require('qrcode-terminal');

const fetch = require("node-fetch");

const cliArguments = process.argv;
const argument = cliArguments[2];

console.log(figlet.textSync(`Interclip`,  {horizontalLayout: 'full'}));

if (validator.isURL(argument)) {
    console.log(`Creating clip from ${argument}`);
    fetch(`https://interclip.app/includes/api?url=${argument}`).then((res) => {
        if (res.ok) {
            return res.json();
        } else {
            return null;
        }
    }).then(res => {
        if (res) {
            console.log(`Code: ${res.result}`);
            //qrcode.generate(`https://interclip.app/${res.result}`);
        } else {
            console.log(figlet.textSync(`Error: ${res}`,  {horizontalLayout: 'full'}));
        }
    });
} else if (argument.length === 5) {
    console.log(`Getting clip from code ${argument}`);
    fetch(`https://interclip.app/includes/get-api?code=${argument}`).then((res) => {
        if (res.ok) {
            return res.json();
        } else {
            return null;
        }
    }).then(res => {
        if (res) {
            console.log(`URL: ${res.result}`);
        } else {
            console.log(`Error: ${res}`);
        }
    });
} else {
    console.log("Nothing to do!");
}