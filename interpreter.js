const IMU = require('immutable');
const EP = require('./earley-parser');

function evalc(x){
	console.log(x);
	eval(x);
}

itp = {
    rules : new Map([]),
    keywords : new Map([]),
    grammarRule: ['start -> root','root -> base'],
    ruleCount : 0,
	ruleFuncs : [],
	registerRule : function (pat,customrule) {
		pat = pat.split(' ');
		this.grammarRule.push("root -> r"+this.ruleCount);
		this.grammarRule.push("r"+this.ruleCount+" -> " + pat.map((x)=>{
		    if (x[0]==='#'){
		        return "root";
            }
		    if (!this.keywords.has(x)){
		        let nam = "k"+this.keywords.size;
		        this.keywords.set(x,nam);
            }
		    return this.keywords.get(x);
        }).join(' '));
		let key = pat.find((x) => x != '#');
		let ar = this.rules.get(key);
		if (!ar){
			ar = [];
			this.rules.set(key,ar);
		}
		let nam = 'f'+this.ruleCount;
		this.ruleCount++;
		let obj ={pat,nam};
		if (customrule != undefined){
			obj.customRule = customrule;
			this.ruleFuncs.push(customrule);
		}
		else{
			this.ruleFuncs.push(ar=>`${nam}(${ar.join(',')})`);
		}
		ar.push(obj);
		return nam;
	},
	jsRule : function (pat,fun,customRule) {
		let nam = this.registerRule(pat,customRule);
		evalc(`${nam} = ${fun}`);
	},
	dict : new Map([]),

	parse : function (qu){
		qu = qu.split(/[ \n]+/g);
		let pbaz = [];
		let st = [];
		let lambdaStack = [];
		for (let i=0;i<qu.length;i++){
			if (!isNaN(qu[i])){
				st.push({task:"num",value:Number(qu[i])});
			}
			else if (qu[i][0]==='#'){
				st.push({task:"var",value:qu[i]});
			}
			else if (qu[i]===')'){
				let ar = [];
				let pos = i;
				while (st[pos] !== '(' && st[pos] !== '(=>') pos--;
				for (let j=pos+1;j<st.length;j++) ar.push(st[j]);
				let jav = this.parseInner(ar);
				if (st[pos] === '(=>'){
					let lo = lambdaStack.pop();
					jav = {task:"lambda",vars:lo,value:jav};
				}
				else{
					jav = {task:"tree",value:jav};
				}
				st.length = pos;
				st.push(jav);
			}
			else if (qu[i] === '=>'){
				let ar = [];
				let pos = i;
				while (st[pos] !== '(') pos--;
				let lo = [];
				for (let j=pos+1;j<st.length;j++) {
					let v = st[j];
					if (v.task !== "var"){
						throw "syntax error";
					}
					this.dict.set(v.value,"l"+lambdaStack.length+'_'+(j-pos+1));
					lo.push(v.value);
				}
				st.length = pos;
				lambdaStack.push(lo);
				st.push('(=>');
			}
			else{
				st.push(qu[i]);
			}
		}
		let mainTree = this.parseInner(st)[0];
		let rf = this.ruleFuncs;
		let vardic = this.dict;
		let treeToJS = function f(tree){
			if (tree.subtrees == undefined){
				return tree;
			}
			if (tree.subtrees.length === 0){
				if (tree.value.task == undefined){
					return "key";
				}
				if (tree.value.task === "lambda"){
					let jsized = f(tree.value.value[0]);
					return `((${tree.value.vars.map(x=>vardic.get(x)).join(',')}) => ${jsized})`;
				}
				if (tree.value.task === "tree"){
					return f(tree.value.value[0]);
				}
				if (tree.value.task === "num"){
					return ""+tree.value.value;
				}
				if (tree.value.task === "var"){
					return vardic.get(tree.value.value);
				}
			}
			let childs = tree.subtrees.map(f).filter((x)=>x!=='key');
			if (/^r[0-9]+$/.test(tree.root)){
				return rf[tree.root.substr(1)](childs);
			}
			return childs.join(' ');
		};
		return treeToJS(mainTree);
	},
    parseInner: function (qu) {
        let grammar = new EP.Grammar(this.grammarRule);
        grammar.terminalSymbols(token => token);
        let tokener = token => {
            if (token.task){
                return 'base';
            }
            if (!this.keywords.has(token)){
                throw token+" is not defined";
            }
            return this.keywords.get(token);
        };
        let text = qu.map(tokener);
        let chart = EP.parse(text, grammar, "start");
        let trees = chart.getFinishedRoot("start").traverse();
        let attachToTree = function f(tree) {
        	tree.subtrees.forEach(f);
        	if (tree.left+1 === tree.right){
        		tree.value = qu[tree.left];
			}
		};
        trees.forEach(attachToTree);
        return trees;
    }
};


