function evalc(x){
	console.log(x);
	eval(x);
}

itp = {
    rules : new Map([]),
    ruleCount : 0,
	registerRule : function (pat,customrule) {
		//console.log(this);
		pat = pat.split(' ');
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
		qu = qu.split(' ');
		let pbaz = [];
		let st = [];
		let lambdaStack = [];
		for (let i=0;i<qu.length;i++){
			if (qu[i]===')'){
				let ar = [];
				let pos = i;
				while (st[pos] !== '(' && st[pos] !== '(=>') pos--;
				for (let j=pos+1;j<st.length;j++) ar.push(st[j]);
				let jav = this.parseInner(ar);
				if (st[pos] === '(=>'){
					let lo = lambdaStack.pop();
					jav = `( (${lo.map((x)=>this.dict.get(x)).join(',')}) => ( ${jav} ) )`;
				}
				st.length = pos;
				st.push({task:"I",value:jav});
			}
			else if (qu[i] === '=>'){
				let ar = [];
				let pos = i;
				while (st[pos] !== '(') pos--;
				let lo = [];
				for (let j=pos+1;j<st.length;j++) {
					let v = st[j];
					if (v[0]!=='#'){
						throw "syntax error";
					}
					this.dict.set(v,"l"+lambdaStack.length+'_'+(j-pos+1));
					lo.push(v);
				}
				st.length = pos;
				lambdaStack.push(lo);
				st.push('(=>');
			}
			else{
				st.push(qu[i]);
			}
		}
		return this.parseInner(st);
	},
	parseInner : function (qu) {
		let n = qu.length;
		let dp = [],calced = [];
		for(let i=0;i<n;i++){
			dp[i]=[];
			calced[i]=[];
		}
		let calc = (l,r) => {



			var voroodi = [],voroodiBackup = [];

			let bctr = (h1,h2,rul) => {
				while (h2<rul.length && rul[h2]!='#'){
					if (h1==r || qu[h1]!=rul[h2]) return 0;
					h1++;h2++;
				}
				if (h1==r && h2==rul.length){
					voroodiBackup = Object.assign([],voroodi);
					return 1;
				}
				if (h1 == r || h2 == rul.length){
					return 0;
				}
				if (rul[h2]=='#'){
					let res=0;
					for (let i=h1+1;i<=r;i++){
					let x=calc(h1,i);
					if (x == undefined) continue;
					voroodi.push(x);
					//console.log(voroodi);
					res += bctr(i,h2+1,rul);
					voroodi.pop();
					if (res>1) return res;
					}
					return res;
				}

				return 0;
			};

			if (calced[l][r]){
				return dp[l][r];
			}
			calced[l][r]=1;
			if (l+1==r){
				if (qu[l].task !== undefined){
					if (qu[l].task === "I"){
						dp[l][r]=qu[l].value;
					}
				}
				else if (this.dict.get(qu[l])){
					dp[l][r]=this.dict.get(qu[l]);
				}
				else if (!isNaN(qu[l])){
					dp[l][r]=qu[l];
				}
				return dp[l][r];
			}
			//console.log(qu,l,qu[l]);
			let rr = this.rules.get(qu[l]);
			if (!rr) rr=[];
			for (let i = 0; i < rr.length; i++){
				let t = bctr(l,0,rr[i].pat);
				if (t){
					//console.log(voroodiBackup);
					if (rr[i].customRule == undefined)
						return dp[l][r]=rr[i].nam+'('+voroodiBackup.join(',')+')';
					else{
						return dp[l][r]=rr[i].customRule(voroodiBackup);
					}
				}
			}
			for (let p = l+1;p<r;p++){
			let c = calc(l,p);
			if (c==undefined) continue;
			voroodi.push(c);
			let rr = this.rules.get(qu[p]);
			if (!rr) rr=[];
			for (let i = 0; i < rr.length; i++){
				let t = bctr(p,1,rr[i].pat);
				if (t){
				//console.log(voroodiBackup);
				return dp[l][r]=rr[i].nam+'('+voroodiBackup.join(',')+')';
				}
			}
			voroodi.pop();
			}
		};
		let res = calc(0,n);
		//console.log(dp);
		return res;
    },
	parseInnerFunction : function (text,varlist){

	},
};

itp.jsRule('jam # ba #',(x,y)=>x+y);
itp.jsRule('zarb # dar #',(x,y)=>x*y);
itp.jsRule('manfi #',x=>-x);
itp.jsRule('agar # dorost bood # vagarna #',(x,y,z)=>(x?y:z),x=>`(${x[0]}?${x[1]}:${x[2]})`);
itp.jsRule('# ra chap kon',(x)=>new IoMonad(()=>console.log(x)));
itp.jsRule('# sepas #',(x,y) => x.then(y));
itp.jsRule('barabarie # ba #',(x,y)=>(x===y));
itp.jsRule('# |> #',(x,y)=>(y(x)));

evalc(`enviroment = (o) => {
  if (o instanceof IoMonad) o.run();
  else throw 'invalid command';
}`);

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
})

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
