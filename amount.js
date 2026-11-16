const D={零:0,〇:0,一:1,二:2,兩:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
const S={十:10,拾:10,百:100,佰:100,千:1000,仟:1000};
const B={萬:1e4,万:1e4,億:1e8,亿:1e8};
const U={k:1e3,rb:1e3,千:1e3,m:1e6,jt:1e6,萬:1e4,万:1e4,億:1e8,亿:1e8};
function chinese(s){let total=0,section=0,n=0;for(const c of s){if(c in D)n=D[c];else if(c in S){section+=(n||1)*S[c];n=0}else if(B[c]===1e8){total=(total+section+n)*1e8;section=0;n=0}else if(c in B){section=(section+n)*1e4;n=0}else return null}return total+section+n}
export function parseAmount(raw){const s=raw.trim().replace(/^rp\.?/i,'').replace(/[,，\s_]/g,'').toLowerCase();if(!s)return null;let value=null,explicit=false;const m=s.match(/^(\d+(?:\.\d*)?|\.\d+)(k|rb|m|jt|千|萬|万|億|亿)?$/);if(m){value=Number(m[1]);if(m[2]){value*=U[m[2]];explicit=true}}else if(/^[零〇一二兩两三四五六七八九十拾百佰千仟萬万億亿]+$/.test(s)){value=chinese(s);explicit=/[千仟萬万億亿]/.test(s)}if(value===null||!Number.isFinite(value)||value<0)return null;const idr=Math.round(explicit?value:value*1000);return idr<=1e15?idr:null}
export function applyKey(value,key){if(key==='clear')return '';if(key==='Backspace')return value.slice(0,-1);if(key==='.')return value.includes('.')?value:value?value+'.':'0.';if(/^\d$/.test(key))return value==='0'?key:value+key;return value}
