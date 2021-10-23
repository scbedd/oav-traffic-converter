import {Argv} from "yargs";
import { ExceptionInfo } from "_debugger";
const fs = require('fs');
const path = require('path');

var OperationCount: number = 0;
var CompletionCount: number = 0;
var InputDirectory: string = "";
var OutputDirectory: string = "";

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
    OperationCount = files.length;

    files.forEach((file: string) => {
        readFile(file);
    });
}

// async callbacks go
// convert (directories) 
//    -> each directory -> readFile -> processFile 
//        -> each entry outputFile

function processFile(file: string, inputJson: any) {
    const filePrefix = file.substring(0, file.lastIndexOf("."));

    inputJson.Entries.forEach((entry: any, idx: number) => {
        let outFile = filePrefix + idx + ".json";
        outputFile(outFile, entry);
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

        CompletionCount += 1;
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
        }).option('verbose', {
            alias: 'v',
            default: false,
        })
    }, (args: any) => {
        if (args.verbose) {
            console.info("Starting the server...");
        }
        convert(args.directory, args.out);
    }).argv;