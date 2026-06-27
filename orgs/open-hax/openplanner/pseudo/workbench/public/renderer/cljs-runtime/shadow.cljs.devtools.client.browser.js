goog.provide('shadow.cljs.devtools.client.browser');
shadow.cljs.devtools.client.browser.devtools_msg = (function shadow$cljs$devtools$client$browser$devtools_msg(var_args){
var args__5732__auto__ = [];
var len__5726__auto___251472 = arguments.length;
var i__5727__auto___251473 = (0);
while(true){
if((i__5727__auto___251473 < len__5726__auto___251472)){
args__5732__auto__.push((arguments[i__5727__auto___251473]));

var G__251474 = (i__5727__auto___251473 + (1));
i__5727__auto___251473 = G__251474;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic = (function (msg,args){
if(shadow.cljs.devtools.client.env.log){
if(cljs.core.seq(shadow.cljs.devtools.client.env.log_style)){
return console.log.apply(console,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [["%cshadow-cljs: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg)].join(''),shadow.cljs.devtools.client.env.log_style], null),args)));
} else {
return console.log.apply(console,cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [["shadow-cljs: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg)].join('')], null),args)));
}
} else {
return null;
}
}));

(shadow.cljs.devtools.client.browser.devtools_msg.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(shadow.cljs.devtools.client.browser.devtools_msg.cljs$lang$applyTo = (function (seq250901){
var G__250902 = cljs.core.first(seq250901);
var seq250901__$1 = cljs.core.next(seq250901);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__250902,seq250901__$1);
}));

shadow.cljs.devtools.client.browser.script_eval = (function shadow$cljs$devtools$client$browser$script_eval(code){
return goog.globalEval(code);
});
shadow.cljs.devtools.client.browser.do_js_load = (function shadow$cljs$devtools$client$browser$do_js_load(sources){
var seq__250904 = cljs.core.seq(sources);
var chunk__250905 = null;
var count__250906 = (0);
var i__250907 = (0);
while(true){
if((i__250907 < count__250906)){
var map__250923 = chunk__250905.cljs$core$IIndexed$_nth$arity$2(null,i__250907);
var map__250923__$1 = cljs.core.__destructure_map(map__250923);
var src = map__250923__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250923__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250923__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250923__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250923__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e250924){var e_251478 = e250924;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_251478);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_251478.message)].join('')));
}

var G__251479 = seq__250904;
var G__251480 = chunk__250905;
var G__251481 = count__250906;
var G__251482 = (i__250907 + (1));
seq__250904 = G__251479;
chunk__250905 = G__251480;
count__250906 = G__251481;
i__250907 = G__251482;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__250904);
if(temp__5804__auto__){
var seq__250904__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__250904__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__250904__$1);
var G__251483 = cljs.core.chunk_rest(seq__250904__$1);
var G__251485 = c__5525__auto__;
var G__251486 = cljs.core.count(c__5525__auto__);
var G__251487 = (0);
seq__250904 = G__251483;
chunk__250905 = G__251485;
count__250906 = G__251486;
i__250907 = G__251487;
continue;
} else {
var map__250925 = cljs.core.first(seq__250904__$1);
var map__250925__$1 = cljs.core.__destructure_map(map__250925);
var src = map__250925__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250925__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250925__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250925__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250925__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e250926){var e_251493 = e250926;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_251493);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_251493.message)].join('')));
}

var G__251494 = cljs.core.next(seq__250904__$1);
var G__251495 = null;
var G__251496 = (0);
var G__251497 = (0);
seq__250904 = G__251494;
chunk__250905 = G__251495;
count__250906 = G__251496;
i__250907 = G__251497;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.cljs.devtools.client.browser.do_js_reload = (function shadow$cljs$devtools$client$browser$do_js_reload(msg,sources,complete_fn,failure_fn){
return shadow.cljs.devtools.client.env.do_js_reload.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(msg,new cljs.core.Keyword(null,"log-missing-fn","log-missing-fn",732676765),(function (fn_sym){
return null;
}),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"log-call-async","log-call-async",183826192),(function (fn_sym){
return shadow.cljs.devtools.client.browser.devtools_msg(["call async ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym)].join(''));
}),new cljs.core.Keyword(null,"log-call","log-call",412404391),(function (fn_sym){
return shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym)].join(''));
})], 0)),(function (next){
shadow.cljs.devtools.client.browser.do_js_load(sources);

return (next.cljs$core$IFn$_invoke$arity$0 ? next.cljs$core$IFn$_invoke$arity$0() : next.call(null));
}),complete_fn,failure_fn);
});
/**
 * when (require '["some-str" :as x]) is done at the REPL we need to manually call the shadow.js.require for it
 * since the file only adds the shadow$provide. only need to do this for shadow-js.
 */
