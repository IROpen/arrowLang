#!/usr/bin/env node

const { ArrowCompiler , ArrowInterpreter } = require('../interpreter');
//const program = require('commander');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);
const unlink = promisify(require('fs').unlink);
const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const E = require('../std/env');
const f = [],md = {};

process.on('unhandledRejection', up => { throw up });

/*program
    .version(require('../package').version)
    .arguments('<file>').action(file=>(scriptFile=file))
    .option('--env-path <path>','path to env.js file')
    .option('--run','run result now')
    .parse(process.argv);*/

let program = require('yargs')
    .scriptName("arrowlang")
    .usage('$0 [Options] <file>')
    .alias('c','compile')
    .describe('compile program to JS')
    .option('env-path', {
        demandOption: true,
        default: "arrowlang/std/env",
        describe: 'locate the env-path',
        type: 'string'
    })
    .help()
    .argv;

let scriptFile = (program._[0]?program._[0]+"":"");

function runAtMe(file){
    //console.log(file);
    let prog = spawn('node',['-e',file]);
    process.stdin.pipe(prog.stdin);
    prog.stdout.pipe(process.stdout);
    prog.on('close',()=>process.exit(0));
    return prog;
}

async function main(){
    if (scriptFile !== ""){
        let itp = new ArrowCompiler();
        if (scriptFile.substr(-4) !== '.far'){
            scriptFile += '.far';
        }
        let wd = path.dirname(path.resolve(scriptFile));
        await writeFile(path.join(wd,'__arrow_requirer.js'),'module.exports = require;');
        itp.importer = require(path.join(wd,'__arrow_requirer.js'));
        let data = await readFile(scriptFile);
        //console.log(data.toString());
        itp.urlToData = async (url) => {
            let pth = path.join(path.dirname(path.resolve(scriptFile)),url)+'.far';
            let x = await readFile(pth);
			return { data : stdize(x+"") , id : pth };
        }
        itp.urlMerger = (url1,url2) => {
            url1 = path.dirname(url1);
            return path.join(url1,url2);
        }
        let { outputFile } = await itp.parseFile(stdize(data.toString()));
        outputFile = `const E = require("${program["env-path"]}");`+outputFile;
        scriptFile = scriptFile.substring(0,scriptFile.length - 3);
        scriptFile+="js";
        //console.log(outputFile);
        //await writeFile(scriptFile,outputFile);
        await unlink(path.join(wd,'__arrow_requirer.js'));
        if (program.compile){
            console.log(outputFile);
        }
        else{
            runAtMe(outputFile);
        }
    }
    else{
        let itp = new ArrowInterpreter();
        itp.urlToData = async (url) => {
            let pth = path.join(path.resolve(),url)+'.far';
            let x = await readFile(pth);
			return { data : stdize(x+"") , id : pth };
        }
        itp.urlMerger = (url1,url2) => {
            url1 = path.dirname(url1);
            return path.join(url1,url2);
        }
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const while1 = async (input) => {
            input = stdize(input);
            if (program.fingilish){
                input = f2f.fa2fi(input);
            }
            let jsCmd = await itp.parseCmd(input); 
            if (program.compile) 
                console.log(jsCmd);
            else
                eval(jsCmd);
            rl.question('\x1b[36m>>> \x1b[0m',while1);
        };
        rl.question('\x1b[36m>>> \x1b[0m',while1);
    }
}

function stdize(str){
	return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function(d) {
		return d.charCodeAt(0) - 1632; // Convert Arabic numbers
	}).replace(/[۰۱۲۳۴۵۶۷۸۹]/g, function(d) {
		return d.charCodeAt(0) - 1776; // Convert Persian numbers
	}).replace(/٪/g,'%');
}

main();