evalc(`enviroment = (o) => {
  if (o instanceof IoMonad) o.run();
  else throw 'invalid command';
};
to_func = (f) => (typeof f == "function"?f:(f instanceof IMU.List || f instanceof IMU.Map ? ( (a)=>f.get(a) ) : ( (a)=>f[a] ) ) ) ;
`);

itp.jsRule('jam # ba #',(x,y)=>x+y);
itp.jsRule('zarb # dar #',(x,y)=>x*y);
itp.jsRule('manfi #',x=>-x);
itp.jsRule('agar # dorost bood # vagarna #',(x,y,z)=>(x?y:z),x=>`(${x[0]}?${x[1]}:${x[2]})`);
itp.jsRule('# ra chap kon',(x)=>new IoMonad(()=>console.log(""+x)));
itp.jsRule('# sepas #',(x,y) => x.then(y));
itp.jsRule('barabarie # ba #',(x,y)=>(x===y));
itp.jsRule('# |> #',(x,y)=>(to_func(y)(x)));
itp.jsRule('[ # .. # ]',(a,b) => IMU.Range(a,b+1).toList());
itp.jsRule('tabdil list # ba tabe #',(x,f) => x.map(to_func(f)));
itp.jsRule('tajmie list # ba tabe #',(x,f) => x.reduce((a,b)=>to_func(to_func(f)(a))(b)));
itp.jsRule('# [ # ]',(x,y)=>x.get(y));
itp.jsRule('# [ # ]:= #',(x,y,z)=>x.set(y,z));
itp.jsRule('tajmie list # ba tabe # ba paye #',(a,f,p)=>{
	a.forEach((x)=>{ p=f(p)(x) });
	return p;
});
itp.jsRule('# :: #::',(x,y)=>x.push(y));

itp.jsRule('{ # : # }',(x,y)=>IMU.Map().set(x,y));

itp.jsRule('tarkib # ba #',(x,y)=>{
	if (x instanceof IMU.Map === y instanceof IMU.Map){
		return x.merge(y);
	}
	y.forEach((val,key)=>{
		x = x.set(key,val);
	});
	return x;
});

//jad a :=> tabdil list [ 1 .. 5 ] ba tabe ( #x => [ 1 .. 5 ] )
//jad b :=> tajmie list [ 0 .. 4 ] ba tabe ( #jad #x => #jad [ #x ] [ #x ]:= 0 ) ba paye jad a


var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line){
    let asn = line.split(' :=> ');
    let cmd;
    if (asn.length == 2){
		let pat = asn[0].split(' ');
		let varCount = 0;
		pat.forEach(x=>{
				if (x[0]=='#'){
					itp.dict.set(x,'v'+varCount);
					varCount++;
				}
			});
			pat = pat.map(x=>(x[0]=='#'?'#':x)).join(' ');
			let nam = itp.registerRule(pat);
			cmd = `${nam} = (${(new Array(varCount)).fill().map((x,i)=>'v'+i).join(',')}) => ${itp.parse(asn[1])};`;
    }
    else{
		cmd  = 'enviroment('+itp.parse(asn[0])+')';
    }
    evalc(cmd);
});

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
