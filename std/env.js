exports.enviroment = (o) => {
  if (typeof o.run == "function") o.run();
  else console.log(o);
};

exports.IoMonad = class {
	run(){
		this.innerF();
	}
	then(io){
		return new exports.IoMonad(()=>{this.innerF();return io.innerF(); } );
	}
	bind(fx_io){
		return new exports.IoMonad(()=>{
			let x = this.innerF();
			return fx_io(x).innerF();
		});
	}
	constructor(f){ this.innerF = f; }
}
