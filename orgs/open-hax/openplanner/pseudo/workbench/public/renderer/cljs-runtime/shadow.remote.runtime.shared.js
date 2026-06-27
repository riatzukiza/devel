goog.provide('shadow.remote.runtime.shared');
shadow.remote.runtime.shared.init_state = (function shadow$remote$runtime$shared$init_state(client_info){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info,new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218),(0),new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),cljs.core.PersistentArrayMap.EMPTY], null);
});
shadow.remote.runtime.shared.now = (function shadow$remote$runtime$shared$now(){
return Date.now();
});
shadow.remote.runtime.shared.get_client_id = (function shadow$remote$runtime$shared$get_client_id(p__243446){
var map__243449 = p__243446;
var map__243449__$1 = cljs.core.__destructure_map(map__243449);
var runtime = map__243449__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243449__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var or__5002__auto__ = new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("runtime has no assigned runtime-id",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime], null));
}
});
shadow.remote.runtime.shared.relay_msg = (function shadow$remote$runtime$shared$relay_msg(runtime,msg){
var self_id_244010 = shadow.remote.runtime.shared.get_client_id(runtime);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"to","to",192099007).cljs$core$IFn$_invoke$arity$1(msg),self_id_244010)){
shadow.remote.runtime.api.relay_msg(runtime,msg);
} else {
Promise.resolve((1)).then((function (){
var G__243520 = runtime;
var G__243521 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"from","from",1815293044),self_id_244010);
return (shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2 ? shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2(G__243520,G__243521) : shadow.remote.runtime.shared.process.call(null,G__243520,G__243521));
}));
}

return msg;
});
shadow.remote.runtime.shared.reply = (function shadow$remote$runtime$shared$reply(runtime,p__243548,res){
var map__243549 = p__243548;
var map__243549__$1 = cljs.core.__destructure_map(map__243549);
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243549__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243549__$1,new cljs.core.Keyword(null,"from","from",1815293044));
var res__$1 = (function (){var G__243553 = res;
var G__243553__$1 = (cljs.core.truth_(call_id)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__243553,new cljs.core.Keyword(null,"call-id","call-id",1043012968),call_id):G__243553);
if(cljs.core.truth_(from)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__243553__$1,new cljs.core.Keyword(null,"to","to",192099007),from);
} else {
return G__243553__$1;
}
})();
return shadow.remote.runtime.api.relay_msg(runtime,res__$1);
});
shadow.remote.runtime.shared.call = (function shadow$remote$runtime$shared$call(var_args){
var G__243586 = arguments.length;
switch (G__243586) {
case 3:
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$3 = (function (runtime,msg,handlers){
return shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4(runtime,msg,handlers,(0));
}));

(shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4 = (function (p__243621,msg,handlers,timeout_after_ms){
var map__243622 = p__243621;
var map__243622__$1 = cljs.core.__destructure_map(map__243622);
var runtime = map__243622__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243622__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
if(cljs.core.map_QMARK_(msg)){
} else {
throw (new Error("Assert failed: (map? msg)"));
}

if(cljs.core.map_QMARK_(handlers)){
} else {
throw (new Error("Assert failed: (map? handlers)"));
}

if(cljs.core.nat_int_QMARK_(timeout_after_ms)){
} else {
throw (new Error("Assert failed: (nat-int? timeout-after-ms)"));
}

var call_id = new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.update,new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218),cljs.core.inc);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),call_id], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"handlers","handlers",79528781),handlers,new cljs.core.Keyword(null,"called-at","called-at",607081160),shadow.remote.runtime.shared.now(),new cljs.core.Keyword(null,"msg","msg",-1386103444),msg,new cljs.core.Keyword(null,"timeout","timeout",-318625318),timeout_after_ms], null));

return shadow.remote.runtime.api.relay_msg(runtime,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"call-id","call-id",1043012968),call_id));
}));

(shadow.remote.runtime.shared.call.cljs$lang$maxFixedArity = 4);

