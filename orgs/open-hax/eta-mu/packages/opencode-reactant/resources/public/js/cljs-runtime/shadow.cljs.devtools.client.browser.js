goog.provide('shadow.cljs.devtools.client.browser');
shadow.cljs.devtools.client.browser.devtools_msg = (function shadow$cljs$devtools$client$browser$devtools_msg(var_args){
var args__5732__auto__ = [];
var len__5726__auto___23914 = arguments.length;
var i__5727__auto___23915 = (0);
while(true){
if((i__5727__auto___23915 < len__5726__auto___23914)){
args__5732__auto__.push((arguments[i__5727__auto___23915]));

var G__23916 = (i__5727__auto___23915 + (1));
i__5727__auto___23915 = G__23916;
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
(shadow.cljs.devtools.client.browser.devtools_msg.cljs$lang$applyTo = (function (seq23505){
var G__23506 = cljs.core.first(seq23505);
var seq23505__$1 = cljs.core.next(seq23505);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__23506,seq23505__$1);
}));

shadow.cljs.devtools.client.browser.script_eval = (function shadow$cljs$devtools$client$browser$script_eval(code){
return goog.globalEval(code);
});
shadow.cljs.devtools.client.browser.do_js_load = (function shadow$cljs$devtools$client$browser$do_js_load(sources){
var seq__23517 = cljs.core.seq(sources);
var chunk__23518 = null;
var count__23519 = (0);
var i__23520 = (0);
while(true){
if((i__23520 < count__23519)){
var map__23528 = chunk__23518.cljs$core$IIndexed$_nth$arity$2(null,i__23520);
var map__23528__$1 = cljs.core.__destructure_map(map__23528);
var src = map__23528__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23528__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23528__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23528__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23528__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e23529){var e_23917 = e23529;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_23917);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_23917.message)].join('')));
}

var G__23918 = seq__23517;
var G__23919 = chunk__23518;
var G__23920 = count__23519;
var G__23921 = (i__23520 + (1));
seq__23517 = G__23918;
chunk__23518 = G__23919;
count__23519 = G__23920;
i__23520 = G__23921;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__23517);
if(temp__5804__auto__){
var seq__23517__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__23517__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__23517__$1);
var G__23922 = cljs.core.chunk_rest(seq__23517__$1);
var G__23923 = c__5525__auto__;
var G__23924 = cljs.core.count(c__5525__auto__);
var G__23925 = (0);
seq__23517 = G__23922;
chunk__23518 = G__23923;
count__23519 = G__23924;
i__23520 = G__23925;
continue;
} else {
var map__23532 = cljs.core.first(seq__23517__$1);
var map__23532__$1 = cljs.core.__destructure_map(map__23532);
var src = map__23532__$1;
var resource_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23532__$1,new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582));
var output_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23532__$1,new cljs.core.Keyword(null,"output-name","output-name",-1769107767));
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23532__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23532__$1,new cljs.core.Keyword(null,"js","js",1768080579));
$CLJS.SHADOW_ENV.setLoaded(output_name);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load JS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([resource_name], 0));

shadow.cljs.devtools.client.env.before_load_src(src);

try{shadow.cljs.devtools.client.browser.script_eval([cljs.core.str.cljs$core$IFn$_invoke$arity$1(js),"\n//# sourceURL=",cljs.core.str.cljs$core$IFn$_invoke$arity$1($CLJS.SHADOW_ENV.scriptBase),cljs.core.str.cljs$core$IFn$_invoke$arity$1(output_name)].join(''));
}catch (e23533){var e_23926 = e23533;
if(shadow.cljs.devtools.client.env.log){
console.error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name)].join(''),e_23926);
} else {
}

throw (new Error(["Failed to load ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name),": ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e_23926.message)].join('')));
}

