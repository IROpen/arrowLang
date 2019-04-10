const EP = require('./earley-parser');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);

let paterner = txt => x => txt.replace(/v[0-9]+/g,(s)=>x[s.substr(1)]);

class ArrowCompiler {
	constructor(){
		this.rules = new Map([]);
		this.keywords = new Map([]);
		this.grammarRule= ['start -> root','root -> base'];
		this.ruleFuncs = [];
		this.grammarInnerVar = 0;
		this.einValue= [];
		this.dict = new Map([]);
		this.myUrl = '.';
	}
	registerRule (pat,customrule) {
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
			let st = [];
			//console.log(pat);
			pat.forEach((x)=>{
				if (x === '%COMBINE'){
					let b = st.pop();
					let a = st.pop();
					let vn = 'giv'+this.grammarInnerVar++;
					this.grammarRule.push(`${vn} -> ${a} ${b} ${vn} | ${a}`);
					st.push(vn);
				}
				else if (x === '%KLEENE'){
					let a = st.pop();
					let vn = 'giv'+this.grammarInnerVar++;
					this.grammarRule.push(`${vn} -> ${a} ${vn} | ${a}`);
					st.push(vn);
				}
				else if (x === '%)'){
					let vn = 'giv'+this.grammarInnerVar++;
					let ar = [];
					let pos = st.length - 1;
					while (st[pos] !== '%(') pos--;
					for (let i=pos+1;i<st.length;i++){
						ar.push(st[i]);
					}
					this.grammarRule.push(`${vn} -> ${ar.join(' ')}`);
					st.length = pos;
					st.push(vn);
				}
				else{
					st.push(x);
				}
			});
			//console.log(st);
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
			this.ruleFuncs.push(ar=>""+nam+ar.map(x=>`(${x})`).join(''));
		}
		ar.push(obj);
		return nam;
	}
	jsRule (pat,fun,customRule) {
		let cmd = `pat[${this.ruleFuncs.length}] = "${pat}"\n`;
		let nam = this.registerRule(pat,customRule);		
		cmd += `${nam} = ${fun}`;
		return cmd;
	}
	parse (qu){
		debugger;
		qu = qu.split(/\s+/g).filter((x)=>x!='');
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
				if (tree.value.task === "num" || tree.value.task === "text"){
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
			else if (qu[i].substr(0,3) === 'ein'){
				st.push({
					task: "text",
					value: this.einValue[qu[i].substr(3)]
				});
			}
			else{
				st.push(qu[i]);
			}
		}
		let mainTree = this.parseInner(st)[0];
		return treeToJS(mainTree);
	}
    parseInner(qu) {
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
		let beautier = token => {
            if (token.task){
                return '(...)';
			}
			return token;
		};
		let text = qu.map(tokener);
		let chart = EP.parse(text, grammar, "start");
		let trees = chart.getFinishedRoot("start");
		if (trees == null){
			console.log(text);
			console.log(this.grammarRule);
			throw `can not parse ${qu.map(beautier).join(' ')} `;
		}
		trees = trees.traverse();
        let attachToTree = function f(tree) {
        	tree.subtrees.forEach(f);
        	if (tree.left+1 === tree.right){
        		tree.value = qu[tree.left];
			}
		};
        trees.forEach(attachToTree);
        return trees;
	}
	eval(line){
		if (/^\s*$/.test(line)) return "";
		//line = stdize(line);
		line = line.replace(/"[^"]*"/g,(x) =>{
			this.einValue.push(x);
			return ` ein${this.einValue.length-1} `;
		});
		let cmd;
		if (line.match(/\s:=>\s/) !== null){
			let asn = line.split(/\s:=>\s/);
			if (asn[0].match(/^\s*%%%/g) != null){
				asn[0] = asn[0].split('%%%')[1];
				cmd = { pat : asn[0],text : asn[1] , type: 'declare' };
			}
			else{
				let pat = asn[0].split(/\s/g).filter(x=>x!=='');
				let varCount = 0;
				pat.forEach(x=>{
					if (x[0]=='%'){
						this.dict.set(x,'v'+varCount);
						varCount++;
					}
				});
				pat = pat.map(x=>(x[0]=='%'?'%':x)).join(' ');
				cmd = {pat,type:'declare',vc:varCount,text:asn[1]};
				//let nam = this.registerRule(pat);
			}
		}
		else if (line.match(/\s#=>\s/) !== null){
			let asn = line.split(/\s#=>\s/);
			let pat = asn[0].split(/\s/g).filter(x=>x!=='');
			let varCount = 0;
			pat.forEach(x=>{
				if (x[0]=='%'){
					this.dict.set(x,'v'+varCount);
					varCount++;
				}
			});
			pat = pat.map(x=>(x[0]=='%'?'%':x)).join(' ');
			let text = this.parse(asn[1]);
			cmd = { pat , type : 'declare-inline' , text};
		}
		else{
			if (line.match(/^\s*\$=>/) != null){
				let libname = line.split(/\s/g).filter(x=>x!='' && x!='$=>')[0];
				cmd = `const JSM_${libname} = require('${libname}');`;
			}
			else if (line.match(/^\s*=>/) != null){
				let makan = line.split(/\s/g).filter(x=>x!='' && x!='=>')[0];
				cmd = { type : 'import' , url : makan };
			}
			else
				cmd  = 'E.enviroment('+this.parse(line)+');';
		}
		return cmd;
	}
	parseDeclares (data) {
		let spliter = (s) => {
			s = s.toString();
            let ar = [];
            s = s.split('');
            let depth = 0;
            let t = "";
            s.forEach((element,i) => {
                if (element === '(' ) depth++;
                if (element === ')' ) depth--;
                if (depth === 0 && element === '.' && s[i+1] !== '/' && s[i+1] !== '.' && s[i-1] !== '.'){
                    ar.push(t);
                    t = "";
                }
                else{
                    t += element;
                }
            });
            ar.push(t);
            return ar;
        }
        data = spliter(data);
		//console.log(data);
		let declares = [];
        for (let i = 0; i < data.length ; i++){
			let line = data[i];
			if (line.match(/\s:=>\s/) !== null){
				let asn = line.split(/\s:=>\s/);
				if (asn[0].match(/^\s*%%%/g) != null){
					let pat = asn[0].split('%%%')[1];
					declares.push({pat,type : 'declare',nam:declares.length});
				}
				else{
					let pat = asn[0].split(/\s/g).filter(x=>x!=='');
					let varCount = 0;
					pat.forEach(x=>{
						if (x[0]=='%'){
							this.dict.set(x,'v'+varCount);
							varCount++;
						}
					});
					pat = pat.map(x=>(x[0]=='%'?'%':x)).join(' ');
					declares.push({pat,type : 'declare', nam:declares.length});
				}
			}
			else if (line.match(/\s#=>\s/) !== null){
				let asn = line.split(/\s#=>\s/);
				let pat = asn[0].split(/\s/g).filter(x=>x!=='');
				let varCount = 0;
				pat.forEach(x=>{
					if (x[0]=='%'){
						this.dict.set(x,'v'+varCount);
						varCount++;
					}
				});
				pat = pat.map(x=>(x[0]=='%'?'%':x)).join(' ');
				let text = this.parse(asn[1]);
				declares.push({ pat , type : 'declare-inline' , text});
			}
		}
		return { declares };
	}
	async parseFile (data,options={}){
		options.onlySelf = options.onlySelf || false;
		let spliter = (s) => {
            let ar = [];
            s = s.split('');
            let depth = 0;
            let t = "";
            s.forEach((element,i) => {
                if (element === '(' ) depth++;
                if (element === ')' ) depth--;
                if (depth === 0 && element === '.' && s[i+1] !== '/' && s[i+1] !== '.' && s[i-1] !== '.'){
                    ar.push(t);
                    t = "";
                }
                else{
                    t += element;
                }
            });
            ar.push(t);
            return ar;
        }
        data = spliter(data);
		//console.log(data);
		let imports = [], declares = [];
        let outputFile = `var f = [];\n`;
        for (let i = 0; i < data.length ; i++){
        //console.log(data[i]);
            let res = this.eval(data[i]);
            if (typeof res == "string"){
                outputFile += res + '\n';
            }
            else{
                if (res.type == 'import'){
					res.url = this.urlMerger(this.myUrl,res.url);
					imports.push(res.url);
					let dt = await this.urlToData(res.url);
					let dc = this.parseDeclares(dt.data);
					dc.declares.forEach((f,i)=>{
						if (f.type === 'declare'){
							this.registerRule(f.pat,
								(x) => `md["${dt.id}"].f[${i}]${x.map(t=>`(${t})`).join('')}`);	
						}
						else{
							this.registerRule(f.pat,paterner(f.text));
						}
					})
				}
				else if (res.type == 'declare'){
					declares.push(res);
					let fname = `f[${declares.length-1}]`;
					this.registerRule(res.pat,(x) => fname + x.map(t=>`(${t})`).join(''));
					res.text = ((res.vc === 0 || res.vc == null)
						? ""+this.parse(res.text)
						: `${(new Array(res.vc)).fill().map((x,i)=>'(v'+i+')').join('=>')} => ${this.parse(res.text)};` );
					outputFile += `${fname} = ${res.text};\n`;
				}
				else if (res.type == 'declare-inline'){
					declares.push(res);
					this.registerRule(res.pat,paterner(res.text));
				}
            }
		}
		if (!options.onlySelf){
			let depFile = `var md={};\n`;
			let mark = {};
			let dfs = async (url) => {
				let dt = await this.urlToData(url);
				if (mark[dt.id]) return;
				mark[dt.id]=true;
				let arper = new ArrowCompiler();
				arper.urlToData = this.urlToData;
				arper.urlMerger = this.urlMerger;
				arper.myUrl = url;
				let rs = await arper.parseFile(dt.data,{onlySelf : true});
				for ( let x of rs.imports ){
					await dfs(x);
				}
				depFile += `md["${dt.id}"]=(()=>{${rs.outputFile};return {f};})();\n`;
			};
			for (let x of imports){
				await dfs(x);
			}
			outputFile = depFile + outputFile;
		}
		return { outputFile , imports , declares };
	}
};

class ArrowInterpreter extends ArrowCompiler{
	constructor(){
		super();
		this.markedModules = {};
		this.dct = 0;
	}
	async parseCmd(data){
		let res = this.eval(data);
		if (typeof res == "string"){
			return res;
		}
		else if (res.type == 'import'){
			res.url = this.urlMerger(this.myUrl,res.url);
			let dt = await this.urlToData(res.url);
			let dc = this.parseDeclares(dt.data);
			dc.declares.forEach((f,i)=>{
				if (f.type === 'declare'){
					this.registerRule(f.pat,
						(x) => `md["${dt.id}"].f[${i}]${x.map(t=>`(${t})`).join('')}`);	
				}
				else{
					this.registerRule(f.pat,paterner(f.text));
				}
			});
			let depFile = "";
			let mark = this.markedModules;
			let dfs = async (url) => {
				let dt = await this.urlToData(url);
				if (mark[dt.id]) return;
				mark[dt.id]=true;
				let arper = new ArrowCompiler();
				arper.urlToData = this.urlToData;
				arper.urlMerger = this.urlMerger;
				arper.myUrl = url;
				let rs = await arper.parseFile(dt.data,{onlySelf : true});
				for ( let x of rs.imports ){
					await dfs(x);
				}
				depFile += `md["${dt.id}"]=(()=>{${rs.outputFile};return {f};})();\n`;
			};
			await dfs(res.url);
			return depFile;
		}
		else if (res.type == 'declare'){
			this.dct++;
			this.registerRule(res.pat,(x) => `f[${this.dct-1}]${x.map(t=>`(${t})`).join('')}`);
			res.text = ((res.vc == 0)
				? ""+this.parse(res.text)
				: `${(new Array(res.vc)).fill().map((x,i)=>'(v'+i+')').join('=>')} => ${this.parse(res.text)};` );	
			return `f[${this.dct-1}] = ${res.text};\n`;
		}
		else if (res.type == 'declare-inline'){
			this.registerRule(res.pat,paterner(res.text));
			return "";
		}
	}
}

/*
this.jsRule('jam % ba %',(x,y)=>x+y);
this.jsRule('zarb % dar %',(x,y)=>x*y);
this.jsRule('manfi %',x=>-x);
this.jsRule('agar % dorost bood % vagarna %',(x,y,z)=>(x?y:z),x=>`(${x[0]}?${x[1]}:${x[2]})`);
this.jsRule('% ra chap kon',(x)=>new IoMonad(()=>console.log(""+x)));
this.jsRule('% sepas %',(x,y) => x.then(y));
this.jsRule('barabarie % ba %',(x,y)=>(x===y));
this.jsRule('% |> %',(x,y)=>(to_func(y)(x)));
this.jsRule('[ % .. % ]',(a,b) => IMU.Range(a,b+1).toList());
this.jsRule('tabdil list % ba tabe %',(x,f) => x.map(to_func(f)));
this.jsRule('tajmie list % ba tabe %',(x,f) => x.reduce((a,b)=>to_func(to_func(f)(a))(b)));
this.jsRule('% [ % ]',(x,y)=>x.get(y));
this.jsRule('% [ % ]:= %',(x,y,z)=>x.set(y,z));
this.jsRule('tajmie list % ba tabe % ba paye %',(a,f,p)=>{
	a.forEach((x)=>{ p=f(p)(x) });
	return p;
});
this.jsRule('% :: %::',(x,y)=>x.push(y));

this.jsRule('{ % : % }',(x,y)=>IMU.Map().set(x,y));

this.jsRule('tarkib % ba %',(x,y)=>{
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




module.exports = { ArrowCompiler , ArrowInterpreter };