shadow.cljs.devtools.client.browser.do_js_requires = (function shadow$cljs$devtools$client$browser$do_js_requires(js_requires){
var seq__250930 = cljs.core.seq(js_requires);
var chunk__250931 = null;
var count__250932 = (0);
var i__250933 = (0);
while(true){
if((i__250933 < count__250932)){
var js_ns = chunk__250931.cljs$core$IIndexed$_nth$arity$2(null,i__250933);
var require_str_251498 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_251498);


var G__251503 = seq__250930;
var G__251504 = chunk__250931;
var G__251505 = count__250932;
var G__251506 = (i__250933 + (1));
seq__250930 = G__251503;
chunk__250931 = G__251504;
count__250932 = G__251505;
i__250933 = G__251506;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__250930);
if(temp__5804__auto__){
var seq__250930__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__250930__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__250930__$1);
var G__251507 = cljs.core.chunk_rest(seq__250930__$1);
var G__251508 = c__5525__auto__;
var G__251509 = cljs.core.count(c__5525__auto__);
var G__251510 = (0);
seq__250930 = G__251507;
chunk__250931 = G__251508;
count__250932 = G__251509;
i__250933 = G__251510;
continue;
} else {
var js_ns = cljs.core.first(seq__250930__$1);
var require_str_251511 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_251511);


var G__251512 = cljs.core.next(seq__250930__$1);
var G__251513 = null;
var G__251514 = (0);
var G__251515 = (0);
seq__250930 = G__251512;
chunk__250931 = G__251513;
count__250932 = G__251514;
i__250933 = G__251515;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.cljs.devtools.client.browser.handle_build_complete = (function shadow$cljs$devtools$client$browser$handle_build_complete(runtime,p__250935){
var map__250936 = p__250935;
var map__250936__$1 = cljs.core.__destructure_map(map__250936);
var msg = map__250936__$1;
var info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250936__$1,new cljs.core.Keyword(null,"info","info",-317069002));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250936__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var warnings = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__250937(s__250938){
return (new cljs.core.LazySeq(null,(function (){
var s__250938__$1 = s__250938;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__250938__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var map__250946 = cljs.core.first(xs__6360__auto__);
var map__250946__$1 = cljs.core.__destructure_map(map__250946);
var src = map__250946__$1;
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250946__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var warnings = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250946__$1,new cljs.core.Keyword(null,"warnings","warnings",-735437651));
if(cljs.core.not(new cljs.core.Keyword(null,"from-jar","from-jar",1050932827).cljs$core$IFn$_invoke$arity$1(src))){
var iterys__5476__auto__ = ((function (s__250938__$1,map__250946,map__250946__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__250936,map__250936__$1,msg,info,reload_info){
return (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__250937_$_iter__250939(s__250940){
return (new cljs.core.LazySeq(null,((function (s__250938__$1,map__250946,map__250946__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__250936,map__250936__$1,msg,info,reload_info){
return (function (){
var s__250940__$1 = s__250940;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__250940__$1);
if(temp__5804__auto____$1){
var s__250940__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__250940__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__250940__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__250942 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__250941 = (0);
while(true){
if((i__250941 < size__5479__auto__)){
var warning = cljs.core._nth(c__5478__auto__,i__250941);
cljs.core.chunk_append(b__250942,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name));

var G__251540 = (i__250941 + (1));
i__250941 = G__251540;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__250942),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__250937_$_iter__250939(cljs.core.chunk_rest(s__250940__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__250942),null);
}
} else {
var warning = cljs.core.first(s__250940__$2);
return cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__250937_$_iter__250939(cljs.core.rest(s__250940__$2)));
}
} else {
return null;
}
break;
}
});})(s__250938__$1,map__250946,map__250946__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__250936,map__250936__$1,msg,info,reload_info))
,null,null));
});})(s__250938__$1,map__250946,map__250946__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__250936,map__250936__$1,msg,info,reload_info))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(warnings));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__250937(cljs.core.rest(s__250938__$1)));
} else {
var G__251545 = cljs.core.rest(s__250938__$1);
s__250938__$1 = G__251545;
continue;
}
} else {
var G__251546 = cljs.core.rest(s__250938__$1);
s__250938__$1 = G__251546;
continue;
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"sources","sources",-321166424).cljs$core$IFn$_invoke$arity$1(info));
})()));
if(shadow.cljs.devtools.client.env.log){
var seq__250947_251547 = cljs.core.seq(warnings);
var chunk__250948_251548 = null;
var count__250949_251549 = (0);
var i__250950_251550 = (0);
while(true){
if((i__250950_251550 < count__250949_251549)){
var map__250953_251551 = chunk__250948_251548.cljs$core$IIndexed$_nth$arity$2(null,i__250950_251550);
var map__250953_251552__$1 = cljs.core.__destructure_map(map__250953_251551);
var w_251553 = map__250953_251552__$1;
var msg_251554__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250953_251552__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_251555 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250953_251552__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_251556 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250953_251552__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_251557 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250953_251552__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_251557)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_251555),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_251556),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_251554__$1)].join(''));


var G__251563 = seq__250947_251547;
var G__251564 = chunk__250948_251548;
var G__251565 = count__250949_251549;
var G__251566 = (i__250950_251550 + (1));
seq__250947_251547 = G__251563;
chunk__250948_251548 = G__251564;
count__250949_251549 = G__251565;
i__250950_251550 = G__251566;
continue;
} else {
var temp__5804__auto___251572 = cljs.core.seq(seq__250947_251547);
if(temp__5804__auto___251572){
var seq__250947_251573__$1 = temp__5804__auto___251572;
if(cljs.core.chunked_seq_QMARK_(seq__250947_251573__$1)){
var c__5525__auto___251575 = cljs.core.chunk_first(seq__250947_251573__$1);
var G__251577 = cljs.core.chunk_rest(seq__250947_251573__$1);
var G__251578 = c__5525__auto___251575;
var G__251579 = cljs.core.count(c__5525__auto___251575);
var G__251580 = (0);
seq__250947_251547 = G__251577;
chunk__250948_251548 = G__251578;
count__250949_251549 = G__251579;
i__250950_251550 = G__251580;
continue;
} else {
var map__250954_251581 = cljs.core.first(seq__250947_251573__$1);
var map__250954_251582__$1 = cljs.core.__destructure_map(map__250954_251581);
var w_251583 = map__250954_251582__$1;
var msg_251584__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250954_251582__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_251585 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250954_251582__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_251586 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250954_251582__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_251587 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250954_251582__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_251587)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_251585),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_251586),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_251584__$1)].join(''));


var G__251595 = cljs.core.next(seq__250947_251573__$1);
var G__251596 = null;
var G__251597 = (0);
var G__251598 = (0);
seq__250947_251547 = G__251595;
chunk__250948_251548 = G__251596;
count__250949_251549 = G__251597;
i__250950_251550 = G__251598;
continue;
}
} else {
}
}
break;
}
} else {
}

if((!(shadow.cljs.devtools.client.env.autoload))){
return shadow.cljs.devtools.client.hud.load_end_success();
} else {
if(((cljs.core.empty_QMARK_(warnings)) || (shadow.cljs.devtools.client.env.ignore_warnings))){
var sources_to_get = shadow.cljs.devtools.client.env.filter_reload_sources(info,reload_info);
if(cljs.core.not(cljs.core.seq(sources_to_get))){
return shadow.cljs.devtools.client.hud.load_end_success();
} else {
if(cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"after-load","after-load",-1278503285)], null)))){
} else {
shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("reloading code but no :after-load hooks are configured!",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["https://shadow-cljs.github.io/docs/UsersGuide.html#_lifecycle_hooks"], 0));
}

