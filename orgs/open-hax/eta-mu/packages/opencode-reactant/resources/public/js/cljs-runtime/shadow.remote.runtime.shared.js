goog.provide('shadow.remote.runtime.shared');
shadow.remote.runtime.shared.init_state = (function shadow$remote$runtime$shared$init_state(client_info){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"extensions","extensions",-1103629196),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info,new cljs.core.Keyword(null,"call-id-seq","call-id-seq",-1679248218),(0),new cljs.core.Keyword(null,"call-handlers","call-handlers",386605551),cljs.core.PersistentArrayMap.EMPTY], null);
});
shadow.remote.runtime.shared.now = (function shadow$remote$runtime$shared$now(){
return Date.now();
});
shadow.remote.runtime.shared.get_client_id = (function shadow$remote$runtime$shared$get_client_id(p__16336){
var map__16337 = p__16336;
var map__16337__$1 = cljs.core.__destructure_map(map__16337);
var runtime = map__16337__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16337__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var or__5002__auto__ = new cljs.core.Keyword(null,"client-id","client-id",-464622140).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("runtime has no assigned runtime-id",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"runtime","runtime",-1331573996),runtime], null));
}
});
shadow.remote.runtime.shared.relay_msg = (function shadow$remote$runtime$shared$relay_msg(runtime,msg){
var self_id_16735 = shadow.remote.runtime.shared.get_client_id(runtime);
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"to","to",192099007).cljs$core$IFn$_invoke$arity$1(msg),self_id_16735)){
shadow.remote.runtime.api.relay_msg(runtime,msg);
} else {
Promise.resolve((1)).then((function (){
var G__16349 = runtime;
var G__16350 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(msg,new cljs.core.Keyword(null,"from","from",1815293044),self_id_16735);
return (shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2 ? shadow.remote.runtime.shared.process.cljs$core$IFn$_invoke$arity$2(G__16349,G__16350) : shadow.remote.runtime.shared.process.call(null,G__16349,G__16350));
}));
}

