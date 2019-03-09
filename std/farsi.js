
            const { enviroment , IoMonad } = require('arrowLang/std/env');
            module.exports.arrow = {f:[],pat:[]};
            var f = module.exports.arrow.f;
            var pat = module.exports.arrow.pat;
        pat[0] = "% را چاپ کن"
f[0] = (v0) => new IoMonad(()=>console.log ( v0 ));
pat[1] = "جمع % با %"
f[1] = (v0,v1) => v0 + v1;
enviroment(f[0](f[1](2,4)));