var G__23927 = cljs.core.next(seq__23517__$1);
var G__23928 = null;
var G__23929 = (0);
var G__23930 = (0);
seq__23517 = G__23927;
chunk__23518 = G__23928;
count__23519 = G__23929;
i__23520 = G__23930;
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
var seq__23534 = cljs.core.seq(js_requires);
var chunk__23535 = null;
var count__23536 = (0);
var i__23537 = (0);
while(true){
if((i__23537 < count__23536)){
var js_ns = chunk__23535.cljs$core$IIndexed$_nth$arity$2(null,i__23537);
var require_str_23931 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_23931);


var G__23932 = seq__23534;
var G__23933 = chunk__23535;
var G__23934 = count__23536;
var G__23935 = (i__23537 + (1));
seq__23534 = G__23932;
chunk__23535 = G__23933;
count__23536 = G__23934;
i__23537 = G__23935;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__23534);
if(temp__5804__auto__){
var seq__23534__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__23534__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__23534__$1);
var G__23936 = cljs.core.chunk_rest(seq__23534__$1);
var G__23937 = c__5525__auto__;
var G__23938 = cljs.core.count(c__5525__auto__);
var G__23939 = (0);
seq__23534 = G__23936;
chunk__23535 = G__23937;
count__23536 = G__23938;
i__23537 = G__23939;
continue;
} else {
var js_ns = cljs.core.first(seq__23534__$1);
var require_str_23940 = ["var ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns)," = shadow.js.require(\"",cljs.core.str.cljs$core$IFn$_invoke$arity$1(js_ns),"\");"].join('');
shadow.cljs.devtools.client.browser.script_eval(require_str_23940);


var G__23941 = cljs.core.next(seq__23534__$1);
var G__23942 = null;
var G__23943 = (0);
var G__23944 = (0);
seq__23534 = G__23941;
chunk__23535 = G__23942;
count__23536 = G__23943;
i__23537 = G__23944;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.cljs.devtools.client.browser.handle_build_complete = (function shadow$cljs$devtools$client$browser$handle_build_complete(runtime,p__23542){
var map__23543 = p__23542;
var map__23543__$1 = cljs.core.__destructure_map(map__23543);
var msg = map__23543__$1;
var info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23543__$1,new cljs.core.Keyword(null,"info","info",-317069002));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23543__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var warnings = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.distinct.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__23544(s__23545){
return (new cljs.core.LazySeq(null,(function (){
var s__23545__$1 = s__23545;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__23545__$1);
if(temp__5804__auto__){
var xs__6360__auto__ = temp__5804__auto__;
var map__23550 = cljs.core.first(xs__6360__auto__);
var map__23550__$1 = cljs.core.__destructure_map(map__23550);
var src = map__23550__$1;
var resource_name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23550__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
var warnings = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23550__$1,new cljs.core.Keyword(null,"warnings","warnings",-735437651));
if(cljs.core.not(new cljs.core.Keyword(null,"from-jar","from-jar",1050932827).cljs$core$IFn$_invoke$arity$1(src))){
var iterys__5476__auto__ = ((function (s__23545__$1,map__23550,map__23550__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__23543,map__23543__$1,msg,info,reload_info){
return (function shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__23544_$_iter__23546(s__23547){
return (new cljs.core.LazySeq(null,((function (s__23545__$1,map__23550,map__23550__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__23543,map__23543__$1,msg,info,reload_info){
return (function (){
var s__23547__$1 = s__23547;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__23547__$1);
if(temp__5804__auto____$1){
var s__23547__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__23547__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__23547__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__23549 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__23548 = (0);
while(true){
if((i__23548 < size__5479__auto__)){
var warning = cljs.core._nth(c__5478__auto__,i__23548);
cljs.core.chunk_append(b__23549,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name));

var G__23945 = (i__23548 + (1));
i__23548 = G__23945;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__23549),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__23544_$_iter__23546(cljs.core.chunk_rest(s__23547__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__23549),null);
}
} else {
var warning = cljs.core.first(s__23547__$2);
return cljs.core.cons(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(warning,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100),resource_name),shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__23544_$_iter__23546(cljs.core.rest(s__23547__$2)));
}
} else {
return null;
}
break;
}
});})(s__23545__$1,map__23550,map__23550__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__23543,map__23543__$1,msg,info,reload_info))
,null,null));
});})(s__23545__$1,map__23550,map__23550__$1,src,resource_name,warnings,xs__6360__auto__,temp__5804__auto__,map__23543,map__23543__$1,msg,info,reload_info))
;
var fs__5477__auto__ = cljs.core.seq(iterys__5476__auto__(warnings));
if(fs__5477__auto__){
return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(fs__5477__auto__,shadow$cljs$devtools$client$browser$handle_build_complete_$_iter__23544(cljs.core.rest(s__23545__$1)));
} else {
var G__23946 = cljs.core.rest(s__23545__$1);
s__23545__$1 = G__23946;
continue;
}
} else {
var G__23947 = cljs.core.rest(s__23545__$1);
s__23545__$1 = G__23947;
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
var seq__23551_23948 = cljs.core.seq(warnings);
var chunk__23552_23949 = null;
var count__23553_23950 = (0);
var i__23554_23951 = (0);
while(true){
if((i__23554_23951 < count__23553_23950)){
var map__23557_23952 = chunk__23552_23949.cljs$core$IIndexed$_nth$arity$2(null,i__23554_23951);
var map__23557_23953__$1 = cljs.core.__destructure_map(map__23557_23952);
var w_23954 = map__23557_23953__$1;
var msg_23955__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23557_23953__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_23956 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23557_23953__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_23957 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23557_23953__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_23958 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23557_23953__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_23958)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_23956),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_23957),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_23955__$1)].join(''));


