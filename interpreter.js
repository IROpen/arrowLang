const EP = require('./earley-parser');

itp = {
    rules : new Map([]),
    keywords : new Map([]),
    grammarRule: ['start -> root','root -> base'],
	ruleFuncs : [],
	grammarInnerVar : [],
	registerRule : function (pat,customrule) {
		let patParser = pat => {
			pat = pat.filter(x => x !== '');
			pat = pat.map((x)=>{
				if (x==='%'){
					return "root";
				}
				if (x[0] === '%'){
					return x;
				}
				if (!this.keywords.has(x)){
					let nam = "k"+this.keywords.size;
					this.keywords.set(x,nam);
				}
				return this.keywords.get(x);
			});
			st = [];
			pat.forEach((x)=>{
				if (x === '%COMBINE'){
					let b = st.pop();
					let a = st.pop();
					let vn = 'giv'+this.grammarInnerVar.length;
					this.grammarRule.push(`${vn} -> ${a} ${b} ${vn} | ${a}`);
					st.push(vn);
				}
				else{
					st.push(x);
				}
			});
			return st.join(' ');
		};
		pat = pat.split(/\s/g);
		this.grammarRule.push("root -> r"+this.ruleFuncs.length);
		this.grammarRule.push("r"+this.ruleFuncs.length+" -> " + patParser(pat));
		let key = pat.find((x) => x != '%');
		let ar = this.rules.get(key);
		if (!ar){
			ar = [];
			this.rules.set(key,ar);
		}
		let nam = 'f['+this.ruleFuncs.length+']';
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
		let cmd = `pat[${this.ruleFuncs.length}] = "${pat}"\n`;
		let nam = this.registerRule(pat,customRule);		
		cmd += `${nam} = ${fun}`;
		return cmd;
	},
	dict : new Map([]),

	parse : function (qu){
		qu = qu.split(/[ \n]+/g).filter((x)=>x!='');
		let pbaz = [];
		let st = [];
		let lambdaStack = [];
		let shouldPlain = 0;
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
					return '('+tree.value.vars.map(x=>`(${vardic.get(x)})`).join('=>')+' => '+jsized+')';
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
				if (tree.value.task === "plain"){
					return `(${tree.value.value})`;
				}
			}
			let childs = tree.subtrees.map(f).filter((x)=>x!=='key');
			if (/^r[0-9]+$/.test(tree.root)){
				return rf[tree.root.substr(1)](childs);
			}
			return childs.join(',');
		};
		for (let i=0;i<qu.length;i++){
			if (shouldPlain){
				if (qu[i] === '$)'){
					let ar = [];
					let pos = i;
					while (st[pos] !== '($') pos--;
					for (let j=pos+1;j<st.length;j++) ar.push(st[j]);
					//console.log(ar);
					let jsText = ar.map((x)=>(x.task == 'tree'? `(${treeToJS(x.value[0])})` :x)).join(' ');
					st.length = pos;
					st.push({task:"plain",value:jsText});
					shouldPlain = 0;
				}
				else if (qu[i] == '($'){
					shouldPlain = 0;
					st.push(qu[i]);	
				}
				else {
					st.push(qu[i]);
				}
			}
			else if (!isNaN(qu[i])){
				st.push({task:"num",value:Number(qu[i])});
			}
			else if (qu[i][0]==='%'){
				st.push({task:"var",value:qu[i]});
			}
			else if (qu[i]===')' || qu[i] == '$)'){
				let ar = [];
				let pos = i;
				if (qu[i]==')')
					while (st[pos] !== '(' && st[pos] !== '(=>') pos--;
				else
					while (st[pos] !== '($') pos--;
				for (let j=pos+1;j<st.length;j++) ar.push(st[j]);
				let jav = this.parseInner(ar);
				if (st[pos] === '(=>'){
					let lo = lambdaStack.pop();
					jav = {task:"lambda",vars:lo,value:jav};
				}
				else{
					jav = {task:"tree",value:jav};
				}
				if (st[pos] ==='($'){
					shouldPlain = 1;
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
			else if (qu[i] === '($'){
				shouldPlain = 1;
				st.push(qu[i]);
			}
			else{
				st.push(qu[i]);
			}
		}
		let mainTree = this.parseInner(st)[0];
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
	},
	eval: function (line){
		let paterner = txt => x => txt.replace(/v[0-9]+/g,(s)=>x[s.substr(1)])
		if (/^\s*$/.test(line)) return "";
		line = stdize(line);
		let cmd;
		if (line.match(' :=> ') !== null){
			let asn = line.split(' :=> ');
			if (asn[0].match(/^\s%%%/g) != null){
				asn[0] = asn[0].split('%%%')[1];
				cmd = this.jsRule(asn[0],this.parse(asn[1]));
			}
			else{
				let pat = asn[0].split(/\s/g).filter(x=>x!=='');
				let varCount = 0;
				pat.forEach(x=>{
					if (x[0]=='%'){
						itp.dict.set(x,'v'+varCount);
						varCount++;
					}
				});
				pat = pat.map(x=>(x[0]=='%'?'%':x)).join(' ');
				cmd = `pat[${this.ruleFuncs.length}] = "${pat}"\n`;
				let nam = itp.registerRule(pat);
				cmd += `${nam} = (${(new Array(varCount)).fill().map((x,i)=>'v'+i).join(',')}) => ${itp.parse(asn[1])};`;
			
			}
		}
		else if (line.match(' #=> ') !== null){
			let asn = line.split(' #=> ');
			let pat = asn[0].split(/\s/g).filter(x=>x!=='');
			let varCount = 0;
			pat.forEach(x=>{
				if (x[0]=='%'){
					itp.dict.set(x,'v'+varCount);
					varCount++;
				}
			});
			pat = pat.map(x=>(x[0]=='%'?'%':x)).join(' ');
			cmd = `pat[${this.ruleFuncs.length}] = "${pat}";\n`;
			cmd += `typ[${this.ruleFuncs.length}] = "inline";\n`;
			let txt = itp.parse(asn[1]);
			let nam = itp.registerRule(pat,paterner(txt));
			cmd += `${nam} = "${txt}";`;
		}
		else{
			if (line.match(/^\s*\$=>/) != null){
				let libname = line.split(/\s/g).filter(x=>x!='' && x!='$=>')[0];
				cmd = `const JSM_${libname} = require('${libname}');`;
			}
			else if (line.match(/^\s*=>/) != null){
				let makan = line.split(/\s/g).filter(x=>x!='' && x!='=>')[0];
				
				let lib = this.importer(makan);
				cmd = ` { let lib = require("${makan}"); \n`;
				lib.arrow.pat.forEach((x,i)=>{
					if (lib.arrow.typ[i] == "inline"){
						cmd += `pat[${this.ruleFuncs.length}] = "${x}";\n`;
						cmd += `typ[${this.ruleFuncs.length}] = "inline";\n`;
						let nam = itp.registerRule(x,paterner(lib.arrow.f[i]));
						cmd += `${nam} = "${lib.arrow.f[i]}";\n`;
					}
					else
						cmd += itp.jsRule(x,`lib.arrow.f[${i}]; \n`);
				});
				cmd += ' } ';
			}
			else
				cmd  = 'enviroment('+itp.parse(line)+');';
		}
		return cmd;
	}
};


