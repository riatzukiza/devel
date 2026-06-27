goog.provide('opencode.ui.config');
/**
 * @define {string}
 */
opencode.ui.config.API_BASE = goog.define("opencode.ui.config.API_BASE","http://localhost:8787/api");
/**
 * @define {string}
 */
opencode.ui.config.WS_URL = goog.define("opencode.ui.config.WS_URL","ws://localhost:8787/events");
/**
 * @define {number}
 */
opencode.ui.config.WS_RECONNECT_MS = goog.define("opencode.ui.config.WS_RECONNECT_MS",(500));
opencode.ui.config.env = (function opencode$ui$config$env(k){
var G__12925 = process;
var G__12925__$1 = (((G__12925 == null))?null:G__12925.env);
if((G__12925__$1 == null)){
return null;
} else {
return (G__12925__$1[k]);
}
});
opencode.ui.config.api_base = (function opencode$ui$config$api_base(){
var or__5002__auto__ = opencode.ui.config.env("OPENHAX_API_BASE");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (((typeof globalThis !== 'undefined'))?globalThis.__OPENHAX_API_BASE__:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return opencode.ui.config.API_BASE;
}
}
});
opencode.ui.config.ws_url = (function opencode$ui$config$ws_url(){
var or__5002__auto__ = opencode.ui.config.env("OPENHAX_WS_URL");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = (((typeof globalThis !== 'undefined'))?globalThis.__OPENHAX_WS_URL__:null);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return opencode.ui.config.WS_URL;
}
}
});
opencode.ui.config.ws_reconnect_ms = (function opencode$ui$config$ws_reconnect_ms(){
return opencode.ui.config.WS_RECONNECT_MS;
});

//# sourceMappingURL=opencode.ui.config.js.map
