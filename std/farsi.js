
            const { enviroment , IoMonad , eventSystem } = require('arrowlang/std/env');
            module.exports.arrow = {f:[],pat:[],typ:[]};
            var f = module.exports.arrow.f;
            var pat = module.exports.arrow.pat;
            var typ = module.exports.arrow.typ;
         { let lib = require("./main"); 
pat[0] = "% <| %";
typ[0] = "inline";
f[0] = "((v0) (v1))";
pat[1] = "% |> %";
typ[1] = "inline";
f[1] = "((v1) (v0))";
pat[2] = "% !> %";
typ[2] = "inline";
f[2] = "((v0) .bind (v1))";
 } 
pat[3] = "% را چاپ کن";
typ[3] = "inline";
f[3] = "(new IoMonad(()=>console.log ( (v0) )))";
pat[4] = "جمع % با %";
typ[4] = "inline";
f[4] = "((v0) + (v1))";
pat[5] = "ضرب % با %";
typ[5] = "inline";
f[5] = "((v0) * (v1))";
pat[6] = "منفی %";
typ[6] = "inline";
f[6] = "(- (v0))";
pat[7] = "اگر % درست بود % وگرنه %";
typ[7] = "inline";
f[7] = "((v0) ? (v1) : (v2))";
pat[8] = "برابری % با %";
typ[8] = "inline";
f[8] = "((v0) === (v1))";
pat[9] = "بزرگتری % از %";
typ[9] = "inline";
f[9] = "((v0) > (v1))";
pat[10] = "کوچکتری % از %";
typ[10] = "inline";
f[10] = "((v0) < (v1))";
pat[11] = "% سپس %";
typ[11] = "inline";
f[11] = "((v0) .then (v1))";
enviroment((new IoMonad(()=>require('./stdio/main'))));
pat[12] = "هرگاه % رخ داد %"
f[12] = (v0,v1) => (new IoMonad(()=>eventSystem.registerEvent(new eventSystem.Event( (v0) , (v1) ) ) ));
pat[13] = "یک خط ورودی بگیر"
f[13] = () => (new IoMonad(require('./stdio/main').getLine));
pat[14] = "برنامه را ببند"
f[14] = () => (new IoMonad(()=>process.exit(0)));
enviroment(((f[13]()) .bind (((l0_2) => (new IoMonad(()=>console.log ( (l0_2) )))))));