var G__23959 = seq__23551_23948;
var G__23960 = chunk__23552_23949;
var G__23961 = count__23553_23950;
var G__23962 = (i__23554_23951 + (1));
seq__23551_23948 = G__23959;
chunk__23552_23949 = G__23960;
count__23553_23950 = G__23961;
i__23554_23951 = G__23962;
continue;
} else {
var temp__5804__auto___23963 = cljs.core.seq(seq__23551_23948);
if(temp__5804__auto___23963){
var seq__23551_23964__$1 = temp__5804__auto___23963;
if(cljs.core.chunked_seq_QMARK_(seq__23551_23964__$1)){
var c__5525__auto___23965 = cljs.core.chunk_first(seq__23551_23964__$1);
var G__23966 = cljs.core.chunk_rest(seq__23551_23964__$1);
var G__23967 = c__5525__auto___23965;
var G__23968 = cljs.core.count(c__5525__auto___23965);
var G__23969 = (0);
seq__23551_23948 = G__23966;
chunk__23552_23949 = G__23967;
count__23553_23950 = G__23968;
i__23554_23951 = G__23969;
continue;
} else {
var map__23558_23970 = cljs.core.first(seq__23551_23964__$1);
var map__23558_23971__$1 = cljs.core.__destructure_map(map__23558_23970);
var w_23972 = map__23558_23971__$1;
var msg_23973__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23558_23971__$1,new cljs.core.Keyword(null,"msg","msg",-1386103444));
var line_23974 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23558_23971__$1,new cljs.core.Keyword(null,"line","line",212345235));
var column_23975 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23558_23971__$1,new cljs.core.Keyword(null,"column","column",2078222095));
var resource_name_23976 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23558_23971__$1,new cljs.core.Keyword(null,"resource-name","resource-name",2001617100));
console.warn(["BUILD-WARNING in ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(resource_name_23976)," at [",cljs.core.str.cljs$core$IFn$_invoke$arity$1(line_23974),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column_23975),"]\n\t",cljs.core.str.cljs$core$IFn$_invoke$arity$1(msg_23973__$1)].join(''));


var G__23977 = cljs.core.next(seq__23551_23964__$1);
var G__23978 = null;
var G__23979 = (0);
var G__23980 = (0);
seq__23551_23948 = G__23977;
chunk__23552_23949 = G__23978;
count__23553_23950 = G__23979;
i__23554_23951 = G__23980;
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

return shadow.cljs.devtools.client.shared.load_sources(runtime,sources_to_get,(function (p1__23538_SHARP_){
return shadow.cljs.devtools.client.browser.do_js_reload(msg,p1__23538_SHARP_,shadow.cljs.devtools.client.hud.load_end_success,shadow.cljs.devtools.client.hud.load_failure);
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
return cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__23564 = node_uri;
G__23564.setQuery(null);

G__23564.setPath(new$);

return G__23564;
})());
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
}
});
shadow.cljs.devtools.client.browser.handle_asset_update = (function shadow$cljs$devtools$client$browser$handle_asset_update(p__23565){
var map__23566 = p__23565;
var map__23566__$1 = cljs.core.__destructure_map(map__23566);
var msg = map__23566__$1;
var updates = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23566__$1,new cljs.core.Keyword(null,"updates","updates",2013983452));
var reload_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23566__$1,new cljs.core.Keyword(null,"reload-info","reload-info",1648088086));
var seq__23567 = cljs.core.seq(updates);
var chunk__23569 = null;
var count__23570 = (0);
var i__23571 = (0);
while(true){
if((i__23571 < count__23570)){
var path = chunk__23569.cljs$core$IIndexed$_nth$arity$2(null,i__23571);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__23715_23981 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__23719_23982 = null;
var count__23720_23983 = (0);
var i__23721_23984 = (0);
while(true){
if((i__23721_23984 < count__23720_23983)){
var node_23985 = chunk__23719_23982.cljs$core$IIndexed$_nth$arity$2(null,i__23721_23984);
if(cljs.core.not(node_23985.shadow$old)){
var path_match_23986 = shadow.cljs.devtools.client.browser.match_paths(node_23985.getAttribute("href"),path);
if(cljs.core.truth_(path_match_23986)){
var new_link_23987 = (function (){var G__23775 = node_23985.cloneNode(true);
G__23775.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_23986),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__23775;
})();
(node_23985.shadow$old = true);

(new_link_23987.onload = ((function (seq__23715_23981,chunk__23719_23982,count__23720_23983,i__23721_23984,seq__23567,chunk__23569,count__23570,i__23571,new_link_23987,path_match_23986,node_23985,path,map__23566,map__23566__$1,msg,updates,reload_info){
return (function (e){
var seq__23777_23988 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__23779_23989 = null;
var count__23780_23990 = (0);
var i__23781_23991 = (0);
while(true){
if((i__23781_23991 < count__23780_23990)){
var map__23788_23992 = chunk__23779_23989.cljs$core$IIndexed$_nth$arity$2(null,i__23781_23991);
var map__23788_23993__$1 = cljs.core.__destructure_map(map__23788_23992);
var task_23994 = map__23788_23993__$1;
var fn_str_23995 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23788_23993__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_23996 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23788_23993__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_23997 = goog.getObjectByName(fn_str_23995,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_23996)].join(''));

(fn_obj_23997.cljs$core$IFn$_invoke$arity$2 ? fn_obj_23997.cljs$core$IFn$_invoke$arity$2(path,new_link_23987) : fn_obj_23997.call(null,path,new_link_23987));


var G__23998 = seq__23777_23988;
var G__23999 = chunk__23779_23989;
var G__24000 = count__23780_23990;
var G__24001 = (i__23781_23991 + (1));
seq__23777_23988 = G__23998;
chunk__23779_23989 = G__23999;
count__23780_23990 = G__24000;
i__23781_23991 = G__24001;
continue;
} else {
var temp__5804__auto___24002 = cljs.core.seq(seq__23777_23988);
if(temp__5804__auto___24002){
var seq__23777_24003__$1 = temp__5804__auto___24002;
if(cljs.core.chunked_seq_QMARK_(seq__23777_24003__$1)){
var c__5525__auto___24004 = cljs.core.chunk_first(seq__23777_24003__$1);
var G__24005 = cljs.core.chunk_rest(seq__23777_24003__$1);
var G__24006 = c__5525__auto___24004;
var G__24007 = cljs.core.count(c__5525__auto___24004);
var G__24008 = (0);
seq__23777_23988 = G__24005;
chunk__23779_23989 = G__24006;
count__23780_23990 = G__24007;
i__23781_23991 = G__24008;
continue;
} else {
var map__23789_24009 = cljs.core.first(seq__23777_24003__$1);
var map__23789_24010__$1 = cljs.core.__destructure_map(map__23789_24009);
var task_24011 = map__23789_24010__$1;
var fn_str_24012 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23789_24010__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_24013 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23789_24010__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_24014 = goog.getObjectByName(fn_str_24012,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_24013)].join(''));

(fn_obj_24014.cljs$core$IFn$_invoke$arity$2 ? fn_obj_24014.cljs$core$IFn$_invoke$arity$2(path,new_link_23987) : fn_obj_24014.call(null,path,new_link_23987));


var G__24015 = cljs.core.next(seq__23777_24003__$1);
var G__24016 = null;
var G__24017 = (0);
var G__24018 = (0);
seq__23777_23988 = G__24015;
chunk__23779_23989 = G__24016;
count__23780_23990 = G__24017;
i__23781_23991 = G__24018;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_23985);
});})(seq__23715_23981,chunk__23719_23982,count__23720_23983,i__23721_23984,seq__23567,chunk__23569,count__23570,i__23571,new_link_23987,path_match_23986,node_23985,path,map__23566,map__23566__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_23986], 0));

goog.dom.insertSiblingAfter(new_link_23987,node_23985);


var G__24019 = seq__23715_23981;
var G__24020 = chunk__23719_23982;
var G__24021 = count__23720_23983;
var G__24022 = (i__23721_23984 + (1));
seq__23715_23981 = G__24019;
chunk__23719_23982 = G__24020;
count__23720_23983 = G__24021;
i__23721_23984 = G__24022;
continue;
} else {
var G__24023 = seq__23715_23981;
var G__24024 = chunk__23719_23982;
var G__24025 = count__23720_23983;
var G__24026 = (i__23721_23984 + (1));
seq__23715_23981 = G__24023;
chunk__23719_23982 = G__24024;
count__23720_23983 = G__24025;
i__23721_23984 = G__24026;
continue;
}
} else {
var G__24027 = seq__23715_23981;
var G__24028 = chunk__23719_23982;
var G__24029 = count__23720_23983;
var G__24030 = (i__23721_23984 + (1));
seq__23715_23981 = G__24027;
chunk__23719_23982 = G__24028;
count__23720_23983 = G__24029;
i__23721_23984 = G__24030;
continue;
}
} else {
var temp__5804__auto___24031 = cljs.core.seq(seq__23715_23981);
if(temp__5804__auto___24031){
var seq__23715_24032__$1 = temp__5804__auto___24031;
if(cljs.core.chunked_seq_QMARK_(seq__23715_24032__$1)){
var c__5525__auto___24033 = cljs.core.chunk_first(seq__23715_24032__$1);
var G__24034 = cljs.core.chunk_rest(seq__23715_24032__$1);
var G__24035 = c__5525__auto___24033;
var G__24036 = cljs.core.count(c__5525__auto___24033);
var G__24037 = (0);
seq__23715_23981 = G__24034;
chunk__23719_23982 = G__24035;
count__23720_23983 = G__24036;
i__23721_23984 = G__24037;
continue;
} else {
var node_24038 = cljs.core.first(seq__23715_24032__$1);
if(cljs.core.not(node_24038.shadow$old)){
var path_match_24039 = shadow.cljs.devtools.client.browser.match_paths(node_24038.getAttribute("href"),path);
if(cljs.core.truth_(path_match_24039)){
var new_link_24040 = (function (){var G__23793 = node_24038.cloneNode(true);
G__23793.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_24039),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__23793;
})();
(node_24038.shadow$old = true);

(new_link_24040.onload = ((function (seq__23715_23981,chunk__23719_23982,count__23720_23983,i__23721_23984,seq__23567,chunk__23569,count__23570,i__23571,new_link_24040,path_match_24039,node_24038,seq__23715_24032__$1,temp__5804__auto___24031,path,map__23566,map__23566__$1,msg,updates,reload_info){
return (function (e){
var seq__23794_24041 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__23796_24042 = null;
var count__23797_24043 = (0);
var i__23798_24044 = (0);
while(true){
if((i__23798_24044 < count__23797_24043)){
var map__23802_24045 = chunk__23796_24042.cljs$core$IIndexed$_nth$arity$2(null,i__23798_24044);
var map__23802_24046__$1 = cljs.core.__destructure_map(map__23802_24045);
var task_24047 = map__23802_24046__$1;
var fn_str_24048 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23802_24046__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_24049 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23802_24046__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_24050 = goog.getObjectByName(fn_str_24048,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_24049)].join(''));

(fn_obj_24050.cljs$core$IFn$_invoke$arity$2 ? fn_obj_24050.cljs$core$IFn$_invoke$arity$2(path,new_link_24040) : fn_obj_24050.call(null,path,new_link_24040));


var G__24051 = seq__23794_24041;
var G__24052 = chunk__23796_24042;
var G__24053 = count__23797_24043;
var G__24054 = (i__23798_24044 + (1));
seq__23794_24041 = G__24051;
chunk__23796_24042 = G__24052;
count__23797_24043 = G__24053;
i__23798_24044 = G__24054;
continue;
} else {
var temp__5804__auto___24055__$1 = cljs.core.seq(seq__23794_24041);
if(temp__5804__auto___24055__$1){
var seq__23794_24056__$1 = temp__5804__auto___24055__$1;
if(cljs.core.chunked_seq_QMARK_(seq__23794_24056__$1)){
var c__5525__auto___24057 = cljs.core.chunk_first(seq__23794_24056__$1);
var G__24058 = cljs.core.chunk_rest(seq__23794_24056__$1);
var G__24059 = c__5525__auto___24057;
var G__24060 = cljs.core.count(c__5525__auto___24057);
var G__24061 = (0);
seq__23794_24041 = G__24058;
chunk__23796_24042 = G__24059;
count__23797_24043 = G__24060;
i__23798_24044 = G__24061;
continue;
} else {
var map__23803_24062 = cljs.core.first(seq__23794_24056__$1);
var map__23803_24063__$1 = cljs.core.__destructure_map(map__23803_24062);
var task_24064 = map__23803_24063__$1;
var fn_str_24065 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23803_24063__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_24066 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23803_24063__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_24067 = goog.getObjectByName(fn_str_24065,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_24066)].join(''));

(fn_obj_24067.cljs$core$IFn$_invoke$arity$2 ? fn_obj_24067.cljs$core$IFn$_invoke$arity$2(path,new_link_24040) : fn_obj_24067.call(null,path,new_link_24040));


var G__24068 = cljs.core.next(seq__23794_24056__$1);
var G__24069 = null;
var G__24070 = (0);
var G__24071 = (0);
seq__23794_24041 = G__24068;
chunk__23796_24042 = G__24069;
count__23797_24043 = G__24070;
i__23798_24044 = G__24071;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_24038);
});})(seq__23715_23981,chunk__23719_23982,count__23720_23983,i__23721_23984,seq__23567,chunk__23569,count__23570,i__23571,new_link_24040,path_match_24039,node_24038,seq__23715_24032__$1,temp__5804__auto___24031,path,map__23566,map__23566__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_24039], 0));

goog.dom.insertSiblingAfter(new_link_24040,node_24038);


var G__24072 = cljs.core.next(seq__23715_24032__$1);
var G__24073 = null;
var G__24074 = (0);
var G__24075 = (0);
seq__23715_23981 = G__24072;
chunk__23719_23982 = G__24073;
count__23720_23983 = G__24074;
i__23721_23984 = G__24075;
continue;
} else {
var G__24076 = cljs.core.next(seq__23715_24032__$1);
var G__24077 = null;
var G__24078 = (0);
var G__24079 = (0);
seq__23715_23981 = G__24076;
chunk__23719_23982 = G__24077;
count__23720_23983 = G__24078;
i__23721_23984 = G__24079;
continue;
}
} else {
var G__24080 = cljs.core.next(seq__23715_24032__$1);
var G__24081 = null;
var G__24082 = (0);
var G__24083 = (0);
seq__23715_23981 = G__24080;
chunk__23719_23982 = G__24081;
count__23720_23983 = G__24082;
i__23721_23984 = G__24083;
continue;
}
}
} else {
}
}
break;
}