return msg;
});
shadow.remote.runtime.shared.reply = (function shadow$remote$runtime$shared$reply(runtime,p__16351,res){
var map__16352 = p__16351;
var map__16352__$1 = cljs.core.__destructure_map(map__16352);
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16352__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
var from = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16352__$1,new cljs.core.Keyword(null,"from","from",1815293044));
var res__$1 = (function (){var G__16354 = res;
var G__16354__$1 = (cljs.core.truth_(call_id)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__16354,new cljs.core.Keyword(null,"call-id","call-id",1043012968),call_id):G__16354);
if(cljs.core.truth_(from)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__16354__$1,new cljs.core.Keyword(null,"to","to",192099007),from);
} else {
return G__16354__$1;
}
})();
return shadow.remote.runtime.api.relay_msg(runtime,res__$1);
});
shadow.remote.runtime.shared.call = (function shadow$remote$runtime$shared$call(var_args){
var G__16363 = arguments.length;
switch (G__16363) {
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

(shadow.remote.runtime.shared.call.cljs$core$IFn$_invoke$arity$4 = (function (p__16378,msg,handlers,timeout_after_ms){
var map__16395 = p__16378;
var map__16395__$1 = cljs.core.__destructure_map(map__16395);
var runtime = map__16395__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16395__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
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
var len__5726__auto___16749 = arguments.length;
var i__5727__auto___16751 = (0);
while(true){
if((i__5727__auto___16751 < len__5726__auto___16749)){
args__5732__auto__.push((arguments[i__5727__auto___16751]));

var G__16752 = (i__5727__auto___16751 + (1));
i__5727__auto___16751 = G__16752;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (p__16449,ev,args){
var map__16453 = p__16449;
var map__16453__$1 = cljs.core.__destructure_map(map__16453);
var runtime = map__16453__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16453__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var seq__16466 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__16469 = null;
var count__16471 = (0);
var i__16472 = (0);
while(true){
if((i__16472 < count__16471)){
var ext = chunk__16469.cljs$core$IIndexed$_nth$arity$2(null,i__16472);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__16759 = seq__16466;
var G__16760 = chunk__16469;
var G__16761 = count__16471;
var G__16762 = (i__16472 + (1));
seq__16466 = G__16759;
chunk__16469 = G__16760;
count__16471 = G__16761;
i__16472 = G__16762;
continue;
} else {
var G__16763 = seq__16466;
var G__16764 = chunk__16469;
var G__16765 = count__16471;
var G__16766 = (i__16472 + (1));
seq__16466 = G__16763;
chunk__16469 = G__16764;
count__16471 = G__16765;
i__16472 = G__16766;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__16466);
if(temp__5804__auto__){
var seq__16466__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__16466__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__16466__$1);
var G__16768 = cljs.core.chunk_rest(seq__16466__$1);
var G__16769 = c__5525__auto__;
var G__16770 = cljs.core.count(c__5525__auto__);
var G__16771 = (0);
seq__16466 = G__16768;
chunk__16469 = G__16769;
count__16471 = G__16770;
i__16472 = G__16771;
continue;
} else {
var ext = cljs.core.first(seq__16466__$1);
var ev_fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(ext,ev);
if(cljs.core.truth_(ev_fn)){
cljs.core.apply.cljs$core$IFn$_invoke$arity$2(ev_fn,args);


var G__16773 = cljs.core.next(seq__16466__$1);
var G__16774 = null;
var G__16775 = (0);
var G__16776 = (0);
seq__16466 = G__16773;
chunk__16469 = G__16774;
count__16471 = G__16775;
i__16472 = G__16776;
continue;
} else {
var G__16778 = cljs.core.next(seq__16466__$1);
var G__16779 = null;
var G__16780 = (0);
var G__16781 = (0);
seq__16466 = G__16778;
chunk__16469 = G__16779;
count__16471 = G__16780;
i__16472 = G__16781;
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
(shadow.remote.runtime.shared.trigger_BANG_.cljs$lang$applyTo = (function (seq16410){
var G__16411 = cljs.core.first(seq16410);
var seq16410__$1 = cljs.core.next(seq16410);
var G__16412 = cljs.core.first(seq16410__$1);
var seq16410__$2 = cljs.core.next(seq16410__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__16411,G__16412,seq16410__$2);
}));

shadow.remote.runtime.shared.welcome = (function shadow$remote$runtime$shared$welcome(p__16548,p__16549){
var map__16550 = p__16548;
var map__16550__$1 = cljs.core.__destructure_map(map__16550);
var runtime = map__16550__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16550__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__16551 = p__16549;
var map__16551__$1 = cljs.core.__destructure_map(map__16551);
var msg = map__16551__$1;
var client_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16551__$1,new cljs.core.Keyword(null,"client-id","client-id",-464622140));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(state_ref,cljs.core.assoc,new cljs.core.Keyword(null,"client-id","client-id",-464622140),client_id,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"welcome","welcome",-578152123),true], 0));

var map__16565 = cljs.core.deref(state_ref);
var map__16565__$1 = cljs.core.__destructure_map(map__16565);
var client_info = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16565__$1,new cljs.core.Keyword(null,"client-info","client-info",1958982504));
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16565__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
shadow.remote.runtime.shared.relay_msg(runtime,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"hello","hello",-245025397),new cljs.core.Keyword(null,"client-info","client-info",1958982504),client_info], null));

return shadow.remote.runtime.shared.trigger_BANG_(runtime,new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125));
});
shadow.remote.runtime.shared.ping = (function shadow$remote$runtime$shared$ping(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"pong","pong",-172484958)], null));
});
shadow.remote.runtime.shared.request_supported_ops = (function shadow$remote$runtime$shared$request_supported_ops(p__16576,msg){
var map__16578 = p__16576;
var map__16578__$1 = cljs.core.__destructure_map(map__16578);
var runtime = map__16578__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16578__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"supported-ops","supported-ops",337914702),new cljs.core.Keyword(null,"ops","ops",1237330063),cljs.core.disj.cljs$core$IFn$_invoke$arity$variadic(cljs.core.set(cljs.core.keys(new cljs.core.Keyword(null,"ops","ops",1237330063).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))),new cljs.core.Keyword(null,"welcome","welcome",-578152123),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),new cljs.core.Keyword(null,"tool-disconnect","tool-disconnect",189103996)], 0))], null));
});
shadow.remote.runtime.shared.unknown_relay_op = (function shadow$remote$runtime$shared$unknown_relay_op(msg){
return console.warn("unknown-relay-op",msg);
});
shadow.remote.runtime.shared.unknown_op = (function shadow$remote$runtime$shared$unknown_op(msg){
return console.warn("unknown-op",msg);
});
shadow.remote.runtime.shared.add_extension_STAR_ = (function shadow$remote$runtime$shared$add_extension_STAR_(p__16613,key,p__16614){
var map__16616 = p__16613;
var map__16616__$1 = cljs.core.__destructure_map(map__16616);
var state = map__16616__$1;
var extensions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16616__$1,new cljs.core.Keyword(null,"extensions","extensions",-1103629196));
var map__16618 = p__16614;
var map__16618__$1 = cljs.core.__destructure_map(map__16618);
var spec = map__16618__$1;
var ops = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16618__$1,new cljs.core.Keyword(null,"ops","ops",1237330063));
var transit_write_handlers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16618__$1,new cljs.core.Keyword(null,"transit-write-handlers","transit-write-handlers",1886308716));
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
shadow.remote.runtime.shared.add_extension = (function shadow$remote$runtime$shared$add_extension(p__16649,key,spec){
var map__16650 = p__16649;
var map__16650__$1 = cljs.core.__destructure_map(map__16650);
var runtime = map__16650__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16650__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(state_ref,shadow.remote.runtime.shared.add_extension_STAR_,key,spec);

var temp__5808__auto___16822 = new cljs.core.Keyword(null,"on-welcome","on-welcome",1895317125).cljs$core$IFn$_invoke$arity$1(spec);
if((temp__5808__auto___16822 == null)){
} else {
var on_welcome_16824 = temp__5808__auto___16822;
if(cljs.core.truth_(new cljs.core.Keyword(null,"welcome","welcome",-578152123).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref)))){
(on_welcome_16824.cljs$core$IFn$_invoke$arity$0 ? on_welcome_16824.cljs$core$IFn$_invoke$arity$0() : on_welcome_16824.call(null));
} else {
}
}

