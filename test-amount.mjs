import assert from 'node:assert/strict';
import {parseAmount,applyKey} from './amount.js';
for(const [v,n] of [['50',50000],['175.5',175500],['175.',175000],['150K',150000],['十五萬',150000],['三百',300000],['一億兩千萬',120000000],['-1',null],['oops',null],['',null]])assert.equal(parseAmount(v),n,v);
assert.equal(applyKey('0','5'),'5');assert.equal(applyKey('1.5','.'),'1.5');assert.equal(applyKey('','.'),'0.');assert.equal(applyKey('50','Backspace'),'5');assert.equal(applyKey('50','clear'),'');
console.log('15 amount/keypad checks passed');
