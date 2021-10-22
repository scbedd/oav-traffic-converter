import {Argv} from "yargs";

function convert(directory: string) {
    console.info(`Converting files in folder ${directory}`);
}

require('yargs')
    .command('convert', "Convert a folder", (yargs: Argv) => {
        yargs.option('directory', {
            describe: "the targeted directory"
        }).option('verbose', {
            alias: 'v',
            default: false,
        })
    }, (args: any) => {
        if (args.verbose) {
            console.info("Starting the server...");
        }
        convert(args.directory);
    }).argv;