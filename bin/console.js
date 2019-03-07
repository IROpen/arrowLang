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
    
}