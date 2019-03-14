
            const { enviroment , IoMonad , eventSystem } = require('./env');
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
pat[4] = "اگر % درست بود % وگرنه %";
typ[4] = "inline";
f[4] = "((v0) ? (v1) : (v2))";
pat[5] = "برابری % با %";
typ[5] = "inline";
f[5] = "((v0) === (v1))";
pat[6] = "بزرگتری % از %";
typ[6] = "inline";
f[6] = "((v0) > (v1))";
pat[7] = "کوچکتری % از %";
typ[7] = "inline";
f[7] = "((v0) < (v1))";
pat[8] = "% سپس %";
typ[8] = "inline";
f[8] = "((v0) .then (v1))";
enviroment((new IoMonad(()=>require('./stdio/main'))));
pat[9] = "هرگاه % رخ داد %"
f[9] = (v0,v1) => (new IoMonad(()=>eventSystem.registerEvent(new eventSystem.Event( (v0) , (v1) ) ) ));
enviroment(f[9](("process.stdin.line"),f[0](5)));

