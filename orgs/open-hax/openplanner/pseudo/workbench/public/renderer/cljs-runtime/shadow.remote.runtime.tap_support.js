goog.provide('shadow.remote.runtime.tap_support');
shadow.remote.runtime.tap_support.tap_subscribe = (function shadow$remote$runtime$tap_support$tap_subscribe(p__249277,p__249278){
var map__249279 = p__249277;
var map__249279__$1 = cljs.core.__destructure_map(map__249279);
var svc = map__249279__$1;
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249279__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
var obj_support = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249279__$1,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249279__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__249280 = p__249278;
var map__249280__$1 = cljs.core.__destructure_map(map__249280);
var msg = map__249280__$1;
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249280__$1,new cljs.core.Keyword(null,"from","from",1815293044));
var summary = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249280__$1,new cljs.core.Keyword(null,"summary","summary",380847952));
var history__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249280__$1,new cljs.core.Keyword(null,"history","history",-247395220));
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__249280__$1,new cljs.core.Keyword(null,"num","num",1985240673),(10));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(subs_ref,cljs.core.assoc,from,msg);

if(cljs.core.truth_(history__$1)){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap-subscribed","tap-subscribed",-1882247432),new cljs.core.Keyword(null,"history","history",-247395220),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (oid){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"oid","oid",-768692334),oid,new cljs.core.Keyword(null,"summary","summary",380847952),shadow.remote.runtime.obj_support.obj_describe_STAR_(obj_support,oid)], null);
}),shadow.remote.runtime.obj_support.get_tap_history(obj_support,num)))], null));
} else {
return null;
}
});
shadow.remote.runtime.tap_support.tap_unsubscribe = (function shadow$remote$runtime$tap_support$tap_unsubscribe(p__249295,p__249296){
var map__249297 = p__249295;
var map__249297__$1 = cljs.core.__destructure_map(map__249297);
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249297__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
var map__249298 = p__249296;
var map__249298__$1 = cljs.core.__destructure_map(map__249298);
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249298__$1,new cljs.core.Keyword(null,"from","from",1815293044));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(subs_ref,cljs.core.dissoc,from);
});
shadow.remote.runtime.tap_support.request_tap_history = (function shadow$remote$runtime$tap_support$request_tap_history(p__249308,p__249309){
var map__249311 = p__249308;
var map__249311__$1 = cljs.core.__destructure_map(map__249311);
var obj_support = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249311__$1,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249311__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__249312 = p__249309;
var map__249312__$1 = cljs.core.__destructure_map(map__249312);
var msg = map__249312__$1;
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__249312__$1,new cljs.core.Keyword(null,"num","num",1985240673),(10));
var tap_ids = shadow.remote.runtime.obj_support.get_tap_history(obj_support,num);
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap-history","tap-history",-282803347),new cljs.core.Keyword(null,"oids","oids",-1580877688),tap_ids], null));
});
shadow.remote.runtime.tap_support.tool_disconnect = (function shadow$remote$runtime$tap_support$tool_disconnect(p__249333,tid){
var map__249337 = p__249333;
var map__249337__$1 = cljs.core.__destructure_map(map__249337);
var svc = map__249337__$1;
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249337__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(subs_ref,cljs.core.dissoc,tid);
});
shadow.remote.runtime.tap_support.start = (function shadow$remote$runtime$tap_support$start(runtime,obj_support){
var subs_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var tap_fn = (function shadow$remote$runtime$tap_support$start_$_runtime_tap(obj){
if((!((obj == null)))){
var oid = shadow.remote.runtime.obj_support.register(obj_support,obj,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"from","from",1815293044),new cljs.core.Keyword(null,"tap","tap",-1086702463)], null));
var seq__249357 = cljs.core.seq(cljs.core.deref(subs_ref));
var chunk__249358 = null;
var count__249359 = (0);
var i__249360 = (0);
while(true){
if((i__249360 < count__249359)){
var vec__249382 = chunk__249358.cljs$core$IIndexed$_nth$arity$2(null,i__249360);
var tid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__249382,(0),null);
var tap_config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__249382,(1),null);
shadow.remote.runtime.api.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap","tap",-1086702463),new cljs.core.Keyword(null,"to","to",192099007),tid,new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));


var G__249457 = seq__249357;
var G__249458 = chunk__249358;
var G__249459 = count__249359;
var G__249460 = (i__249360 + (1));
seq__249357 = G__249457;
chunk__249358 = G__249458;
count__249359 = G__249459;
i__249360 = G__249460;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__249357);
if(temp__5804__auto__){
var seq__249357__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__249357__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__249357__$1);
var G__249465 = cljs.core.chunk_rest(seq__249357__$1);
var G__249466 = c__5525__auto__;
var G__249467 = cljs.core.count(c__5525__auto__);
var G__249468 = (0);
seq__249357 = G__249465;
chunk__249358 = G__249466;
count__249359 = G__249467;
i__249360 = G__249468;
continue;
} else {
var vec__249391 = cljs.core.first(seq__249357__$1);
var tid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__249391,(0),null);
var tap_config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__249391,(1),null);
shadow.remote.runtime.api.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap","tap",-1086702463),new cljs.core.Keyword(null,"to","to",192099007),tid,new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));


var G__249475 = cljs.core.next(seq__249357__$1);
var G__249476 = null;
var G__249477 = (0);
var G__249478 = (0);
seq__249357 = G__249475;
chunk__249358 = G__249476;
count__249359 = G__249477;
i__249360 = G__249478;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
});
var svc = new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229),obj_support,new cljs.core.Keyword(null,"tap-fn","tap-fn",1573556461),tap_fn,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911),subs_ref], null);
shadow.remote.runtime.api.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.tap-support","ext","shadow.remote.runtime.tap-support/ext",1019069674),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tap-subscribe","tap-subscribe",411179050),(function (p1__249345_SHARP_){
return shadow.remote.runtime.tap_support.tap_subscribe(svc,p1__249345_SHARP_);
}),new cljs.core.Keyword(null,"tap-unsubscribe","tap-unsubscribe",1183890755),(function (p1__249346_SHARP_){
return shadow.remote.runtime.tap_support.tap_unsubscribe(svc,p1__249346_SHARP_);
}),new cljs.core.Keyword(null,"request-tap-history","request-tap-history",-670837812),(function (p1__249347_SHARP_){
return shadow.remote.runtime.tap_support.request_tap_history(svc,p1__249347_SHARP_);
})], null),new cljs.core.Keyword(null,"on-tool-disconnect","on-tool-disconnect",693464366),(function (p1__249348_SHARP_){
return shadow.remote.runtime.tap_support.tool_disconnect(svc,p1__249348_SHARP_);
})], null));

cljs.core.add_tap(tap_fn);

return svc;
});
shadow.remote.runtime.tap_support.stop = (function shadow$remote$runtime$tap_support$stop(p__249413){
var map__249415 = p__249413;
var map__249415__$1 = cljs.core.__destructure_map(map__249415);
var svc = map__249415__$1;
var tap_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249415__$1,new cljs.core.Keyword(null,"tap-fn","tap-fn",1573556461));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249415__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
cljs.core.remove_tap(tap_fn);

return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.tap-support","ext","shadow.remote.runtime.tap-support/ext",1019069674));
});

//# sourceMappingURL=shadow.remote.runtime.tap_support.js.map
