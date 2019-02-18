class List {
    constructor(head,tail){
        this.head = head;
        this.tail = tail;
    }
}

class Grammar {
    rules = [];
    ruleByHead = {};
    addRule(head, rule) {
        let id = this.rules.push({head,rule})-1;
        if (this.ruleByHead[head] == undefined){
            this.ruleByHead[head] = [];
        }
        this.ruleByHead[head].push(id);
    }
    parse(ar,root){
        let n = ar.length;
        let s = new Array(n+1).fill().map(()=>[]);
        s[0].push({rule:[root],head:'#',pr:0,ps:0,tree:undefined})
        for (let i=0;i<=n;i++){
            let mark = {};
            for (let j=0;j<=s[i].length;j++){
                let state = s[i][j];
                if (state.pr == state.rule.length){
                    //Completer
                    let x = state.ps;
                    for (let k=0;k<s[x].length;k++){
                        let rl = s[x][k];
                        if (rl.rule[rl.pr]==state.head){
                            let nrl = Object.assign({},rl);
                            nrl.pr++;
                            nrl.tree = new List(state.tree,rl.tree);
                            s[i].push(nrl);
                        }
                    }
                }
                else {
                    let B = state.rule[state.pr];
                    if (ar[i] == B) {
                        let nrl = Object.assign({}, state);
                        nrl.pr++;
                        nrl.tree = new List({l: k, r: i + 1}, rl.tree);
                        s[i + 1].push(nrl);
                    }
                    if (!mark[B]){
                        mark[B]=1;

                    }
                }
            }
        }
    }
}

/*TODO: delete it in future*/