#!/usr/bin/env node

const itp = require('../interpreter');
const program = require('commander');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);

var scriptFile = "";

program
    .version(require('../package').version)
    .arguments('<file>').action(file=>(scriptFile=file))
    .option('--env-path <path>','path to env.js file')
    .parse(process.argv);

program.envPath = program.envPath || "arrowlang/std/env";

if (scriptFile !== ""){
    if (scriptFile.substr(-4) !== '.far'){
        scriptFile += '.far';
    }
    readFile(scriptFile).then(data=>{
        //console.log(data.toString());
        let spliter = (s) => {
            let ar = [];
            s = s.split('');
            let depth = 0;
            let t = "";
            s.forEach(element => {
                if (element === '(' ) depth++;
                if (element === ')' ) depth--;
                if (depth === 0 && element === '.'){
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
            const { enviroment , IoMonad } = require('${program.envPath}');
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
        writeFile(scriptFile,outputFile);
    });
    
}