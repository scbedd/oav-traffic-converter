/*
The only requirements actually necessary are native node types `fs` and `path`.

`yargs` is only used for the CLI interface to make testing this easy.

Order of execution:
Get Directories -> convert()
    foreach discovered file -> readFile() -> processFile()
        fireach generated entry outputFile()
*/

import {Argv} from "yargs";
import { ExceptionInfo } from "_debugger";
const fs = require('fs');
const path = require('path');

var FileCount: number = 0;
var InputDirectory: string = "";
var OutputDirectory: string = "";
var CONTENT_TYPE_KEY: string = "Content-Type"

interface ProxyPayload {
    RequestUri: string;
    RequestMethod: string;
    RequestHeaders: {};
    RequestBody: string;
    ResponseHeaders: {};
    ResponseBody: {};
    StatusCode: string;
}

interface ProxyPayloads {
    Entries: Array<ProxyPayload>;
}

interface LiveRequest {
    body: any;
    method: string;
    url: string;
    headers: any;
}

interface LiveResponse {
    body: any;
    statusCode: string;
    headers: any;
}

interface ValidationPayload {
    liveRequest: LiveRequest;
    liveResponse: LiveResponse;
}

function convert(directory: string, outDirectory: string) {
    console.info(`Converting files in folder ${directory} ${outDirectory}`);
    InputDirectory = directory;
    OutputDirectory = outDirectory;

    let files: Array<string> = fs.readdirSync(directory);
    FileCount = files.length;

    files.forEach((file: string) => {
        readFile(file);
    });
}

function requestBodyConversion(body: string, headers: any) {
    if (CONTENT_TYPE_KEY in headers) {
        let content: string = headers[CONTENT_TYPE_KEY];

        if ( content.indexOf("application/json") > -1 )
        {
            return JSON.parse(body);
        }
    }

    return body;
}

function processFile(file: string, inputJson: any) {
    const filePrefix = file.substring(0, file.lastIndexOf("."));

    inputJson.Entries.forEach((entry: ProxyPayload, idx: number) => {
        let outFile = filePrefix + idx + ".json";
        let newEntry: ValidationPayload = {
            liveRequest: <LiveRequest>{},
            liveResponse: <LiveResponse>{}
        };

        newEntry.liveRequest.url = entry.RequestUri;
        newEntry.liveRequest.headers = entry.RequestHeaders;
        newEntry.liveRequest.body = requestBodyConversion(entry.RequestBody, entry.RequestHeaders);
        newEntry.liveRequest.method = entry.RequestMethod;
        
        newEntry.liveResponse.body = entry.ResponseBody;
        newEntry.liveResponse.statusCode = entry.StatusCode.toString();
        newEntry.liveResponse.headers = entry.ResponseHeaders;

        outputFile(outFile, newEntry);
    });
}

function readFile(file: string){
    const input_location = path.join(InputDirectory, file);

    fs.readFile(input_location, 'utf8', (err: any, data: any) => {
        if (err) {
            throw err;
        }
        processFile(file, JSON.parse(data));
    });
}

function outputFile(file: string, outputJson: ValidationPayload){
    const data = JSON.stringify(outputJson, null, 4);
    const outputLocation = path.join(OutputDirectory, file);

    fs.writeFile(outputLocation, data, (err: any) => {
        if (err) {
            throw err;
        }
    });
}

require('yargs')
    .command('convert', "Convert a folder", (yargs: Argv) => {
        yargs.option('directory', {
            alias: 'd',
            describe: "The targeted input directory."
        }).option('out', {
            alias: 'o',
            describe: "The targeted output directory."
        })
    }, (args: any) => {
        console.log(`Input Directory: ${args.directory}. Output Directory: ${args.directory}`)
        convert(args.directory, args.out);
        console.log(`Operating on ${FileCount} files.`)
    }).argv;