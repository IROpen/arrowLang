exports.enviroment = (o) => {
  if (typeof o.run == "function") o.run();
  else console.log(o);
};

exports.IoMonad = class {
	run(){
		this.innerF();
	}
	then(io){
		return new exports.IoMonad(async ()=>{await this.innerF();return await io.innerF(); } );
	}
	bind(fx_io){
		return new exports.IoMonad(async ()=>{
			let x = await this.innerF();
			return await fx_io(x).innerF();
		});
	}
	constructor(f){ this.innerF = f; }
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