shadow.remote.runtime.shared.trigger_BANG_ = (function shadow$remote$runtime$shared$trigger_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___244012 = arguments.length;
var i__5727__auto___244013 = (0);
while(true){
if((i__5727__auto___244013 < len__5726__auto___244012)){
args__5732__auto__.push((arguments[i__5727__auto___244013]));

var G__244015 = (i__5727__auto___244013 + (1));
i__5727__auto___244013 = G__244015;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__243682,ev,args){
var map__243684 = p__243682;
var map__243684__$1 = cljs.core.__destructure_map(map__243684);
var runtime = map__243684__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243684__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var seq__243688 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__243691 = null;
var count__243692 = (0);
var i__243693 = (0);
while(true){
if((i__243693 < count__243692)){
var ext = chunk__243691.cljs$core$IIndexed$_nth$arity$2(null,i__243693);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__244018 = seq__243688;
var G__244019 = chunk__243691;
var G__244020 = count__243692;
var G__244021 = (i__243693 + (1));
seq__243688 = G__244018;
chunk__243691 = G__244019;
count__243692 = G__244020;
i__243693 = G__244021;
continue;
} else {
var G__244022 = seq__243688;
var G__244023 = chunk__243691;
var G__244024 = count__243692;
var G__244025 = (i__243693 + (1));
seq__243688 = G__244022;
chunk__243691 = G__244023;
count__243692 = G__244024;
i__243693 = G__244025;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__243688);
if(temp__5804__auto__){
var seq__243688__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__243688__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__243688__$1);
var G__244026 = cljs.core.chunk_rest(seq__243688__$1);
var G__244027 = c__5525__auto__;
var G__244028 = cljs.core.count(c__5525__auto__);
var G__244029 = (0);
seq__243688 = G__244026;
chunk__243691 = G__244027;
count__243692 = G__244028;
i__243693 = G__244029;
continue;
} else {
var ext = cljs.core.first(seq__243688__$1);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__244034 = cljs.core.next(seq__243688__$1);
var G__244035 = null;
var G__244036 = (0);
var G__244037 = (0);
seq__243688 = G__244034;
chunk__243691 = G__244035;
count__243692 = G__244036;
i__243693 = G__244037;
continue;
} else {
var G__244038 = cljs.core.next(seq__243688__$1);
var G__244039 = null;
var G__244040 = (0);
var G__244041 = (0);
seq__243688 = G__244038;
chunk__243691 = G__244039;
count__243692 = G__244040;
i__243693 = G__244041;
continue;
}
}
} else {
return null;
}
}
break;
}
}));

(shadow.remote.runtime.shared.trigger_BANG_.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(shadow.remote.runtime.shared.trigger_BANG_.cljs$lang$applyTo = (function (seq243666){
var G__243667 = cljs.core.first(seq243666);
var seq243666__$1 = cljs.core.next(seq243666);
var G__243668 = cljs.core.first(seq243666__$1);
var seq243666__$2 = cljs.core.next(seq243666__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__243667,G__243668,seq243666__$2);
}));

shadow.remote.runtime.shared.welcome = (function shadow$remote$runtime$shared$welcome(p__243712,p__243713){
var map__243714 = p__243712;
var map__243714__$1 = cljs.core.__destructure_map(map__243714);
var runtime = map__243714__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243714__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__243715 = p__243713;
var map__243715__$1 = cljs.core.__destructure_map(map__243715);
var msg = map__243715__$1;
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243715__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.assoc,new cljs.core.Keyword(null,"client-id","client-id",-464622140),client_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"welcome","welcome",-578152123),true], 0));

var map__243719 = cljs.core.deref(state_ref);
var map__243719__$1 = cljs.core.__destructure_map(map__243719);
var client_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243719__$1,new cljs.core.Keyword(null,"client-info","client-info",1958982504));
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243719__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
shadow.remote.runtime.shared.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"hello","hello",-245025397),new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info], null));

return shadow.remote.runtime.shared.trigger_BANG_(runtime,new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125));
});
shadow.remote.runtime.shared.ping = (function shadow$remote$runtime$shared$ping(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"pong","pong",-172484958)], null));
});
shadow.remote.runtime.shared.request_supported_ops = (function shadow$remote$runtime$shared$request_supported_ops(p__243733,msg){
var map__243734 = p__243733;
var map__243734__$1 = cljs.core.__destructure_map(map__243734);
var runtime = map__243734__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243734__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"supported-ops","supported-ops",337914702),new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.disj.cljs$core$IFn$_invoke$arity$variadic(cljs.core.set(cljs.core.keys(new cljs.core.Keyword(null,"ops","ops",1237330063).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))),new cljs.core.Keyword(null,"welcome","welcome",-578152123),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),new cljs.core.Keyword(null,"tool-disconnect","tool-disconnect",189103996)], 0))], null));
});
shadow.remote.runtime.shared.unknown_relay_op = (function shadow$remote$runtime$shared$unknown_relay_op(msg){
return console.warn("unknown-relay-op",msg);
});
shadow.remote.runtime.shared.unknown_op = (function shadow$remote$runtime$shared$unknown_op(msg){
return console.warn("unknown-op",msg);
});
shadow.remote.runtime.shared.add_extension_STAR_ = (function shadow$remote$runtime$shared$add_extension_STAR_(p__243753,key,p__243754){
var map__243760 = p__243753;
var map__243760__$1 = cljs.core.__destructure_map(map__243760);
var state = map__243760__$1;
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243760__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
var map__243763 = p__243754;
var map__243763__$1 = cljs.core.__destructure_map(map__243763);
var spec = map__243763__$1;
var ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243763__$1,new cljs.core.Keyword(null,"ops","ops",1237330063));
var transit_write_handlers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243763__$1,new cljs.core.Keyword(null,"transit-write-handlers","transit-write-handlers",1886308716));
if(cljs.core.contains_QMARK_(extensions,key)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("extension already registered",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"spec","spec",347520401),spec], null));
} else {
}

