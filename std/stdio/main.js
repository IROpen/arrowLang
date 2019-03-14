const env = require('../env');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line',(data)=>{
    env.eventSystem.emit('process.stdin.line',data);
})

exports.getLine = (function () {
	const getLineGen = (async function* () {
		for await (const line of rl) {
			yield line;
	  	}
	})();
	return async () => ((await getLineGen.next()).value);
})();