var G__24084 = seq__23567;
var G__24085 = chunk__23569;
var G__24086 = count__23570;
var G__24087 = (i__23571 + (1));
seq__23567 = G__24084;
chunk__23569 = G__24085;
count__23570 = G__24086;
i__23571 = G__24087;
continue;
} else {
var G__24088 = seq__23567;
var G__24089 = chunk__23569;
var G__24090 = count__23570;
var G__24091 = (i__23571 + (1));
seq__23567 = G__24088;
chunk__23569 = G__24089;
count__23570 = G__24090;
i__23571 = G__24091;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__23567);
if(temp__5804__auto__){
var seq__23567__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__23567__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__23567__$1);
var G__24092 = cljs.core.chunk_rest(seq__23567__$1);
var G__24093 = c__5525__auto__;
var G__24094 = cljs.core.count(c__5525__auto__);
var G__24095 = (0);
seq__23567 = G__24092;
chunk__23569 = G__24093;
count__23570 = G__24094;
i__23571 = G__24095;
continue;
} else {
var path = cljs.core.first(seq__23567__$1);
if(clojure.string.ends_with_QMARK_(path,"css")){
var seq__23804_24096 = cljs.core.seq(cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(document.querySelectorAll("link[rel=\"stylesheet\"]")));
var chunk__23808_24097 = null;
var count__23809_24098 = (0);
var i__23810_24099 = (0);
while(true){
if((i__23810_24099 < count__23809_24098)){
var node_24100 = chunk__23808_24097.cljs$core$IIndexed$_nth$arity$2(null,i__23810_24099);
if(cljs.core.not(node_24100.shadow$old)){
var path_match_24101 = shadow.cljs.devtools.client.browser.match_paths(node_24100.getAttribute("href"),path);
if(cljs.core.truth_(path_match_24101)){
var new_link_24102 = (function (){var G__23863 = node_24100.cloneNode(true);
G__23863.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_24101),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__23863;
})();
(node_24100.shadow$old = true);

(new_link_24102.onload = ((function (seq__23804_24096,chunk__23808_24097,count__23809_24098,i__23810_24099,seq__23567,chunk__23569,count__23570,i__23571,new_link_24102,path_match_24101,node_24100,path,seq__23567__$1,temp__5804__auto__,map__23566,map__23566__$1,msg,updates,reload_info){
return (function (e){
var seq__23864_24103 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__23866_24104 = null;
var count__23867_24105 = (0);
var i__23868_24106 = (0);
while(true){
if((i__23868_24106 < count__23867_24105)){
var map__23875_24107 = chunk__23866_24104.cljs$core$IIndexed$_nth$arity$2(null,i__23868_24106);
var map__23875_24108__$1 = cljs.core.__destructure_map(map__23875_24107);
var task_24109 = map__23875_24108__$1;
var fn_str_24110 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23875_24108__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_24111 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23875_24108__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_24112 = goog.getObjectByName(fn_str_24110,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_24111)].join(''));

(fn_obj_24112.cljs$core$IFn$_invoke$arity$2 ? fn_obj_24112.cljs$core$IFn$_invoke$arity$2(path,new_link_24102) : fn_obj_24112.call(null,path,new_link_24102));


var G__24113 = seq__23864_24103;
var G__24114 = chunk__23866_24104;
var G__24115 = count__23867_24105;
var G__24116 = (i__23868_24106 + (1));
seq__23864_24103 = G__24113;
chunk__23866_24104 = G__24114;
count__23867_24105 = G__24115;
i__23868_24106 = G__24116;
continue;
} else {
var temp__5804__auto___24117__$1 = cljs.core.seq(seq__23864_24103);
if(temp__5804__auto___24117__$1){
var seq__23864_24118__$1 = temp__5804__auto___24117__$1;
if(cljs.core.chunked_seq_QMARK_(seq__23864_24118__$1)){
var c__5525__auto___24119 = cljs.core.chunk_first(seq__23864_24118__$1);
var G__24120 = cljs.core.chunk_rest(seq__23864_24118__$1);
var G__24121 = c__5525__auto___24119;
var G__24122 = cljs.core.count(c__5525__auto___24119);
var G__24123 = (0);
seq__23864_24103 = G__24120;
chunk__23866_24104 = G__24121;
count__23867_24105 = G__24122;
i__23868_24106 = G__24123;
continue;
} else {
var map__23878_24124 = cljs.core.first(seq__23864_24118__$1);
var map__23878_24125__$1 = cljs.core.__destructure_map(map__23878_24124);
var task_24126 = map__23878_24125__$1;
var fn_str_24127 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23878_24125__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_24128 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23878_24125__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_24129 = goog.getObjectByName(fn_str_24127,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_24128)].join(''));

(fn_obj_24129.cljs$core$IFn$_invoke$arity$2 ? fn_obj_24129.cljs$core$IFn$_invoke$arity$2(path,new_link_24102) : fn_obj_24129.call(null,path,new_link_24102));


var G__24130 = cljs.core.next(seq__23864_24118__$1);
var G__24131 = null;
var G__24132 = (0);
var G__24133 = (0);
seq__23864_24103 = G__24130;
chunk__23866_24104 = G__24131;
count__23867_24105 = G__24132;
i__23868_24106 = G__24133;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_24100);
});})(seq__23804_24096,chunk__23808_24097,count__23809_24098,i__23810_24099,seq__23567,chunk__23569,count__23570,i__23571,new_link_24102,path_match_24101,node_24100,path,seq__23567__$1,temp__5804__auto__,map__23566,map__23566__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_24101], 0));

goog.dom.insertSiblingAfter(new_link_24102,node_24100);


var G__24134 = seq__23804_24096;
var G__24135 = chunk__23808_24097;
var G__24136 = count__23809_24098;
var G__24137 = (i__23810_24099 + (1));
seq__23804_24096 = G__24134;
chunk__23808_24097 = G__24135;
count__23809_24098 = G__24136;
i__23810_24099 = G__24137;
continue;
} else {
var G__24138 = seq__23804_24096;
var G__24139 = chunk__23808_24097;
var G__24140 = count__23809_24098;
var G__24141 = (i__23810_24099 + (1));
seq__23804_24096 = G__24138;
chunk__23808_24097 = G__24139;
count__23809_24098 = G__24140;
i__23810_24099 = G__24141;
continue;
}
} else {
var G__24142 = seq__23804_24096;
var G__24143 = chunk__23808_24097;
var G__24144 = count__23809_24098;
var G__24145 = (i__23810_24099 + (1));
seq__23804_24096 = G__24142;
chunk__23808_24097 = G__24143;
count__23809_24098 = G__24144;
i__23810_24099 = G__24145;
continue;
}
} else {
var temp__5804__auto___24146__$1 = cljs.core.seq(seq__23804_24096);
if(temp__5804__auto___24146__$1){
var seq__23804_24147__$1 = temp__5804__auto___24146__$1;
if(cljs.core.chunked_seq_QMARK_(seq__23804_24147__$1)){
var c__5525__auto___24148 = cljs.core.chunk_first(seq__23804_24147__$1);
var G__24149 = cljs.core.chunk_rest(seq__23804_24147__$1);
var G__24150 = c__5525__auto___24148;
var G__24151 = cljs.core.count(c__5525__auto___24148);
var G__24152 = (0);
seq__23804_24096 = G__24149;
chunk__23808_24097 = G__24150;
count__23809_24098 = G__24151;
i__23810_24099 = G__24152;
continue;
} else {
var node_24153 = cljs.core.first(seq__23804_24147__$1);
if(cljs.core.not(node_24153.shadow$old)){
var path_match_24154 = shadow.cljs.devtools.client.browser.match_paths(node_24153.getAttribute("href"),path);
if(cljs.core.truth_(path_match_24154)){
var new_link_24155 = (function (){var G__23881 = node_24153.cloneNode(true);
G__23881.setAttribute("href",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(path_match_24154),"?r=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.rand.cljs$core$IFn$_invoke$arity$0())].join(''));

return G__23881;
})();
(node_24153.shadow$old = true);

(new_link_24155.onload = ((function (seq__23804_24096,chunk__23808_24097,count__23809_24098,i__23810_24099,seq__23567,chunk__23569,count__23570,i__23571,new_link_24155,path_match_24154,node_24153,seq__23804_24147__$1,temp__5804__auto___24146__$1,path,seq__23567__$1,temp__5804__auto__,map__23566,map__23566__$1,msg,updates,reload_info){
return (function (e){
var seq__23882_24156 = cljs.core.seq(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(msg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"reload-info","reload-info",1648088086),new cljs.core.Keyword(null,"asset-load","asset-load",-1925902322)], null)));
var chunk__23884_24157 = null;
var count__23885_24158 = (0);
var i__23886_24159 = (0);
while(true){
if((i__23886_24159 < count__23885_24158)){
var map__23890_24160 = chunk__23884_24157.cljs$core$IIndexed$_nth$arity$2(null,i__23886_24159);
var map__23890_24161__$1 = cljs.core.__destructure_map(map__23890_24160);
var task_24162 = map__23890_24161__$1;
var fn_str_24163 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23890_24161__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_24164 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23890_24161__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_24165 = goog.getObjectByName(fn_str_24163,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_24164)].join(''));

(fn_obj_24165.cljs$core$IFn$_invoke$arity$2 ? fn_obj_24165.cljs$core$IFn$_invoke$arity$2(path,new_link_24155) : fn_obj_24165.call(null,path,new_link_24155));


var G__24166 = seq__23882_24156;
var G__24167 = chunk__23884_24157;
var G__24168 = count__23885_24158;
var G__24169 = (i__23886_24159 + (1));
seq__23882_24156 = G__24166;
chunk__23884_24157 = G__24167;
count__23885_24158 = G__24168;
i__23886_24159 = G__24169;
continue;
} else {
var temp__5804__auto___24170__$2 = cljs.core.seq(seq__23882_24156);
if(temp__5804__auto___24170__$2){
var seq__23882_24171__$1 = temp__5804__auto___24170__$2;
if(cljs.core.chunked_seq_QMARK_(seq__23882_24171__$1)){
var c__5525__auto___24172 = cljs.core.chunk_first(seq__23882_24171__$1);
var G__24173 = cljs.core.chunk_rest(seq__23882_24171__$1);
var G__24174 = c__5525__auto___24172;
var G__24175 = cljs.core.count(c__5525__auto___24172);
var G__24176 = (0);
seq__23882_24156 = G__24173;
chunk__23884_24157 = G__24174;
count__23885_24158 = G__24175;
i__23886_24159 = G__24176;
continue;
} else {
var map__23891_24177 = cljs.core.first(seq__23882_24171__$1);
var map__23891_24178__$1 = cljs.core.__destructure_map(map__23891_24177);
var task_24179 = map__23891_24178__$1;
var fn_str_24180 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23891_24178__$1,new cljs.core.Keyword(null,"fn-str","fn-str",-1348506402));
var fn_sym_24181 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23891_24178__$1,new cljs.core.Keyword(null,"fn-sym","fn-sym",1423988510));
var fn_obj_24182 = goog.getObjectByName(fn_str_24180,$CLJS);
shadow.cljs.devtools.client.browser.devtools_msg(["call ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(fn_sym_24181)].join(''));

(fn_obj_24182.cljs$core$IFn$_invoke$arity$2 ? fn_obj_24182.cljs$core$IFn$_invoke$arity$2(path,new_link_24155) : fn_obj_24182.call(null,path,new_link_24155));


var G__24183 = cljs.core.next(seq__23882_24171__$1);
var G__24184 = null;
var G__24185 = (0);
var G__24186 = (0);
seq__23882_24156 = G__24183;
chunk__23884_24157 = G__24184;
count__23885_24158 = G__24185;
i__23886_24159 = G__24186;
continue;
}
} else {
}
}
break;
}

return goog.dom.removeNode(node_24153);
});})(seq__23804_24096,chunk__23808_24097,count__23809_24098,i__23810_24099,seq__23567,chunk__23569,count__23570,i__23571,new_link_24155,path_match_24154,node_24153,seq__23804_24147__$1,temp__5804__auto___24146__$1,path,seq__23567__$1,temp__5804__auto__,map__23566,map__23566__$1,msg,updates,reload_info))
);

shadow.cljs.devtools.client.browser.devtools_msg.cljs$core$IFn$_invoke$arity$variadic("load CSS",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([path_match_24154], 0));

goog.dom.insertSiblingAfter(new_link_24155,node_24153);


var G__24187 = cljs.core.next(seq__23804_24147__$1);
var G__24188 = null;
var G__24189 = (0);
var G__24190 = (0);
seq__23804_24096 = G__24187;
chunk__23808_24097 = G__24188;
count__23809_24098 = G__24189;
i__23810_24099 = G__24190;
continue;
} else {
var G__24191 = cljs.core.next(seq__23804_24147__$1);
var G__24192 = null;
var G__24193 = (0);
var G__24194 = (0);
seq__23804_24096 = G__24191;
chunk__23808_24097 = G__24192;
count__23809_24098 = G__24193;
i__23810_24099 = G__24194;
continue;
}
} else {
var G__24195 = cljs.core.next(seq__23804_24147__$1);
var G__24196 = null;
var G__24197 = (0);
var G__24198 = (0);
seq__23804_24096 = G__24195;
chunk__23808_24097 = G__24196;
count__23809_24098 = G__24197;
i__23810_24099 = G__24198;
continue;
}
}
} else {
}
}
break;
}


