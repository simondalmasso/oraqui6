// Latest typical Quini6 post-draw window, Monday/Thursday 02:15 UTC
// = Sunday/Wednesday 23:15 Argentine time (UTC-3).
export function latestResultWindow(now=Date.now()){
 if(!Number.isFinite(now))return null;
 const date=new Date(now);
 const base=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),2,15);
 for(let days=0;days<8;days++){
  const timestamp=base-days*86400000;
  const weekday=new Date(timestamp).getUTCDay();
  if((weekday===1||weekday===4)&&timestamp<=now)return new Date(timestamp).toISOString();
 }
 return null;
}