return cljs.core.reduce_kv((function (state__$1,op_kw,op_handler){
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063),op_kw], null)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("op already registered",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),key,new cljs.core.Keyword(null,"op","op",-1882987955),op_kw], null));
} else {
}

return cljs.core.assoc_in(state__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063),op_kw], null),op_handler);
}),cljs.core.assoc_in(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),key], null),spec),ops);
});
shadow.remote.runtime.shared.add_extension = (function shadow$remote$runtime$shared$add_extension(p__243800,key,spec){
var map__243806 = p__243800;
var map__243806__$1 = cljs.core.__destructure_map(map__243806);
var runtime = map__243806__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243806__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,shadow.remote.runtime.shared.add_extension_STAR_,key,spec);

var temp__5808__auto___244057 = new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125).cljs$core$IFn$_invoke$arity$1(spec);
if((temp__5808__auto___244057 == null)){
} else {
var on_welcome_244058 = temp__5808__auto___244057;
if(cljs.core.truth_(new cljs.core.Keyword(null,"welcome","welcome",-578152123).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))){
(on_welcome_244058.cljs$core$IFn$_invoke$arity$0 ? on_welcome_244058.cljs$core$IFn$_invoke$arity$0() : on_welcome_244058.call(null));
} else {
}
}

return runtime;
});
shadow.remote.runtime.shared.add_defaults = (function shadow$remote$runtime$shared$add_defaults(runtime){
return shadow.remote.runtime.shared.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.shared","defaults","shadow.remote.runtime.shared/defaults",-1821257543),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"welcome","welcome",-578152123),(function (p1__243818_SHARP_){
return shadow.remote.runtime.shared.welcome(runtime,p1__243818_SHARP_);
}),new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),(function (p1__243819_SHARP_){
return shadow.remote.runtime.shared.unknown_relay_op(p1__243819_SHARP_);
}),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),(function (p1__243820_SHARP_){
return shadow.remote.runtime.shared.unknown_op(p1__243820_SHARP_);
}),new cljs.core.Keyword(null,"ping","ping",-1670114784),(function (p1__243821_SHARP_){
return shadow.remote.runtime.shared.ping(runtime,p1__243821_SHARP_);
}),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),(function (p1__243822_SHARP_){
return shadow.remote.runtime.shared.request_supported_ops(runtime,p1__243822_SHARP_);
})], null)], null));
});
shadow.remote.runtime.shared.del_extension_STAR_ = (function shadow$remote$runtime$shared$del_extension_STAR_(state,key){
var ext = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),key], null));
if(cljs.core.not(ext)){
return state;
} else {
return cljs.core.reduce_kv((function (state__$1,op_kw,op_handler){
return cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(state__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063)], null),cljs.core.dissoc,op_kw);
}),cljs.core.update.cljs$core$IFn$_invoke$arity$4(state,new cljs.core.Keyword(null,"extensions","extensions",-1103629196),cljs.core.dissoc,key),new cljs.core.Keyword(null,"ops","ops",1237330063).cljs$core$IFn$_invoke$arity$1(ext));
}
});
shadow.remote.runtime.shared.del_extension = (function shadow$remote$runtime$shared$del_extension(p__243860,key){
var map__243861 = p__243860;
var map__243861__$1 = cljs.core.__destructure_map(map__243861);
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243861__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(state_ref,shadow.remote.runtime.shared.del_extension_STAR_,key);
});
shadow.remote.runtime.shared.unhandled_call_result = (function shadow$remote$runtime$shared$unhandled_call_result(call_config,msg){
return console.warn("unhandled call result",msg,call_config);
});
shadow.remote.runtime.shared.unhandled_client_not_found = (function shadow$remote$runtime$shared$unhandled_client_not_found(p__243906,msg){
var map__243907 = p__243906;
var map__243907__$1 = cljs.core.__destructure_map(map__243907);
var runtime = map__243907__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243907__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic(runtime,new cljs.core.Keyword(null,"on-client-not-found","on-client-not-found",-642452849),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([msg], 0));
});
shadow.remote.runtime.shared.reply_unknown_op = (function shadow$remote$runtime$shared$reply_unknown_op(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"msg","msg",-1386103444),msg], null));
});
shadow.remote.runtime.shared.process = (function shadow$remote$runtime$shared$process(p__243940,p__243941){
var map__243942 = p__243940;
var map__243942__$1 = cljs.core.__destructure_map(map__243942);
var runtime = map__243942__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243942__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__243943 = p__243941;
var map__243943__$1 = cljs.core.__destructure_map(map__243943);
var msg = map__243943__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243943__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__243943__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
var state = cljs.core.deref(state_ref);
var op_handler = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ops","ops",1237330063),op], null));
if(cljs.core.truth_(call_id)){
var cfg = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(state,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),call_id], null));
var call_handler = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cfg,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"handlers","handlers",79528781),op], null));
if(cljs.core.truth_(call_handler)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.update,new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([call_id], 0));

