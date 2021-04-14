# iclip-cli
Interclip for your terminal!

## Instalation
It's very easy, just go to your terminal, and execute the following:
```bash
npm i -g interclip
```

## Usage
### Basic usage
```bash
iclip <code|url> --options
```
#### Example usage
##### Create a clip
```bash
iclip https://github.com/aperta-principium/Interclip
```

##### Fetch a clip by its code
```bash
iclip sgejf
```
### Options
#### --clear (-c)
Displays the output in a clean manner, for example:
```bash
iclip tasks -c
```
yields
```bash
tasks => https://taskord.com/
```
#### --copy (-p)
Copy the result of the command
##### Example command 
```bash
iclip tasks -p
```

#### --qrcode (-q)
Display a QR code for the result of your command
##### Example command
```
iclip tasks -q
```