var G__24199 = cljs.core.next(seq__23567__$1);
var G__24200 = null;
var G__24201 = (0);
var G__24202 = (0);
seq__23567 = G__24199;
chunk__23569 = G__24200;
count__23570 = G__24201;
i__23571 = G__24202;
continue;
} else {
var G__24203 = cljs.core.next(seq__23567__$1);
var G__24204 = null;
var G__24205 = (0);
var G__24206 = (0);
seq__23567 = G__24203;
chunk__23569 = G__24204;
count__23570 = G__24205;
i__23571 = G__24206;
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
try{var G__23893 = shadow.cljs.devtools.client.browser.global_eval(code);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__23893) : success.call(null,G__23893));
}catch (e23892){var e = e23892;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_invoke$arity$5 = (function (this$,ns,p__23894,success,fail){
var map__23895 = p__23894;
var map__23895__$1 = cljs.core.__destructure_map(map__23895);
var js = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23895__$1,new cljs.core.Keyword(null,"js","js",1768080579));
var this$__$1 = this;
try{var G__23897 = shadow.cljs.devtools.client.browser.global_eval(js);
return (success.cljs$core$IFn$_invoke$arity$1 ? success.cljs$core$IFn$_invoke$arity$1(G__23897) : success.call(null,G__23897));
}catch (e23896){var e = e23896;
return (fail.cljs$core$IFn$_invoke$arity$1 ? fail.cljs$core$IFn$_invoke$arity$1(e) : fail.call(null,e));
}}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_init$arity$4 = (function (runtime,p__23898,done,error){
var map__23899 = p__23898;
var map__23899__$1 = cljs.core.__destructure_map(map__23899);
var repl_sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23899__$1,new cljs.core.Keyword(null,"repl-sources","repl-sources",723867535));
var runtime__$1 = this;
return shadow.cljs.devtools.client.shared.load_sources(runtime__$1,cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(shadow.cljs.devtools.client.env.src_is_loaded_QMARK_,repl_sources)),(function (sources){
shadow.cljs.devtools.client.browser.do_js_load(sources);

return (done.cljs$core$IFn$_invoke$arity$0 ? done.cljs$core$IFn$_invoke$arity$0() : done.call(null));
}));
}));