return (call_handler.cljs$core$IFn$_invoke$arity$1 ? call_handler.cljs$core$IFn$_invoke$arity$1(msg) : call_handler.call(null,msg));
} else {
if(cljs.core.truth_(op_handler)){
return (op_handler.cljs$core$IFn$_invoke$arity$1 ? op_handler.cljs$core$IFn$_invoke$arity$1(msg) : op_handler.call(null,msg));
} else {
return shadow.remote.runtime.shared.unhandled_call_result(cfg,msg);

}
}
} else {
if(cljs.core.truth_(op_handler)){
return (op_handler.cljs$core$IFn$_invoke$arity$1 ? op_handler.cljs$core$IFn$_invoke$arity$1(msg) : op_handler.call(null,msg));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-not-found","client-not-found",-1754042614),op)){
return shadow.remote.runtime.shared.unhandled_client_not_found(runtime,msg);
} else {
return shadow.remote.runtime.shared.reply_unknown_op(runtime,msg);

}
}
}
});
shadow.remote.runtime.shared.run_on_idle = (function shadow$remote$runtime$shared$run_on_idle(state_ref){
var seq__243981 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__243983 = null;
var count__243984 = (0);
var i__243985 = (0);
while(true){
if((i__243985 < count__243984)){
var map__244001 = chunk__243983.cljs$core$IIndexed$_nth$arity$2(null,i__243985);
var map__244001__$1 = cljs.core.__destructure_map(map__244001);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__244001__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__244065 = seq__243981;
var G__244066 = chunk__243983;
var G__244067 = count__243984;
var G__244068 = (i__243985 + (1));
seq__243981 = G__244065;
chunk__243983 = G__244066;
count__243984 = G__244067;
i__243985 = G__244068;
continue;
} else {
var G__244069 = seq__243981;
var G__244070 = chunk__243983;
var G__244071 = count__243984;
var G__244072 = (i__243985 + (1));
seq__243981 = G__244069;
chunk__243983 = G__244070;
count__243984 = G__244071;
i__243985 = G__244072;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__243981);
if(temp__5804__auto__){
var seq__243981__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__243981__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__243981__$1);
var G__244073 = cljs.core.chunk_rest(seq__243981__$1);
var G__244074 = c__5525__auto__;
var G__244075 = cljs.core.count(c__5525__auto__);
var G__244076 = (0);
seq__243981 = G__244073;
chunk__243983 = G__244074;
count__243984 = G__244075;
i__243985 = G__244076;
continue;
} else {
var map__244002 = cljs.core.first(seq__243981__$1);
var map__244002__$1 = cljs.core.__destructure_map(map__244002);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__244002__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__244077 = cljs.core.next(seq__243981__$1);
var G__244078 = null;
var G__244079 = (0);
var G__244080 = (0);
seq__243981 = G__244077;
chunk__243983 = G__244078;
count__243984 = G__244079;
i__243985 = G__244080;
continue;
} else {
var G__244081 = cljs.core.next(seq__243981__$1);
var G__244082 = null;
var G__244083 = (0);
var G__244084 = (0);
seq__243981 = G__244081;
chunk__243983 = G__244082;
count__243984 = G__244083;
i__243985 = G__244084;
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

//# sourceMappingURL=shadow.remote.runtime.shared.js.map
