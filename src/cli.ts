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
var DEFAULT_API_VERSION: string = "2019-02-02"

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

function convert(directory: string, outDirectory: string, version: string) {
    console.info(`Converting files in folder ${directory} ${outDirectory}`);
    InputDirectory = directory;
    OutputDirectory = outDirectory;

    let files: Array<string> = fs.readdirSync(directory);
    FileCount = files.length;

    files.forEach((file: string) => {
        readFile(file, version);
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
function requestUriConversion(uri: string, version: string): string {
    const parsedUrl = new URL(uri);

    if(!parsedUrl.searchParams.get('api-version')){
        parsedUrl.searchParams.set('api-version', version)
    }
    
    return parsedUrl.toString();
}

function processFile(file: string, inputJson: any, version: string) {
    const filePrefix = file.substring(0, file.lastIndexOf("."));
    if (inputJson.Entries !== undefined && inputJson.Entries.length > 0) {
        inputJson.Entries.forEach((entry: ProxyPayload, idx: number) => {
            let outFile = filePrefix + idx + ".json";
            let newEntry: ValidationPayload = {
                liveRequest: <LiveRequest>{},
                liveResponse: <LiveResponse>{}
            };
            
            // manipulate the request URI
            newEntry.liveRequest.url = requestUriConversion(entry.RequestUri, version);
            newEntry.liveRequest.headers = entry.RequestHeaders;

            // the request body is expected to be a JSON entry. Force that conversion if we can.
            newEntry.liveRequest.body = requestBodyConversion(entry.RequestBody, entry.RequestHeaders);
            newEntry.liveRequest.method = entry.RequestMethod;

            newEntry.liveResponse.body = entry.ResponseBody;
            newEntry.liveResponse.statusCode = entry.StatusCode.toString();
            newEntry.liveResponse.headers = entry.ResponseHeaders;

            outputFile(outFile, newEntry);
        });
    }
}

function readFile(file: string, version: string){
    const input_location = path.join(InputDirectory, file);

    fs.readFile(input_location, 'utf8', (err: any, data: any) => {
        if (err) {
            throw err;
        }
        let convertedJson: any = {};

        try {
            convertedJson = JSON.parse(data.charCodeAt(0) === 0xFEFF ? data.slice(1) : data)
        }
        catch (ex: any){
            console.log(input_location);
            console.log(ex);
            throw ex;
        }
        processFile(file, convertedJson, version);
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
        }).option('api-version', {
            alias: 'a',
            default: DEFAULT_API_VERSION,
            describe: `The api version expected to be used. Defaults to "${DEFAULT_API_VERSION}".`
        })
    }, (args: any) => {
        console.log(`Input Directory: ${args.directory}. Output Directory: ${args.directory}`)
        convert(args.directory, args.out, args.apiVersion);
        console.log(`Operating on ${FileCount} files.`)
    }).argv;