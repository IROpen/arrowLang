
            const { enviroment , IoMonad } = require('arrowLang/std/env');
            module.exports.arrow = {f:[],pat:[],typ:[]};
            var f = module.exports.arrow.f;
            var pat = module.exports.arrow.pat;
            var typ = module.exports.arrow.typ;
            
        pat[0] = "% را چاپ کن"
f[0] = (v0) => (new IoMonad(()=>console.log ( (v0) )));
pat[1] = "جمع % با %";
typ[1] = "inline";
f[1] = "((v0) + (v1))";
pat[2] = "ضرب % با %";
typ[2] = "inline";
f[2] = "((v0) * (v1))";
pat[3] = "منفی %";
typ[3] = "inline";
f[3] = "(- (v0))";
enviroment(f[0](((2) + (7))));

