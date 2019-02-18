let f0 = (x,y)=>x+y
let f1 = (x,y)=>x*y
let f2 = x=>-x
let f3 = (x,y,z)=>(x?y:z)
let f4 = (x)=>({cmd:'print',val:x})
function enviroment(o){
  if (o.cmd=='print') console.log(o.val);
  throw 'invalid command';
}
enviroment(f0(2,3))