return shadow.cljs.devtools.client.shared.load_sources(runtime,sources_to_get,(function (p1__250934_SHARP_){
return shadow.cljs.devtools.client.browser.do_js_reload(msg,p1__250934_SHARP_,shadow.cljs.devtools.client.hud.load_end_success,shadow.cljs.devtools.client.hud.load_failure);
}));
}
} else {
return null;
}
}
});
shadow.cljs.devtools.client.browser.page_load_uri = (cljs.core.truth_(goog.global.document)?goog.Uri.parse(document.location.href):null);
shadow.cljs.devtools.client.browser.match_paths = (function shadow$cljs$devtools$client$browser$match_paths(old,new$){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("file",shadow.cljs.devtools.client.browser.page_load_uri.getScheme())){
var rel_new = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(new$,(1));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(old,rel_new)) || (clojure.string.starts_with_QMARK_(old,[rel_new,"?"].join(''))))){
return rel_new;
} else {
return null;
}
} else {
var node_uri = goog.Uri.parse(old);
var node_uri_resolved = shadow.cljs.devtools.client.browser.page_load_uri.resolve(node_uri);
var node_abs = node_uri_resolved.getPath();
var and__5000__auto__ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$1(shadow.cljs.devtools.client.browser.page_load_uri.hasSameDomainAs(node_uri))) || (cljs.core.not(node_uri.hasDomain())));
if(and__5000__auto__){
var and__5000__auto____$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(node_abs,new$);
if(and__5000__auto____$1){
return cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__250957 = node_uri;
G__250957.setQuery(null);

G__250957.setPath(new$);

return G__250957;
})());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
});
shadow.cljs.devtools.client.browser.handle_asset_update = (function shadow$cljs$devtools$client$browser$handle_asset_update(p__250961){
var map__250962 = p__250961;
var map__250962__$1 = cljs.core.__destructure_map(map__250962);
var msg = map__250962__$1;
var updates = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250962__$1,new cljs.core.Keyword(null,"updates","updates",2013983452));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__250962__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var seq__250963 = cljs.core.seq(updates);
var chunk__250965 = null;
var count__250966 = (0);
var i__250967 = (0);
while(true){
if((i__250967 < count__250966)){
var path = chunk__250965.cljs$core$IIndexed$_nth$arity$2(null,i__250967);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__251243_251610 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__251247_251611 = null;
var count__251248_251612 = (0);
var i__251249_251613 = (0);
while(true){
if((i__251249_251613 < count__251248_251612)){
var node_251614 = chunk__251247_251611.cljs$core$IIndexed$_nth$arity$2(null,i__251249_251613);
if(cljs.core.not(node_251614.shadow$old)){
var path_match_251615 = shadow.cljs.devtools.client.browser.match_paths(node_251614.getAttribute("href"),path);
if(cljs.core.truth_(path_match_251615)){
var new_link_251616 = (function (){var G__251284 = node_251614.cloneNode(true);
G__251284.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_251615),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__251284;
})();
(node_251614.shadow$old = true);

(new_link_251616.onload = ((function (seq__251243_251610,chunk__251247_251611,count__251248_251612,i__251249_251613,seq__250963,chunk__250965,count__250966,i__250967,new_link_251616,path_match_251615,node_251614,path,map__250962,map__250962__$1,msg,updates,reload_info){
return (function (e){
var seq__251291_251617 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__251293_251618 = null;
var count__251294_251619 = (0);
var i__251295_251620 = (0);
while(true){
if((i__251295_251620 < count__251294_251619)){
var map__251308_251623 = chunk__251293_251618.cljs$core$IIndexed$_nth$arity$2(null,i__251295_251620);
var map__251308_251624__$1 = cljs.core.__destructure_map(map__251308_251623);
var task_251625 = map__251308_251624__$1;
var fn_str_251626 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251308_251624__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251627 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251308_251624__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251628 = goog.getObjectByName(fn_str_251626,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251627)].join(''));

(fn_obj_251628.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251628.cljs$core$IFn$_invoke$arity$2(path,new_link_251616) : fn_obj_251628.call(null,path,new_link_251616));


var G__251629 = seq__251291_251617;
var G__251630 = chunk__251293_251618;
var G__251631 = count__251294_251619;
var G__251632 = (i__251295_251620 + (1));
seq__251291_251617 = G__251629;
chunk__251293_251618 = G__251630;
count__251294_251619 = G__251631;
i__251295_251620 = G__251632;
continue;
} else {
var temp__5804__auto___251633 = cljs.core.seq(seq__251291_251617);
if(temp__5804__auto___251633){
var seq__251291_251635__$1 = temp__5804__auto___251633;
if(cljs.core.chunked_seq_QMARK_(seq__251291_251635__$1)){
var c__5525__auto___251636 = cljs.core.chunk_first(seq__251291_251635__$1);
var G__251637 = cljs.core.chunk_rest(seq__251291_251635__$1);
var G__251638 = c__5525__auto___251636;
var G__251639 = cljs.core.count(c__5525__auto___251636);
var G__251640 = (0);
seq__251291_251617 = G__251637;
chunk__251293_251618 = G__251638;
count__251294_251619 = G__251639;
i__251295_251620 = G__251640;
continue;
} else {
var map__251309_251641 = cljs.core.first(seq__251291_251635__$1);
var map__251309_251642__$1 = cljs.core.__destructure_map(map__251309_251641);
var task_251643 = map__251309_251642__$1;
var fn_str_251644 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251309_251642__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251645 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251309_251642__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251646 = goog.getObjectByName(fn_str_251644,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251645)].join(''));

(fn_obj_251646.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251646.cljs$core$IFn$_invoke$arity$2(path,new_link_251616) : fn_obj_251646.call(null,path,new_link_251616));


var G__251647 = cljs.core.next(seq__251291_251635__$1);
var G__251648 = null;
var G__251649 = (0);
var G__251650 = (0);
seq__251291_251617 = G__251647;
chunk__251293_251618 = G__251648;
count__251294_251619 = G__251649;
i__251295_251620 = G__251650;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_251614);
});})(seq__251243_251610,chunk__251247_251611,count__251248_251612,i__251249_251613,seq__250963,chunk__250965,count__250966,i__250967,new_link_251616,path_match_251615,node_251614,path,map__250962,map__250962__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_251615], 0));

goog.dom.insertSiblingAfter(new_link_251616,node_251614);


var G__251652 = seq__251243_251610;
var G__251653 = chunk__251247_251611;
var G__251654 = count__251248_251612;
var G__251655 = (i__251249_251613 + (1));
seq__251243_251610 = G__251652;
chunk__251247_251611 = G__251653;
count__251248_251612 = G__251654;
i__251249_251613 = G__251655;
continue;
} else {
var G__251656 = seq__251243_251610;
var G__251657 = chunk__251247_251611;
var G__251658 = count__251248_251612;
var G__251659 = (i__251249_251613 + (1));
seq__251243_251610 = G__251656;
chunk__251247_251611 = G__251657;
count__251248_251612 = G__251658;
i__251249_251613 = G__251659;
continue;
}
} else {
var G__251660 = seq__251243_251610;
var G__251661 = chunk__251247_251611;
var G__251662 = count__251248_251612;
var G__251663 = (i__251249_251613 + (1));
seq__251243_251610 = G__251660;
chunk__251247_251611 = G__251661;
count__251248_251612 = G__251662;
i__251249_251613 = G__251663;
continue;
}
} else {
var temp__5804__auto___251664 = cljs.core.seq(seq__251243_251610);
if(temp__5804__auto___251664){
var seq__251243_251665__$1 = temp__5804__auto___251664;
if(cljs.core.chunked_seq_QMARK_(seq__251243_251665__$1)){
var c__5525__auto___251667 = cljs.core.chunk_first(seq__251243_251665__$1);
var G__251668 = cljs.core.chunk_rest(seq__251243_251665__$1);
var G__251669 = c__5525__auto___251667;
var G__251670 = cljs.core.count(c__5525__auto___251667);
var G__251671 = (0);
seq__251243_251610 = G__251668;
chunk__251247_251611 = G__251669;
count__251248_251612 = G__251670;
i__251249_251613 = G__251671;
continue;
} else {
var node_251672 = cljs.core.first(seq__251243_251665__$1);
if(cljs.core.not(node_251672.shadow$old)){
var path_match_251673 = shadow.cljs.devtools.client.browser.match_paths(node_251672.getAttribute("href"),path);
if(cljs.core.truth_(path_match_251673)){
var new_link_251674 = (function (){var G__251311 = node_251672.cloneNode(true);
G__251311.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_251673),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__251311;
})();
(node_251672.shadow$old = true);

(new_link_251674.onload = ((function (seq__251243_251610,chunk__251247_251611,count__251248_251612,i__251249_251613,seq__250963,chunk__250965,count__250966,i__250967,new_link_251674,path_match_251673,node_251672,seq__251243_251665__$1,temp__5804__auto___251664,path,map__250962,map__250962__$1,msg,updates,reload_info){
return (function (e){
var seq__251313_251676 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__251315_251677 = null;
var count__251316_251678 = (0);
var i__251317_251679 = (0);
while(true){
if((i__251317_251679 < count__251316_251678)){
var map__251323_251680 = chunk__251315_251677.cljs$core$IIndexed$_nth$arity$2(null,i__251317_251679);
var map__251323_251681__$1 = cljs.core.__destructure_map(map__251323_251680);
var task_251682 = map__251323_251681__$1;
var fn_str_251683 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251323_251681__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251685 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251323_251681__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251689 = goog.getObjectByName(fn_str_251683,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251685)].join(''));

(fn_obj_251689.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251689.cljs$core$IFn$_invoke$arity$2(path,new_link_251674) : fn_obj_251689.call(null,path,new_link_251674));


var G__251690 = seq__251313_251676;
var G__251691 = chunk__251315_251677;
var G__251692 = count__251316_251678;
var G__251693 = (i__251317_251679 + (1));
seq__251313_251676 = G__251690;
chunk__251315_251677 = G__251691;
count__251316_251678 = G__251692;
i__251317_251679 = G__251693;
continue;
} else {
var temp__5804__auto___251694__$1 = cljs.core.seq(seq__251313_251676);
if(temp__5804__auto___251694__$1){
var seq__251313_251695__$1 = temp__5804__auto___251694__$1;
if(cljs.core.chunked_seq_QMARK_(seq__251313_251695__$1)){
var c__5525__auto___251696 = cljs.core.chunk_first(seq__251313_251695__$1);
var G__251697 = cljs.core.chunk_rest(seq__251313_251695__$1);
var G__251698 = c__5525__auto___251696;
var G__251699 = cljs.core.count(c__5525__auto___251696);
var G__251700 = (0);
seq__251313_251676 = G__251697;
chunk__251315_251677 = G__251698;
count__251316_251678 = G__251699;
i__251317_251679 = G__251700;
continue;
} else {
var map__251324_251701 = cljs.core.first(seq__251313_251695__$1);
var map__251324_251702__$1 = cljs.core.__destructure_map(map__251324_251701);
var task_251703 = map__251324_251702__$1;
var fn_str_251704 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251324_251702__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251705 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251324_251702__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251706 = goog.getObjectByName(fn_str_251704,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251705)].join(''));

(fn_obj_251706.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251706.cljs$core$IFn$_invoke$arity$2(path,new_link_251674) : fn_obj_251706.call(null,path,new_link_251674));


var G__251707 = cljs.core.next(seq__251313_251695__$1);
var G__251708 = null;
var G__251709 = (0);
var G__251710 = (0);
seq__251313_251676 = G__251707;
chunk__251315_251677 = G__251708;
count__251316_251678 = G__251709;
i__251317_251679 = G__251710;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_251672);
});})(seq__251243_251610,chunk__251247_251611,count__251248_251612,i__251249_251613,seq__250963,chunk__250965,count__250966,i__250967,new_link_251674,path_match_251673,node_251672,seq__251243_251665__$1,temp__5804__auto___251664,path,map__250962,map__250962__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_251673], 0));

goog.dom.insertSiblingAfter(new_link_251674,node_251672);


var G__251712 = cljs.core.next(seq__251243_251665__$1);
var G__251713 = null;
var G__251714 = (0);
var G__251715 = (0);
seq__251243_251610 = G__251712;
chunk__251247_251611 = G__251713;
count__251248_251612 = G__251714;
i__251249_251613 = G__251715;
continue;
} else {
var G__251716 = cljs.core.next(seq__251243_251665__$1);
var G__251717 = null;
var G__251718 = (0);
var G__251719 = (0);
seq__251243_251610 = G__251716;
chunk__251247_251611 = G__251717;
count__251248_251612 = G__251718;
i__251249_251613 = G__251719;
continue;
}
} else {
var G__251721 = cljs.core.next(seq__251243_251665__$1);
var G__251722 = null;
var G__251723 = (0);
var G__251724 = (0);
seq__251243_251610 = G__251721;
chunk__251247_251611 = G__251722;
count__251248_251612 = G__251723;
i__251249_251613 = G__251724;
continue;
}
}
} else {
}
}
break;
}


