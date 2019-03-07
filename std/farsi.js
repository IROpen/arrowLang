
module.exports.arrow = {f:[],pat:[]};
var f = module.exports.arrow.f;
var pat = module.exports.arrow.pat;

enviroment = (o) => {
  if (typeof o.run == "function") o.run();
  else console.log(o);
};
to_func = (f) => (typeof f == "function"?f:(f instanceof IMU.List || f instanceof IMU.Map ? ( (a)=>f.get(a) ) : ( (a)=>f[a] ) ) ) ;



class IoMonad {
	run(){
		this.innerF();
	}
	then(io){
		return new IoMonad(()=>{this.innerF();return io.innerF(); } );
	}
	bind(fx_io){
		return new IoMonad(()=>{
			let x = this.innerF();
			return fx_io(x).innerF();
		});
	}
	constructor(f){ this.innerF = f; }
}


pat[0] = "jam % ba %"
f[0] = (x,y)=>x+y
pat[1] = "zarb % dar %"
f[1] = (x,y)=>x*y
pat[2] = "manfi %"
f[2] = x=>-x
pat[3] = "agar % dorost bood % vagarna %"
f[3] = (x,y,z)=>(x?y:z)
pat[4] = "% ra chap kon"
f[4] = (x)=>new IoMonad(()=>console.log(""+x))
pat[5] = "% sepas %"
f[5] = (x,y) => x.then(y)
pat[6] = "barabarie % ba %"
f[6] = (x,y)=>(x===y)
pat[7] = "% |> %"
f[7] = (x,y)=>(to_func(y)(x))
pat[8] = "[ % .. % ]"
f[8] = (a,b) => IMU.Range(a,b+1).toList()
pat[9] = "tabdil list % ba tabe %"
f[9] = (x,f) => x.map(to_func(f))
pat[10] = "tajmie list % ba tabe %"
f[10] = (x,f) => x.reduce((a,b)=>to_func(to_func(f)(a))(b))
pat[11] = "% [ % ]"
f[11] = (x,y)=>x.get(y)
pat[12] = "% [ % ]:= %"
f[12] = (x,y,z)=>x.set(y,z)
pat[13] = "tajmie list % ba tabe % ba paye %"
f[13] = (a,f,p)=>{
	a.forEach((x)=>{ p=f(p)(x) });
	return p;
}
pat[14] = "% :: %::"
f[14] = (x,y)=>x.push(y)
pat[15] = "{ % : % }"
f[15] = (x,y)=>IMU.Map().set(x,y)
pat[16] = "tarkib % ba %"
f[16] = (x,y)=>{
	if (x instanceof IMU.Map === y instanceof IMU.Map){
		return x.merge(y);
	}
	y.forEach((val,key)=>{
		x = x.set(key,val);
	});
	return x;
}
pat[17] = "% را چاپ کن"
f[17] = (v0) => new IoMonad(()=>console.log ( v0 ));
pat[18] = "جمع % با %"
f[18] = (v0,v1) => v0 + v1;
enviroment(f[17](f[18](2,4)))