/*
itp.jsRule('jam % ba %',(x,y)=>x+y);
itp.jsRule('zarb % dar %',(x,y)=>x*y);
itp.jsRule('manfi %',x=>-x);
itp.jsRule('agar % dorost bood % vagarna %',(x,y,z)=>(x?y:z),x=>`(${x[0]}?${x[1]}:${x[2]})`);
itp.jsRule('% ra chap kon',(x)=>new IoMonad(()=>console.log(""+x)));
itp.jsRule('% sepas %',(x,y) => x.then(y));
itp.jsRule('barabarie % ba %',(x,y)=>(x===y));
itp.jsRule('% |> %',(x,y)=>(to_func(y)(x)));
itp.jsRule('[ % .. % ]',(a,b) => IMU.Range(a,b+1).toList());
itp.jsRule('tabdil list % ba tabe %',(x,f) => x.map(to_func(f)));
itp.jsRule('tajmie list % ba tabe %',(x,f) => x.reduce((a,b)=>to_func(to_func(f)(a))(b)));
itp.jsRule('% [ % ]',(x,y)=>x.get(y));
itp.jsRule('% [ % ]:= %',(x,y,z)=>x.set(y,z));
itp.jsRule('tajmie list % ba tabe % ba paye %',(a,f,p)=>{
	a.forEach((x)=>{ p=f(p)(x) });
	return p;
});
itp.jsRule('% :: %::',(x,y)=>x.push(y));

itp.jsRule('{ % : % }',(x,y)=>IMU.Map().set(x,y));

itp.jsRule('tarkib % ba %',(x,y)=>{
	if (x instanceof IMU.Map === y instanceof IMU.Map){
		return x.merge(y);
	}
	y.forEach((val,key)=>{
		x = x.set(key,val);
	});
	return x;
});
*/
//jad a :=> tabdil list [ 1 .. 5 ] ba tabe ( %x => [ 1 .. 5 ] )
//jad b :=> tajmie list [ 0 .. 4 ] ba tabe ( %jad %x => %jad [ %x ] [ %x ]:= 0 ) ba paye jad a


function stdize(str){
	return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, function(d) {
		return d.charCodeAt(0) - 1632; // Convert Arabic numbers
	}).replace(/[۰۱۲۳۴۵۶۷۸۹]/g, function(d) {
		return d.charCodeAt(0) - 1776; // Convert Persian numbers
	}).replace(/٪/g,'%');
}

module.exports = itp;