var G__251725 = seq__250963;
var G__251726 = chunk__250965;
var G__251727 = count__250966;
var G__251728 = (i__250967 + (1));
seq__250963 = G__251725;
chunk__250965 = G__251726;
count__250966 = G__251727;
i__250967 = G__251728;
continue;
} else {
var G__251729 = seq__250963;
var G__251730 = chunk__250965;
var G__251731 = count__250966;
var G__251732 = (i__250967 + (1));
seq__250963 = G__251729;
chunk__250965 = G__251730;
count__250966 = G__251731;
i__250967 = G__251732;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__250963);
if(temp__5804__auto__){
var seq__250963__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__250963__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__250963__$1);
var G__251733 = cljs.core.chunk_rest(seq__250963__$1);
var G__251734 = c__5525__auto__;
var G__251735 = cljs.core.count(c__5525__auto__);
var G__251736 = (0);
seq__250963 = G__251733;
chunk__250965 = G__251734;
count__250966 = G__251735;
i__250967 = G__251736;
continue;
} else {
var path = cljs.core.first(seq__250963__$1);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__251328_251737 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__251332_251738 = null;
var count__251333_251739 = (0);
var i__251334_251740 = (0);
while(true){
if((i__251334_251740 < count__251333_251739)){
var node_251741 = chunk__251332_251738.cljs$core$IIndexed$_nth$arity$2(null,i__251334_251740);
if(cljs.core.not(node_251741.shadow$old)){
var path_match_251742 = shadow.cljs.devtools.client.browser.match_paths(node_251741.getAttribute("href"),path);
if(cljs.core.truth_(path_match_251742)){
var new_link_251743 = (function (){var G__251389 = node_251741.cloneNode(true);
G__251389.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_251742),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__251389;
})();
(node_251741.shadow$old = true);

(new_link_251743.onload = ((function (seq__251328_251737,chunk__251332_251738,count__251333_251739,i__251334_251740,seq__250963,chunk__250965,count__250966,i__250967,new_link_251743,path_match_251742,node_251741,path,seq__250963__$1,temp__5804__auto__,map__250962,map__250962__$1,msg,updates,reload_info){
return (function (e){
var seq__251393_251748 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__251395_251749 = null;
var count__251396_251750 = (0);
var i__251397_251751 = (0);
while(true){
if((i__251397_251751 < count__251396_251750)){
var map__251402_251752 = chunk__251395_251749.cljs$core$IIndexed$_nth$arity$2(null,i__251397_251751);
var map__251402_251753__$1 = cljs.core.__destructure_map(map__251402_251752);
var task_251754 = map__251402_251753__$1;
var fn_str_251755 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251402_251753__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251756 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251402_251753__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251758 = goog.getObjectByName(fn_str_251755,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251756)].join(''));

(fn_obj_251758.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251758.cljs$core$IFn$_invoke$arity$2(path,new_link_251743) : fn_obj_251758.call(null,path,new_link_251743));


var G__251759 = seq__251393_251748;
var G__251760 = chunk__251395_251749;
var G__251761 = count__251396_251750;
var G__251762 = (i__251397_251751 + (1));
seq__251393_251748 = G__251759;
chunk__251395_251749 = G__251760;
count__251396_251750 = G__251761;
i__251397_251751 = G__251762;
continue;
} else {
var temp__5804__auto___251764__$1 = cljs.core.seq(seq__251393_251748);
if(temp__5804__auto___251764__$1){
var seq__251393_251765__$1 = temp__5804__auto___251764__$1;
if(cljs.core.chunked_seq_QMARK_(seq__251393_251765__$1)){
var c__5525__auto___251766 = cljs.core.chunk_first(seq__251393_251765__$1);
var G__251767 = cljs.core.chunk_rest(seq__251393_251765__$1);
var G__251768 = c__5525__auto___251766;
var G__251769 = cljs.core.count(c__5525__auto___251766);
var G__251770 = (0);
seq__251393_251748 = G__251767;
chunk__251395_251749 = G__251768;
count__251396_251750 = G__251769;
i__251397_251751 = G__251770;
continue;
} else {
var map__251405_251772 = cljs.core.first(seq__251393_251765__$1);
var map__251405_251773__$1 = cljs.core.__destructure_map(map__251405_251772);
var task_251774 = map__251405_251773__$1;
var fn_str_251775 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251405_251773__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251776 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251405_251773__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251777 = goog.getObjectByName(fn_str_251775,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251776)].join(''));

(fn_obj_251777.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251777.cljs$core$IFn$_invoke$arity$2(path,new_link_251743) : fn_obj_251777.call(null,path,new_link_251743));


var G__251778 = cljs.core.next(seq__251393_251765__$1);
var G__251779 = null;
var G__251780 = (0);
var G__251781 = (0);
seq__251393_251748 = G__251778;
chunk__251395_251749 = G__251779;
count__251396_251750 = G__251780;
i__251397_251751 = G__251781;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_251741);
});})(seq__251328_251737,chunk__251332_251738,count__251333_251739,i__251334_251740,seq__250963,chunk__250965,count__250966,i__250967,new_link_251743,path_match_251742,node_251741,path,seq__250963__$1,temp__5804__auto__,map__250962,map__250962__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_251742], 0));

goog.dom.insertSiblingAfter(new_link_251743,node_251741);


var G__251783 = seq__251328_251737;
var G__251784 = chunk__251332_251738;
var G__251785 = count__251333_251739;
var G__251786 = (i__251334_251740 + (1));
seq__251328_251737 = G__251783;
chunk__251332_251738 = G__251784;
count__251333_251739 = G__251785;
i__251334_251740 = G__251786;
continue;
} else {
var G__251787 = seq__251328_251737;
var G__251788 = chunk__251332_251738;
var G__251789 = count__251333_251739;
var G__251790 = (i__251334_251740 + (1));
seq__251328_251737 = G__251787;
chunk__251332_251738 = G__251788;
count__251333_251739 = G__251789;
i__251334_251740 = G__251790;
continue;
}
} else {
var G__251791 = seq__251328_251737;
var G__251792 = chunk__251332_251738;
var G__251793 = count__251333_251739;
var G__251794 = (i__251334_251740 + (1));
seq__251328_251737 = G__251791;
chunk__251332_251738 = G__251792;
count__251333_251739 = G__251793;
i__251334_251740 = G__251794;
continue;
}
} else {
var temp__5804__auto___251795__$1 = cljs.core.seq(seq__251328_251737);
if(temp__5804__auto___251795__$1){
var seq__251328_251796__$1 = temp__5804__auto___251795__$1;
if(cljs.core.chunked_seq_QMARK_(seq__251328_251796__$1)){
var c__5525__auto___251797 = cljs.core.chunk_first(seq__251328_251796__$1);
var G__251798 = cljs.core.chunk_rest(seq__251328_251796__$1);
var G__251799 = c__5525__auto___251797;
var G__251800 = cljs.core.count(c__5525__auto___251797);
var G__251801 = (0);
seq__251328_251737 = G__251798;
chunk__251332_251738 = G__251799;
count__251333_251739 = G__251800;
i__251334_251740 = G__251801;
continue;
} else {
var node_251802 = cljs.core.first(seq__251328_251796__$1);
if(cljs.core.not(node_251802.shadow$old)){
var path_match_251803 = shadow.cljs.devtools.client.browser.match_paths(node_251802.getAttribute("href"),path);
if(cljs.core.truth_(path_match_251803)){
var new_link_251804 = (function (){var G__251406 = node_251802.cloneNode(true);
G__251406.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_251803),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__251406;
})();
(node_251802.shadow$old = true);

(new_link_251804.onload = ((function (seq__251328_251737,chunk__251332_251738,count__251333_251739,i__251334_251740,seq__250963,chunk__250965,count__250966,i__250967,new_link_251804,path_match_251803,node_251802,seq__251328_251796__$1,temp__5804__auto___251795__$1,path,seq__250963__$1,temp__5804__auto__,map__250962,map__250962__$1,msg,updates,reload_info){
return (function (e){
var seq__251407_251806 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__251409_251807 = null;
var count__251410_251808 = (0);
var i__251411_251809 = (0);
while(true){
if((i__251411_251809 < count__251410_251808)){
var map__251415_251810 = chunk__251409_251807.cljs$core$IIndexed$_nth$arity$2(null,i__251411_251809);
var map__251415_251811__$1 = cljs.core.__destructure_map(map__251415_251810);
var task_251812 = map__251415_251811__$1;
var fn_str_251813 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251415_251811__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251814 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251415_251811__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251815 = goog.getObjectByName(fn_str_251813,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251814)].join(''));

(fn_obj_251815.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251815.cljs$core$IFn$_invoke$arity$2(path,new_link_251804) : fn_obj_251815.call(null,path,new_link_251804));


var G__251816 = seq__251407_251806;
var G__251817 = chunk__251409_251807;
var G__251818 = count__251410_251808;
var G__251819 = (i__251411_251809 + (1));
seq__251407_251806 = G__251816;
chunk__251409_251807 = G__251817;
count__251410_251808 = G__251818;
i__251411_251809 = G__251819;
continue;
} else {
var temp__5804__auto___251820__$2 = cljs.core.seq(seq__251407_251806);
if(temp__5804__auto___251820__$2){
var seq__251407_251821__$1 = temp__5804__auto___251820__$2;
if(cljs.core.chunked_seq_QMARK_(seq__251407_251821__$1)){
var c__5525__auto___251822 = cljs.core.chunk_first(seq__251407_251821__$1);
var G__251823 = cljs.core.chunk_rest(seq__251407_251821__$1);
var G__251824 = c__5525__auto___251822;
var G__251825 = cljs.core.count(c__5525__auto___251822);
var G__251826 = (0);
seq__251407_251806 = G__251823;
chunk__251409_251807 = G__251824;
count__251410_251808 = G__251825;
i__251411_251809 = G__251826;
continue;
} else {
var map__251417_251827 = cljs.core.first(seq__251407_251821__$1);
var map__251417_251828__$1 = cljs.core.__destructure_map(map__251417_251827);
var task_251829 = map__251417_251828__$1;
var fn_str_251830 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251417_251828__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_251831 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251417_251828__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_251832 = goog.getObjectByName(fn_str_251830,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_251831)].join(''));

(fn_obj_251832.cljs$core$IFn$_invoke$arity$2 ? fn_obj_251832.cljs$core$IFn$_invoke$arity$2(path,new_link_251804) : fn_obj_251832.call(null,path,new_link_251804));


var G__251833 = cljs.core.next(seq__251407_251821__$1);
var G__251834 = null;
var G__251835 = (0);
var G__251836 = (0);
seq__251407_251806 = G__251833;
chunk__251409_251807 = G__251834;
count__251410_251808 = G__251835;
i__251411_251809 = G__251836;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_251802);
});})(seq__251328_251737,chunk__251332_251738,count__251333_251739,i__251334_251740,seq__250963,chunk__250965,count__250966,i__250967,new_link_251804,path_match_251803,node_251802,seq__251328_251796__$1,temp__5804__auto___251795__$1,path,seq__250963__$1,temp__5804__auto__,map__250962,map__250962__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_251803], 0));

goog.dom.insertSiblingAfter(new_link_251804,node_251802);


var G__251837 = cljs.core.next(seq__251328_251796__$1);
var G__251838 = null;
var G__251839 = (0);
var G__251840 = (0);
seq__251328_251737 = G__251837;
chunk__251332_251738 = G__251838;
count__251333_251739 = G__251839;
i__251334_251740 = G__251840;
continue;
} else {
var G__251841 = cljs.core.next(seq__251328_251796__$1);
var G__251842 = null;
var G__251843 = (0);
var G__251844 = (0);
seq__251328_251737 = G__251841;
chunk__251332_251738 = G__251842;
count__251333_251739 = G__251843;
i__251334_251740 = G__251844;
continue;
}
} else {
var G__251846 = cljs.core.next(seq__251328_251796__$1);
var G__251847 = null;
var G__251848 = (0);
var G__251849 = (0);
seq__251328_251737 = G__251846;
chunk__251332_251738 = G__251847;
count__251333_251739 = G__251848;
i__251334_251740 = G__251849;
continue;
}
}
} else {
}
}
break;
}


