import {Argv} from "yargs";

function convert(directory: string, outDirectory: string) {
    console.info(`Converting files in folder ${directory} ${outDirectory}`);
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