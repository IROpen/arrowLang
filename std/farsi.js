
            const { enviroment , IoMonad } = require('./env');
            module.exports = {f:[],pat:[]};
            var f = module.exports.f;
            var pat = module.exports.pat;
        f[0] = (v0) => new IoMonad(()=>console.log ( v0 ));
f[1] = (v0,v1) => v0 + v1;
enviroment(f[0](f[1](2,4)));

