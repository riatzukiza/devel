goog.provide('shadow.remote.runtime.tap_support');
shadow.remote.runtime.tap_support.tap_subscribe = (function shadow$remote$runtime$tap_support$tap_subscribe(p__22727,p__22728){
var map__22732 = p__22727;
var map__22732__$1 = cljs.core.__destructure_map(map__22732);
var svc = map__22732__$1;
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22732__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
var obj_support = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22732__$1,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22732__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__22734 = p__22728;
var map__22734__$1 = cljs.core.__destructure_map(map__22734);
var msg = map__22734__$1;
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22734__$1,new cljs.core.Keyword(null,"from","from",1815293044));
var summary = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22734__$1,new cljs.core.Keyword(null,"summary","summary",380847952));
var history__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22734__$1,new cljs.core.Keyword(null,"history","history",-247395220));
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__22734__$1,new cljs.core.Keyword(null,"num","num",1985240673),(10));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(subs_ref,cljs.core.assoc,from,msg);

if(cljs.core.truth_(history__$1)){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap-subscribed","tap-subscribed",-1882247432),new cljs.core.Keyword(null,"history","history",-247395220),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentVector.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (oid){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"oid","oid",-768692334),oid,new cljs.core.Keyword(null,"summary","summary",380847952),shadow.remote.runtime.obj_support.obj_describe_STAR_(obj_support,oid)], null);
}),shadow.remote.runtime.obj_support.get_tap_history(obj_support,num)))], null));
} else {
return null;
}
});
shadow.remote.runtime.tap_support.tap_unsubscribe = (function shadow$remote$runtime$tap_support$tap_unsubscribe(p__22744,p__22745){
var map__22748 = p__22744;
var map__22748__$1 = cljs.core.__destructure_map(map__22748);
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22748__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
var map__22749 = p__22745;
var map__22749__$1 = cljs.core.__destructure_map(map__22749);
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22749__$1,new cljs.core.Keyword(null,"from","from",1815293044));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(subs_ref,cljs.core.dissoc,from);
});
shadow.remote.runtime.tap_support.request_tap_history = (function shadow$remote$runtime$tap_support$request_tap_history(p__22757,p__22758){
var map__22760 = p__22757;
var map__22760__$1 = cljs.core.__destructure_map(map__22760);
var obj_support = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22760__$1,new cljs.core.Keyword(null,"obj-support","obj-support",1522559229));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22760__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
var map__22761 = p__22758;
var map__22761__$1 = cljs.core.__destructure_map(map__22761);
var msg = map__22761__$1;
var num = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__22761__$1,new cljs.core.Keyword(null,"num","num",1985240673),(10));
var tap_ids = shadow.remote.runtime.obj_support.get_tap_history(obj_support,num);
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap-history","tap-history",-282803347),new cljs.core.Keyword(null,"oids","oids",-1580877688),tap_ids], null));
});
shadow.remote.runtime.tap_support.tool_disconnect = (function shadow$remote$runtime$tap_support$tool_disconnect(p__22766,tid){
var map__22767 = p__22766;
var map__22767__$1 = cljs.core.__destructure_map(map__22767);
var svc = map__22767__$1;
var subs_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22767__$1,new cljs.core.Keyword(null,"subs-ref","subs-ref",-1355989911));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(subs_ref,cljs.core.dissoc,tid);
});
shadow.remote.runtime.tap_support.start = (function shadow$remote$runtime$tap_support$start(runtime,obj_support){
var subs_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var tap_fn = (function shadow$remote$runtime$tap_support$start_$_runtime_tap(obj){
if((!((obj == null)))){
var oid = shadow.remote.runtime.obj_support.register(obj_support,obj,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"from","from",1815293044),new cljs.core.Keyword(null,"tap","tap",-1086702463)], null));
var seq__22782 = cljs.core.seq(cljs.core.deref(subs_ref));
var chunk__22783 = null;
var count__22784 = (0);
var i__22785 = (0);
while(true){
if((i__22785 < count__22784)){
var vec__22803 = chunk__22783.cljs$core$IIndexed$_nth$arity$2(null,i__22785);
var tid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22803,(0),null);
var tap_config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22803,(1),null);
shadow.remote.runtime.api.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap","tap",-1086702463),new cljs.core.Keyword(null,"to","to",192099007),tid,new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));


var G__22880 = seq__22782;
var G__22881 = chunk__22783;
var G__22882 = count__22784;
var G__22883 = (i__22785 + (1));
seq__22782 = G__22880;
chunk__22783 = G__22881;
count__22784 = G__22882;
i__22785 = G__22883;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__22782);
if(temp__5804__auto__){
var seq__22782__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__22782__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__22782__$1);
var G__22893 = cljs.core.chunk_rest(seq__22782__$1);
var G__22894 = c__5525__auto__;
var G__22895 = cljs.core.count(c__5525__auto__);
var G__22896 = (0);
seq__22782 = G__22893;
chunk__22783 = G__22894;
count__22784 = G__22895;
i__22785 = G__22896;
continue;
} else {
var vec__22809 = cljs.core.first(seq__22782__$1);
var tid = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22809,(0),null);
var tap_config = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__22809,(1),null);
shadow.remote.runtime.api.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"tap","tap",-1086702463),new cljs.core.Keyword(null,"to","to",192099007),tid,new cljs.core.Keyword(null,"oid","oid",-768692334),oid], null));


var G__22904 = cljs.core.next(seq__22782__$1);
var G__22905 = null;
var G__22906 = (0);
var G__22907 = (0);
seq__22782 = G__22904;
chunk__22783 = G__22905;
count__22784 = G__22906;
i__22785 = G__22907;
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
shadow.remote.runtime.api.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.tap-support","ext","shadow.remote.runtime.tap-support/ext",1019069674),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"tap-subscribe","tap-subscribe",411179050),(function (p1__22771_SHARP_){
return shadow.remote.runtime.tap_support.tap_subscribe(svc,p1__22771_SHARP_);
}),new cljs.core.Keyword(null,"tap-unsubscribe","tap-unsubscribe",1183890755),(function (p1__22773_SHARP_){
return shadow.remote.runtime.tap_support.tap_unsubscribe(svc,p1__22773_SHARP_);
}),new cljs.core.Keyword(null,"request-tap-history","request-tap-history",-670837812),(function (p1__22775_SHARP_){
return shadow.remote.runtime.tap_support.request_tap_history(svc,p1__22775_SHARP_);
})], null),new cljs.core.Keyword(null,"on-tool-disconnect","on-tool-disconnect",693464366),(function (p1__22776_SHARP_){
return shadow.remote.runtime.tap_support.tool_disconnect(svc,p1__22776_SHARP_);
})], null));

cljs.core.add_tap(tap_fn);

return svc;
});
shadow.remote.runtime.tap_support.stop = (function shadow$remote$runtime$tap_support$stop(p__22833){
var map__22836 = p__22833;
var map__22836__$1 = cljs.core.__destructure_map(map__22836);
var svc = map__22836__$1;
var tap_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22836__$1,new cljs.core.Keyword(null,"tap-fn","tap-fn",1573556461));
var runtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__22836__$1,new cljs.core.Keyword(null,"runtime","runtime",-1331573996));
cljs.core.remove_tap(tap_fn);

return shadow.remote.runtime.api.del_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.tap-support","ext","shadow.remote.runtime.tap-support/ext",1019069674));
});

//# sourceMappingURL=shadow.remote.runtime.tap_support.js.map
