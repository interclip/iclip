# iclip-cli
Interclip for your terminal!

![Screenshot](https://user-images.githubusercontent.com/29888641/114844900-89c94600-9ddb-11eb-87ce-17cc2cb811e9.png)

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
#### --verbose (-c)
Displays verbose output for debugging and more information in general.

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

#### --endpoint (-e)
Set a custom endpoint of the Interclip deployment 

##### Example command
```
iclip tasks -e https://interclip.app
```