var G__251850 = cljs.core.next(seq__250963__$1);
var G__251851 = null;
var G__251852 = (0);
var G__251853 = (0);
seq__250963 = G__251850;
chunk__250965 = G__251851;
count__250966 = G__251852;
i__250967 = G__251853;
continue;
} else {
var G__251855 = cljs.core.next(seq__250963__$1);
var G__251856 = null;
var G__251857 = (0);
var G__251858 = (0);
seq__250963 = G__251855;
chunk__250965 = G__251856;
count__250966 = G__251857;
i__250967 = G__251858;
continue;
}
}
} else {
return null;
}
}
break;
}
});
shadow.cljs.devtools.client.browser.global_eval = (function shadow$cljs$devtools$client$browser$global_eval(js){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2("undefined",typeof(module))){
return eval(js);
} else {
return (0,eval)(js);;
}
});
shadow.cljs.devtools.client.browser.runtime_info = (((typeof SHADOW_CONFIG !== 'undefined'))?shadow.json.to_clj.cljs$core$IFn$_invoke$arity$1(SHADOW_CONFIG):null);
shadow.cljs.devtools.client.browser.client_info = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([shadow.cljs.devtools.client.browser.runtime_info,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"host","host",-1558485167),(cljs.core.truth_(goog.global.document)?new cljs.core.Keyword(null,"browser","browser",828191719):new cljs.core.Keyword(null,"browser-worker","browser-worker",1638998282)),new cljs.core.Keyword(null,"user-agent","user-agent",1220426212),[(cljs.core.truth_(goog.userAgent.OPERA)?"Opera":(cljs.core.truth_(goog.userAgent.product.CHROME)?"Chrome":(cljs.core.truth_(goog.userAgent.IE)?"MSIE":(cljs.core.truth_(goog.userAgent.EDGE)?"Edge":(cljs.core.truth_(goog.userAgent.GECKO)?"Firefox":(cljs.core.truth_(goog.userAgent.SAFARI)?"Safari":(cljs.core.truth_(goog.userAgent.WEBKIT)?"Webkit":null)))))))," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.userAgent.VERSION)," [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(goog.userAgent.PLATFORM),"]"].join(''),new cljs.core.Keyword(null,"dom","dom",-1236537922),(!((goog.global.document == null)))], null)], 0));
if((typeof shadow !== 'undefined') && (typeof shadow.cljs !== 'undefined') && (typeof shadow.cljs.devtools !== 'undefined') && (typeof shadow.cljs.devtools.client !== 'undefined') && (typeof shadow.cljs.devtools.client.browser !== 'undefined') && (typeof shadow.cljs.devtools.client.browser.ws_was_welcome_ref !== 'undefined')){
} else {
shadow.cljs.devtools.client.browser.ws_was_welcome_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if(((shadow.cljs.devtools.client.env.enabled) && ((shadow.cljs.devtools.client.env.worker_client_id > (0))))){
(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$remote$runtime$api$IEvalJS$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$remote$runtime$api$IEvalJS$_js_eval$arity$4 = (function (this$,code,success,fail){
var this$__$1 = this;
try{var G__251419 = shadow.cljs.devtools.client.browser.global_eval(code);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__251419) : success.call(null,G__251419));
}catch (e251418){var e = e251418;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_invoke$arity$5 = (function (this$,ns,p__251420,success,fail){
var map__251421 = p__251420;
var map__251421__$1 = cljs.core.__destructure_map(map__251421);
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251421__$1,new cljs.core.Keyword(null,"js","js",1768080579));
var this$__$1 = this;
try{var G__251423 = shadow.cljs.devtools.client.browser.global_eval(js);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__251423) : success.call(null,G__251423));
}catch (e251422){var e = e251422;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_init$arity$4 = (function (runtime,p__251425,done,error){
var map__251426 = p__251425;
var map__251426__$1 = cljs.core.__destructure_map(map__251426);
var repl_sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251426__$1,new cljs.core.Keyword(null,"repl-sources","repl-sources",723867535));
var runtime__$1 = this;
return shadow.cljs.devtools.client.shared.load_sources(runtime__$1,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(shadow.cljs.devtools.client.env.src_is_loaded_QMARK_,repl_sources)),(function (sources){
shadow.cljs.devtools.client.browser.do_js_load(sources);

return (done.cljs$core$IFn$_invoke$arity$0 ? done.cljs$core$IFn$_invoke$arity$0() : done.call(null));
}));
}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_require$arity$4 = (function (runtime,p__251428,done,error){
var map__251429 = p__251428;
var map__251429__$1 = cljs.core.__destructure_map(map__251429);
var msg = map__251429__$1;
var sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251429__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
var reload_namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251429__$1,new cljs.core.Keyword(null,"reload-namespaces","reload-namespaces",250210134));
var js_requires = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251429__$1,new cljs.core.Keyword(null,"js-requires","js-requires",-1311472051));
var runtime__$1 = this;
var sources_to_load = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__251430){
var map__251431 = p__251430;
var map__251431__$1 = cljs.core.__destructure_map(map__251431);
var src = map__251431__$1;
var provides = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251431__$1,new cljs.core.Keyword(null,"provides","provides",-1634397992));
var and__5000__auto__ = shadow.cljs.devtools.client.env.src_is_loaded_QMARK_(src);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.some(reload_namespaces,provides));
} else {
return and__5000__auto__;
}
}),sources));
if(cljs.core.not(cljs.core.seq(sources_to_load))){
var G__251432 = cljs.core.PersistentVector.EMPTY;
return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(G__251432) : done.call(null,G__251432));
} else {
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3(runtime__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"cljs-load-sources","cljs-load-sources",-1458295962),new cljs.core.Keyword(null,"to","to",192099007),shadow.cljs.devtools.client.env.worker_client_id,new cljs.core.Keyword(null,"sources","sources",-321166424),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582)),sources_to_load)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cljs-sources","cljs-sources",31121610),(function (p__251434){
var map__251435 = p__251434;
var map__251435__$1 = cljs.core.__destructure_map(map__251435);
var msg__$1 = map__251435__$1;
var sources__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251435__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
try{shadow.cljs.devtools.client.browser.do_js_load(sources__$1);

if(cljs.core.seq(js_requires)){
shadow.cljs.devtools.client.browser.do_js_requires(js_requires);
} else {
}

return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(sources_to_load) : done.call(null,sources_to_load));
}catch (e251436){var ex = e251436;
return (error.cljs$core$IFn$_invoke$arity$1 ? error.cljs$core$IFn$_invoke$arity$1(ex) : error.call(null,ex));
}})], null));
}
}));