(shadow.cljs.devtools.client.shared.Runtime.prototype.shadow$cljs$devtools$client$shared$IHostSpecific$do_repl_require$arity$4 = (function (runtime,p__23900,done,error){
var map__23901 = p__23900;
var map__23901__$1 = cljs.core.__destructure_map(map__23901);
var msg = map__23901__$1;
var sources = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23901__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
var reload_namespaces = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23901__$1,new cljs.core.Keyword(null,"reload-namespaces","reload-namespaces",250210134));
var js_requires = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23901__$1,new cljs.core.Keyword(null,"js-requires","js-requires",-1311472051));
var runtime__$1 = this;
var sources_to_load = cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p__23902){
var map__23903 = p__23902;
var map__23903__$1 = cljs.core.__destructure_map(map__23903);
var src = map__23903__$1;
var provides = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23903__$1,new cljs.core.Keyword(null,"provides","provides",-1634397992));
var and__5000__auto__ = shadow.cljs.devtools.client.env.src_is_loaded_QMARK_(src);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(cljs.core.some(reload_namespaces,provides));
} else {
return and__5000__auto__;
}
}),sources));
if(cljs.core.not(cljs.core.seq(sources_to_load))){
var G__23904 = cljs.core.PersistentVector.EMPTY;
return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(G__23904) : done.call(null,G__23904));
} else {
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3(runtime__$1,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"cljs-load-sources","cljs-load-sources",-1458295962),new cljs.core.Keyword(null,"to","to",192099007),shadow.cljs.devtools.client.env.worker_client_id,new cljs.core.Keyword(null,"sources","sources",-321166424),cljs.core.into.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"resource-id","resource-id",-1308422582)),sources_to_load)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cljs-sources","cljs-sources",31121610),(function (p__23905){
var map__23906 = p__23905;
var map__23906__$1 = cljs.core.__destructure_map(map__23906);
var msg__$1 = map__23906__$1;
var sources__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23906__$1,new cljs.core.Keyword(null,"sources","sources",-321166424));
try{shadow.cljs.devtools.client.browser.do_js_load(sources__$1);

if(cljs.core.seq(js_requires)){
shadow.cljs.devtools.client.browser.do_js_requires(js_requires);
} else {
}

return (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(sources_to_load) : done.call(null,sources_to_load));
}catch (e23907){var ex = e23907;
return (error.cljs$core$IFn$_invoke$arity$1 ? error.cljs$core$IFn$_invoke$arity$1(ex) : error.call(null,ex));
}})], null));
}
}));

