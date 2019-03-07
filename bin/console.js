#!/usr/bin/env node

const itp = require('../interpreter');
const program = require('commander');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);


var scriptFile = "";

program
    .version('0.2.0')
    .arguments('<file>').action(file=>(scriptFile=file))
    .parse(process.argv);

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
	    for (let i = 0; i < data.length ; i++){
		//console.log(data[i]);
            let res = itp.eval(data[i]);
            console.log(res);
	    }
    });
    
}