shadow.cljs.devtools.client.shared.add_plugin_BANG_(new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282),cljs.core.PersistentHashSet.EMPTY,(function (p__251437){
var map__251438 = p__251437;
var map__251438__$1 = cljs.core.__destructure_map(map__251438);
var env = map__251438__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251438__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var svc = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime], null);
shadow.remote.runtime.api.add_extension(runtime,new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125),(function (){
cljs.core.reset_BANG_(shadow.cljs.devtools.client.browser.ws_was_welcome_ref,true);

shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

shadow.cljs.devtools.client.env.patch_goog_BANG_();

return shadow.cljs.devtools.client.browser.devtools_msg(["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(new cljs.core.Keyword(null,"state-ref","state-ref",2127874952).cljs$core$IFn$_invoke$arity$1(runtime))))," ready!"].join(''));
}),new cljs.core.Keyword(null,"on-disconnect","on-disconnect",-809021814),(function (e){
if(cljs.core.truth_(cljs.core.deref(shadow.cljs.devtools.client.browser.ws_was_welcome_ref))){
shadow.cljs.devtools.client.hud.connection_error("The Websocket connection was closed!");

return cljs.core.reset_BANG_(shadow.cljs.devtools.client.browser.ws_was_welcome_ref,false);
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-reconnect","on-reconnect",1239988702),(function (e){
return shadow.cljs.devtools.client.hud.connection_error("Reconnecting ...");
}),new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"access-denied","access-denied",959449406),(function (msg){
cljs.core.reset_BANG_(shadow.cljs.devtools.client.browser.ws_was_welcome_ref,false);

return shadow.cljs.devtools.client.hud.connection_error(["Stale Output! Your loaded JS was not produced by the running shadow-cljs instance."," Is the watch for this build running?"].join(''));
}),new cljs.core.Keyword(null,"cljs-asset-update","cljs-asset-update",1224093028),(function (msg){
return shadow.cljs.devtools.client.browser.handle_asset_update(msg);
}),new cljs.core.Keyword(null,"cljs-build-configure","cljs-build-configure",-2089891268),(function (msg){
return null;
}),new cljs.core.Keyword(null,"cljs-build-start","cljs-build-start",-725781241),(function (msg){
shadow.cljs.devtools.client.hud.hud_hide();

shadow.cljs.devtools.client.hud.load_start();

return shadow.cljs.devtools.client.env.run_custom_notify_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"build-start","build-start",-959649480)));
}),new cljs.core.Keyword(null,"cljs-build-complete","cljs-build-complete",273626153),(function (msg){
var msg__$1 = shadow.cljs.devtools.client.env.add_warnings_to_info(msg);
shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

shadow.cljs.devtools.client.hud.hud_warnings(msg__$1);

shadow.cljs.devtools.client.browser.handle_build_complete(runtime,msg__$1);

return shadow.cljs.devtools.client.env.run_custom_notify_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg__$1,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"build-complete","build-complete",-501868472)));
}),new cljs.core.Keyword(null,"cljs-build-failure","cljs-build-failure",1718154990),(function (msg){
shadow.cljs.devtools.client.hud.load_end();

shadow.cljs.devtools.client.hud.hud_error(msg);

return shadow.cljs.devtools.client.env.run_custom_notify_BANG_(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"build-failure","build-failure",-2107487466)));
}),new cljs.core.Keyword("shadow.cljs.devtools.client.env","worker-notify","shadow.cljs.devtools.client.env/worker-notify",-1456820670),(function (p__251451){
var map__251452 = p__251451;
var map__251452__$1 = cljs.core.__destructure_map(map__251452);
var event_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251452__$1,new cljs.core.Keyword(null,"event-op","event-op",200358057));
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251452__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-disconnect","client-disconnect",640227957),event_op)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(client_id,shadow.cljs.devtools.client.env.worker_client_id)))){
shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

return shadow.cljs.devtools.client.hud.connection_error("The watch for this build was stopped!");
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-connect","client-connect",-1113973888),event_op)){
shadow.cljs.devtools.client.hud.connection_error_clear_BANG_();

return shadow.cljs.devtools.client.hud.connection_error("The watch for this build was restarted. Reload required!");
} else {
return null;
}
}
})], null)], null));

return svc;
}),(function (p__251457){
var map__251459 = p__251457;
var map__251459__$1 = cljs.core.__destructure_map(map__251459);
var svc = map__251459__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__251459__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282));
}));

shadow.cljs.devtools.client.shared.init_runtime_BANG_(shadow.cljs.devtools.client.browser.client_info,shadow.cljs.devtools.client.websocket.start,shadow.cljs.devtools.client.websocket.send,shadow.cljs.devtools.client.websocket.stop);
} else {
}

//# sourceMappingURL=shadow.cljs.devtools.client.browser.js.map
