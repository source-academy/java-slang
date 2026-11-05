const fs=require('fs')
const dv=new DataView(new ArrayBuffer(8))
const toD=s=>{dv.setBigInt64(0,BigInt(s));return dv.getFloat64(0)}
const toB=d=>{dv.setFloat64(0,d);return dv.getBigInt64(0)}
const js={cbrt:Math.cbrt,exp:Math.exp,cosh:Math.cosh,tanh:Math.tanh,pow:Math.pow,atan2:Math.atan2,hypot:Math.hypot}
const picked={},special={}
const isSpecial=(v)=>!Number.isFinite(v)||v===0||Object.is(v,-0)
for(const f of ['vectors.txt','vectors2.txt']){
 for(const line of fs.readFileSync(process.argv[2]+'/'+f,'utf8').trim().split('\n')){
  const p=line.split(' ');const n=p[0]
  const args=p.slice(1,-1).map(toD)
  const nb=(b)=>{dv.setBigInt64(0,b);const d=dv.getFloat64(0);return d!==d}
  // functions where JS Math differs: keep cases JS gets wrong
  if(js[n]){
    const got=toB(js[n](...args)),exp=BigInt(p[p.length-1])
    if(got!==exp&&!(nb(got)&&nb(exp))){const a=(picked[n]=picked[n]||[]);if(a.length<6&&!a.some(x=>x[0]===line))a.push([line])}
  }
  // plus a few special-value cases of every function
  if(args.some(isSpecial)){const a=(special[n]=special[n]||[]);if(a.length<5&&!a.some(x=>x[0]===line))a.push([line])}
 }
}
const out={}
for(const n of new Set([...Object.keys(picked),...Object.keys(special)]))out[n]={differs:(picked[n]||[]).map(x=>x[0]),special:(special[n]||[]).map(x=>x[0])}
fs.writeFileSync(process.argv[2]+'/picked.json',JSON.stringify(out,null,1))
console.log(Object.entries(out).map(([k,v])=>k+':'+v.differs.length+'+'+v.special.length).join(' '))
