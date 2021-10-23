import {Argv} from "yargs";
import { ExceptionInfo } from "_debugger";
const fs = require('fs');
const path = require('path');

var OperationCount: number = 0;
var CompletionCount: number = 0;
var InputDirectory: string = "";
var OutputDirectory: string = "";

function convert(directory: string, outDirectory: string) {
    console.info(`Converting files in folder ${directory} ${outDirectory}`);
    InputDirectory = directory;
    OutputDirectory = outDirectory;

    let files: Array<string> = fs.readdirSync(directory);
    OperationCount = files.length;

    files.forEach((file: string) => {
        read_file(file);
    });
}

// async callbacks go
// convert (directories) 
//    -> each directory -> read_file -> process_file 
//        -> each entry output_file

function read_file(file: string){
    const input_location = path.join(InputDirectory, file);

    fs.readFile(input_location, 'utf8', (err: any, data: any) => {
        if (err) {
            throw err;
        }
        process_file(file, JSON.parse(data));
    });
}

function process_file(file: string, inputJson: any) {
    output_file(file, inputJson);
}

function output_file(file: string, outputJson: any){
    const data = JSON.stringify(outputJson, null, 4);
    const output_location = path.join(OutputDirectory, file);

    fs.writeFile(output_location, data, (err: any) => {
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