shadow.cljs.devtools.client.shared.add_plugin_BANG_(new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282),cljs.core.PersistentHashSet.EMPTY,(function (p__23908){
var map__23909 = p__23908;
var map__23909__$1 = cljs.core.__destructure_map(map__23909);
var env = map__23909__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23909__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
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
}),new cljs.core.Keyword("shadow.cljs.devtools.client.env","worker-notify","shadow.cljs.devtools.client.env/worker-notify",-1456820670),(function (p__23910){
var map__23911 = p__23910;
var map__23911__$1 = cljs.core.__destructure_map(map__23911);
var event_op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23911__$1,new cljs.core.Keyword(null,"event-op","event-op",200358057));
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23911__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
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
}),(function (p__23912){
var map__23913 = p__23912;
var map__23913__$1 = cljs.core.__destructure_map(map__23913);
var svc = map__23913__$1;
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__23913__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.cljs.devtools.client.browser","client","shadow.cljs.devtools.client.browser/client",-1461019282));
}));

shadow.cljs.devtools.client.shared.init_runtime_BANG_(shadow.cljs.devtools.client.browser.client_info,shadow.cljs.devtools.client.websocket.start,shadow.cljs.devtools.client.websocket.send,shadow.cljs.devtools.client.websocket.stop);
} else {
}

//# sourceMappingURL=shadow.cljs.devtools.client.browser.js.map
