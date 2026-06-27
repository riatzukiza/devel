goog.provide('opencode_unified.persistence');
opencode_unified.persistence.prefix = "opencode.workbench.";
opencode_unified.persistence.local_storage = (function opencode_unified$persistence$local_storage(){
if((typeof window !== 'undefined')){
var G__252413 = window;
if((G__252413 == null)){
return null;
} else {
return (G__252413["localStorage"]);
}
} else {
return null;
}
});
opencode_unified.persistence.save_state_BANG_ = (function opencode_unified$persistence$save_state_BANG_(key,value){
try{var temp__5804__auto__ = opencode_unified.persistence.local_storage();
if(cljs.core.truth_(temp__5804__auto__)){
var storage = temp__5804__auto__;
return storage.setItem([opencode_unified.persistence.prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join(''),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([value], 0)));
} else {
return null;
}
}catch (e252416){if((e252416 instanceof Error)){
var e = e252416;
return console.error("Failed to save state:",key,e);
} else {
throw e252416;

}
}});
opencode_unified.persistence.load_state = (function opencode_unified$persistence$load_state(key,default_value){
try{var temp__5802__auto__ = (function (){var temp__5804__auto__ = opencode_unified.persistence.local_storage();
if(cljs.core.truth_(temp__5804__auto__)){
var storage = temp__5804__auto__;
return storage.getItem([opencode_unified.persistence.prefix,cljs.core.str.cljs$core$IFn$_invoke$arity$1(key)].join(''));
} else {
return null;
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var stored = temp__5802__auto__;
return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(stored);
} else {
return default_value;
}
}catch (e252431){if((e252431 instanceof Error)){
var e = e252431;
console.error("Failed to load state:",key,e);

return default_value;
} else {
throw e252431;

}
}});

//# sourceMappingURL=opencode_unified.persistence.js.map