return runtime;
});
shadow.remote.runtime.shared.add_defaults = (function shadow$remote$runtime$shared$add_defaults(runtime){
return shadow.remote.runtime.shared.add_extension(runtime,new cljs.core.Keyword("shadow.remote.runtime.shared","defaults","shadow.remote.runtime.shared/defaults",-1821257543),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"ops","ops",1237330063),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"welcome","welcome",-578152123),(function (p1__16658_SHARP_){
return shadow.remote.runtime.shared.welcome(runtime,p1__16658_SHARP_);
}),new cljs.core.Keyword(null,"unknown-relay-op","unknown-relay-op",170832753),(function (p1__16659_SHARP_){
return shadow.remote.runtime.shared.unknown_relay_op(p1__16659_SHARP_);
}),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),(function (p1__16660_SHARP_){
return shadow.remote.runtime.shared.unknown_op(p1__16660_SHARP_);
}),new cljs.core.Keyword(null,"ping","ping",-1670114784),(function (p1__16661_SHARP_){
return shadow.remote.runtime.shared.ping(runtime,p1__16661_SHARP_);
}),new cljs.core.Keyword(null,"request-supported-ops","request-supported-ops",-1034994502),(function (p1__16662_SHARP_){
return shadow.remote.runtime.shared.request_supported_ops(runtime,p1__16662_SHARP_);
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
shadow.remote.runtime.shared.del_extension = (function shadow$remote$runtime$shared$del_extension(p__16673,key){
var map__16675 = p__16673;
var map__16675__$1 = cljs.core.__destructure_map(map__16675);
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16675__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(state_ref,shadow.remote.runtime.shared.del_extension_STAR_,key);
});
shadow.remote.runtime.shared.unhandled_call_result = (function shadow$remote$runtime$shared$unhandled_call_result(call_config,msg){
return console.warn("unhandled call result",msg,call_config);
});
shadow.remote.runtime.shared.unhandled_client_not_found = (function shadow$remote$runtime$shared$unhandled_client_not_found(p__16678,msg){
var map__16681 = p__16678;
var map__16681__$1 = cljs.core.__destructure_map(map__16681);
var runtime = map__16681__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16681__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
return shadow.remote.runtime.shared.trigger_BANG_.cljs$core$IFn$_invoke$arity$variadic(runtime,new cljs.core.Keyword(null,"on-client-not-found","on-client-not-found",-642452849),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([msg], 0));
});
shadow.remote.runtime.shared.reply_unknown_op = (function shadow$remote$runtime$shared$reply_unknown_op(runtime,msg){
return shadow.remote.runtime.shared.reply(runtime,msg,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"unknown-op","unknown-op",1900385996),new cljs.core.Keyword(null,"msg","msg",-1386103444),msg], null));
});
shadow.remote.runtime.shared.process = (function shadow$remote$runtime$shared$process(p__16688,p__16689){
var map__16690 = p__16688;
var map__16690__$1 = cljs.core.__destructure_map(map__16690);
var runtime = map__16690__$1;
var state_ref = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16690__$1,new cljs.core.Keyword(null,"state-ref","state-ref",2127874952));
var map__16694 = p__16689;
var map__16694__$1 = cljs.core.__destructure_map(map__16694);
var msg = map__16694__$1;
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16694__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var call_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16694__$1,new cljs.core.Keyword(null,"call-id","call-id",1043012968));
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
var seq__16703 = cljs.core.seq(cljs.core.vals(new cljs.core.Keyword(null,"extensions","extensions",-1103629196).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(state_ref))));
var chunk__16705 = null;
var count__16706 = (0);
var i__16707 = (0);
while(true){
if((i__16707 < count__16706)){
var map__16719 = chunk__16705.cljs$core$IIndexed$_nth$arity$2(null,i__16707);
var map__16719__$1 = cljs.core.__destructure_map(map__16719);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16719__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__16874 = seq__16703;
var G__16875 = chunk__16705;
var G__16876 = count__16706;
var G__16877 = (i__16707 + (1));
seq__16703 = G__16874;
chunk__16705 = G__16875;
count__16706 = G__16876;
i__16707 = G__16877;
continue;
} else {
var G__16878 = seq__16703;
var G__16879 = chunk__16705;
var G__16880 = count__16706;
var G__16881 = (i__16707 + (1));
seq__16703 = G__16878;
chunk__16705 = G__16879;
count__16706 = G__16880;
i__16707 = G__16881;
continue;
}
} else {
var temp__5804__auto__ = cljs.core.seq(seq__16703);
if(temp__5804__auto__){
var seq__16703__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__16703__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__16703__$1);
var G__16888 = cljs.core.chunk_rest(seq__16703__$1);
var G__16889 = c__5525__auto__;
var G__16890 = cljs.core.count(c__5525__auto__);
var G__16891 = (0);
seq__16703 = G__16888;
chunk__16705 = G__16889;
count__16706 = G__16890;
i__16707 = G__16891;
continue;
} else {
var map__16725 = cljs.core.first(seq__16703__$1);
var map__16725__$1 = cljs.core.__destructure_map(map__16725);
var on_idle = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__16725__$1,new cljs.core.Keyword(null,"on-idle","on-idle",2044706602));
if(cljs.core.truth_(on_idle)){
(on_idle.cljs$core$IFn$_invoke$arity$0 ? on_idle.cljs$core$IFn$_invoke$arity$0() : on_idle.call(null));


var G__16897 = cljs.core.next(seq__16703__$1);
var G__16898 = null;
var G__16899 = (0);
var G__16900 = (0);
seq__16703 = G__16897;
chunk__16705 = G__16898;
count__16706 = G__16899;
i__16707 = G__16900;
continue;
} else {
var G__16901 = cljs.core.next(seq__16703__$1);
var G__16902 = null;
var G__16903 = (0);
var G__16904 = (0);
seq__16703 = G__16901;
chunk__16705 = G__16902;
count__16706 = G__16903;
i__16707 = G__16904;
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
