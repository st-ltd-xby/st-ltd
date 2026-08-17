import{n as e,s as t}from"./react-dom-WKMewNdz.js";import{$t as n,Gr as r,Qt as i,Rr as a,Ur as o,Vr as s,Wr as c,dr as l,en as u,gr as d,pr as f,zr as p}from"./jsx-runtime-BSzLRKme.js";var m=`modulepreload`,h=function(e){return`/`+e},g={},_=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=h(t,n),t=s(t),t in g)return;g[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:m,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},v=t(r()),y=t(e()),b=(0,y.createContext)({});function x(e){return e.replace(/-(.)/g,function(e,t){return t.toUpperCase()})}function S(e,t){s(e,`[@ant-design/icons] ${t}`)}function C(e){return o(e)===`object`&&typeof e.name==`string`&&typeof e.theme==`string`&&(o(e.icon)===`object`||typeof e.icon==`function`)}function w(){var e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return Object.keys(e).reduce(function(t,n){var r=e[n];switch(n){case`class`:t.className=r,delete t.class;break;default:delete t[n],t[x(n)]=r}return t},{})}function T(e,t,n){return n?y.createElement(e.tag,a(a({key:t},w(e.attrs)),n),(e.children||[]).map(function(n,r){return T(n,`${t}-${e.tag}-${r}`)})):y.createElement(e.tag,a({key:t},w(e.attrs)),(e.children||[]).map(function(n,r){return T(n,`${t}-${e.tag}-${r}`)}))}function E(e){return u(e)[0]}function D(e){return e?Array.isArray(e)?e:[e]:[]}var O=`
.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin::before,
.anticon-spin {
  display: inline-block;
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`,k=function(e){var t=(0,y.useContext)(b),n=t.csp,r=t.prefixCls,a=O;r&&(a=a.replace(/anticon/g,r)),(0,y.useEffect)(function(){var t=e.current,r=i(t);f(a,`@ant-design-icons`,{prepend:!0,csp:n,attachTo:r})},[])},A=[`icon`,`className`,`onClick`,`style`,`primaryColor`,`secondaryColor`],j={primaryColor:`#333`,secondaryColor:`#E6E6E6`,calculated:!1};function M(e){var t=e.primaryColor,n=e.secondaryColor;j.primaryColor=t,j.secondaryColor=n||E(t),j.calculated=!!n}function N(){return a({},j)}var P=function(e){var t=e.icon,n=e.className,r=e.onClick,i=e.style,o=e.primaryColor,s=e.secondaryColor,c=l(e,A),u=y.useRef(),d=j;if(o&&(d={primaryColor:o,secondaryColor:s||E(o)}),k(u),S(C(t),`icon should be icon definiton, but got ${t}`),!C(t))return null;var f=t;return f&&typeof f.icon==`function`&&(f=a(a({},f),{},{icon:f.icon(d.primaryColor,d.secondaryColor)})),T(f.icon,`svg-${f.name}`,a(a({className:n,onClick:r,style:i,"data-icon":f.name,width:`1em`,height:`1em`,fill:`currentColor`,"aria-hidden":`true`},c),{},{ref:u}))};P.displayName=`IconReact`,P.getTwoToneColors=N,P.setTwoToneColors=M;function F(e){var t=d(D(e),2),n=t[0],r=t[1];return P.setTwoToneColors({primaryColor:n,secondaryColor:r})}function I(){var e=P.getTwoToneColors();return e.calculated?[e.primaryColor,e.secondaryColor]:e.primaryColor}var L=[`className`,`icon`,`spin`,`rotate`,`tabIndex`,`onClick`,`twoToneColor`];F(n.primary);var R=y.forwardRef(function(e,t){var n=e.className,r=e.icon,i=e.spin,a=e.rotate,o=e.tabIndex,s=e.onClick,u=e.twoToneColor,f=l(e,L),m=y.useContext(b),h=m.prefixCls,g=h===void 0?`anticon`:h,_=m.rootClassName,x=(0,v.default)(_,g,p(p({},`${g}-${r.name}`,!!r.name),`${g}-spin`,!!i||r.name===`loading`),n),S=o;S===void 0&&s&&(S=-1);var C=a?{msTransform:`rotate(${a}deg)`,transform:`rotate(${a}deg)`}:void 0,w=d(D(u),2),T=w[0],E=w[1];return y.createElement(`span`,c({role:`img`,"aria-label":r.name},f,{ref:t,tabIndex:S,onClick:s,className:x}),y.createElement(P,{icon:r,primaryColor:T,secondaryColor:E,style:C}))});R.displayName=`AntdIcon`,R.getTwoToneColor=I,R.setTwoToneColor=F;var z={icon:{tag:`svg`,attrs:{viewBox:`64 64 896 896`,focusable:`false`},children:[{tag:`path`,attrs:{d:`M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z`}}]},name:`user`,theme:`outlined`},B=y.forwardRef(function(e,t){return y.createElement(R,c({},e,{ref:t,icon:z}))});export{R as n,_ as r,B as t};