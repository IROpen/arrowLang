#!/usr/bin/env node

const itp = require('../interpreter');
//const program = require('commander');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);
const { spawn } = require('child_process');
const path = require('path');

process.on('unhandledRejection', up => { throw up });

/*program
    .version(require('../package').version)
    .arguments('<file>').action(file=>(scriptFile=file))
    .option('--env-path <path>','path to env.js file')
    .option('--run','run result now')
    .parse(process.argv);*/

let program = require('yargs')
    .scriptName("arrowlang")
    .usage('$0 <file> [Options]')
    .alias('r','run')
    .describe('run the program')
    .option('env-path', {
        demandOption: true,
        default: "arrowlang/std/env",
        describe: 'locate the env-path',
        type: 'string'
    })
    .help()
    .argv;

//console.log(program);

let scriptFile = program._[0];

function runAtMe(file){
    //console.log(file);
    let prog = spawn('node',[file]);
    process.stdin.pipe(prog.stdin);
    prog.stdout.pipe(process.stdout);
    prog.on('close',()=>process.exit(0));
    return prog;
}

async function main(){
    if (scriptFile !== ""){
        if (scriptFile.substr(-4) !== '.far'){
            scriptFile += '.far';
        }
        itp.workDir = path.dirname(path.resolve(scriptFile));
        let data = await readFile(scriptFile);
        //console.log(data.toString());
        let spliter = (s) => {
            let ar = [];
            s = s.split('');
            let depth = 0;
            let t = "";
            s.forEach((element,i) => {
                if (element === '(' ) depth++;
                if (element === ')' ) depth--;
                if (depth === 0 && element === '.' && s[i+1] !== '/'){
                    ar.push(t);
                    t = "";
                }
                else{
                    t += element;
                }
            });
            ar.push(t);
            return ar;
        }
        data = spliter(data.toString());
        //console.log(data);
        let outputFile = `
            const { enviroment , IoMonad , eventSystem } = require('${program.envPath}');
            module.exports.arrow = {f:[],pat:[],typ:[]};
            var f = module.exports.arrow.f;
            var pat = module.exports.arrow.pat;
            var typ = module.exports.arrow.typ;
        `;
        for (let i = 0; i < data.length ; i++){
        //console.log(data[i]);
            let res = itp.eval(data[i]);
            outputFile += res + '\n';
        }
        scriptFile = scriptFile.substring(0,scriptFile.length - 3);
        scriptFile+="js";
        await writeFile(scriptFile,outputFile);
        if (program.run) runAtMe(scriptFile);
    }
}

main();