const privateMap=new WeakMap,initPrivate=e=>privateMap.set(e,{}),$=e=>privateMap.get(e);export class Manager{constructor(e){const t=this;initPrivate(t);const n=$(t);n.t=0,n.i=0,n.o=Symbol("dataSource"),n.s=new WeakMap,n.options={enabled:!0,u:!1,l:10,p:"$$watch",h:"$$watchDeep",m:null,g:50,getTime:"undefined"!=typeof performance?()=>performance.now():()=>Date.now()},n.M=[],n.v=new Set,t.$(e),t.O=t.O.bind(t),t.j=t.j.bind(t),t.R=t.R.bind(t),t.k=t.k.bind(t),t.P=t.P.bind(t),t.S=t.S.bind(t),t.D=t.D.bind(t),t.U=t.O,t.A=t.j,t.I=t.R,t.W=t.k,"undefined"!=typeof process&&"test"===process.env.NODE_ENV&&(t.K=n)}P(e,t,n){[].concat(n||Object.keys(e)).forEach(n=>{Object.defineProperty(t,n,{T:!0,get(){return Reflect.get(e,n,this)},set(t){return Reflect.set(e,n,t,this)}})})}$(e={}){$(this).options=Object.assign($(this).options,e)}C(){return Object.assign({},$(this).options)}O(e){const t=this,n=$(t);if(!e)return e;if(e.constructor!==Object&&e.constructor!==Array&&"function"!=typeof e)return e;if(t.S(e))return e;const r=Array.isArray(e);let i=n.s.get(e);if(!i){const o=new Map,a={};Object.keys(e).forEach(n=>{const r=Object.getOwnPropertyDescriptor(e,n);r&&"function"==typeof r.get&&(a[n]=t.k(r.get))});const s=e=>{e.L=!0,e.q&&e.q(),e.valid&&(e.valid=!1,e.B.forEach(e=>s(e))),e.B.clear()},c=e=>{const t=new Set;return o.set(e,t),t};let f=!1;const u=(r,s)=>{const u=s===n.options.h?n.options.p:s;if(s===n.options.h){if(f)return;f=!0,Object.keys(e).forEach(r=>{if("object"==typeof e[r]){t.O(e[r])[n.options.h]}}),f=!1}u===n.options.p&&Object.keys(a).forEach(e=>{a[e].call(i)});const l=o.get(u)||c(u);l.has(r)||(l.add(r),r.F.set(e,e=>{l.delete(e),0===l.size&&o.delete(u)}))},l={G:o,H:e,J:u},p=e=>{const r=e=>s(e);if(null==e)[...l.G.values()].forEach(e=>e.forEach(r));else{const t=l.G.get(e);t&&t.forEach(r);const i=l.G.get(n.options.p);i&&i.forEach(r)}n.N||1!==n.i||(n.options.u?t.V():t.X())};i=new Proxy(e,{get:(i,o,a)=>{if(o===n.o)return e;let s;if(n.M.length&&(s=n.M[n.M.length-1],u(s,o)),o===n.options.p||o===n.options.h)return a;const c=Reflect.get(i,o,a);return r&&"function"==typeof c&&"constructor"!==o?new Proxy(c,{apply:(t,r,i)=>{if(["copyWithin","fill","pop","push","reverse","shift","sort","splice","unshift"].includes(o)){n.i++;try{p()}finally{n.i--}return t.apply(e,i)}return t.apply(r,i)}}):"object"==typeof c?t.O(c):c},set:(e,t,r,i)=>{if(r!==Reflect.get(e,t,i)||Array.isArray(e)&&"length"===t){n.i++;try{Reflect.set(e,t,r,i),p(t)}finally{n.i--}}return!0},defineProperty:(e,n,r)=>(r&&"function"==typeof r.get&&(a[n]=t.k(r.get)),Reflect.defineProperty(e,n,r)),deleteProperty:(e,t)=>{n.i++;try{t in a&&delete a[t],p(t)}finally{n.i--}return Reflect.deleteProperty(e,t)}}),n.s.set(e,i)}return i}k(e,t={}){if(e.Y)return e;const n=t.q,r=t.Z,i=$(this),o={id:++i.t,active:!0,valid:!1,q:n,Z:r,value:void 0,B:new Set,F:new Map,_:()=>{[...o.F.values()].forEach(e=>e(o)),o.F.clear()}},a=function(){if(!o.active)return e.call(this,this);if(o.ee)console.warn('Detected cross reference inside computed properties! "undefined" will be returned to prevent infinite loop');else{if(i.M.length&&o.B.add(i.M[i.M.length-1]),o.valid)return o.value;o.ee=!0,o._(),i.M.push(o);try{const t=this?i.s.get(this)||this:null;o.L=!1;const n=e.call(t,t);return o.valid=!o.L,o.value=n,n}finally{o.ee=!1,i.M.pop()}}};return a._=()=>{o._(),o.active=!1,r&&r()},a.Y=e,a}R(e,t,n,r){Object.defineProperty(e,t,{T:!0,te:!0,get:this.k(n),set:r})}j(e,t=!0){const n=this,r=$(n),i=n.k(e,{q:()=>r.v.add(i),Z:()=>r.v.delete(i)});return r.v.add(i),t&&(r.options.u?n.V():n.X()),i}D(e){return e[$(this).o]}S(e){return null!=e[$(this).o]}V(e){const t=this,n=$(t);if(n.options.enabled){n.N=!0;try{"function"==typeof e&&e(),n.ne=!1;let r=0;for(;n.v.size;){if(r>n.options.l)throw n.v.clear(),new Error("Max iterations exceeded!");r++;const e=n.options.getTime(),i=[...n.v.values()];for(const t of i)if(n.v.delete(t),t(),n.options.getTime()-e>=n.options.g)break;n.v.size&&t.X()}"function"==typeof n.options.m&&n.options.m()}finally{n.N=!1}}}X(e,t=0){const n=$(this);if(n.options.enabled){n.N=!0;try{n.ne||(n.ne=setTimeout(()=>this.V(),t)),"function"==typeof e&&e()}finally{n.N=!1}}}}Manager.default=new Manager,Manager.default.re=Manager;export default Manager.default;export const observable=Manager.default.U;export const reaction=Manager.default.A;export const computed=Manager.default.I;export const updatable=Manager.default.W;