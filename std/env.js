exports.enviroment = (o) => {
  if (typeof o.run == "function") o.run();
  else console.log(o);
};

exports.IoMonad = class {
	async run(ct){
		if (ct === undefined){
			ct = {
				isCancel : false,
				onCancel : ()=>{},
			};
		}
		try{
			return await this.innerF(ct);
		} catch(e){
			if (e === "IO aborted"){
				return "IO aborted";
			}
			else{
				throw e;
			}
		}
	}
	then(io){
		return new exports.IoMonad(async (ct)=>{await this.innerF(ct);return io.innerF(ct); } );
	}
	bind(fx_io){
		return new exports.IoMonad(async (ct)=>{
			let x = await this.innerF(ct);
			return fx_io(x).innerF(ct);
		});
	}
	constructor(f){ this.innerF = f; }
}

exports.parallelMonad = function(...works){
	return new exports.IoMonad((ct)=>{
		if (ct.isCancel) throw "IO aborted";
		let cts = works.map(()=>{
			return new exports.IoController();
		});
		//TODO: handle on cancel correctly
		return Promise.all(works.map((w,i)=>w.innerF(cts[i])));
	});
}

exports.simpleIoMonad = function (f){
	return new exports.IoMonad(async (ct)=>{
		if (ct.isCancel) throw "IO aborted";
		return f();
	});
}

exports.IoController = function (){
	this.isCancel = false;
	this.cancel = () => {
		this.isCancel = true;
		if (this.onCancel)
			this.onCancel();
	}
}


exports.eventSystem = {
	eventList : [],
	emit : function(str,...args){
		this.eventList.forEach(element => {
			if (element.test(str)){
				if (element.task instanceof exports.IoMonad){
					element.task.run();
				}
				else{
					element.task(...args).run();
				}
			}
		});
	},
	registerEvent : function(event){
		this.eventList.push(event);
	},
	Event : class {
		constructor(matcher,task){
			if (typeof matcher === "string"){
				this.test = (x) => x === matcher;
			}
			else if (matcher instanceof RegExp){
				this.test = (x) => matcher.test(x);
			}
			else{
				this.test = matcher;
			}
			this.task = task;
		}
	},
};