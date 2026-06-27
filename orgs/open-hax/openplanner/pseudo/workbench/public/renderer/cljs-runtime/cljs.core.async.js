goog.provide('cljs.core.async');
goog.scope(function(){
  cljs.core.async.goog$module$goog$array = goog.module.get('goog.array');
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async244265 = (function (f,blockable,meta244266){
this.f = f;
this.blockable = blockable;
this.meta244266 = meta244266;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async244265.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_244267,meta244266__$1){
var self__ = this;
var _244267__$1 = this;
return (new cljs.core.async.t_cljs$core$async244265(self__.f,self__.blockable,meta244266__$1));
}));

(cljs.core.async.t_cljs$core$async244265.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_244267){
var self__ = this;
var _244267__$1 = this;
return self__.meta244266;
}));

(cljs.core.async.t_cljs$core$async244265.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async244265.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async244265.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.blockable;
}));

(cljs.core.async.t_cljs$core$async244265.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.f;
}));

(cljs.core.async.t_cljs$core$async244265.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"blockable","blockable",-28395259,null),new cljs.core.Symbol(null,"meta244266","meta244266",1109336049,null)], null);
}));

(cljs.core.async.t_cljs$core$async244265.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async244265.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async244265");

(cljs.core.async.t_cljs$core$async244265.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async244265");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async244265.
 */
cljs.core.async.__GT_t_cljs$core$async244265 = (function cljs$core$async$__GT_t_cljs$core$async244265(f,blockable,meta244266){
return (new cljs.core.async.t_cljs$core$async244265(f,blockable,meta244266));
});


cljs.core.async.fn_handler = (function cljs$core$async$fn_handler(var_args){
var G__244256 = arguments.length;
switch (G__244256) {
case 1:
return cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1 = (function (f){
return cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2(f,true);
}));

(cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2 = (function (f,blockable){
return (new cljs.core.async.t_cljs$core$async244265(f,blockable,cljs.core.PersistentArrayMap.EMPTY));
}));

(cljs.core.async.fn_handler.cljs$lang$maxFixedArity = 2);

/**
 * Returns a fixed buffer of size n. When full, puts will block/park.
 */
cljs.core.async.buffer = (function cljs$core$async$buffer(n){
return cljs.core.async.impl.buffers.fixed_buffer(n);
});
/**
 * Returns a buffer of size n. When full, puts will complete but
 *   val will be dropped (no transfer).
 */
cljs.core.async.dropping_buffer = (function cljs$core$async$dropping_buffer(n){
return cljs.core.async.impl.buffers.dropping_buffer(n);
});
/**
 * Returns a buffer of size n. When full, puts will complete, and be
 *   buffered, but oldest elements in buffer will be dropped (not
 *   transferred).
 */
cljs.core.async.sliding_buffer = (function cljs$core$async$sliding_buffer(n){
return cljs.core.async.impl.buffers.sliding_buffer(n);
});
/**
 * Returns true if a channel created with buff will never block. That is to say,
 * puts into this buffer will never cause the buffer to be full. 
 */
cljs.core.async.unblocking_buffer_QMARK_ = (function cljs$core$async$unblocking_buffer_QMARK_(buff){
if((!((buff == null)))){
if(((false) || ((cljs.core.PROTOCOL_SENTINEL === buff.cljs$core$async$impl$protocols$UnblockingBuffer$)))){
return true;
} else {
if((!buff.cljs$lang$protocol_mask$partition$)){
return cljs.core.native_satisfies_QMARK_(cljs.core.async.impl.protocols.UnblockingBuffer,buff);
} else {
return false;
}
}
} else {
return cljs.core.native_satisfies_QMARK_(cljs.core.async.impl.protocols.UnblockingBuffer,buff);
}
});
/**
 * Creates a channel with an optional buffer, an optional transducer (like (map f),
 *   (filter p) etc or a composition thereof), and an optional exception handler.
 *   If buf-or-n is a number, will create and use a fixed buffer of that size. If a
 *   transducer is supplied a buffer must be specified. ex-handler must be a
 *   fn of one argument - if an exception occurs during transformation it will be called
 *   with the thrown value as an argument, and any non-nil return value will be placed
 *   in the channel.
 */
cljs.core.async.chan = (function cljs$core$async$chan(var_args){
var G__244317 = arguments.length;
switch (G__244317) {
case 0:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(null);
}));

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1 = (function (buf_or_n){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3(buf_or_n,null,null);
}));

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$2 = (function (buf_or_n,xform){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3(buf_or_n,xform,null);
}));

(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3 = (function (buf_or_n,xform,ex_handler){
var buf_or_n__$1 = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buf_or_n,(0)))?null:buf_or_n);
if(cljs.core.truth_(xform)){
if(cljs.core.truth_(buf_or_n__$1)){
} else {
throw (new Error(["Assert failed: ","buffer must be supplied when transducer is","\n","buf-or-n"].join('')));
}
} else {
}

return cljs.core.async.impl.channels.chan.cljs$core$IFn$_invoke$arity$3(((typeof buf_or_n__$1 === 'number')?cljs.core.async.buffer(buf_or_n__$1):buf_or_n__$1),xform,ex_handler);
}));

(cljs.core.async.chan.cljs$lang$maxFixedArity = 3);

/**
 * Creates a promise channel with an optional transducer, and an optional
 *   exception-handler. A promise channel can take exactly one value that consumers
 *   will receive. Once full, puts complete but val is dropped (no transfer).
 *   Consumers will block until either a value is placed in the channel or the
 *   channel is closed. See chan for the semantics of xform and ex-handler.
 */
cljs.core.async.promise_chan = (function cljs$core$async$promise_chan(var_args){
var G__244365 = arguments.length;
switch (G__244365) {
case 0:
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$0 = (function (){
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$1(null);
}));

(cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$1 = (function (xform){
return cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$2(xform,null);
}));

(cljs.core.async.promise_chan.cljs$core$IFn$_invoke$arity$2 = (function (xform,ex_handler){
return cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3(cljs.core.async.impl.buffers.promise_buffer(),xform,ex_handler);
}));

(cljs.core.async.promise_chan.cljs$lang$maxFixedArity = 2);

/**
 * Returns a channel that will close after msecs
 */
cljs.core.async.timeout = (function cljs$core$async$timeout(msecs){
return cljs.core.async.impl.timers.timeout(msecs);
});
/**
 * takes a val from port. Must be called inside a (go ...) block. Will
 *   return nil if closed. Will park if nothing is available.
 *   Returns true unless port is already closed
 */
cljs.core.async._LT__BANG_ = (function cljs$core$async$_LT__BANG_(port){
throw (new Error("<! used not in (go ...) block"));
});
/**
 * Asynchronously takes a val from port, passing to fn1. Will pass nil
 * if closed. If on-caller? (default true) is true, and value is
 * immediately available, will call fn1 on calling thread.
 * Returns nil.
 */
cljs.core.async.take_BANG_ = (function cljs$core$async$take_BANG_(var_args){
var G__244426 = arguments.length;
switch (G__244426) {
case 2:
return cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (port,fn1){
return cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$3(port,fn1,true);
}));

(cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (port,fn1,on_caller_QMARK_){
var ret = cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1(fn1));
if(cljs.core.truth_(ret)){
var val_249152 = cljs.core.deref(ret);
if(cljs.core.truth_(on_caller_QMARK_)){
(fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_249152) : fn1.call(null,val_249152));
} else {
cljs.core.async.impl.dispatch.run((function (){
return (fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_249152) : fn1.call(null,val_249152));
}));
}
} else {
}

return null;
}));

(cljs.core.async.take_BANG_.cljs$lang$maxFixedArity = 3);

cljs.core.async.nop = (function cljs$core$async$nop(_){
return null;
});
cljs.core.async.fhnop = cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1(cljs.core.async.nop);
/**
 * puts a val into port. nil values are not allowed. Must be called
 *   inside a (go ...) block. Will park if no buffer space is available.
 *   Returns true unless port is already closed.
 */
cljs.core.async._GT__BANG_ = (function cljs$core$async$_GT__BANG_(port,val){
throw (new Error(">! used not in (go ...) block"));
});
/**
 * Asynchronously puts a val into port, calling fn1 (if supplied) when
 * complete. nil values are not allowed. Will throw if closed. If
 * on-caller? (default true) is true, and the put is immediately
 * accepted, will call fn1 on calling thread.  Returns nil.
 */
cljs.core.async.put_BANG_ = (function cljs$core$async$put_BANG_(var_args){
var G__244501 = arguments.length;
switch (G__244501) {
case 2:
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (port,val){
var temp__5802__auto__ = cljs.core.async.impl.protocols.put_BANG_(port,val,cljs.core.async.fhnop);
if(cljs.core.truth_(temp__5802__auto__)){
var ret = temp__5802__auto__;
return cljs.core.deref(ret);
} else {
return true;
}
}));

(cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (port,val,fn1){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$4(port,val,fn1,true);
}));

(cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$4 = (function (port,val,fn1,on_caller_QMARK_){
var temp__5802__auto__ = cljs.core.async.impl.protocols.put_BANG_(port,val,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$1(fn1));
if(cljs.core.truth_(temp__5802__auto__)){
var retb = temp__5802__auto__;
var ret = cljs.core.deref(retb);
if(cljs.core.truth_(on_caller_QMARK_)){
(fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(ret) : fn1.call(null,ret));
} else {
cljs.core.async.impl.dispatch.run((function (){
return (fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(ret) : fn1.call(null,ret));
}));
}

return ret;
} else {
return true;
}
}));

(cljs.core.async.put_BANG_.cljs$lang$maxFixedArity = 4);

cljs.core.async.close_BANG_ = (function cljs$core$async$close_BANG_(port){
return cljs.core.async.impl.protocols.close_BANG_(port);
});
cljs.core.async.random_array = (function cljs$core$async$random_array(n){
var a = (new Array(n));
var n__5593__auto___249168 = n;
var x_249169 = (0);
while(true){
if((x_249169 < n__5593__auto___249168)){
(a[x_249169] = x_249169);

var G__249171 = (x_249169 + (1));
x_249169 = G__249171;
continue;
} else {
}
break;
}

cljs.core.async.goog$module$goog$array.shuffle(a);

return a;
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async244566 = (function (flag,meta244567){
this.flag = flag;
this.meta244567 = meta244567;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async244566.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_244568,meta244567__$1){
var self__ = this;
var _244568__$1 = this;
return (new cljs.core.async.t_cljs$core$async244566(self__.flag,meta244567__$1));
}));

(cljs.core.async.t_cljs$core$async244566.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_244568){
var self__ = this;
var _244568__$1 = this;
return self__.meta244567;
}));

(cljs.core.async.t_cljs$core$async244566.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async244566.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.flag);
}));

(cljs.core.async.t_cljs$core$async244566.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async244566.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.flag,null);

return true;
}));

(cljs.core.async.t_cljs$core$async244566.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"meta244567","meta244567",-1656320179,null)], null);
}));

(cljs.core.async.t_cljs$core$async244566.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async244566.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async244566");

(cljs.core.async.t_cljs$core$async244566.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async244566");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async244566.
 */
cljs.core.async.__GT_t_cljs$core$async244566 = (function cljs$core$async$__GT_t_cljs$core$async244566(flag,meta244567){
return (new cljs.core.async.t_cljs$core$async244566(flag,meta244567));
});


cljs.core.async.alt_flag = (function cljs$core$async$alt_flag(){
var flag = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
return (new cljs.core.async.t_cljs$core$async244566(flag,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async244603 = (function (flag,cb,meta244604){
this.flag = flag;
this.cb = cb;
this.meta244604 = meta244604;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async244603.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_244605,meta244604__$1){
var self__ = this;
var _244605__$1 = this;
return (new cljs.core.async.t_cljs$core$async244603(self__.flag,self__.cb,meta244604__$1));
}));

(cljs.core.async.t_cljs$core$async244603.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_244605){
var self__ = this;
var _244605__$1 = this;
return self__.meta244604;
}));

(cljs.core.async.t_cljs$core$async244603.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async244603.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.flag);
}));

(cljs.core.async.t_cljs$core$async244603.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async244603.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.async.impl.protocols.commit(self__.flag);

return self__.cb;
}));

(cljs.core.async.t_cljs$core$async244603.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"cb","cb",-2064487928,null),new cljs.core.Symbol(null,"meta244604","meta244604",-145608799,null)], null);
}));

(cljs.core.async.t_cljs$core$async244603.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async244603.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async244603");

(cljs.core.async.t_cljs$core$async244603.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async244603");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async244603.
 */
cljs.core.async.__GT_t_cljs$core$async244603 = (function cljs$core$async$__GT_t_cljs$core$async244603(flag,cb,meta244604){
return (new cljs.core.async.t_cljs$core$async244603(flag,cb,meta244604));
});


cljs.core.async.alt_handler = (function cljs$core$async$alt_handler(flag,cb){
return (new cljs.core.async.t_cljs$core$async244603(flag,cb,cljs.core.PersistentArrayMap.EMPTY));
});
/**
 * returns derefable [val port] if immediate, nil if enqueued
 */
cljs.core.async.do_alts = (function cljs$core$async$do_alts(fret,ports,opts){
if((cljs.core.count(ports) > (0))){
} else {
throw (new Error(["Assert failed: ","alts must have at least one channel operation","\n","(pos? (count ports))"].join('')));
}

var flag = cljs.core.async.alt_flag();
var n = cljs.core.count(ports);
var idxs = cljs.core.async.random_array(n);
var priority = new cljs.core.Keyword(null,"priority","priority",1431093715).cljs$core$IFn$_invoke$arity$1(opts);
var ret = (function (){var i = (0);
while(true){
if((i < n)){
var idx = (cljs.core.truth_(priority)?i:(idxs[i]));
var port = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(ports,idx);
var wport = ((cljs.core.vector_QMARK_(port))?(port.cljs$core$IFn$_invoke$arity$1 ? port.cljs$core$IFn$_invoke$arity$1((0)) : port.call(null,(0))):null);
var vbox = (cljs.core.truth_(wport)?(function (){var val = (port.cljs$core$IFn$_invoke$arity$1 ? port.cljs$core$IFn$_invoke$arity$1((1)) : port.call(null,(1)));
return cljs.core.async.impl.protocols.put_BANG_(wport,val,cljs.core.async.alt_handler(flag,((function (i,val,idx,port,wport,flag,n,idxs,priority){
return (function (p1__244631_SHARP_){
var G__244652 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__244631_SHARP_,wport], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__244652) : fret.call(null,G__244652));
});})(i,val,idx,port,wport,flag,n,idxs,priority))
));
})():cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.alt_handler(flag,((function (i,idx,port,wport,flag,n,idxs,priority){
return (function (p1__244632_SHARP_){
var G__244655 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__244632_SHARP_,port], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__244655) : fret.call(null,G__244655));
});})(i,idx,port,wport,flag,n,idxs,priority))
)));
if(cljs.core.truth_(vbox)){
return cljs.core.async.impl.channels.box(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cljs.core.deref(vbox),(function (){var or__5002__auto__ = wport;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return port;
}
})()], null));
} else {
var G__249181 = (i + (1));
i = G__249181;
continue;
}
} else {
return null;
}
break;
}
})();
var or__5002__auto__ = ret;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(cljs.core.contains_QMARK_(opts,new cljs.core.Keyword(null,"default","default",-1987822328))){
var temp__5804__auto__ = (function (){var and__5000__auto__ = flag.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1(null);
if(cljs.core.truth_(and__5000__auto__)){
return flag.cljs$core$async$impl$protocols$Handler$commit$arity$1(null);
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(temp__5804__auto__)){
var got = temp__5804__auto__;
return cljs.core.async.impl.channels.box(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"default","default",-1987822328).cljs$core$IFn$_invoke$arity$1(opts),new cljs.core.Keyword(null,"default","default",-1987822328)], null));
} else {
return null;
}
} else {
return null;
}
}
});
/**
 * Completes at most one of several channel operations. Must be called
 * inside a (go ...) block. ports is a vector of channel endpoints,
 * which can be either a channel to take from or a vector of
 *   [channel-to-put-to val-to-put], in any combination. Takes will be
 *   made as if by <!, and puts will be made as if by >!. Unless
 *   the :priority option is true, if more than one port operation is
 *   ready a non-deterministic choice will be made. If no operation is
 *   ready and a :default value is supplied, [default-val :default] will
 *   be returned, otherwise alts! will park until the first operation to
 *   become ready completes. Returns [val port] of the completed
 *   operation, where val is the value taken for takes, and a
 *   boolean (true unless already closed, as per put!) for puts.
 * 
 *   opts are passed as :key val ... Supported options:
 * 
 *   :default val - the value to use if none of the operations are immediately ready
 *   :priority true - (default nil) when true, the operations will be tried in order.
 * 
 *   Note: there is no guarantee that the port exps or val exprs will be
 *   used, nor in what order should they be, so they should not be
 *   depended upon for side effects.
 */
cljs.core.async.alts_BANG_ = (function cljs$core$async$alts_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___249187 = arguments.length;
var i__5727__auto___249188 = (0);
while(true){
if((i__5727__auto___249188 < len__5726__auto___249187)){
args__5732__auto__.push((arguments[i__5727__auto___249188]));

var G__249189 = (i__5727__auto___249188 + (1));
i__5727__auto___249188 = G__249189;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (ports,p__244685){
var map__244686 = p__244685;
var map__244686__$1 = cljs.core.__destructure_map(map__244686);
var opts = map__244686__$1;
throw (new Error("alts! used not in (go ...) block"));
}));

(cljs.core.async.alts_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs.core.async.alts_BANG_.cljs$lang$applyTo = (function (seq244669){
var G__244670 = cljs.core.first(seq244669);
var seq244669__$1 = cljs.core.next(seq244669);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__244670,seq244669__$1);
}));

/**
 * Puts a val into port if it's possible to do so immediately.
 *   nil values are not allowed. Never blocks. Returns true if offer succeeds.
 */
cljs.core.async.offer_BANG_ = (function cljs$core$async$offer_BANG_(port,val){
var ret = cljs.core.async.impl.protocols.put_BANG_(port,val,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2(cljs.core.async.nop,false));
if(cljs.core.truth_(ret)){
return cljs.core.deref(ret);
} else {
return null;
}
});
/**
 * Takes a val from port if it's possible to do so immediately.
 *   Never blocks. Returns value if successful, nil otherwise.
 */
cljs.core.async.poll_BANG_ = (function cljs$core$async$poll_BANG_(port){
var ret = cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.fn_handler.cljs$core$IFn$_invoke$arity$2(cljs.core.async.nop,false));
if(cljs.core.truth_(ret)){
return cljs.core.deref(ret);
} else {
return null;
}
});
/**
 * Takes elements from the from channel and supplies them to the to
 * channel. By default, the to channel will be closed when the from
 * channel closes, but can be determined by the close?  parameter. Will
 * stop consuming the from channel if the to channel closes
 */
cljs.core.async.pipe = (function cljs$core$async$pipe(var_args){
var G__244710 = arguments.length;
switch (G__244710) {
case 2:
return cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$2 = (function (from,to){
return cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$3(from,to,true);
}));

(cljs.core.async.pipe.cljs$core$IFn$_invoke$arity$3 = (function (from,to,close_QMARK_){
var c__31897__auto___249200 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_244752){
var state_val_244754 = (state_244752[(1)]);
if((state_val_244754 === (7))){
var inst_244746 = (state_244752[(2)]);
var state_244752__$1 = state_244752;
var statearr_244759_249201 = state_244752__$1;
(statearr_244759_249201[(2)] = inst_244746);

(statearr_244759_249201[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (1))){
var state_244752__$1 = state_244752;
var statearr_244762_249203 = state_244752__$1;
(statearr_244762_249203[(2)] = null);

(statearr_244762_249203[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (4))){
var inst_244727 = (state_244752[(7)]);
var inst_244727__$1 = (state_244752[(2)]);
var inst_244728 = (inst_244727__$1 == null);
var state_244752__$1 = (function (){var statearr_244765 = state_244752;
(statearr_244765[(7)] = inst_244727__$1);

return statearr_244765;
})();
if(cljs.core.truth_(inst_244728)){
var statearr_244766_249206 = state_244752__$1;
(statearr_244766_249206[(1)] = (5));

} else {
var statearr_244767_249207 = state_244752__$1;
(statearr_244767_249207[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (13))){
var state_244752__$1 = state_244752;
var statearr_244768_249208 = state_244752__$1;
(statearr_244768_249208[(2)] = null);

(statearr_244768_249208[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (6))){
var inst_244727 = (state_244752[(7)]);
var state_244752__$1 = state_244752;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_244752__$1,(11),to,inst_244727);
} else {
if((state_val_244754 === (3))){
var inst_244748 = (state_244752[(2)]);
var state_244752__$1 = state_244752;
return cljs.core.async.impl.ioc_helpers.return_chan(state_244752__$1,inst_244748);
} else {
if((state_val_244754 === (12))){
var state_244752__$1 = state_244752;
var statearr_244776_249210 = state_244752__$1;
(statearr_244776_249210[(2)] = null);

(statearr_244776_249210[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (2))){
var state_244752__$1 = state_244752;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_244752__$1,(4),from);
} else {
if((state_val_244754 === (11))){
var inst_244739 = (state_244752[(2)]);
var state_244752__$1 = state_244752;
if(cljs.core.truth_(inst_244739)){
var statearr_244777_249213 = state_244752__$1;
(statearr_244777_249213[(1)] = (12));

} else {
var statearr_244778_249214 = state_244752__$1;
(statearr_244778_249214[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (9))){
var state_244752__$1 = state_244752;
var statearr_244780_249215 = state_244752__$1;
(statearr_244780_249215[(2)] = null);

(statearr_244780_249215[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (5))){
var state_244752__$1 = state_244752;
if(cljs.core.truth_(close_QMARK_)){
var statearr_244783_249220 = state_244752__$1;
(statearr_244783_249220[(1)] = (8));

} else {
var statearr_244787_249221 = state_244752__$1;
(statearr_244787_249221[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (14))){
var inst_244744 = (state_244752[(2)]);
var state_244752__$1 = state_244752;
var statearr_244788_249222 = state_244752__$1;
(statearr_244788_249222[(2)] = inst_244744);

(statearr_244788_249222[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (10))){
var inst_244736 = (state_244752[(2)]);
var state_244752__$1 = state_244752;
var statearr_244789_249225 = state_244752__$1;
(statearr_244789_249225[(2)] = inst_244736);

(statearr_244789_249225[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244754 === (8))){
var inst_244733 = cljs.core.async.close_BANG_(to);
var state_244752__$1 = state_244752;
var statearr_244796_249226 = state_244752__$1;
(statearr_244796_249226[(2)] = inst_244733);

(statearr_244796_249226[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_244800 = [null,null,null,null,null,null,null,null];
(statearr_244800[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_244800[(1)] = (1));

return statearr_244800;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_244752){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_244752);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e244801){var ex__31628__auto__ = e244801;
var statearr_244803_249233 = state_244752;
(statearr_244803_249233[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_244752[(4)]))){
var statearr_244807_249235 = state_244752;
(statearr_244807_249235[(1)] = cljs.core.first((state_244752[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249239 = state_244752;
state_244752 = G__249239;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_244752){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_244752);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_244842 = f__31898__auto__();
(statearr_244842[(6)] = c__31897__auto___249200);

return statearr_244842;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return to;
}));

(cljs.core.async.pipe.cljs$lang$maxFixedArity = 3);

cljs.core.async.pipeline_STAR_ = (function cljs$core$async$pipeline_STAR_(n,to,xf,from,close_QMARK_,ex_handler,type){
if((n > (0))){
} else {
throw (new Error("Assert failed: (pos? n)"));
}

var jobs = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(n);
var results = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(n);
var process__$1 = (function (p__244864){
var vec__244866 = p__244864;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__244866,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__244866,(1),null);
var job = vec__244866;
if((job == null)){
cljs.core.async.close_BANG_(results);

return null;
} else {
var res = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3((1),xf,ex_handler);
var c__31897__auto___249244 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_244876){
var state_val_244877 = (state_244876[(1)]);
if((state_val_244877 === (1))){
var state_244876__$1 = state_244876;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_244876__$1,(2),res,v);
} else {
if((state_val_244877 === (2))){
var inst_244872 = (state_244876[(2)]);
var inst_244873 = cljs.core.async.close_BANG_(res);
var state_244876__$1 = (function (){var statearr_244883 = state_244876;
(statearr_244883[(7)] = inst_244872);

return statearr_244883;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_244876__$1,inst_244873);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0 = (function (){
var statearr_244885 = [null,null,null,null,null,null,null,null];
(statearr_244885[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__);

(statearr_244885[(1)] = (1));

return statearr_244885;
});
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1 = (function (state_244876){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_244876);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e244891){var ex__31628__auto__ = e244891;
var statearr_244892_249256 = state_244876;
(statearr_244892_249256[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_244876[(4)]))){
var statearr_244895_249260 = state_244876;
(statearr_244895_249260[(1)] = cljs.core.first((state_244876[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249262 = state_244876;
state_244876 = G__249262;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = function(state_244876){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1.call(this,state_244876);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_244902 = f__31898__auto__();
(statearr_244902[(6)] = c__31897__auto___249244);

return statearr_244902;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(p,res);

return true;
}
});
var async = (function (p__244905){
var vec__244906 = p__244905;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__244906,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__244906,(1),null);
var job = vec__244906;
if((job == null)){
cljs.core.async.close_BANG_(results);

return null;
} else {
var res = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
(xf.cljs$core$IFn$_invoke$arity$2 ? xf.cljs$core$IFn$_invoke$arity$2(v,res) : xf.call(null,v,res));

cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(p,res);

return true;
}
});
var n__5593__auto___249263 = n;
var __249266 = (0);
while(true){
if((__249266 < n__5593__auto___249263)){
var G__244910_249269 = type;
var G__244910_249270__$1 = (((G__244910_249269 instanceof cljs.core.Keyword))?G__244910_249269.fqn:null);
switch (G__244910_249270__$1) {
case "compute":
var c__31897__auto___249276 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__249266,c__31897__auto___249276,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async){
return (function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = ((function (__249266,c__31897__auto___249276,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async){
return (function (state_244928){
var state_val_244929 = (state_244928[(1)]);
if((state_val_244929 === (1))){
var state_244928__$1 = state_244928;
var statearr_244935_249281 = state_244928__$1;
(statearr_244935_249281[(2)] = null);

(statearr_244935_249281[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244929 === (2))){
var state_244928__$1 = state_244928;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_244928__$1,(4),jobs);
} else {
if((state_val_244929 === (3))){
var inst_244925 = (state_244928[(2)]);
var state_244928__$1 = state_244928;
return cljs.core.async.impl.ioc_helpers.return_chan(state_244928__$1,inst_244925);
} else {
if((state_val_244929 === (4))){
var inst_244917 = (state_244928[(2)]);
var inst_244918 = process__$1(inst_244917);
var state_244928__$1 = state_244928;
if(cljs.core.truth_(inst_244918)){
var statearr_244947_249284 = state_244928__$1;
(statearr_244947_249284[(1)] = (5));

} else {
var statearr_244948_249285 = state_244928__$1;
(statearr_244948_249285[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244929 === (5))){
var state_244928__$1 = state_244928;
var statearr_244949_249287 = state_244928__$1;
(statearr_244949_249287[(2)] = null);

(statearr_244949_249287[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244929 === (6))){
var state_244928__$1 = state_244928;
var statearr_244950_249290 = state_244928__$1;
(statearr_244950_249290[(2)] = null);

(statearr_244950_249290[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244929 === (7))){
var inst_244923 = (state_244928[(2)]);
var state_244928__$1 = state_244928;
var statearr_244953_249293 = state_244928__$1;
(statearr_244953_249293[(2)] = inst_244923);

(statearr_244953_249293[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
});})(__249266,c__31897__auto___249276,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async))
;
return ((function (__249266,switch__31624__auto__,c__31897__auto___249276,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0 = (function (){
var statearr_244957 = [null,null,null,null,null,null,null];
(statearr_244957[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__);

(statearr_244957[(1)] = (1));

return statearr_244957;
});
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1 = (function (state_244928){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_244928);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e244958){var ex__31628__auto__ = e244958;
var statearr_244960_249303 = state_244928;
(statearr_244960_249303[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_244928[(4)]))){
var statearr_244963_249304 = state_244928;
(statearr_244963_249304[(1)] = cljs.core.first((state_244928[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249305 = state_244928;
state_244928 = G__249305;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = function(state_244928){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1.call(this,state_244928);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__;
})()
;})(__249266,switch__31624__auto__,c__31897__auto___249276,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async))
})();
var state__31899__auto__ = (function (){var statearr_244968 = f__31898__auto__();
(statearr_244968[(6)] = c__31897__auto___249276);

return statearr_244968;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
});})(__249266,c__31897__auto___249276,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async))
);


break;
case "async":
var c__31897__auto___249307 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__249266,c__31897__auto___249307,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async){
return (function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = ((function (__249266,c__31897__auto___249307,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async){
return (function (state_244988){
var state_val_244989 = (state_244988[(1)]);
if((state_val_244989 === (1))){
var state_244988__$1 = state_244988;
var statearr_244994_249313 = state_244988__$1;
(statearr_244994_249313[(2)] = null);

(statearr_244994_249313[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244989 === (2))){
var state_244988__$1 = state_244988;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_244988__$1,(4),jobs);
} else {
if((state_val_244989 === (3))){
var inst_244986 = (state_244988[(2)]);
var state_244988__$1 = state_244988;
return cljs.core.async.impl.ioc_helpers.return_chan(state_244988__$1,inst_244986);
} else {
if((state_val_244989 === (4))){
var inst_244978 = (state_244988[(2)]);
var inst_244979 = async(inst_244978);
var state_244988__$1 = state_244988;
if(cljs.core.truth_(inst_244979)){
var statearr_245004_249321 = state_244988__$1;
(statearr_245004_249321[(1)] = (5));

} else {
var statearr_245005_249323 = state_244988__$1;
(statearr_245005_249323[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244989 === (5))){
var state_244988__$1 = state_244988;
var statearr_245007_249324 = state_244988__$1;
(statearr_245007_249324[(2)] = null);

(statearr_245007_249324[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244989 === (6))){
var state_244988__$1 = state_244988;
var statearr_245012_249325 = state_244988__$1;
(statearr_245012_249325[(2)] = null);

(statearr_245012_249325[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_244989 === (7))){
var inst_244984 = (state_244988[(2)]);
var state_244988__$1 = state_244988;
var statearr_245013_249331 = state_244988__$1;
(statearr_245013_249331[(2)] = inst_244984);

(statearr_245013_249331[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
});})(__249266,c__31897__auto___249307,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async))
;
return ((function (__249266,switch__31624__auto__,c__31897__auto___249307,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0 = (function (){
var statearr_245015 = [null,null,null,null,null,null,null];
(statearr_245015[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__);

(statearr_245015[(1)] = (1));

return statearr_245015;
});
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1 = (function (state_244988){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_244988);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e245017){var ex__31628__auto__ = e245017;
var statearr_245021_249340 = state_244988;
(statearr_245021_249340[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_244988[(4)]))){
var statearr_245022_249341 = state_244988;
(statearr_245022_249341[(1)] = cljs.core.first((state_244988[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249349 = state_244988;
state_244988 = G__249349;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = function(state_244988){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1.call(this,state_244988);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__;
})()
;})(__249266,switch__31624__auto__,c__31897__auto___249307,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async))
})();
var state__31899__auto__ = (function (){var statearr_245026 = f__31898__auto__();
(statearr_245026[(6)] = c__31897__auto___249307);

return statearr_245026;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
});})(__249266,c__31897__auto___249307,G__244910_249269,G__244910_249270__$1,n__5593__auto___249263,jobs,results,process__$1,async))
);


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__244910_249270__$1)].join('')));

}

var G__249351 = (__249266 + (1));
__249266 = G__249351;
continue;
} else {
}
break;
}

var c__31897__auto___249352 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_245051){
var state_val_245052 = (state_245051[(1)]);
if((state_val_245052 === (7))){
var inst_245047 = (state_245051[(2)]);
var state_245051__$1 = state_245051;
var statearr_245058_249353 = state_245051__$1;
(statearr_245058_249353[(2)] = inst_245047);

(statearr_245058_249353[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245052 === (1))){
var state_245051__$1 = state_245051;
var statearr_245061_249355 = state_245051__$1;
(statearr_245061_249355[(2)] = null);

(statearr_245061_249355[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245052 === (4))){
var inst_245030 = (state_245051[(7)]);
var inst_245030__$1 = (state_245051[(2)]);
var inst_245032 = (inst_245030__$1 == null);
var state_245051__$1 = (function (){var statearr_245063 = state_245051;
(statearr_245063[(7)] = inst_245030__$1);

return statearr_245063;
})();
if(cljs.core.truth_(inst_245032)){
var statearr_245064_249361 = state_245051__$1;
(statearr_245064_249361[(1)] = (5));

} else {
var statearr_245066_249363 = state_245051__$1;
(statearr_245066_249363[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245052 === (6))){
var inst_245030 = (state_245051[(7)]);
var inst_245037 = (state_245051[(8)]);
var inst_245037__$1 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var inst_245038 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_245039 = [inst_245030,inst_245037__$1];
var inst_245040 = (new cljs.core.PersistentVector(null,2,(5),inst_245038,inst_245039,null));
var state_245051__$1 = (function (){var statearr_245067 = state_245051;
(statearr_245067[(8)] = inst_245037__$1);

return statearr_245067;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_245051__$1,(8),jobs,inst_245040);
} else {
if((state_val_245052 === (3))){
var inst_245049 = (state_245051[(2)]);
var state_245051__$1 = state_245051;
return cljs.core.async.impl.ioc_helpers.return_chan(state_245051__$1,inst_245049);
} else {
if((state_val_245052 === (2))){
var state_245051__$1 = state_245051;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245051__$1,(4),from);
} else {
if((state_val_245052 === (9))){
var inst_245044 = (state_245051[(2)]);
var state_245051__$1 = (function (){var statearr_245072 = state_245051;
(statearr_245072[(9)] = inst_245044);

return statearr_245072;
})();
var statearr_245073_249375 = state_245051__$1;
(statearr_245073_249375[(2)] = null);

(statearr_245073_249375[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245052 === (5))){
var inst_245034 = cljs.core.async.close_BANG_(jobs);
var state_245051__$1 = state_245051;
var statearr_245074_249377 = state_245051__$1;
(statearr_245074_249377[(2)] = inst_245034);

(statearr_245074_249377[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245052 === (8))){
var inst_245037 = (state_245051[(8)]);
var inst_245042 = (state_245051[(2)]);
var state_245051__$1 = (function (){var statearr_245075 = state_245051;
(statearr_245075[(10)] = inst_245042);

return statearr_245075;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_245051__$1,(9),results,inst_245037);
} else {
return null;
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0 = (function (){
var statearr_245084 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_245084[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__);

(statearr_245084[(1)] = (1));

return statearr_245084;
});
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1 = (function (state_245051){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_245051);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e245085){var ex__31628__auto__ = e245085;
var statearr_245092_249385 = state_245051;
(statearr_245092_249385[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_245051[(4)]))){
var statearr_245093_249386 = state_245051;
(statearr_245093_249386[(1)] = cljs.core.first((state_245051[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249388 = state_245051;
state_245051 = G__249388;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = function(state_245051){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1.call(this,state_245051);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_245094 = f__31898__auto__();
(statearr_245094[(6)] = c__31897__auto___249352);

return statearr_245094;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


var c__31897__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_245147){
var state_val_245148 = (state_245147[(1)]);
if((state_val_245148 === (7))){
var inst_245143 = (state_245147[(2)]);
var state_245147__$1 = state_245147;
var statearr_245153_249390 = state_245147__$1;
(statearr_245153_249390[(2)] = inst_245143);

(statearr_245153_249390[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (20))){
var state_245147__$1 = state_245147;
var statearr_245154_249394 = state_245147__$1;
(statearr_245154_249394[(2)] = null);

(statearr_245154_249394[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (1))){
var state_245147__$1 = state_245147;
var statearr_245155_249395 = state_245147__$1;
(statearr_245155_249395[(2)] = null);

(statearr_245155_249395[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (4))){
var inst_245110 = (state_245147[(7)]);
var inst_245110__$1 = (state_245147[(2)]);
var inst_245111 = (inst_245110__$1 == null);
var state_245147__$1 = (function (){var statearr_245156 = state_245147;
(statearr_245156[(7)] = inst_245110__$1);

return statearr_245156;
})();
if(cljs.core.truth_(inst_245111)){
var statearr_245158_249399 = state_245147__$1;
(statearr_245158_249399[(1)] = (5));

} else {
var statearr_245159_249401 = state_245147__$1;
(statearr_245159_249401[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (15))){
var inst_245125 = (state_245147[(8)]);
var state_245147__$1 = state_245147;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_245147__$1,(18),to,inst_245125);
} else {
if((state_val_245148 === (21))){
var inst_245138 = (state_245147[(2)]);
var state_245147__$1 = state_245147;
var statearr_245161_249406 = state_245147__$1;
(statearr_245161_249406[(2)] = inst_245138);

(statearr_245161_249406[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (13))){
var inst_245140 = (state_245147[(2)]);
var state_245147__$1 = (function (){var statearr_245166 = state_245147;
(statearr_245166[(9)] = inst_245140);

return statearr_245166;
})();
var statearr_245167_249409 = state_245147__$1;
(statearr_245167_249409[(2)] = null);

(statearr_245167_249409[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (6))){
var inst_245110 = (state_245147[(7)]);
var state_245147__$1 = state_245147;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245147__$1,(11),inst_245110);
} else {
if((state_val_245148 === (17))){
var inst_245133 = (state_245147[(2)]);
var state_245147__$1 = state_245147;
if(cljs.core.truth_(inst_245133)){
var statearr_245177_249411 = state_245147__$1;
(statearr_245177_249411[(1)] = (19));

} else {
var statearr_245181_249412 = state_245147__$1;
(statearr_245181_249412[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (3))){
var inst_245145 = (state_245147[(2)]);
var state_245147__$1 = state_245147;
return cljs.core.async.impl.ioc_helpers.return_chan(state_245147__$1,inst_245145);
} else {
if((state_val_245148 === (12))){
var inst_245122 = (state_245147[(10)]);
var state_245147__$1 = state_245147;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245147__$1,(14),inst_245122);
} else {
if((state_val_245148 === (2))){
var state_245147__$1 = state_245147;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245147__$1,(4),results);
} else {
if((state_val_245148 === (19))){
var state_245147__$1 = state_245147;
var statearr_245188_249414 = state_245147__$1;
(statearr_245188_249414[(2)] = null);

(statearr_245188_249414[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (11))){
var inst_245122 = (state_245147[(2)]);
var state_245147__$1 = (function (){var statearr_245189 = state_245147;
(statearr_245189[(10)] = inst_245122);

return statearr_245189;
})();
var statearr_245190_249416 = state_245147__$1;
(statearr_245190_249416[(2)] = null);

(statearr_245190_249416[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (9))){
var state_245147__$1 = state_245147;
var statearr_245193_249417 = state_245147__$1;
(statearr_245193_249417[(2)] = null);

(statearr_245193_249417[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (5))){
var state_245147__$1 = state_245147;
if(cljs.core.truth_(close_QMARK_)){
var statearr_245199_249422 = state_245147__$1;
(statearr_245199_249422[(1)] = (8));

} else {
var statearr_245200_249423 = state_245147__$1;
(statearr_245200_249423[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (14))){
var inst_245127 = (state_245147[(11)]);
var inst_245125 = (state_245147[(8)]);
var inst_245125__$1 = (state_245147[(2)]);
var inst_245126 = (inst_245125__$1 == null);
var inst_245127__$1 = cljs.core.not(inst_245126);
var state_245147__$1 = (function (){var statearr_245205 = state_245147;
(statearr_245205[(11)] = inst_245127__$1);

(statearr_245205[(8)] = inst_245125__$1);

return statearr_245205;
})();
if(inst_245127__$1){
var statearr_245208_249428 = state_245147__$1;
(statearr_245208_249428[(1)] = (15));

} else {
var statearr_245210_249429 = state_245147__$1;
(statearr_245210_249429[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (16))){
var inst_245127 = (state_245147[(11)]);
var state_245147__$1 = state_245147;
var statearr_245212_249430 = state_245147__$1;
(statearr_245212_249430[(2)] = inst_245127);

(statearr_245212_249430[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (10))){
var inst_245117 = (state_245147[(2)]);
var state_245147__$1 = state_245147;
var statearr_245216_249433 = state_245147__$1;
(statearr_245216_249433[(2)] = inst_245117);

(statearr_245216_249433[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (18))){
var inst_245130 = (state_245147[(2)]);
var state_245147__$1 = state_245147;
var statearr_245218_249434 = state_245147__$1;
(statearr_245218_249434[(2)] = inst_245130);

(statearr_245218_249434[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245148 === (8))){
var inst_245114 = cljs.core.async.close_BANG_(to);
var state_245147__$1 = state_245147;
var statearr_245222_249435 = state_245147__$1;
(statearr_245222_249435[(2)] = inst_245114);

(statearr_245222_249435[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0 = (function (){
var statearr_245230 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_245230[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__);

(statearr_245230[(1)] = (1));

return statearr_245230;
});
var cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1 = (function (state_245147){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_245147);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e245234){var ex__31628__auto__ = e245234;
var statearr_245236_249442 = state_245147;
(statearr_245236_249442[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_245147[(4)]))){
var statearr_245240_249443 = state_245147;
(statearr_245240_249443[(1)] = cljs.core.first((state_245147[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249444 = state_245147;
state_245147 = G__249444;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__ = function(state_245147){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1.call(this,state_245147);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__31625__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_245248 = f__31898__auto__();
(statearr_245248[(6)] = c__31897__auto__);

return statearr_245248;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));

return c__31897__auto__;
});
/**
 * Takes elements from the from channel and supplies them to the to
 *   channel, subject to the async function af, with parallelism n. af
 *   must be a function of two arguments, the first an input value and
 *   the second a channel on which to place the result(s). The
 *   presumption is that af will return immediately, having launched some
 *   asynchronous operation whose completion/callback will put results on
 *   the channel, then close! it. Outputs will be returned in order
 *   relative to the inputs. By default, the to channel will be closed
 *   when the from channel closes, but can be determined by the close?
 *   parameter. Will stop consuming the from channel if the to channel
 *   closes. See also pipeline, pipeline-blocking.
 */
cljs.core.async.pipeline_async = (function cljs$core$async$pipeline_async(var_args){
var G__245270 = arguments.length;
switch (G__245270) {
case 4:
return cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$4 = (function (n,to,af,from){
return cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$5(n,to,af,from,true);
}));

(cljs.core.async.pipeline_async.cljs$core$IFn$_invoke$arity$5 = (function (n,to,af,from,close_QMARK_){
return cljs.core.async.pipeline_STAR_(n,to,af,from,close_QMARK_,null,new cljs.core.Keyword(null,"async","async",1050769601));
}));

(cljs.core.async.pipeline_async.cljs$lang$maxFixedArity = 5);

/**
 * Takes elements from the from channel and supplies them to the to
 *   channel, subject to the transducer xf, with parallelism n. Because
 *   it is parallel, the transducer will be applied independently to each
 *   element, not across elements, and may produce zero or more outputs
 *   per input.  Outputs will be returned in order relative to the
 *   inputs. By default, the to channel will be closed when the from
 *   channel closes, but can be determined by the close?  parameter. Will
 *   stop consuming the from channel if the to channel closes.
 * 
 *   Note this is supplied for API compatibility with the Clojure version.
 *   Values of N > 1 will not result in actual concurrency in a
 *   single-threaded runtime.
 */
cljs.core.async.pipeline = (function cljs$core$async$pipeline(var_args){
var G__245294 = arguments.length;
switch (G__245294) {
case 4:
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
case 5:
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$5((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]));

break;
case 6:
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$6((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]),(arguments[(4)]),(arguments[(5)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$4 = (function (n,to,xf,from){
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$5(n,to,xf,from,true);
}));

(cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$5 = (function (n,to,xf,from,close_QMARK_){
return cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$6(n,to,xf,from,close_QMARK_,null);
}));

(cljs.core.async.pipeline.cljs$core$IFn$_invoke$arity$6 = (function (n,to,xf,from,close_QMARK_,ex_handler){
return cljs.core.async.pipeline_STAR_(n,to,xf,from,close_QMARK_,ex_handler,new cljs.core.Keyword(null,"compute","compute",1555393130));
}));

(cljs.core.async.pipeline.cljs$lang$maxFixedArity = 6);

/**
 * Takes a predicate and a source channel and returns a vector of two
 *   channels, the first of which will contain the values for which the
 *   predicate returned true, the second those for which it returned
 *   false.
 * 
 *   The out channels will be unbuffered by default, or two buf-or-ns can
 *   be supplied. The channels will close after the source channel has
 *   closed.
 */
cljs.core.async.split = (function cljs$core$async$split(var_args){
var G__245322 = arguments.length;
switch (G__245322) {
case 2:
return cljs.core.async.split.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return cljs.core.async.split.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.split.cljs$core$IFn$_invoke$arity$2 = (function (p,ch){
return cljs.core.async.split.cljs$core$IFn$_invoke$arity$4(p,ch,null,null);
}));

(cljs.core.async.split.cljs$core$IFn$_invoke$arity$4 = (function (p,ch,t_buf_or_n,f_buf_or_n){
var tc = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(t_buf_or_n);
var fc = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(f_buf_or_n);
var c__31897__auto___249464 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_245374){
var state_val_245376 = (state_245374[(1)]);
if((state_val_245376 === (7))){
var inst_245370 = (state_245374[(2)]);
var state_245374__$1 = state_245374;
var statearr_245385_249469 = state_245374__$1;
(statearr_245385_249469[(2)] = inst_245370);

(statearr_245385_249469[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (1))){
var state_245374__$1 = state_245374;
var statearr_245387_249470 = state_245374__$1;
(statearr_245387_249470[(2)] = null);

(statearr_245387_249470[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (4))){
var inst_245343 = (state_245374[(7)]);
var inst_245343__$1 = (state_245374[(2)]);
var inst_245345 = (inst_245343__$1 == null);
var state_245374__$1 = (function (){var statearr_245389 = state_245374;
(statearr_245389[(7)] = inst_245343__$1);

return statearr_245389;
})();
if(cljs.core.truth_(inst_245345)){
var statearr_245392_249479 = state_245374__$1;
(statearr_245392_249479[(1)] = (5));

} else {
var statearr_245393_249480 = state_245374__$1;
(statearr_245393_249480[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (13))){
var state_245374__$1 = state_245374;
var statearr_245394_249481 = state_245374__$1;
(statearr_245394_249481[(2)] = null);

(statearr_245394_249481[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (6))){
var inst_245343 = (state_245374[(7)]);
var inst_245351 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_245343) : p.call(null,inst_245343));
var state_245374__$1 = state_245374;
if(cljs.core.truth_(inst_245351)){
var statearr_245396_249482 = state_245374__$1;
(statearr_245396_249482[(1)] = (9));

} else {
var statearr_245397_249483 = state_245374__$1;
(statearr_245397_249483[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (3))){
var inst_245372 = (state_245374[(2)]);
var state_245374__$1 = state_245374;
return cljs.core.async.impl.ioc_helpers.return_chan(state_245374__$1,inst_245372);
} else {
if((state_val_245376 === (12))){
var state_245374__$1 = state_245374;
var statearr_245401_249484 = state_245374__$1;
(statearr_245401_249484[(2)] = null);

(statearr_245401_249484[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (2))){
var state_245374__$1 = state_245374;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245374__$1,(4),ch);
} else {
if((state_val_245376 === (11))){
var inst_245343 = (state_245374[(7)]);
var inst_245360 = (state_245374[(2)]);
var state_245374__$1 = state_245374;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_245374__$1,(8),inst_245360,inst_245343);
} else {
if((state_val_245376 === (9))){
var state_245374__$1 = state_245374;
var statearr_245410_249485 = state_245374__$1;
(statearr_245410_249485[(2)] = tc);

(statearr_245410_249485[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (5))){
var inst_245347 = cljs.core.async.close_BANG_(tc);
var inst_245348 = cljs.core.async.close_BANG_(fc);
var state_245374__$1 = (function (){var statearr_245412 = state_245374;
(statearr_245412[(8)] = inst_245347);

return statearr_245412;
})();
var statearr_245414_249486 = state_245374__$1;
(statearr_245414_249486[(2)] = inst_245348);

(statearr_245414_249486[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (14))){
var inst_245368 = (state_245374[(2)]);
var state_245374__$1 = state_245374;
var statearr_245415_249489 = state_245374__$1;
(statearr_245415_249489[(2)] = inst_245368);

(statearr_245415_249489[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (10))){
var state_245374__$1 = state_245374;
var statearr_245419_249490 = state_245374__$1;
(statearr_245419_249490[(2)] = fc);

(statearr_245419_249490[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245376 === (8))){
var inst_245362 = (state_245374[(2)]);
var state_245374__$1 = state_245374;
if(cljs.core.truth_(inst_245362)){
var statearr_245421_249491 = state_245374__$1;
(statearr_245421_249491[(1)] = (12));

} else {
var statearr_245422_249492 = state_245374__$1;
(statearr_245422_249492[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_245426 = [null,null,null,null,null,null,null,null,null];
(statearr_245426[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_245426[(1)] = (1));

return statearr_245426;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_245374){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_245374);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e245429){var ex__31628__auto__ = e245429;
var statearr_245430_249493 = state_245374;
(statearr_245430_249493[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_245374[(4)]))){
var statearr_245432_249494 = state_245374;
(statearr_245432_249494[(1)] = cljs.core.first((state_245374[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249496 = state_245374;
state_245374 = G__249496;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_245374){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_245374);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_245436 = f__31898__auto__();
(statearr_245436[(6)] = c__31897__auto___249464);

return statearr_245436;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [tc,fc], null);
}));

(cljs.core.async.split.cljs$lang$maxFixedArity = 4);

/**
 * f should be a function of 2 arguments. Returns a channel containing
 *   the single result of applying f to init and the first item from the
 *   channel, then applying f to that result and the 2nd item, etc. If
 *   the channel closes without yielding items, returns init and f is not
 *   called. ch must close before reduce produces a result.
 */
cljs.core.async.reduce = (function cljs$core$async$reduce(f,init,ch){
var c__31897__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_245468){
var state_val_245469 = (state_245468[(1)]);
if((state_val_245469 === (7))){
var inst_245464 = (state_245468[(2)]);
var state_245468__$1 = state_245468;
var statearr_245474_249499 = state_245468__$1;
(statearr_245474_249499[(2)] = inst_245464);

(statearr_245474_249499[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245469 === (1))){
var inst_245442 = init;
var inst_245443 = inst_245442;
var state_245468__$1 = (function (){var statearr_245475 = state_245468;
(statearr_245475[(7)] = inst_245443);

return statearr_245475;
})();
var statearr_245477_249500 = state_245468__$1;
(statearr_245477_249500[(2)] = null);

(statearr_245477_249500[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245469 === (4))){
var inst_245448 = (state_245468[(8)]);
var inst_245448__$1 = (state_245468[(2)]);
var inst_245449 = (inst_245448__$1 == null);
var state_245468__$1 = (function (){var statearr_245487 = state_245468;
(statearr_245487[(8)] = inst_245448__$1);

return statearr_245487;
})();
if(cljs.core.truth_(inst_245449)){
var statearr_245489_249501 = state_245468__$1;
(statearr_245489_249501[(1)] = (5));

} else {
var statearr_245490_249502 = state_245468__$1;
(statearr_245490_249502[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245469 === (6))){
var inst_245454 = (state_245468[(9)]);
var inst_245448 = (state_245468[(8)]);
var inst_245443 = (state_245468[(7)]);
var inst_245454__$1 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(inst_245443,inst_245448) : f.call(null,inst_245443,inst_245448));
var inst_245455 = cljs.core.reduced_QMARK_(inst_245454__$1);
var state_245468__$1 = (function (){var statearr_245497 = state_245468;
(statearr_245497[(9)] = inst_245454__$1);

return statearr_245497;
})();
if(inst_245455){
var statearr_245500_249505 = state_245468__$1;
(statearr_245500_249505[(1)] = (8));

} else {
var statearr_245501_249507 = state_245468__$1;
(statearr_245501_249507[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245469 === (3))){
var inst_245466 = (state_245468[(2)]);
var state_245468__$1 = state_245468;
return cljs.core.async.impl.ioc_helpers.return_chan(state_245468__$1,inst_245466);
} else {
if((state_val_245469 === (2))){
var state_245468__$1 = state_245468;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245468__$1,(4),ch);
} else {
if((state_val_245469 === (9))){
var inst_245454 = (state_245468[(9)]);
var inst_245443 = inst_245454;
var state_245468__$1 = (function (){var statearr_245504 = state_245468;
(statearr_245504[(7)] = inst_245443);

return statearr_245504;
})();
var statearr_245505_249509 = state_245468__$1;
(statearr_245505_249509[(2)] = null);

(statearr_245505_249509[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245469 === (5))){
var inst_245443 = (state_245468[(7)]);
var state_245468__$1 = state_245468;
var statearr_245508_249510 = state_245468__$1;
(statearr_245508_249510[(2)] = inst_245443);

(statearr_245508_249510[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245469 === (10))){
var inst_245462 = (state_245468[(2)]);
var state_245468__$1 = state_245468;
var statearr_245513_249511 = state_245468__$1;
(statearr_245513_249511[(2)] = inst_245462);

(statearr_245513_249511[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245469 === (8))){
var inst_245454 = (state_245468[(9)]);
var inst_245458 = cljs.core.deref(inst_245454);
var state_245468__$1 = state_245468;
var statearr_245514_249512 = state_245468__$1;
(statearr_245514_249512[(2)] = inst_245458);

(statearr_245514_249512[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$reduce_$_state_machine__31625__auto__ = null;
var cljs$core$async$reduce_$_state_machine__31625__auto____0 = (function (){
var statearr_245520 = [null,null,null,null,null,null,null,null,null,null];
(statearr_245520[(0)] = cljs$core$async$reduce_$_state_machine__31625__auto__);

(statearr_245520[(1)] = (1));

return statearr_245520;
});
var cljs$core$async$reduce_$_state_machine__31625__auto____1 = (function (state_245468){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_245468);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e245524){var ex__31628__auto__ = e245524;
var statearr_245525_249514 = state_245468;
(statearr_245525_249514[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_245468[(4)]))){
var statearr_245529_249515 = state_245468;
(statearr_245529_249515[(1)] = cljs.core.first((state_245468[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249520 = state_245468;
state_245468 = G__249520;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$reduce_$_state_machine__31625__auto__ = function(state_245468){
switch(arguments.length){
case 0:
return cljs$core$async$reduce_$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$reduce_$_state_machine__31625__auto____1.call(this,state_245468);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$reduce_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$reduce_$_state_machine__31625__auto____0;
cljs$core$async$reduce_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$reduce_$_state_machine__31625__auto____1;
return cljs$core$async$reduce_$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_245531 = f__31898__auto__();
(statearr_245531[(6)] = c__31897__auto__);

return statearr_245531;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));

return c__31897__auto__;
});
/**
 * async/reduces a channel with a transformation (xform f).
 *   Returns a channel containing the result.  ch must close before
 *   transduce produces a result.
 */
cljs.core.async.transduce = (function cljs$core$async$transduce(xform,f,init,ch){
var f__$1 = (xform.cljs$core$IFn$_invoke$arity$1 ? xform.cljs$core$IFn$_invoke$arity$1(f) : xform.call(null,f));
var c__31897__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_245544){
var state_val_245545 = (state_245544[(1)]);
if((state_val_245545 === (1))){
var inst_245538 = cljs.core.async.reduce(f__$1,init,ch);
var state_245544__$1 = state_245544;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245544__$1,(2),inst_245538);
} else {
if((state_val_245545 === (2))){
var inst_245541 = (state_245544[(2)]);
var inst_245542 = (f__$1.cljs$core$IFn$_invoke$arity$1 ? f__$1.cljs$core$IFn$_invoke$arity$1(inst_245541) : f__$1.call(null,inst_245541));
var state_245544__$1 = state_245544;
return cljs.core.async.impl.ioc_helpers.return_chan(state_245544__$1,inst_245542);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$transduce_$_state_machine__31625__auto__ = null;
var cljs$core$async$transduce_$_state_machine__31625__auto____0 = (function (){
var statearr_245572 = [null,null,null,null,null,null,null];
(statearr_245572[(0)] = cljs$core$async$transduce_$_state_machine__31625__auto__);

(statearr_245572[(1)] = (1));

return statearr_245572;
});
var cljs$core$async$transduce_$_state_machine__31625__auto____1 = (function (state_245544){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_245544);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e245577){var ex__31628__auto__ = e245577;
var statearr_245579_249524 = state_245544;
(statearr_245579_249524[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_245544[(4)]))){
var statearr_245581_249526 = state_245544;
(statearr_245581_249526[(1)] = cljs.core.first((state_245544[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249527 = state_245544;
state_245544 = G__249527;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$transduce_$_state_machine__31625__auto__ = function(state_245544){
switch(arguments.length){
case 0:
return cljs$core$async$transduce_$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$transduce_$_state_machine__31625__auto____1.call(this,state_245544);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$transduce_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$transduce_$_state_machine__31625__auto____0;
cljs$core$async$transduce_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$transduce_$_state_machine__31625__auto____1;
return cljs$core$async$transduce_$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_245582 = f__31898__auto__();
(statearr_245582[(6)] = c__31897__auto__);

return statearr_245582;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));

return c__31897__auto__;
});
/**
 * Puts the contents of coll into the supplied channel.
 * 
 *   By default the channel will be closed after the items are copied,
 *   but can be determined by the close? parameter.
 * 
 *   Returns a channel which will close after the items are copied.
 */
cljs.core.async.onto_chan_BANG_ = (function cljs$core$async$onto_chan_BANG_(var_args){
var G__245587 = arguments.length;
switch (G__245587) {
case 2:
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$2 = (function (ch,coll){
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,coll,true);
}));

(cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3 = (function (ch,coll,close_QMARK_){
var c__31897__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_245625){
var state_val_245626 = (state_245625[(1)]);
if((state_val_245626 === (7))){
var inst_245607 = (state_245625[(2)]);
var state_245625__$1 = state_245625;
var statearr_245629_249533 = state_245625__$1;
(statearr_245629_249533[(2)] = inst_245607);

(statearr_245629_249533[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (1))){
var inst_245597 = cljs.core.seq(coll);
var inst_245598 = inst_245597;
var state_245625__$1 = (function (){var statearr_245639 = state_245625;
(statearr_245639[(7)] = inst_245598);

return statearr_245639;
})();
var statearr_245643_249534 = state_245625__$1;
(statearr_245643_249534[(2)] = null);

(statearr_245643_249534[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (4))){
var inst_245598 = (state_245625[(7)]);
var inst_245605 = cljs.core.first(inst_245598);
var state_245625__$1 = state_245625;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_245625__$1,(7),ch,inst_245605);
} else {
if((state_val_245626 === (13))){
var inst_245619 = (state_245625[(2)]);
var state_245625__$1 = state_245625;
var statearr_245644_249536 = state_245625__$1;
(statearr_245644_249536[(2)] = inst_245619);

(statearr_245644_249536[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (6))){
var inst_245610 = (state_245625[(2)]);
var state_245625__$1 = state_245625;
if(cljs.core.truth_(inst_245610)){
var statearr_245645_249538 = state_245625__$1;
(statearr_245645_249538[(1)] = (8));

} else {
var statearr_245650_249539 = state_245625__$1;
(statearr_245650_249539[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (3))){
var inst_245623 = (state_245625[(2)]);
var state_245625__$1 = state_245625;
return cljs.core.async.impl.ioc_helpers.return_chan(state_245625__$1,inst_245623);
} else {
if((state_val_245626 === (12))){
var state_245625__$1 = state_245625;
var statearr_245651_249540 = state_245625__$1;
(statearr_245651_249540[(2)] = null);

(statearr_245651_249540[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (2))){
var inst_245598 = (state_245625[(7)]);
var state_245625__$1 = state_245625;
if(cljs.core.truth_(inst_245598)){
var statearr_245652_249541 = state_245625__$1;
(statearr_245652_249541[(1)] = (4));

} else {
var statearr_245653_249542 = state_245625__$1;
(statearr_245653_249542[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (11))){
var inst_245616 = cljs.core.async.close_BANG_(ch);
var state_245625__$1 = state_245625;
var statearr_245654_249543 = state_245625__$1;
(statearr_245654_249543[(2)] = inst_245616);

(statearr_245654_249543[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (9))){
var state_245625__$1 = state_245625;
if(cljs.core.truth_(close_QMARK_)){
var statearr_245656_249544 = state_245625__$1;
(statearr_245656_249544[(1)] = (11));

} else {
var statearr_245658_249545 = state_245625__$1;
(statearr_245658_249545[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (5))){
var inst_245598 = (state_245625[(7)]);
var state_245625__$1 = state_245625;
var statearr_245665_249547 = state_245625__$1;
(statearr_245665_249547[(2)] = inst_245598);

(statearr_245665_249547[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (10))){
var inst_245621 = (state_245625[(2)]);
var state_245625__$1 = state_245625;
var statearr_245672_249548 = state_245625__$1;
(statearr_245672_249548[(2)] = inst_245621);

(statearr_245672_249548[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245626 === (8))){
var inst_245598 = (state_245625[(7)]);
var inst_245612 = cljs.core.next(inst_245598);
var inst_245598__$1 = inst_245612;
var state_245625__$1 = (function (){var statearr_245674 = state_245625;
(statearr_245674[(7)] = inst_245598__$1);

return statearr_245674;
})();
var statearr_245675_249549 = state_245625__$1;
(statearr_245675_249549[(2)] = null);

(statearr_245675_249549[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_245677 = [null,null,null,null,null,null,null,null];
(statearr_245677[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_245677[(1)] = (1));

return statearr_245677;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_245625){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_245625);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e245684){var ex__31628__auto__ = e245684;
var statearr_245685_249551 = state_245625;
(statearr_245685_249551[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_245625[(4)]))){
var statearr_245691_249555 = state_245625;
(statearr_245691_249555[(1)] = cljs.core.first((state_245625[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249556 = state_245625;
state_245625 = G__249556;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_245625){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_245625);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_245695 = f__31898__auto__();
(statearr_245695[(6)] = c__31897__auto__);

return statearr_245695;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));

return c__31897__auto__;
}));

(cljs.core.async.onto_chan_BANG_.cljs$lang$maxFixedArity = 3);

/**
 * Creates and returns a channel which contains the contents of coll,
 *   closing when exhausted.
 */
cljs.core.async.to_chan_BANG_ = (function cljs$core$async$to_chan_BANG_(coll){
var ch = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(cljs.core.bounded_count((100),coll));
cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$2(ch,coll);

return ch;
});
/**
 * Deprecated - use onto-chan!
 */
cljs.core.async.onto_chan = (function cljs$core$async$onto_chan(var_args){
var G__245701 = arguments.length;
switch (G__245701) {
case 2:
return cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$2 = (function (ch,coll){
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,coll,true);
}));

(cljs.core.async.onto_chan.cljs$core$IFn$_invoke$arity$3 = (function (ch,coll,close_QMARK_){
return cljs.core.async.onto_chan_BANG_.cljs$core$IFn$_invoke$arity$3(ch,coll,close_QMARK_);
}));

(cljs.core.async.onto_chan.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - use to-chan!
 */
cljs.core.async.to_chan = (function cljs$core$async$to_chan(coll){
return cljs.core.async.to_chan_BANG_(coll);
});

/**
 * @interface
 */
cljs.core.async.Mux = function(){};

var cljs$core$async$Mux$muxch_STAR_$dyn_249562 = (function (_){
var x__5350__auto__ = (((_ == null))?null:_);
var m__5351__auto__ = (cljs.core.async.muxch_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5351__auto__.call(null,_));
} else {
var m__5349__auto__ = (cljs.core.async.muxch_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(_) : m__5349__auto__.call(null,_));
} else {
throw cljs.core.missing_protocol("Mux.muxch*",_);
}
}
});
cljs.core.async.muxch_STAR_ = (function cljs$core$async$muxch_STAR_(_){
if((((!((_ == null)))) && ((!((_.cljs$core$async$Mux$muxch_STAR_$arity$1 == null)))))){
return _.cljs$core$async$Mux$muxch_STAR_$arity$1(_);
} else {
return cljs$core$async$Mux$muxch_STAR_$dyn_249562(_);
}
});


/**
 * @interface
 */
cljs.core.async.Mult = function(){};

var cljs$core$async$Mult$tap_STAR_$dyn_249564 = (function (m,ch,close_QMARK_){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.tap_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(m,ch,close_QMARK_) : m__5351__auto__.call(null,m,ch,close_QMARK_));
} else {
var m__5349__auto__ = (cljs.core.async.tap_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(m,ch,close_QMARK_) : m__5349__auto__.call(null,m,ch,close_QMARK_));
} else {
throw cljs.core.missing_protocol("Mult.tap*",m);
}
}
});
cljs.core.async.tap_STAR_ = (function cljs$core$async$tap_STAR_(m,ch,close_QMARK_){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mult$tap_STAR_$arity$3 == null)))))){
return m.cljs$core$async$Mult$tap_STAR_$arity$3(m,ch,close_QMARK_);
} else {
return cljs$core$async$Mult$tap_STAR_$dyn_249564(m,ch,close_QMARK_);
}
});

var cljs$core$async$Mult$untap_STAR_$dyn_249568 = (function (m,ch){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.untap_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5351__auto__.call(null,m,ch));
} else {
var m__5349__auto__ = (cljs.core.async.untap_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5349__auto__.call(null,m,ch));
} else {
throw cljs.core.missing_protocol("Mult.untap*",m);
}
}
});
cljs.core.async.untap_STAR_ = (function cljs$core$async$untap_STAR_(m,ch){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mult$untap_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mult$untap_STAR_$arity$2(m,ch);
} else {
return cljs$core$async$Mult$untap_STAR_$dyn_249568(m,ch);
}
});

var cljs$core$async$Mult$untap_all_STAR_$dyn_249574 = (function (m){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.untap_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5351__auto__.call(null,m));
} else {
var m__5349__auto__ = (cljs.core.async.untap_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5349__auto__.call(null,m));
} else {
throw cljs.core.missing_protocol("Mult.untap-all*",m);
}
}
});
cljs.core.async.untap_all_STAR_ = (function cljs$core$async$untap_all_STAR_(m){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mult$untap_all_STAR_$arity$1 == null)))))){
return m.cljs$core$async$Mult$untap_all_STAR_$arity$1(m);
} else {
return cljs$core$async$Mult$untap_all_STAR_$dyn_249574(m);
}
});


/**
* @constructor
 * @implements {cljs.core.async.Mult}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async245755 = (function (ch,cs,meta245756){
this.ch = ch;
this.cs = cs;
this.meta245756 = meta245756;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_245757,meta245756__$1){
var self__ = this;
var _245757__$1 = this;
return (new cljs.core.async.t_cljs$core$async245755(self__.ch,self__.cs,meta245756__$1));
}));

(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_245757){
var self__ = this;
var _245757__$1 = this;
return self__.meta245756;
}));

(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$async$Mult$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$async$Mult$tap_STAR_$arity$3 = (function (_,ch__$1,close_QMARK_){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch__$1,close_QMARK_);

return null;
}));

(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$async$Mult$untap_STAR_$arity$2 = (function (_,ch__$1){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch__$1);

return null;
}));

(cljs.core.async.t_cljs$core$async245755.prototype.cljs$core$async$Mult$untap_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return null;
}));

(cljs.core.async.t_cljs$core$async245755.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"meta245756","meta245756",-1286110864,null)], null);
}));

(cljs.core.async.t_cljs$core$async245755.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async245755.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async245755");

(cljs.core.async.t_cljs$core$async245755.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async245755");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async245755.
 */
cljs.core.async.__GT_t_cljs$core$async245755 = (function cljs$core$async$__GT_t_cljs$core$async245755(ch,cs,meta245756){
return (new cljs.core.async.t_cljs$core$async245755(ch,cs,meta245756));
});


/**
 * Creates and returns a mult(iple) of the supplied channel. Channels
 *   containing copies of the channel can be created with 'tap', and
 *   detached with 'untap'.
 * 
 *   Each item is distributed to all taps in parallel and synchronously,
 *   i.e. each tap must accept before the next item is distributed. Use
 *   buffering/windowing to prevent slow taps from holding up the mult.
 * 
 *   Items received when there are no taps get dropped.
 * 
 *   If a tap puts to a closed channel, it will be removed from the mult.
 */
cljs.core.async.mult = (function cljs$core$async$mult(ch){
var cs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var m = (new cljs.core.async.t_cljs$core$async245755(ch,cs,cljs.core.PersistentArrayMap.EMPTY));
var dchan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var dctr = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var done = (function (_){
if((cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec) === (0))){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(dchan,true);
} else {
return null;
}
});
var c__31897__auto___249598 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_245959){
var state_val_245960 = (state_245959[(1)]);
if((state_val_245960 === (7))){
var inst_245948 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_245969_249599 = state_245959__$1;
(statearr_245969_249599[(2)] = inst_245948);

(statearr_245969_249599[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (20))){
var inst_245839 = (state_245959[(7)]);
var inst_245851 = cljs.core.first(inst_245839);
var inst_245853 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_245851,(0),null);
var inst_245854 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_245851,(1),null);
var state_245959__$1 = (function (){var statearr_245976 = state_245959;
(statearr_245976[(8)] = inst_245853);

return statearr_245976;
})();
if(cljs.core.truth_(inst_245854)){
var statearr_245979_249600 = state_245959__$1;
(statearr_245979_249600[(1)] = (22));

} else {
var statearr_245980_249601 = state_245959__$1;
(statearr_245980_249601[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (27))){
var inst_245882 = (state_245959[(9)]);
var inst_245884 = (state_245959[(10)]);
var inst_245803 = (state_245959[(11)]);
var inst_245889 = (state_245959[(12)]);
var inst_245889__$1 = cljs.core._nth(inst_245882,inst_245884);
var inst_245890 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_245889__$1,inst_245803,done);
var state_245959__$1 = (function (){var statearr_245988 = state_245959;
(statearr_245988[(12)] = inst_245889__$1);

return statearr_245988;
})();
if(cljs.core.truth_(inst_245890)){
var statearr_245989_249603 = state_245959__$1;
(statearr_245989_249603[(1)] = (30));

} else {
var statearr_245993_249604 = state_245959__$1;
(statearr_245993_249604[(1)] = (31));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (1))){
var state_245959__$1 = state_245959;
var statearr_245998_249605 = state_245959__$1;
(statearr_245998_249605[(2)] = null);

(statearr_245998_249605[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (24))){
var inst_245839 = (state_245959[(7)]);
var inst_245859 = (state_245959[(2)]);
var inst_245860 = cljs.core.next(inst_245839);
var inst_245813 = inst_245860;
var inst_245814 = null;
var inst_245815 = (0);
var inst_245816 = (0);
var state_245959__$1 = (function (){var statearr_246006 = state_245959;
(statearr_246006[(13)] = inst_245814);

(statearr_246006[(14)] = inst_245815);

(statearr_246006[(15)] = inst_245816);

(statearr_246006[(16)] = inst_245813);

(statearr_246006[(17)] = inst_245859);

return statearr_246006;
})();
var statearr_246014_249615 = state_245959__$1;
(statearr_246014_249615[(2)] = null);

(statearr_246014_249615[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (39))){
var state_245959__$1 = state_245959;
var statearr_246022_249618 = state_245959__$1;
(statearr_246022_249618[(2)] = null);

(statearr_246022_249618[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (4))){
var inst_245803 = (state_245959[(11)]);
var inst_245803__$1 = (state_245959[(2)]);
var inst_245804 = (inst_245803__$1 == null);
var state_245959__$1 = (function (){var statearr_246026 = state_245959;
(statearr_246026[(11)] = inst_245803__$1);

return statearr_246026;
})();
if(cljs.core.truth_(inst_245804)){
var statearr_246028_249620 = state_245959__$1;
(statearr_246028_249620[(1)] = (5));

} else {
var statearr_246030_249622 = state_245959__$1;
(statearr_246030_249622[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (15))){
var inst_245814 = (state_245959[(13)]);
var inst_245815 = (state_245959[(14)]);
var inst_245816 = (state_245959[(15)]);
var inst_245813 = (state_245959[(16)]);
var inst_245835 = (state_245959[(2)]);
var inst_245836 = (inst_245816 + (1));
var tmp246016 = inst_245814;
var tmp246017 = inst_245815;
var tmp246018 = inst_245813;
var inst_245813__$1 = tmp246018;
var inst_245814__$1 = tmp246016;
var inst_245815__$1 = tmp246017;
var inst_245816__$1 = inst_245836;
var state_245959__$1 = (function (){var statearr_246035 = state_245959;
(statearr_246035[(13)] = inst_245814__$1);

(statearr_246035[(14)] = inst_245815__$1);

(statearr_246035[(15)] = inst_245816__$1);

(statearr_246035[(16)] = inst_245813__$1);

(statearr_246035[(18)] = inst_245835);

return statearr_246035;
})();
var statearr_246042_249631 = state_245959__$1;
(statearr_246042_249631[(2)] = null);

(statearr_246042_249631[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (21))){
var inst_245863 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246057_249632 = state_245959__$1;
(statearr_246057_249632[(2)] = inst_245863);

(statearr_246057_249632[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (31))){
var inst_245889 = (state_245959[(12)]);
var inst_245893 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_245889);
var state_245959__$1 = state_245959;
var statearr_246066_249633 = state_245959__$1;
(statearr_246066_249633[(2)] = inst_245893);

(statearr_246066_249633[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (32))){
var inst_245882 = (state_245959[(9)]);
var inst_245881 = (state_245959[(19)]);
var inst_245884 = (state_245959[(10)]);
var inst_245883 = (state_245959[(20)]);
var inst_245895 = (state_245959[(2)]);
var inst_245896 = (inst_245884 + (1));
var tmp246049 = inst_245882;
var tmp246050 = inst_245881;
var tmp246051 = inst_245883;
var inst_245881__$1 = tmp246050;
var inst_245882__$1 = tmp246049;
var inst_245883__$1 = tmp246051;
var inst_245884__$1 = inst_245896;
var state_245959__$1 = (function (){var statearr_246077 = state_245959;
(statearr_246077[(9)] = inst_245882__$1);

(statearr_246077[(19)] = inst_245881__$1);

(statearr_246077[(10)] = inst_245884__$1);

(statearr_246077[(21)] = inst_245895);

(statearr_246077[(20)] = inst_245883__$1);

return statearr_246077;
})();
var statearr_246081_249638 = state_245959__$1;
(statearr_246081_249638[(2)] = null);

(statearr_246081_249638[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (40))){
var inst_245919 = (state_245959[(22)]);
var inst_245924 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_245919);
var state_245959__$1 = state_245959;
var statearr_246088_249645 = state_245959__$1;
(statearr_246088_249645[(2)] = inst_245924);

(statearr_246088_249645[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (33))){
var inst_245903 = (state_245959[(23)]);
var inst_245906 = cljs.core.chunked_seq_QMARK_(inst_245903);
var state_245959__$1 = state_245959;
if(inst_245906){
var statearr_246091_249646 = state_245959__$1;
(statearr_246091_249646[(1)] = (36));

} else {
var statearr_246092_249648 = state_245959__$1;
(statearr_246092_249648[(1)] = (37));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (13))){
var inst_245828 = (state_245959[(24)]);
var inst_245832 = cljs.core.async.close_BANG_(inst_245828);
var state_245959__$1 = state_245959;
var statearr_246094_249649 = state_245959__$1;
(statearr_246094_249649[(2)] = inst_245832);

(statearr_246094_249649[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (22))){
var inst_245853 = (state_245959[(8)]);
var inst_245856 = cljs.core.async.close_BANG_(inst_245853);
var state_245959__$1 = state_245959;
var statearr_246103_249650 = state_245959__$1;
(statearr_246103_249650[(2)] = inst_245856);

(statearr_246103_249650[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (36))){
var inst_245903 = (state_245959[(23)]);
var inst_245911 = cljs.core.chunk_first(inst_245903);
var inst_245915 = cljs.core.chunk_rest(inst_245903);
var inst_245916 = cljs.core.count(inst_245911);
var inst_245881 = inst_245915;
var inst_245882 = inst_245911;
var inst_245883 = inst_245916;
var inst_245884 = (0);
var state_245959__$1 = (function (){var statearr_246107 = state_245959;
(statearr_246107[(9)] = inst_245882);

(statearr_246107[(19)] = inst_245881);

(statearr_246107[(10)] = inst_245884);

(statearr_246107[(20)] = inst_245883);

return statearr_246107;
})();
var statearr_246109_249656 = state_245959__$1;
(statearr_246109_249656[(2)] = null);

(statearr_246109_249656[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (41))){
var inst_245903 = (state_245959[(23)]);
var inst_245926 = (state_245959[(2)]);
var inst_245927 = cljs.core.next(inst_245903);
var inst_245881 = inst_245927;
var inst_245882 = null;
var inst_245883 = (0);
var inst_245884 = (0);
var state_245959__$1 = (function (){var statearr_246110 = state_245959;
(statearr_246110[(9)] = inst_245882);

(statearr_246110[(19)] = inst_245881);

(statearr_246110[(25)] = inst_245926);

(statearr_246110[(10)] = inst_245884);

(statearr_246110[(20)] = inst_245883);

return statearr_246110;
})();
var statearr_246111_249657 = state_245959__$1;
(statearr_246111_249657[(2)] = null);

(statearr_246111_249657[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (43))){
var state_245959__$1 = state_245959;
var statearr_246112_249658 = state_245959__$1;
(statearr_246112_249658[(2)] = null);

(statearr_246112_249658[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (29))){
var inst_245935 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246117_249659 = state_245959__$1;
(statearr_246117_249659[(2)] = inst_245935);

(statearr_246117_249659[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (44))){
var inst_245945 = (state_245959[(2)]);
var state_245959__$1 = (function (){var statearr_246118 = state_245959;
(statearr_246118[(26)] = inst_245945);

return statearr_246118;
})();
var statearr_246119_249664 = state_245959__$1;
(statearr_246119_249664[(2)] = null);

(statearr_246119_249664[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (6))){
var inst_245873 = (state_245959[(27)]);
var inst_245872 = cljs.core.deref(cs);
var inst_245873__$1 = cljs.core.keys(inst_245872);
var inst_245874 = cljs.core.count(inst_245873__$1);
var inst_245875 = cljs.core.reset_BANG_(dctr,inst_245874);
var inst_245880 = cljs.core.seq(inst_245873__$1);
var inst_245881 = inst_245880;
var inst_245882 = null;
var inst_245883 = (0);
var inst_245884 = (0);
var state_245959__$1 = (function (){var statearr_246121 = state_245959;
(statearr_246121[(28)] = inst_245875);

(statearr_246121[(9)] = inst_245882);

(statearr_246121[(19)] = inst_245881);

(statearr_246121[(27)] = inst_245873__$1);

(statearr_246121[(10)] = inst_245884);

(statearr_246121[(20)] = inst_245883);

return statearr_246121;
})();
var statearr_246122_249669 = state_245959__$1;
(statearr_246122_249669[(2)] = null);

(statearr_246122_249669[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (28))){
var inst_245881 = (state_245959[(19)]);
var inst_245903 = (state_245959[(23)]);
var inst_245903__$1 = cljs.core.seq(inst_245881);
var state_245959__$1 = (function (){var statearr_246125 = state_245959;
(statearr_246125[(23)] = inst_245903__$1);

return statearr_246125;
})();
if(inst_245903__$1){
var statearr_246126_249672 = state_245959__$1;
(statearr_246126_249672[(1)] = (33));

} else {
var statearr_246127_249674 = state_245959__$1;
(statearr_246127_249674[(1)] = (34));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (25))){
var inst_245884 = (state_245959[(10)]);
var inst_245883 = (state_245959[(20)]);
var inst_245886 = (inst_245884 < inst_245883);
var inst_245887 = inst_245886;
var state_245959__$1 = state_245959;
if(cljs.core.truth_(inst_245887)){
var statearr_246128_249676 = state_245959__$1;
(statearr_246128_249676[(1)] = (27));

} else {
var statearr_246129_249677 = state_245959__$1;
(statearr_246129_249677[(1)] = (28));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (34))){
var state_245959__$1 = state_245959;
var statearr_246130_249678 = state_245959__$1;
(statearr_246130_249678[(2)] = null);

(statearr_246130_249678[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (17))){
var state_245959__$1 = state_245959;
var statearr_246132_249679 = state_245959__$1;
(statearr_246132_249679[(2)] = null);

(statearr_246132_249679[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (3))){
var inst_245950 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
return cljs.core.async.impl.ioc_helpers.return_chan(state_245959__$1,inst_245950);
} else {
if((state_val_245960 === (12))){
var inst_245868 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246134_249681 = state_245959__$1;
(statearr_246134_249681[(2)] = inst_245868);

(statearr_246134_249681[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (2))){
var state_245959__$1 = state_245959;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245959__$1,(4),ch);
} else {
if((state_val_245960 === (23))){
var state_245959__$1 = state_245959;
var statearr_246135_249682 = state_245959__$1;
(statearr_246135_249682[(2)] = null);

(statearr_246135_249682[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (35))){
var inst_245933 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246136_249687 = state_245959__$1;
(statearr_246136_249687[(2)] = inst_245933);

(statearr_246136_249687[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (19))){
var inst_245839 = (state_245959[(7)]);
var inst_245843 = cljs.core.chunk_first(inst_245839);
var inst_245844 = cljs.core.chunk_rest(inst_245839);
var inst_245845 = cljs.core.count(inst_245843);
var inst_245813 = inst_245844;
var inst_245814 = inst_245843;
var inst_245815 = inst_245845;
var inst_245816 = (0);
var state_245959__$1 = (function (){var statearr_246138 = state_245959;
(statearr_246138[(13)] = inst_245814);

(statearr_246138[(14)] = inst_245815);

(statearr_246138[(15)] = inst_245816);

(statearr_246138[(16)] = inst_245813);

return statearr_246138;
})();
var statearr_246139_249688 = state_245959__$1;
(statearr_246139_249688[(2)] = null);

(statearr_246139_249688[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (11))){
var inst_245813 = (state_245959[(16)]);
var inst_245839 = (state_245959[(7)]);
var inst_245839__$1 = cljs.core.seq(inst_245813);
var state_245959__$1 = (function (){var statearr_246147 = state_245959;
(statearr_246147[(7)] = inst_245839__$1);

return statearr_246147;
})();
if(inst_245839__$1){
var statearr_246148_249690 = state_245959__$1;
(statearr_246148_249690[(1)] = (16));

} else {
var statearr_246149_249691 = state_245959__$1;
(statearr_246149_249691[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (9))){
var inst_245870 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246150_249692 = state_245959__$1;
(statearr_246150_249692[(2)] = inst_245870);

(statearr_246150_249692[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (5))){
var inst_245810 = cljs.core.deref(cs);
var inst_245811 = cljs.core.seq(inst_245810);
var inst_245813 = inst_245811;
var inst_245814 = null;
var inst_245815 = (0);
var inst_245816 = (0);
var state_245959__$1 = (function (){var statearr_246151 = state_245959;
(statearr_246151[(13)] = inst_245814);

(statearr_246151[(14)] = inst_245815);

(statearr_246151[(15)] = inst_245816);

(statearr_246151[(16)] = inst_245813);

return statearr_246151;
})();
var statearr_246153_249693 = state_245959__$1;
(statearr_246153_249693[(2)] = null);

(statearr_246153_249693[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (14))){
var state_245959__$1 = state_245959;
var statearr_246160_249694 = state_245959__$1;
(statearr_246160_249694[(2)] = null);

(statearr_246160_249694[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (45))){
var inst_245942 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246165_249695 = state_245959__$1;
(statearr_246165_249695[(2)] = inst_245942);

(statearr_246165_249695[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (26))){
var inst_245873 = (state_245959[(27)]);
var inst_245937 = (state_245959[(2)]);
var inst_245939 = cljs.core.seq(inst_245873);
var state_245959__$1 = (function (){var statearr_246171 = state_245959;
(statearr_246171[(29)] = inst_245937);

return statearr_246171;
})();
if(inst_245939){
var statearr_246173_249698 = state_245959__$1;
(statearr_246173_249698[(1)] = (42));

} else {
var statearr_246175_249699 = state_245959__$1;
(statearr_246175_249699[(1)] = (43));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (16))){
var inst_245839 = (state_245959[(7)]);
var inst_245841 = cljs.core.chunked_seq_QMARK_(inst_245839);
var state_245959__$1 = state_245959;
if(inst_245841){
var statearr_246176_249702 = state_245959__$1;
(statearr_246176_249702[(1)] = (19));

} else {
var statearr_246177_249703 = state_245959__$1;
(statearr_246177_249703[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (38))){
var inst_245930 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246179_249704 = state_245959__$1;
(statearr_246179_249704[(2)] = inst_245930);

(statearr_246179_249704[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (30))){
var state_245959__$1 = state_245959;
var statearr_246180_249706 = state_245959__$1;
(statearr_246180_249706[(2)] = null);

(statearr_246180_249706[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (10))){
var inst_245814 = (state_245959[(13)]);
var inst_245816 = (state_245959[(15)]);
var inst_245827 = cljs.core._nth(inst_245814,inst_245816);
var inst_245828 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_245827,(0),null);
var inst_245829 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_245827,(1),null);
var state_245959__$1 = (function (){var statearr_246181 = state_245959;
(statearr_246181[(24)] = inst_245828);

return statearr_246181;
})();
if(cljs.core.truth_(inst_245829)){
var statearr_246186_249708 = state_245959__$1;
(statearr_246186_249708[(1)] = (13));

} else {
var statearr_246187_249709 = state_245959__$1;
(statearr_246187_249709[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (18))){
var inst_245866 = (state_245959[(2)]);
var state_245959__$1 = state_245959;
var statearr_246191_249711 = state_245959__$1;
(statearr_246191_249711[(2)] = inst_245866);

(statearr_246191_249711[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (42))){
var state_245959__$1 = state_245959;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_245959__$1,(45),dchan);
} else {
if((state_val_245960 === (37))){
var inst_245919 = (state_245959[(22)]);
var inst_245903 = (state_245959[(23)]);
var inst_245803 = (state_245959[(11)]);
var inst_245919__$1 = cljs.core.first(inst_245903);
var inst_245921 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_245919__$1,inst_245803,done);
var state_245959__$1 = (function (){var statearr_246198 = state_245959;
(statearr_246198[(22)] = inst_245919__$1);

return statearr_246198;
})();
if(cljs.core.truth_(inst_245921)){
var statearr_246199_249714 = state_245959__$1;
(statearr_246199_249714[(1)] = (39));

} else {
var statearr_246200_249715 = state_245959__$1;
(statearr_246200_249715[(1)] = (40));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_245960 === (8))){
var inst_245815 = (state_245959[(14)]);
var inst_245816 = (state_245959[(15)]);
var inst_245818 = (inst_245816 < inst_245815);
var inst_245819 = inst_245818;
var state_245959__$1 = state_245959;
if(cljs.core.truth_(inst_245819)){
var statearr_246201_249718 = state_245959__$1;
(statearr_246201_249718[(1)] = (10));

} else {
var statearr_246202_249720 = state_245959__$1;
(statearr_246202_249720[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$mult_$_state_machine__31625__auto__ = null;
var cljs$core$async$mult_$_state_machine__31625__auto____0 = (function (){
var statearr_246210 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_246210[(0)] = cljs$core$async$mult_$_state_machine__31625__auto__);

(statearr_246210[(1)] = (1));

return statearr_246210;
});
var cljs$core$async$mult_$_state_machine__31625__auto____1 = (function (state_245959){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_245959);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e246212){var ex__31628__auto__ = e246212;
var statearr_246214_249721 = state_245959;
(statearr_246214_249721[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_245959[(4)]))){
var statearr_246215_249723 = state_245959;
(statearr_246215_249723[(1)] = cljs.core.first((state_245959[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249724 = state_245959;
state_245959 = G__249724;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$mult_$_state_machine__31625__auto__ = function(state_245959){
switch(arguments.length){
case 0:
return cljs$core$async$mult_$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$mult_$_state_machine__31625__auto____1.call(this,state_245959);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mult_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mult_$_state_machine__31625__auto____0;
cljs$core$async$mult_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mult_$_state_machine__31625__auto____1;
return cljs$core$async$mult_$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_246219 = f__31898__auto__();
(statearr_246219[(6)] = c__31897__auto___249598);

return statearr_246219;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return m;
});
/**
 * Copies the mult source onto the supplied channel.
 * 
 *   By default the channel will be closed when the source closes,
 *   but can be determined by the close? parameter.
 */
cljs.core.async.tap = (function cljs$core$async$tap(var_args){
var G__246225 = arguments.length;
switch (G__246225) {
case 2:
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.tap.cljs$core$IFn$_invoke$arity$2 = (function (mult,ch){
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3(mult,ch,true);
}));

(cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3 = (function (mult,ch,close_QMARK_){
cljs.core.async.tap_STAR_(mult,ch,close_QMARK_);

return ch;
}));

(cljs.core.async.tap.cljs$lang$maxFixedArity = 3);

/**
 * Disconnects a target channel from a mult
 */
cljs.core.async.untap = (function cljs$core$async$untap(mult,ch){
return cljs.core.async.untap_STAR_(mult,ch);
});
/**
 * Disconnects all target channels from a mult
 */
cljs.core.async.untap_all = (function cljs$core$async$untap_all(mult){
return cljs.core.async.untap_all_STAR_(mult);
});

/**
 * @interface
 */
cljs.core.async.Mix = function(){};

var cljs$core$async$Mix$admix_STAR_$dyn_249734 = (function (m,ch){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.admix_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5351__auto__.call(null,m,ch));
} else {
var m__5349__auto__ = (cljs.core.async.admix_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5349__auto__.call(null,m,ch));
} else {
throw cljs.core.missing_protocol("Mix.admix*",m);
}
}
});
cljs.core.async.admix_STAR_ = (function cljs$core$async$admix_STAR_(m,ch){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$admix_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$admix_STAR_$arity$2(m,ch);
} else {
return cljs$core$async$Mix$admix_STAR_$dyn_249734(m,ch);
}
});

var cljs$core$async$Mix$unmix_STAR_$dyn_249735 = (function (m,ch){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.unmix_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5351__auto__.call(null,m,ch));
} else {
var m__5349__auto__ = (cljs.core.async.unmix_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,ch) : m__5349__auto__.call(null,m,ch));
} else {
throw cljs.core.missing_protocol("Mix.unmix*",m);
}
}
});
cljs.core.async.unmix_STAR_ = (function cljs$core$async$unmix_STAR_(m,ch){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$unmix_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$unmix_STAR_$arity$2(m,ch);
} else {
return cljs$core$async$Mix$unmix_STAR_$dyn_249735(m,ch);
}
});

var cljs$core$async$Mix$unmix_all_STAR_$dyn_249740 = (function (m){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.unmix_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5351__auto__.call(null,m));
} else {
var m__5349__auto__ = (cljs.core.async.unmix_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(m) : m__5349__auto__.call(null,m));
} else {
throw cljs.core.missing_protocol("Mix.unmix-all*",m);
}
}
});
cljs.core.async.unmix_all_STAR_ = (function cljs$core$async$unmix_all_STAR_(m){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$unmix_all_STAR_$arity$1 == null)))))){
return m.cljs$core$async$Mix$unmix_all_STAR_$arity$1(m);
} else {
return cljs$core$async$Mix$unmix_all_STAR_$dyn_249740(m);
}
});

var cljs$core$async$Mix$toggle_STAR_$dyn_249741 = (function (m,state_map){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.toggle_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,state_map) : m__5351__auto__.call(null,m,state_map));
} else {
var m__5349__auto__ = (cljs.core.async.toggle_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,state_map) : m__5349__auto__.call(null,m,state_map));
} else {
throw cljs.core.missing_protocol("Mix.toggle*",m);
}
}
});
cljs.core.async.toggle_STAR_ = (function cljs$core$async$toggle_STAR_(m,state_map){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$toggle_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$toggle_STAR_$arity$2(m,state_map);
} else {
return cljs$core$async$Mix$toggle_STAR_$dyn_249741(m,state_map);
}
});

var cljs$core$async$Mix$solo_mode_STAR_$dyn_249742 = (function (m,mode){
var x__5350__auto__ = (((m == null))?null:m);
var m__5351__auto__ = (cljs.core.async.solo_mode_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(m,mode) : m__5351__auto__.call(null,m,mode));
} else {
var m__5349__auto__ = (cljs.core.async.solo_mode_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(m,mode) : m__5349__auto__.call(null,m,mode));
} else {
throw cljs.core.missing_protocol("Mix.solo-mode*",m);
}
}
});
cljs.core.async.solo_mode_STAR_ = (function cljs$core$async$solo_mode_STAR_(m,mode){
if((((!((m == null)))) && ((!((m.cljs$core$async$Mix$solo_mode_STAR_$arity$2 == null)))))){
return m.cljs$core$async$Mix$solo_mode_STAR_$arity$2(m,mode);
} else {
return cljs$core$async$Mix$solo_mode_STAR_$dyn_249742(m,mode);
}
});

cljs.core.async.ioc_alts_BANG_ = (function cljs$core$async$ioc_alts_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___249745 = arguments.length;
var i__5727__auto___249746 = (0);
while(true){
if((i__5727__auto___249746 < len__5726__auto___249745)){
args__5732__auto__.push((arguments[i__5727__auto___249746]));

var G__249748 = (i__5727__auto___249746 + (1));
i__5727__auto___249746 = G__249748;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (state,cont_block,ports,p__246387){
var map__246394 = p__246387;
var map__246394__$1 = cljs.core.__destructure_map(map__246394);
var opts = map__246394__$1;
var statearr_246400_249752 = state;
(statearr_246400_249752[(1)] = cont_block);


var temp__5804__auto__ = cljs.core.async.do_alts((function (val){
var statearr_246402_249753 = state;
(statearr_246402_249753[(2)] = val);


return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state);
}),ports,opts);
if(cljs.core.truth_(temp__5804__auto__)){
var cb = temp__5804__auto__;
var statearr_246405_249754 = state;
(statearr_246405_249754[(2)] = cljs.core.deref(cb));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}));

(cljs.core.async.ioc_alts_BANG_.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(cljs.core.async.ioc_alts_BANG_.cljs$lang$applyTo = (function (seq246365){
var G__246366 = cljs.core.first(seq246365);
var seq246365__$1 = cljs.core.next(seq246365);
var G__246367 = cljs.core.first(seq246365__$1);
var seq246365__$2 = cljs.core.next(seq246365__$1);
var G__246368 = cljs.core.first(seq246365__$2);
var seq246365__$3 = cljs.core.next(seq246365__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__246366,G__246367,G__246368,seq246365__$3);
}));


/**
* @constructor
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mix}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async246431 = (function (change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta246432){
this.change = change;
this.solo_mode = solo_mode;
this.pick = pick;
this.cs = cs;
this.calc_state = calc_state;
this.out = out;
this.changed = changed;
this.solo_modes = solo_modes;
this.attrs = attrs;
this.meta246432 = meta246432;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_246433,meta246432__$1){
var self__ = this;
var _246433__$1 = this;
return (new cljs.core.async.t_cljs$core$async246431(self__.change,self__.solo_mode,self__.pick,self__.cs,self__.calc_state,self__.out,self__.changed,self__.solo_modes,self__.attrs,meta246432__$1));
}));

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_246433){
var self__ = this;
var _246433__$1 = this;
return self__.meta246432;
}));

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.out;
}));

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mix$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mix$admix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mix$unmix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mix$unmix_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mix$toggle_STAR_$arity$2 = (function (_,state_map){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.merge_with,cljs.core.merge),state_map);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async246431.prototype.cljs$core$async$Mix$solo_mode_STAR_$arity$2 = (function (_,mode){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.solo_modes.cljs$core$IFn$_invoke$arity$1 ? self__.solo_modes.cljs$core$IFn$_invoke$arity$1(mode) : self__.solo_modes.call(null,mode)))){
} else {
throw (new Error(["Assert failed: ",["mode must be one of: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.solo_modes)].join(''),"\n","(solo-modes mode)"].join('')));
}

cljs.core.reset_BANG_(self__.solo_mode,mode);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async246431.getBasis = (function (){
return new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"change","change",477485025,null),new cljs.core.Symbol(null,"solo-mode","solo-mode",2031788074,null),new cljs.core.Symbol(null,"pick","pick",1300068175,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"calc-state","calc-state",-349968968,null),new cljs.core.Symbol(null,"out","out",729986010,null),new cljs.core.Symbol(null,"changed","changed",-2083710852,null),new cljs.core.Symbol(null,"solo-modes","solo-modes",882180540,null),new cljs.core.Symbol(null,"attrs","attrs",-450137186,null),new cljs.core.Symbol(null,"meta246432","meta246432",-643624168,null)], null);
}));

(cljs.core.async.t_cljs$core$async246431.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async246431.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async246431");

(cljs.core.async.t_cljs$core$async246431.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async246431");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async246431.
 */
cljs.core.async.__GT_t_cljs$core$async246431 = (function cljs$core$async$__GT_t_cljs$core$async246431(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta246432){
return (new cljs.core.async.t_cljs$core$async246431(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta246432));
});


/**
 * Creates and returns a mix of one or more input channels which will
 *   be put on the supplied out channel. Input sources can be added to
 *   the mix with 'admix', and removed with 'unmix'. A mix supports
 *   soloing, muting and pausing multiple inputs atomically using
 *   'toggle', and can solo using either muting or pausing as determined
 *   by 'solo-mode'.
 * 
 *   Each channel can have zero or more boolean modes set via 'toggle':
 * 
 *   :solo - when true, only this (ond other soloed) channel(s) will appear
 *        in the mix output channel. :mute and :pause states of soloed
 *        channels are ignored. If solo-mode is :mute, non-soloed
 *        channels are muted, if :pause, non-soloed channels are
 *        paused.
 * 
 *   :mute - muted channels will have their contents consumed but not included in the mix
 *   :pause - paused channels will not have their contents consumed (and thus also not included in the mix)
 */
cljs.core.async.mix = (function cljs$core$async$mix(out){
var cs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var solo_modes = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"pause","pause",-2095325672),null,new cljs.core.Keyword(null,"mute","mute",1151223646),null], null), null);
var attrs = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(solo_modes,new cljs.core.Keyword(null,"solo","solo",-316350075));
var solo_mode = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"mute","mute",1151223646));
var change = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(cljs.core.async.sliding_buffer((1)));
var changed = (function (){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(change,true);
});
var pick = (function (attr,chs){
return cljs.core.reduce_kv((function (ret,c,v){
if(cljs.core.truth_((attr.cljs$core$IFn$_invoke$arity$1 ? attr.cljs$core$IFn$_invoke$arity$1(v) : attr.call(null,v)))){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,c);
} else {
return ret;
}
}),cljs.core.PersistentHashSet.EMPTY,chs);
});
var calc_state = (function (){
var chs = cljs.core.deref(cs);
var mode = cljs.core.deref(solo_mode);
var solos = pick(new cljs.core.Keyword(null,"solo","solo",-316350075),chs);
var pauses = pick(new cljs.core.Keyword(null,"pause","pause",-2095325672),chs);
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"solos","solos",1441458643),solos,new cljs.core.Keyword(null,"mutes","mutes",1068806309),pick(new cljs.core.Keyword(null,"mute","mute",1151223646),chs),new cljs.core.Keyword(null,"reads","reads",-1215067361),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"pause","pause",-2095325672))) && ((!(cljs.core.empty_QMARK_(solos))))))?cljs.core.vec(solos):cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(pauses,cljs.core.keys(chs)))),change)], null);
});
var m = (new cljs.core.async.t_cljs$core$async246431(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,cljs.core.PersistentArrayMap.EMPTY));
var c__31897__auto___249772 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_246558){
var state_val_246559 = (state_246558[(1)]);
if((state_val_246559 === (7))){
var inst_246512 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
if(cljs.core.truth_(inst_246512)){
var statearr_246564_249773 = state_246558__$1;
(statearr_246564_249773[(1)] = (8));

} else {
var statearr_246565_249774 = state_246558__$1;
(statearr_246565_249774[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (20))){
var inst_246497 = (state_246558[(7)]);
var state_246558__$1 = state_246558;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_246558__$1,(23),out,inst_246497);
} else {
if((state_val_246559 === (1))){
var inst_246479 = calc_state();
var inst_246480 = cljs.core.__destructure_map(inst_246479);
var inst_246481 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_246480,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_246482 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_246480,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_246484 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_246480,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var inst_246485 = inst_246479;
var state_246558__$1 = (function (){var statearr_246566 = state_246558;
(statearr_246566[(8)] = inst_246485);

(statearr_246566[(9)] = inst_246484);

(statearr_246566[(10)] = inst_246481);

(statearr_246566[(11)] = inst_246482);

return statearr_246566;
})();
var statearr_246570_249778 = state_246558__$1;
(statearr_246570_249778[(2)] = null);

(statearr_246570_249778[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (24))){
var inst_246488 = (state_246558[(12)]);
var inst_246485 = inst_246488;
var state_246558__$1 = (function (){var statearr_246571 = state_246558;
(statearr_246571[(8)] = inst_246485);

return statearr_246571;
})();
var statearr_246574_249782 = state_246558__$1;
(statearr_246574_249782[(2)] = null);

(statearr_246574_249782[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (4))){
var inst_246497 = (state_246558[(7)]);
var inst_246503 = (state_246558[(13)]);
var inst_246496 = (state_246558[(2)]);
var inst_246497__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_246496,(0),null);
var inst_246498 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_246496,(1),null);
var inst_246503__$1 = (inst_246497__$1 == null);
var state_246558__$1 = (function (){var statearr_246577 = state_246558;
(statearr_246577[(7)] = inst_246497__$1);

(statearr_246577[(13)] = inst_246503__$1);

(statearr_246577[(14)] = inst_246498);

return statearr_246577;
})();
if(cljs.core.truth_(inst_246503__$1)){
var statearr_246579_249785 = state_246558__$1;
(statearr_246579_249785[(1)] = (5));

} else {
var statearr_246584_249786 = state_246558__$1;
(statearr_246584_249786[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (15))){
var inst_246489 = (state_246558[(15)]);
var inst_246532 = (state_246558[(16)]);
var inst_246532__$1 = cljs.core.empty_QMARK_(inst_246489);
var state_246558__$1 = (function (){var statearr_246585 = state_246558;
(statearr_246585[(16)] = inst_246532__$1);

return statearr_246585;
})();
if(inst_246532__$1){
var statearr_246586_249788 = state_246558__$1;
(statearr_246586_249788[(1)] = (17));

} else {
var statearr_246589_249792 = state_246558__$1;
(statearr_246589_249792[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (21))){
var inst_246488 = (state_246558[(12)]);
var inst_246485 = inst_246488;
var state_246558__$1 = (function (){var statearr_246590 = state_246558;
(statearr_246590[(8)] = inst_246485);

return statearr_246590;
})();
var statearr_246591_249793 = state_246558__$1;
(statearr_246591_249793[(2)] = null);

(statearr_246591_249793[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (13))){
var inst_246525 = (state_246558[(2)]);
var inst_246526 = calc_state();
var inst_246485 = inst_246526;
var state_246558__$1 = (function (){var statearr_246594 = state_246558;
(statearr_246594[(8)] = inst_246485);

(statearr_246594[(17)] = inst_246525);

return statearr_246594;
})();
var statearr_246596_249798 = state_246558__$1;
(statearr_246596_249798[(2)] = null);

(statearr_246596_249798[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (22))){
var inst_246552 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
var statearr_246600_249800 = state_246558__$1;
(statearr_246600_249800[(2)] = inst_246552);

(statearr_246600_249800[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (6))){
var inst_246498 = (state_246558[(14)]);
var inst_246506 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_246498,change);
var state_246558__$1 = state_246558;
var statearr_246601_249801 = state_246558__$1;
(statearr_246601_249801[(2)] = inst_246506);

(statearr_246601_249801[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (25))){
var state_246558__$1 = state_246558;
var statearr_246602_249805 = state_246558__$1;
(statearr_246602_249805[(2)] = null);

(statearr_246602_249805[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (17))){
var inst_246490 = (state_246558[(18)]);
var inst_246498 = (state_246558[(14)]);
var inst_246534 = (inst_246490.cljs$core$IFn$_invoke$arity$1 ? inst_246490.cljs$core$IFn$_invoke$arity$1(inst_246498) : inst_246490.call(null,inst_246498));
var inst_246535 = cljs.core.not(inst_246534);
var state_246558__$1 = state_246558;
var statearr_246603_249806 = state_246558__$1;
(statearr_246603_249806[(2)] = inst_246535);

(statearr_246603_249806[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (3))){
var inst_246556 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
return cljs.core.async.impl.ioc_helpers.return_chan(state_246558__$1,inst_246556);
} else {
if((state_val_246559 === (12))){
var state_246558__$1 = state_246558;
var statearr_246620_249807 = state_246558__$1;
(statearr_246620_249807[(2)] = null);

(statearr_246620_249807[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (2))){
var inst_246485 = (state_246558[(8)]);
var inst_246488 = (state_246558[(12)]);
var inst_246488__$1 = cljs.core.__destructure_map(inst_246485);
var inst_246489 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_246488__$1,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_246490 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_246488__$1,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_246491 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_246488__$1,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var state_246558__$1 = (function (){var statearr_246633 = state_246558;
(statearr_246633[(15)] = inst_246489);

(statearr_246633[(18)] = inst_246490);

(statearr_246633[(12)] = inst_246488__$1);

return statearr_246633;
})();
return cljs.core.async.ioc_alts_BANG_(state_246558__$1,(4),inst_246491);
} else {
if((state_val_246559 === (23))){
var inst_246543 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
if(cljs.core.truth_(inst_246543)){
var statearr_246634_249808 = state_246558__$1;
(statearr_246634_249808[(1)] = (24));

} else {
var statearr_246643_249809 = state_246558__$1;
(statearr_246643_249809[(1)] = (25));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (19))){
var inst_246538 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
var statearr_246656_249810 = state_246558__$1;
(statearr_246656_249810[(2)] = inst_246538);

(statearr_246656_249810[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (11))){
var inst_246498 = (state_246558[(14)]);
var inst_246522 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cs,cljs.core.dissoc,inst_246498);
var state_246558__$1 = state_246558;
var statearr_246665_249811 = state_246558__$1;
(statearr_246665_249811[(2)] = inst_246522);

(statearr_246665_249811[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (9))){
var inst_246489 = (state_246558[(15)]);
var inst_246498 = (state_246558[(14)]);
var inst_246529 = (state_246558[(19)]);
var inst_246529__$1 = (inst_246489.cljs$core$IFn$_invoke$arity$1 ? inst_246489.cljs$core$IFn$_invoke$arity$1(inst_246498) : inst_246489.call(null,inst_246498));
var state_246558__$1 = (function (){var statearr_246670 = state_246558;
(statearr_246670[(19)] = inst_246529__$1);

return statearr_246670;
})();
if(cljs.core.truth_(inst_246529__$1)){
var statearr_246671_249813 = state_246558__$1;
(statearr_246671_249813[(1)] = (14));

} else {
var statearr_246674_249814 = state_246558__$1;
(statearr_246674_249814[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (5))){
var inst_246503 = (state_246558[(13)]);
var state_246558__$1 = state_246558;
var statearr_246679_249816 = state_246558__$1;
(statearr_246679_249816[(2)] = inst_246503);

(statearr_246679_249816[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (14))){
var inst_246529 = (state_246558[(19)]);
var state_246558__$1 = state_246558;
var statearr_246686_249817 = state_246558__$1;
(statearr_246686_249817[(2)] = inst_246529);

(statearr_246686_249817[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (26))){
var inst_246548 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
var statearr_246687_249819 = state_246558__$1;
(statearr_246687_249819[(2)] = inst_246548);

(statearr_246687_249819[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (16))){
var inst_246540 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
if(cljs.core.truth_(inst_246540)){
var statearr_246691_249821 = state_246558__$1;
(statearr_246691_249821[(1)] = (20));

} else {
var statearr_246695_249822 = state_246558__$1;
(statearr_246695_249822[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (10))){
var inst_246554 = (state_246558[(2)]);
var state_246558__$1 = state_246558;
var statearr_246698_249824 = state_246558__$1;
(statearr_246698_249824[(2)] = inst_246554);

(statearr_246698_249824[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (18))){
var inst_246532 = (state_246558[(16)]);
var state_246558__$1 = state_246558;
var statearr_246707_249825 = state_246558__$1;
(statearr_246707_249825[(2)] = inst_246532);

(statearr_246707_249825[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_246559 === (8))){
var inst_246497 = (state_246558[(7)]);
var inst_246515 = (inst_246497 == null);
var state_246558__$1 = state_246558;
if(cljs.core.truth_(inst_246515)){
var statearr_246711_249827 = state_246558__$1;
(statearr_246711_249827[(1)] = (11));

} else {
var statearr_246712_249828 = state_246558__$1;
(statearr_246712_249828[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$mix_$_state_machine__31625__auto__ = null;
var cljs$core$async$mix_$_state_machine__31625__auto____0 = (function (){
var statearr_246716 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_246716[(0)] = cljs$core$async$mix_$_state_machine__31625__auto__);

(statearr_246716[(1)] = (1));

return statearr_246716;
});
var cljs$core$async$mix_$_state_machine__31625__auto____1 = (function (state_246558){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_246558);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e246717){var ex__31628__auto__ = e246717;
var statearr_246718_249831 = state_246558;
(statearr_246718_249831[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_246558[(4)]))){
var statearr_246719_249833 = state_246558;
(statearr_246719_249833[(1)] = cljs.core.first((state_246558[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249834 = state_246558;
state_246558 = G__249834;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$mix_$_state_machine__31625__auto__ = function(state_246558){
switch(arguments.length){
case 0:
return cljs$core$async$mix_$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$mix_$_state_machine__31625__auto____1.call(this,state_246558);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mix_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mix_$_state_machine__31625__auto____0;
cljs$core$async$mix_$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mix_$_state_machine__31625__auto____1;
return cljs$core$async$mix_$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_246720 = f__31898__auto__();
(statearr_246720[(6)] = c__31897__auto___249772);

return statearr_246720;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return m;
});
/**
 * Adds ch as an input to the mix
 */
cljs.core.async.admix = (function cljs$core$async$admix(mix,ch){
return cljs.core.async.admix_STAR_(mix,ch);
});
/**
 * Removes ch as an input to the mix
 */
cljs.core.async.unmix = (function cljs$core$async$unmix(mix,ch){
return cljs.core.async.unmix_STAR_(mix,ch);
});
/**
 * removes all inputs from the mix
 */
cljs.core.async.unmix_all = (function cljs$core$async$unmix_all(mix){
return cljs.core.async.unmix_all_STAR_(mix);
});
/**
 * Atomically sets the state(s) of one or more channels in a mix. The
 *   state map is a map of channels -> channel-state-map. A
 *   channel-state-map is a map of attrs -> boolean, where attr is one or
 *   more of :mute, :pause or :solo. Any states supplied are merged with
 *   the current state.
 * 
 *   Note that channels can be added to a mix via toggle, which can be
 *   used to add channels in a particular (e.g. paused) state.
 */
cljs.core.async.toggle = (function cljs$core$async$toggle(mix,state_map){
return cljs.core.async.toggle_STAR_(mix,state_map);
});
/**
 * Sets the solo mode of the mix. mode must be one of :mute or :pause
 */
cljs.core.async.solo_mode = (function cljs$core$async$solo_mode(mix,mode){
return cljs.core.async.solo_mode_STAR_(mix,mode);
});

/**
 * @interface
 */
cljs.core.async.Pub = function(){};

var cljs$core$async$Pub$sub_STAR_$dyn_249839 = (function (p,v,ch,close_QMARK_){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.sub_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$4(p,v,ch,close_QMARK_) : m__5351__auto__.call(null,p,v,ch,close_QMARK_));
} else {
var m__5349__auto__ = (cljs.core.async.sub_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$4 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$4(p,v,ch,close_QMARK_) : m__5349__auto__.call(null,p,v,ch,close_QMARK_));
} else {
throw cljs.core.missing_protocol("Pub.sub*",p);
}
}
});
cljs.core.async.sub_STAR_ = (function cljs$core$async$sub_STAR_(p,v,ch,close_QMARK_){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$sub_STAR_$arity$4 == null)))))){
return p.cljs$core$async$Pub$sub_STAR_$arity$4(p,v,ch,close_QMARK_);
} else {
return cljs$core$async$Pub$sub_STAR_$dyn_249839(p,v,ch,close_QMARK_);
}
});

var cljs$core$async$Pub$unsub_STAR_$dyn_249842 = (function (p,v,ch){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.unsub_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$3(p,v,ch) : m__5351__auto__.call(null,p,v,ch));
} else {
var m__5349__auto__ = (cljs.core.async.unsub_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$3 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$3(p,v,ch) : m__5349__auto__.call(null,p,v,ch));
} else {
throw cljs.core.missing_protocol("Pub.unsub*",p);
}
}
});
cljs.core.async.unsub_STAR_ = (function cljs$core$async$unsub_STAR_(p,v,ch){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_STAR_$arity$3 == null)))))){
return p.cljs$core$async$Pub$unsub_STAR_$arity$3(p,v,ch);
} else {
return cljs$core$async$Pub$unsub_STAR_$dyn_249842(p,v,ch);
}
});

var cljs$core$async$Pub$unsub_all_STAR_$dyn_249847 = (function() {
var G__249848 = null;
var G__249848__1 = (function (p){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.unsub_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(p) : m__5351__auto__.call(null,p));
} else {
var m__5349__auto__ = (cljs.core.async.unsub_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(p) : m__5349__auto__.call(null,p));
} else {
throw cljs.core.missing_protocol("Pub.unsub-all*",p);
}
}
});
var G__249848__2 = (function (p,v){
var x__5350__auto__ = (((p == null))?null:p);
var m__5351__auto__ = (cljs.core.async.unsub_all_STAR_[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$2(p,v) : m__5351__auto__.call(null,p,v));
} else {
var m__5349__auto__ = (cljs.core.async.unsub_all_STAR_["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$2 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$2(p,v) : m__5349__auto__.call(null,p,v));
} else {
throw cljs.core.missing_protocol("Pub.unsub-all*",p);
}
}
});
G__249848 = function(p,v){
switch(arguments.length){
case 1:
return G__249848__1.call(this,p);
case 2:
return G__249848__2.call(this,p,v);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__249848.cljs$core$IFn$_invoke$arity$1 = G__249848__1;
G__249848.cljs$core$IFn$_invoke$arity$2 = G__249848__2;
return G__249848;
})()
;
cljs.core.async.unsub_all_STAR_ = (function cljs$core$async$unsub_all_STAR_(var_args){
var G__246809 = arguments.length;
switch (G__246809) {
case 1:
return cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$1 = (function (p){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_all_STAR_$arity$1 == null)))))){
return p.cljs$core$async$Pub$unsub_all_STAR_$arity$1(p);
} else {
return cljs$core$async$Pub$unsub_all_STAR_$dyn_249847(p);
}
}));

(cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$2 = (function (p,v){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_all_STAR_$arity$2 == null)))))){
return p.cljs$core$async$Pub$unsub_all_STAR_$arity$2(p,v);
} else {
return cljs$core$async$Pub$unsub_all_STAR_$dyn_249847(p,v);
}
}));

(cljs.core.async.unsub_all_STAR_.cljs$lang$maxFixedArity = 2);



/**
* @constructor
 * @implements {cljs.core.async.Pub}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async246891 = (function (ch,topic_fn,buf_fn,mults,ensure_mult,meta246892){
this.ch = ch;
this.topic_fn = topic_fn;
this.buf_fn = buf_fn;
this.mults = mults;
this.ensure_mult = ensure_mult;
this.meta246892 = meta246892;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_246893,meta246892__$1){
var self__ = this;
var _246893__$1 = this;
return (new cljs.core.async.t_cljs$core$async246891(self__.ch,self__.topic_fn,self__.buf_fn,self__.mults,self__.ensure_mult,meta246892__$1));
}));

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_246893){
var self__ = this;
var _246893__$1 = this;
return self__.meta246892;
}));

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$async$Pub$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$async$Pub$sub_STAR_$arity$4 = (function (p,topic,ch__$1,close_QMARK_){
var self__ = this;
var p__$1 = this;
var m = (self__.ensure_mult.cljs$core$IFn$_invoke$arity$1 ? self__.ensure_mult.cljs$core$IFn$_invoke$arity$1(topic) : self__.ensure_mult.call(null,topic));
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3(m,ch__$1,close_QMARK_);
}));

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$async$Pub$unsub_STAR_$arity$3 = (function (p,topic,ch__$1){
var self__ = this;
var p__$1 = this;
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(self__.mults),topic);
if(cljs.core.truth_(temp__5804__auto__)){
var m = temp__5804__auto__;
return cljs.core.async.untap(m,ch__$1);
} else {
return null;
}
}));

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.reset_BANG_(self__.mults,cljs.core.PersistentArrayMap.EMPTY);
}));

(cljs.core.async.t_cljs$core$async246891.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$2 = (function (_,topic){
var self__ = this;
var ___$1 = this;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.mults,cljs.core.dissoc,topic);
}));

(cljs.core.async.t_cljs$core$async246891.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"topic-fn","topic-fn",-862449736,null),new cljs.core.Symbol(null,"buf-fn","buf-fn",-1200281591,null),new cljs.core.Symbol(null,"mults","mults",-461114485,null),new cljs.core.Symbol(null,"ensure-mult","ensure-mult",1796584816,null),new cljs.core.Symbol(null,"meta246892","meta246892",-2019357879,null)], null);
}));

(cljs.core.async.t_cljs$core$async246891.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async246891.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async246891");

(cljs.core.async.t_cljs$core$async246891.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async246891");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async246891.
 */
cljs.core.async.__GT_t_cljs$core$async246891 = (function cljs$core$async$__GT_t_cljs$core$async246891(ch,topic_fn,buf_fn,mults,ensure_mult,meta246892){
return (new cljs.core.async.t_cljs$core$async246891(ch,topic_fn,buf_fn,mults,ensure_mult,meta246892));
});


/**
 * Creates and returns a pub(lication) of the supplied channel,
 *   partitioned into topics by the topic-fn. topic-fn will be applied to
 *   each value on the channel and the result will determine the 'topic'
 *   on which that value will be put. Channels can be subscribed to
 *   receive copies of topics using 'sub', and unsubscribed using
 *   'unsub'. Each topic will be handled by an internal mult on a
 *   dedicated channel. By default these internal channels are
 *   unbuffered, but a buf-fn can be supplied which, given a topic,
 *   creates a buffer with desired properties.
 * 
 *   Each item is distributed to all subs in parallel and synchronously,
 *   i.e. each sub must accept before the next item is distributed. Use
 *   buffering/windowing to prevent slow subs from holding up the pub.
 * 
 *   Items received when there are no matching subs get dropped.
 * 
 *   Note that if buf-fns are used then each topic is handled
 *   asynchronously, i.e. if a channel is subscribed to more than one
 *   topic it should not expect them to be interleaved identically with
 *   the source.
 */
cljs.core.async.pub = (function cljs$core$async$pub(var_args){
var G__246880 = arguments.length;
switch (G__246880) {
case 2:
return cljs.core.async.pub.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.pub.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.pub.cljs$core$IFn$_invoke$arity$2 = (function (ch,topic_fn){
return cljs.core.async.pub.cljs$core$IFn$_invoke$arity$3(ch,topic_fn,cljs.core.constantly(null));
}));

(cljs.core.async.pub.cljs$core$IFn$_invoke$arity$3 = (function (ch,topic_fn,buf_fn){
var mults = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var ensure_mult = (function (topic){
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(mults),topic);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(mults,(function (p1__246861_SHARP_){
if(cljs.core.truth_((p1__246861_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__246861_SHARP_.cljs$core$IFn$_invoke$arity$1(topic) : p1__246861_SHARP_.call(null,topic)))){
return p1__246861_SHARP_;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__246861_SHARP_,topic,cljs.core.async.mult(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((buf_fn.cljs$core$IFn$_invoke$arity$1 ? buf_fn.cljs$core$IFn$_invoke$arity$1(topic) : buf_fn.call(null,topic)))));
}
})),topic);
}
});
var p = (new cljs.core.async.t_cljs$core$async246891(ch,topic_fn,buf_fn,mults,ensure_mult,cljs.core.PersistentArrayMap.EMPTY));
var c__31897__auto___249860 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_247051){
var state_val_247052 = (state_247051[(1)]);
if((state_val_247052 === (7))){
var inst_247047 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
var statearr_247061_249864 = state_247051__$1;
(statearr_247061_249864[(2)] = inst_247047);

(statearr_247061_249864[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (20))){
var state_247051__$1 = state_247051;
var statearr_247069_249865 = state_247051__$1;
(statearr_247069_249865[(2)] = null);

(statearr_247069_249865[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (1))){
var state_247051__$1 = state_247051;
var statearr_247074_249866 = state_247051__$1;
(statearr_247074_249866[(2)] = null);

(statearr_247074_249866[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (24))){
var inst_247028 = (state_247051[(7)]);
var inst_247039 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(mults,cljs.core.dissoc,inst_247028);
var state_247051__$1 = state_247051;
var statearr_247078_249870 = state_247051__$1;
(statearr_247078_249870[(2)] = inst_247039);

(statearr_247078_249870[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (4))){
var inst_246957 = (state_247051[(8)]);
var inst_246957__$1 = (state_247051[(2)]);
var inst_246958 = (inst_246957__$1 == null);
var state_247051__$1 = (function (){var statearr_247085 = state_247051;
(statearr_247085[(8)] = inst_246957__$1);

return statearr_247085;
})();
if(cljs.core.truth_(inst_246958)){
var statearr_247086_249872 = state_247051__$1;
(statearr_247086_249872[(1)] = (5));

} else {
var statearr_247087_249873 = state_247051__$1;
(statearr_247087_249873[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (15))){
var inst_247022 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
var statearr_247089_249875 = state_247051__$1;
(statearr_247089_249875[(2)] = inst_247022);

(statearr_247089_249875[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (21))){
var inst_247044 = (state_247051[(2)]);
var state_247051__$1 = (function (){var statearr_247090 = state_247051;
(statearr_247090[(9)] = inst_247044);

return statearr_247090;
})();
var statearr_247091_249876 = state_247051__$1;
(statearr_247091_249876[(2)] = null);

(statearr_247091_249876[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (13))){
var inst_246997 = (state_247051[(10)]);
var inst_246999 = cljs.core.chunked_seq_QMARK_(inst_246997);
var state_247051__$1 = state_247051;
if(inst_246999){
var statearr_247094_249877 = state_247051__$1;
(statearr_247094_249877[(1)] = (16));

} else {
var statearr_247096_249878 = state_247051__$1;
(statearr_247096_249878[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (22))){
var inst_247036 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
if(cljs.core.truth_(inst_247036)){
var statearr_247097_249880 = state_247051__$1;
(statearr_247097_249880[(1)] = (23));

} else {
var statearr_247098_249882 = state_247051__$1;
(statearr_247098_249882[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (6))){
var inst_247028 = (state_247051[(7)]);
var inst_246957 = (state_247051[(8)]);
var inst_247030 = (state_247051[(11)]);
var inst_247028__$1 = (topic_fn.cljs$core$IFn$_invoke$arity$1 ? topic_fn.cljs$core$IFn$_invoke$arity$1(inst_246957) : topic_fn.call(null,inst_246957));
var inst_247029 = cljs.core.deref(mults);
var inst_247030__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_247029,inst_247028__$1);
var state_247051__$1 = (function (){var statearr_247112 = state_247051;
(statearr_247112[(7)] = inst_247028__$1);

(statearr_247112[(11)] = inst_247030__$1);

return statearr_247112;
})();
if(cljs.core.truth_(inst_247030__$1)){
var statearr_247113_249883 = state_247051__$1;
(statearr_247113_249883[(1)] = (19));

} else {
var statearr_247114_249884 = state_247051__$1;
(statearr_247114_249884[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (25))){
var inst_247041 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
var statearr_247121_249886 = state_247051__$1;
(statearr_247121_249886[(2)] = inst_247041);

(statearr_247121_249886[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (17))){
var inst_246997 = (state_247051[(10)]);
var inst_247006 = cljs.core.first(inst_246997);
var inst_247011 = cljs.core.async.muxch_STAR_(inst_247006);
var inst_247012 = cljs.core.async.close_BANG_(inst_247011);
var inst_247013 = cljs.core.next(inst_246997);
var inst_246967 = inst_247013;
var inst_246968 = null;
var inst_246969 = (0);
var inst_246970 = (0);
var state_247051__$1 = (function (){var statearr_247126 = state_247051;
(statearr_247126[(12)] = inst_247012);

(statearr_247126[(13)] = inst_246970);

(statearr_247126[(14)] = inst_246969);

(statearr_247126[(15)] = inst_246967);

(statearr_247126[(16)] = inst_246968);

return statearr_247126;
})();
var statearr_247127_249890 = state_247051__$1;
(statearr_247127_249890[(2)] = null);

(statearr_247127_249890[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (3))){
var inst_247049 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
return cljs.core.async.impl.ioc_helpers.return_chan(state_247051__$1,inst_247049);
} else {
if((state_val_247052 === (12))){
var inst_247024 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
var statearr_247128_249895 = state_247051__$1;
(statearr_247128_249895[(2)] = inst_247024);

(statearr_247128_249895[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (2))){
var state_247051__$1 = state_247051;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_247051__$1,(4),ch);
} else {
if((state_val_247052 === (23))){
var state_247051__$1 = state_247051;
var statearr_247136_249896 = state_247051__$1;
(statearr_247136_249896[(2)] = null);

(statearr_247136_249896[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (19))){
var inst_246957 = (state_247051[(8)]);
var inst_247030 = (state_247051[(11)]);
var inst_247034 = cljs.core.async.muxch_STAR_(inst_247030);
var state_247051__$1 = state_247051;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_247051__$1,(22),inst_247034,inst_246957);
} else {
if((state_val_247052 === (11))){
var inst_246997 = (state_247051[(10)]);
var inst_246967 = (state_247051[(15)]);
var inst_246997__$1 = cljs.core.seq(inst_246967);
var state_247051__$1 = (function (){var statearr_247140 = state_247051;
(statearr_247140[(10)] = inst_246997__$1);

return statearr_247140;
})();
if(inst_246997__$1){
var statearr_247141_249897 = state_247051__$1;
(statearr_247141_249897[(1)] = (13));

} else {
var statearr_247142_249898 = state_247051__$1;
(statearr_247142_249898[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (9))){
var inst_247026 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
var statearr_247143_249899 = state_247051__$1;
(statearr_247143_249899[(2)] = inst_247026);

(statearr_247143_249899[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (5))){
var inst_246964 = cljs.core.deref(mults);
var inst_246965 = cljs.core.vals(inst_246964);
var inst_246966 = cljs.core.seq(inst_246965);
var inst_246967 = inst_246966;
var inst_246968 = null;
var inst_246969 = (0);
var inst_246970 = (0);
var state_247051__$1 = (function (){var statearr_247151 = state_247051;
(statearr_247151[(13)] = inst_246970);

(statearr_247151[(14)] = inst_246969);

(statearr_247151[(15)] = inst_246967);

(statearr_247151[(16)] = inst_246968);

return statearr_247151;
})();
var statearr_247156_249901 = state_247051__$1;
(statearr_247156_249901[(2)] = null);

(statearr_247156_249901[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (14))){
var state_247051__$1 = state_247051;
var statearr_247164_249902 = state_247051__$1;
(statearr_247164_249902[(2)] = null);

(statearr_247164_249902[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (16))){
var inst_246997 = (state_247051[(10)]);
var inst_247001 = cljs.core.chunk_first(inst_246997);
var inst_247002 = cljs.core.chunk_rest(inst_246997);
var inst_247003 = cljs.core.count(inst_247001);
var inst_246967 = inst_247002;
var inst_246968 = inst_247001;
var inst_246969 = inst_247003;
var inst_246970 = (0);
var state_247051__$1 = (function (){var statearr_247174 = state_247051;
(statearr_247174[(13)] = inst_246970);

(statearr_247174[(14)] = inst_246969);

(statearr_247174[(15)] = inst_246967);

(statearr_247174[(16)] = inst_246968);

return statearr_247174;
})();
var statearr_247181_249909 = state_247051__$1;
(statearr_247181_249909[(2)] = null);

(statearr_247181_249909[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (10))){
var inst_246970 = (state_247051[(13)]);
var inst_246969 = (state_247051[(14)]);
var inst_246967 = (state_247051[(15)]);
var inst_246968 = (state_247051[(16)]);
var inst_246980 = cljs.core._nth(inst_246968,inst_246970);
var inst_246982 = cljs.core.async.muxch_STAR_(inst_246980);
var inst_246983 = cljs.core.async.close_BANG_(inst_246982);
var inst_246988 = (inst_246970 + (1));
var tmp247160 = inst_246969;
var tmp247161 = inst_246967;
var tmp247162 = inst_246968;
var inst_246967__$1 = tmp247161;
var inst_246968__$1 = tmp247162;
var inst_246969__$1 = tmp247160;
var inst_246970__$1 = inst_246988;
var state_247051__$1 = (function (){var statearr_247196 = state_247051;
(statearr_247196[(13)] = inst_246970__$1);

(statearr_247196[(14)] = inst_246969__$1);

(statearr_247196[(17)] = inst_246983);

(statearr_247196[(15)] = inst_246967__$1);

(statearr_247196[(16)] = inst_246968__$1);

return statearr_247196;
})();
var statearr_247201_249911 = state_247051__$1;
(statearr_247201_249911[(2)] = null);

(statearr_247201_249911[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (18))){
var inst_247016 = (state_247051[(2)]);
var state_247051__$1 = state_247051;
var statearr_247205_249913 = state_247051__$1;
(statearr_247205_249913[(2)] = inst_247016);

(statearr_247205_249913[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247052 === (8))){
var inst_246970 = (state_247051[(13)]);
var inst_246969 = (state_247051[(14)]);
var inst_246973 = (inst_246970 < inst_246969);
var inst_246974 = inst_246973;
var state_247051__$1 = state_247051;
if(cljs.core.truth_(inst_246974)){
var statearr_247212_249918 = state_247051__$1;
(statearr_247212_249918[(1)] = (10));

} else {
var statearr_247215_249923 = state_247051__$1;
(statearr_247215_249923[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_247228 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_247228[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_247228[(1)] = (1));

return statearr_247228;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_247051){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_247051);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e247233){var ex__31628__auto__ = e247233;
var statearr_247234_249928 = state_247051;
(statearr_247234_249928[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_247051[(4)]))){
var statearr_247241_249933 = state_247051;
(statearr_247241_249933[(1)] = cljs.core.first((state_247051[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__249935 = state_247051;
state_247051 = G__249935;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_247051){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_247051);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_247257 = f__31898__auto__();
(statearr_247257[(6)] = c__31897__auto___249860);

return statearr_247257;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return p;
}));

(cljs.core.async.pub.cljs$lang$maxFixedArity = 3);

/**
 * Subscribes a channel to a topic of a pub.
 * 
 *   By default the channel will be closed when the source closes,
 *   but can be determined by the close? parameter.
 */
cljs.core.async.sub = (function cljs$core$async$sub(var_args){
var G__247265 = arguments.length;
switch (G__247265) {
case 3:
return cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return cljs.core.async.sub.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.sub.cljs$core$IFn$_invoke$arity$3 = (function (p,topic,ch){
return cljs.core.async.sub.cljs$core$IFn$_invoke$arity$4(p,topic,ch,true);
}));

(cljs.core.async.sub.cljs$core$IFn$_invoke$arity$4 = (function (p,topic,ch,close_QMARK_){
return cljs.core.async.sub_STAR_(p,topic,ch,close_QMARK_);
}));

(cljs.core.async.sub.cljs$lang$maxFixedArity = 4);

/**
 * Unsubscribes a channel from a topic of a pub
 */
cljs.core.async.unsub = (function cljs$core$async$unsub(p,topic,ch){
return cljs.core.async.unsub_STAR_(p,topic,ch);
});
/**
 * Unsubscribes all channels from a pub, or a topic of a pub
 */
cljs.core.async.unsub_all = (function cljs$core$async$unsub_all(var_args){
var G__247318 = arguments.length;
switch (G__247318) {
case 1:
return cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$1 = (function (p){
return cljs.core.async.unsub_all_STAR_(p);
}));

(cljs.core.async.unsub_all.cljs$core$IFn$_invoke$arity$2 = (function (p,topic){
return cljs.core.async.unsub_all_STAR_(p,topic);
}));

(cljs.core.async.unsub_all.cljs$lang$maxFixedArity = 2);

/**
 * Takes a function and a collection of source channels, and returns a
 *   channel which contains the values produced by applying f to the set
 *   of first items taken from each source channel, followed by applying
 *   f to the set of second items from each channel, until any one of the
 *   channels is closed, at which point the output channel will be
 *   closed. The returned channel will be unbuffered by default, or a
 *   buf-or-n can be supplied
 */
cljs.core.async.map = (function cljs$core$async$map(var_args){
var G__247359 = arguments.length;
switch (G__247359) {
case 2:
return cljs.core.async.map.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.map.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.map.cljs$core$IFn$_invoke$arity$2 = (function (f,chs){
return cljs.core.async.map.cljs$core$IFn$_invoke$arity$3(f,chs,null);
}));

(cljs.core.async.map.cljs$core$IFn$_invoke$arity$3 = (function (f,chs,buf_or_n){
var chs__$1 = cljs.core.vec(chs);
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var cnt = cljs.core.count(chs__$1);
var rets = cljs.core.object_array.cljs$core$IFn$_invoke$arity$1(cnt);
var dchan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var dctr = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var done = cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (i){
return (function (ret){
(rets[i] = ret);

if((cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec) === (0))){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(dchan,rets.slice((0)));
} else {
return null;
}
});
}),cljs.core.range.cljs$core$IFn$_invoke$arity$1(cnt));
if((cnt === (0))){
cljs.core.async.close_BANG_(out);
} else {
var c__31897__auto___249965 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_247490){
var state_val_247492 = (state_247490[(1)]);
if((state_val_247492 === (7))){
var state_247490__$1 = state_247490;
var statearr_247520_249966 = state_247490__$1;
(statearr_247520_249966[(2)] = null);

(statearr_247520_249966[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (1))){
var state_247490__$1 = state_247490;
var statearr_247528_249968 = state_247490__$1;
(statearr_247528_249968[(2)] = null);

(statearr_247528_249968[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (4))){
var inst_247428 = (state_247490[(7)]);
var inst_247422 = (state_247490[(8)]);
var inst_247432 = (inst_247428 < inst_247422);
var state_247490__$1 = state_247490;
if(cljs.core.truth_(inst_247432)){
var statearr_247543_249969 = state_247490__$1;
(statearr_247543_249969[(1)] = (6));

} else {
var statearr_247547_249970 = state_247490__$1;
(statearr_247547_249970[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (15))){
var inst_247470 = (state_247490[(9)]);
var inst_247477 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,inst_247470);
var state_247490__$1 = state_247490;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_247490__$1,(17),out,inst_247477);
} else {
if((state_val_247492 === (13))){
var inst_247470 = (state_247490[(9)]);
var inst_247470__$1 = (state_247490[(2)]);
var inst_247471 = cljs.core.some(cljs.core.nil_QMARK_,inst_247470__$1);
var state_247490__$1 = (function (){var statearr_247583 = state_247490;
(statearr_247583[(9)] = inst_247470__$1);

return statearr_247583;
})();
if(cljs.core.truth_(inst_247471)){
var statearr_247588_249974 = state_247490__$1;
(statearr_247588_249974[(1)] = (14));

} else {
var statearr_247589_249976 = state_247490__$1;
(statearr_247589_249976[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (6))){
var state_247490__$1 = state_247490;
var statearr_247595_249978 = state_247490__$1;
(statearr_247595_249978[(2)] = null);

(statearr_247595_249978[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (17))){
var inst_247480 = (state_247490[(2)]);
var state_247490__$1 = (function (){var statearr_247603 = state_247490;
(statearr_247603[(10)] = inst_247480);

return statearr_247603;
})();
var statearr_247604_249981 = state_247490__$1;
(statearr_247604_249981[(2)] = null);

(statearr_247604_249981[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (3))){
var inst_247485 = (state_247490[(2)]);
var state_247490__$1 = state_247490;
return cljs.core.async.impl.ioc_helpers.return_chan(state_247490__$1,inst_247485);
} else {
if((state_val_247492 === (12))){
var _ = (function (){var statearr_247612 = state_247490;
(statearr_247612[(4)] = cljs.core.rest((state_247490[(4)])));

return statearr_247612;
})();
var state_247490__$1 = state_247490;
var ex247602 = (state_247490__$1[(2)]);
var statearr_247615_249982 = state_247490__$1;
(statearr_247615_249982[(5)] = ex247602);


if((ex247602 instanceof Object)){
var statearr_247618_249983 = state_247490__$1;
(statearr_247618_249983[(1)] = (11));

(statearr_247618_249983[(5)] = null);

} else {
throw ex247602;

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (2))){
var inst_247419 = cljs.core.reset_BANG_(dctr,cnt);
var inst_247422 = cnt;
var inst_247428 = (0);
var state_247490__$1 = (function (){var statearr_247625 = state_247490;
(statearr_247625[(7)] = inst_247428);

(statearr_247625[(11)] = inst_247419);

(statearr_247625[(8)] = inst_247422);

return statearr_247625;
})();
var statearr_247627_249990 = state_247490__$1;
(statearr_247627_249990[(2)] = null);

(statearr_247627_249990[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (11))){
var inst_247439 = (state_247490[(2)]);
var inst_247440 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec);
var state_247490__$1 = (function (){var statearr_247629 = state_247490;
(statearr_247629[(12)] = inst_247439);

return statearr_247629;
})();
var statearr_247635_249991 = state_247490__$1;
(statearr_247635_249991[(2)] = inst_247440);

(statearr_247635_249991[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (9))){
var inst_247428 = (state_247490[(7)]);
var _ = (function (){var statearr_247645 = state_247490;
(statearr_247645[(4)] = cljs.core.cons((12),(state_247490[(4)])));

return statearr_247645;
})();
var inst_247448 = (chs__$1.cljs$core$IFn$_invoke$arity$1 ? chs__$1.cljs$core$IFn$_invoke$arity$1(inst_247428) : chs__$1.call(null,inst_247428));
var inst_247449 = (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(inst_247428) : done.call(null,inst_247428));
var inst_247450 = cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2(inst_247448,inst_247449);
var ___$1 = (function (){var statearr_247654 = state_247490;
(statearr_247654[(4)] = cljs.core.rest((state_247490[(4)])));

return statearr_247654;
})();
var state_247490__$1 = state_247490;
var statearr_247655_249994 = state_247490__$1;
(statearr_247655_249994[(2)] = inst_247450);

(statearr_247655_249994[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (5))){
var inst_247468 = (state_247490[(2)]);
var state_247490__$1 = (function (){var statearr_247660 = state_247490;
(statearr_247660[(13)] = inst_247468);

return statearr_247660;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_247490__$1,(13),dchan);
} else {
if((state_val_247492 === (14))){
var inst_247474 = cljs.core.async.close_BANG_(out);
var state_247490__$1 = state_247490;
var statearr_247669_249997 = state_247490__$1;
(statearr_247669_249997[(2)] = inst_247474);

(statearr_247669_249997[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (16))){
var inst_247483 = (state_247490[(2)]);
var state_247490__$1 = state_247490;
var statearr_247679_249998 = state_247490__$1;
(statearr_247679_249998[(2)] = inst_247483);

(statearr_247679_249998[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (10))){
var inst_247428 = (state_247490[(7)]);
var inst_247453 = (state_247490[(2)]);
var inst_247455 = (inst_247428 + (1));
var inst_247428__$1 = inst_247455;
var state_247490__$1 = (function (){var statearr_247683 = state_247490;
(statearr_247683[(14)] = inst_247453);

(statearr_247683[(7)] = inst_247428__$1);

return statearr_247683;
})();
var statearr_247688_250006 = state_247490__$1;
(statearr_247688_250006[(2)] = null);

(statearr_247688_250006[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247492 === (8))){
var inst_247462 = (state_247490[(2)]);
var state_247490__$1 = state_247490;
var statearr_247690_250011 = state_247490__$1;
(statearr_247690_250011[(2)] = inst_247462);

(statearr_247690_250011[(1)] = (5));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_247695 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_247695[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_247695[(1)] = (1));

return statearr_247695;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_247490){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_247490);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e247697){var ex__31628__auto__ = e247697;
var statearr_247698_250025 = state_247490;
(statearr_247698_250025[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_247490[(4)]))){
var statearr_247702_250029 = state_247490;
(statearr_247702_250029[(1)] = cljs.core.first((state_247490[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250030 = state_247490;
state_247490 = G__250030;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_247490){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_247490);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_247711 = f__31898__auto__();
(statearr_247711[(6)] = c__31897__auto___249965);

return statearr_247711;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));

}

return out;
}));

(cljs.core.async.map.cljs$lang$maxFixedArity = 3);

/**
 * Takes a collection of source channels and returns a channel which
 *   contains all values taken from them. The returned channel will be
 *   unbuffered by default, or a buf-or-n can be supplied. The channel
 *   will close after all the source channels have closed.
 */
cljs.core.async.merge = (function cljs$core$async$merge(var_args){
var G__247717 = arguments.length;
switch (G__247717) {
case 1:
return cljs.core.async.merge.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.merge.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.merge.cljs$core$IFn$_invoke$arity$1 = (function (chs){
return cljs.core.async.merge.cljs$core$IFn$_invoke$arity$2(chs,null);
}));

(cljs.core.async.merge.cljs$core$IFn$_invoke$arity$2 = (function (chs,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__31897__auto___250035 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_247767){
var state_val_247768 = (state_247767[(1)]);
if((state_val_247768 === (7))){
var inst_247747 = (state_247767[(7)]);
var inst_247746 = (state_247767[(8)]);
var inst_247746__$1 = (state_247767[(2)]);
var inst_247747__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_247746__$1,(0),null);
var inst_247748 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_247746__$1,(1),null);
var inst_247749 = (inst_247747__$1 == null);
var state_247767__$1 = (function (){var statearr_247769 = state_247767;
(statearr_247769[(9)] = inst_247748);

(statearr_247769[(7)] = inst_247747__$1);

(statearr_247769[(8)] = inst_247746__$1);

return statearr_247769;
})();
if(cljs.core.truth_(inst_247749)){
var statearr_247770_250040 = state_247767__$1;
(statearr_247770_250040[(1)] = (8));

} else {
var statearr_247771_250041 = state_247767__$1;
(statearr_247771_250041[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247768 === (1))){
var inst_247729 = cljs.core.vec(chs);
var inst_247730 = inst_247729;
var state_247767__$1 = (function (){var statearr_247772 = state_247767;
(statearr_247772[(10)] = inst_247730);

return statearr_247772;
})();
var statearr_247773_250046 = state_247767__$1;
(statearr_247773_250046[(2)] = null);

(statearr_247773_250046[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247768 === (4))){
var inst_247730 = (state_247767[(10)]);
var state_247767__$1 = state_247767;
return cljs.core.async.ioc_alts_BANG_(state_247767__$1,(7),inst_247730);
} else {
if((state_val_247768 === (6))){
var inst_247763 = (state_247767[(2)]);
var state_247767__$1 = state_247767;
var statearr_247775_250050 = state_247767__$1;
(statearr_247775_250050[(2)] = inst_247763);

(statearr_247775_250050[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247768 === (3))){
var inst_247765 = (state_247767[(2)]);
var state_247767__$1 = state_247767;
return cljs.core.async.impl.ioc_helpers.return_chan(state_247767__$1,inst_247765);
} else {
if((state_val_247768 === (2))){
var inst_247730 = (state_247767[(10)]);
var inst_247735 = cljs.core.count(inst_247730);
var inst_247740 = (inst_247735 > (0));
var state_247767__$1 = state_247767;
if(cljs.core.truth_(inst_247740)){
var statearr_247777_250055 = state_247767__$1;
(statearr_247777_250055[(1)] = (4));

} else {
var statearr_247779_250056 = state_247767__$1;
(statearr_247779_250056[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247768 === (11))){
var inst_247730 = (state_247767[(10)]);
var inst_247756 = (state_247767[(2)]);
var tmp247776 = inst_247730;
var inst_247730__$1 = tmp247776;
var state_247767__$1 = (function (){var statearr_247780 = state_247767;
(statearr_247780[(10)] = inst_247730__$1);

(statearr_247780[(11)] = inst_247756);

return statearr_247780;
})();
var statearr_247781_250057 = state_247767__$1;
(statearr_247781_250057[(2)] = null);

(statearr_247781_250057[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247768 === (9))){
var inst_247747 = (state_247767[(7)]);
var state_247767__$1 = state_247767;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_247767__$1,(11),out,inst_247747);
} else {
if((state_val_247768 === (5))){
var inst_247761 = cljs.core.async.close_BANG_(out);
var state_247767__$1 = state_247767;
var statearr_247785_250065 = state_247767__$1;
(statearr_247785_250065[(2)] = inst_247761);

(statearr_247785_250065[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247768 === (10))){
var inst_247759 = (state_247767[(2)]);
var state_247767__$1 = state_247767;
var statearr_247786_250066 = state_247767__$1;
(statearr_247786_250066[(2)] = inst_247759);

(statearr_247786_250066[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247768 === (8))){
var inst_247748 = (state_247767[(9)]);
var inst_247730 = (state_247767[(10)]);
var inst_247747 = (state_247767[(7)]);
var inst_247746 = (state_247767[(8)]);
var inst_247751 = (function (){var cs = inst_247730;
var vec__247742 = inst_247746;
var v = inst_247747;
var c = inst_247748;
return (function (p1__247715_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(c,p1__247715_SHARP_);
});
})();
var inst_247752 = cljs.core.filterv(inst_247751,inst_247730);
var inst_247730__$1 = inst_247752;
var state_247767__$1 = (function (){var statearr_247787 = state_247767;
(statearr_247787[(10)] = inst_247730__$1);

return statearr_247787;
})();
var statearr_247788_250073 = state_247767__$1;
(statearr_247788_250073[(2)] = null);

(statearr_247788_250073[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_247791 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_247791[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_247791[(1)] = (1));

return statearr_247791;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_247767){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_247767);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e247793){var ex__31628__auto__ = e247793;
var statearr_247794_250080 = state_247767;
(statearr_247794_250080[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_247767[(4)]))){
var statearr_247795_250081 = state_247767;
(statearr_247795_250081[(1)] = cljs.core.first((state_247767[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250082 = state_247767;
state_247767 = G__250082;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_247767){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_247767);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_247798 = f__31898__auto__();
(statearr_247798[(6)] = c__31897__auto___250035);

return statearr_247798;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return out;
}));

(cljs.core.async.merge.cljs$lang$maxFixedArity = 2);

/**
 * Returns a channel containing the single (collection) result of the
 *   items taken from the channel conjoined to the supplied
 *   collection. ch must close before into produces a result.
 */
cljs.core.async.into = (function cljs$core$async$into(coll,ch){
return cljs.core.async.reduce(cljs.core.conj,coll,ch);
});
/**
 * Returns a channel that will return, at most, n items from ch. After n items
 * have been returned, or ch has been closed, the return chanel will close.
 * 
 *   The output channel is unbuffered by default, unless buf-or-n is given.
 */
cljs.core.async.take = (function cljs$core$async$take(var_args){
var G__247816 = arguments.length;
switch (G__247816) {
case 2:
return cljs.core.async.take.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.take.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.take.cljs$core$IFn$_invoke$arity$2 = (function (n,ch){
return cljs.core.async.take.cljs$core$IFn$_invoke$arity$3(n,ch,null);
}));

(cljs.core.async.take.cljs$core$IFn$_invoke$arity$3 = (function (n,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__31897__auto___250097 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_247850){
var state_val_247851 = (state_247850[(1)]);
if((state_val_247851 === (7))){
var inst_247831 = (state_247850[(7)]);
var inst_247831__$1 = (state_247850[(2)]);
var inst_247832 = (inst_247831__$1 == null);
var inst_247833 = cljs.core.not(inst_247832);
var state_247850__$1 = (function (){var statearr_247854 = state_247850;
(statearr_247854[(7)] = inst_247831__$1);

return statearr_247854;
})();
if(inst_247833){
var statearr_247855_250102 = state_247850__$1;
(statearr_247855_250102[(1)] = (8));

} else {
var statearr_247856_250103 = state_247850__$1;
(statearr_247856_250103[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (1))){
var inst_247824 = (0);
var state_247850__$1 = (function (){var statearr_247857 = state_247850;
(statearr_247857[(8)] = inst_247824);

return statearr_247857;
})();
var statearr_247858_250105 = state_247850__$1;
(statearr_247858_250105[(2)] = null);

(statearr_247858_250105[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (4))){
var state_247850__$1 = state_247850;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_247850__$1,(7),ch);
} else {
if((state_val_247851 === (6))){
var inst_247845 = (state_247850[(2)]);
var state_247850__$1 = state_247850;
var statearr_247859_250106 = state_247850__$1;
(statearr_247859_250106[(2)] = inst_247845);

(statearr_247859_250106[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (3))){
var inst_247847 = (state_247850[(2)]);
var inst_247848 = cljs.core.async.close_BANG_(out);
var state_247850__$1 = (function (){var statearr_247860 = state_247850;
(statearr_247860[(9)] = inst_247847);

return statearr_247860;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_247850__$1,inst_247848);
} else {
if((state_val_247851 === (2))){
var inst_247824 = (state_247850[(8)]);
var inst_247826 = (inst_247824 < n);
var state_247850__$1 = state_247850;
if(cljs.core.truth_(inst_247826)){
var statearr_247862_250109 = state_247850__$1;
(statearr_247862_250109[(1)] = (4));

} else {
var statearr_247863_250110 = state_247850__$1;
(statearr_247863_250110[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (11))){
var inst_247824 = (state_247850[(8)]);
var inst_247837 = (state_247850[(2)]);
var inst_247838 = (inst_247824 + (1));
var inst_247824__$1 = inst_247838;
var state_247850__$1 = (function (){var statearr_247865 = state_247850;
(statearr_247865[(8)] = inst_247824__$1);

(statearr_247865[(10)] = inst_247837);

return statearr_247865;
})();
var statearr_247866_250112 = state_247850__$1;
(statearr_247866_250112[(2)] = null);

(statearr_247866_250112[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (9))){
var state_247850__$1 = state_247850;
var statearr_247867_250114 = state_247850__$1;
(statearr_247867_250114[(2)] = null);

(statearr_247867_250114[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (5))){
var state_247850__$1 = state_247850;
var statearr_247872_250115 = state_247850__$1;
(statearr_247872_250115[(2)] = null);

(statearr_247872_250115[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (10))){
var inst_247842 = (state_247850[(2)]);
var state_247850__$1 = state_247850;
var statearr_247873_250116 = state_247850__$1;
(statearr_247873_250116[(2)] = inst_247842);

(statearr_247873_250116[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_247851 === (8))){
var inst_247831 = (state_247850[(7)]);
var state_247850__$1 = state_247850;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_247850__$1,(11),out,inst_247831);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_247884 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_247884[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_247884[(1)] = (1));

return statearr_247884;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_247850){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_247850);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e247885){var ex__31628__auto__ = e247885;
var statearr_247886_250117 = state_247850;
(statearr_247886_250117[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_247850[(4)]))){
var statearr_247887_250118 = state_247850;
(statearr_247887_250118[(1)] = cljs.core.first((state_247850[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250120 = state_247850;
state_247850 = G__250120;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_247850){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_247850);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_247890 = f__31898__auto__();
(statearr_247890[(6)] = c__31897__auto___250097);

return statearr_247890;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return out;
}));

(cljs.core.async.take.cljs$lang$maxFixedArity = 3);


/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async247913 = (function (f,ch,meta247897,_,fn1,meta247914){
this.f = f;
this.ch = ch;
this.meta247897 = meta247897;
this._ = _;
this.fn1 = fn1;
this.meta247914 = meta247914;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async247913.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_247915,meta247914__$1){
var self__ = this;
var _247915__$1 = this;
return (new cljs.core.async.t_cljs$core$async247913(self__.f,self__.ch,self__.meta247897,self__._,self__.fn1,meta247914__$1));
}));

(cljs.core.async.t_cljs$core$async247913.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_247915){
var self__ = this;
var _247915__$1 = this;
return self__.meta247914;
}));

(cljs.core.async.t_cljs$core$async247913.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247913.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.fn1);
}));

(cljs.core.async.t_cljs$core$async247913.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async247913.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
var f1 = cljs.core.async.impl.protocols.commit(self__.fn1);
return (function (p1__247894_SHARP_){
var G__247922 = (((p1__247894_SHARP_ == null))?null:(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(p1__247894_SHARP_) : self__.f.call(null,p1__247894_SHARP_)));
return (f1.cljs$core$IFn$_invoke$arity$1 ? f1.cljs$core$IFn$_invoke$arity$1(G__247922) : f1.call(null,G__247922));
});
}));

(cljs.core.async.t_cljs$core$async247913.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta247897","meta247897",1085949336,null),cljs.core.with_meta(new cljs.core.Symbol(null,"_","_",-1201019570,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core.async","t_cljs$core$async247896","cljs.core.async/t_cljs$core$async247896",-1620525236,null)], null)),new cljs.core.Symbol(null,"fn1","fn1",895834444,null),new cljs.core.Symbol(null,"meta247914","meta247914",1590512032,null)], null);
}));

(cljs.core.async.t_cljs$core$async247913.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async247913.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async247913");

(cljs.core.async.t_cljs$core$async247913.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async247913");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async247913.
 */
cljs.core.async.__GT_t_cljs$core$async247913 = (function cljs$core$async$__GT_t_cljs$core$async247913(f,ch,meta247897,_,fn1,meta247914){
return (new cljs.core.async.t_cljs$core$async247913(f,ch,meta247897,_,fn1,meta247914));
});



/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async247896 = (function (f,ch,meta247897){
this.f = f;
this.ch = ch;
this.meta247897 = meta247897;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_247898,meta247897__$1){
var self__ = this;
var _247898__$1 = this;
return (new cljs.core.async.t_cljs$core$async247896(self__.f,self__.ch,meta247897__$1));
}));

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_247898){
var self__ = this;
var _247898__$1 = this;
return self__.meta247897;
}));

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
var ret = cljs.core.async.impl.protocols.take_BANG_(self__.ch,(new cljs.core.async.t_cljs$core$async247913(self__.f,self__.ch,self__.meta247897,___$1,fn1,cljs.core.PersistentArrayMap.EMPTY)));
if(cljs.core.truth_((function (){var and__5000__auto__ = ret;
if(cljs.core.truth_(and__5000__auto__)){
return (!((cljs.core.deref(ret) == null)));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.async.impl.channels.box((function (){var G__247928 = cljs.core.deref(ret);
return (self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(G__247928) : self__.f.call(null,G__247928));
})());
} else {
return ret;
}
}));

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247896.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
}));

(cljs.core.async.t_cljs$core$async247896.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta247897","meta247897",1085949336,null)], null);
}));

(cljs.core.async.t_cljs$core$async247896.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async247896.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async247896");

(cljs.core.async.t_cljs$core$async247896.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async247896");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async247896.
 */
cljs.core.async.__GT_t_cljs$core$async247896 = (function cljs$core$async$__GT_t_cljs$core$async247896(f,ch,meta247897){
return (new cljs.core.async.t_cljs$core$async247896(f,ch,meta247897));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_LT_ = (function cljs$core$async$map_LT_(f,ch){
return (new cljs.core.async.t_cljs$core$async247896(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async247940 = (function (f,ch,meta247941){
this.f = f;
this.ch = ch;
this.meta247941 = meta247941;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_247942,meta247941__$1){
var self__ = this;
var _247942__$1 = this;
return (new cljs.core.async.t_cljs$core$async247940(self__.f,self__.ch,meta247941__$1));
}));

(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_247942){
var self__ = this;
var _247942__$1 = this;
return self__.meta247941;
}));

(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247940.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(val) : self__.f.call(null,val)),fn1);
}));

(cljs.core.async.t_cljs$core$async247940.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta247941","meta247941",-612826365,null)], null);
}));

(cljs.core.async.t_cljs$core$async247940.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async247940.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async247940");

(cljs.core.async.t_cljs$core$async247940.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async247940");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async247940.
 */
cljs.core.async.__GT_t_cljs$core$async247940 = (function cljs$core$async$__GT_t_cljs$core$async247940(f,ch,meta247941){
return (new cljs.core.async.t_cljs$core$async247940(f,ch,meta247941));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_GT_ = (function cljs$core$async$map_GT_(f,ch){
return (new cljs.core.async.t_cljs$core$async247940(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async247978 = (function (p,ch,meta247979){
this.p = p;
this.ch = ch;
this.meta247979 = meta247979;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_247980,meta247979__$1){
var self__ = this;
var _247980__$1 = this;
return (new cljs.core.async.t_cljs$core$async247978(self__.p,self__.ch,meta247979__$1));
}));

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_247980){
var self__ = this;
var _247980__$1 = this;
return self__.meta247979;
}));

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async247978.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.p.cljs$core$IFn$_invoke$arity$1 ? self__.p.cljs$core$IFn$_invoke$arity$1(val) : self__.p.call(null,val)))){
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
} else {
return cljs.core.async.impl.channels.box(cljs.core.not(cljs.core.async.impl.protocols.closed_QMARK_(self__.ch)));
}
}));

(cljs.core.async.t_cljs$core$async247978.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"p","p",1791580836,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta247979","meta247979",-1233491280,null)], null);
}));

(cljs.core.async.t_cljs$core$async247978.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async247978.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async247978");

(cljs.core.async.t_cljs$core$async247978.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async247978");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async247978.
 */
cljs.core.async.__GT_t_cljs$core$async247978 = (function cljs$core$async$__GT_t_cljs$core$async247978(p,ch,meta247979){
return (new cljs.core.async.t_cljs$core$async247978(p,ch,meta247979));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.filter_GT_ = (function cljs$core$async$filter_GT_(p,ch){
return (new cljs.core.async.t_cljs$core$async247978(p,ch,cljs.core.PersistentArrayMap.EMPTY));
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.remove_GT_ = (function cljs$core$async$remove_GT_(p,ch){
return cljs.core.async.filter_GT_(cljs.core.complement(p),ch);
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.filter_LT_ = (function cljs$core$async$filter_LT_(var_args){
var G__248013 = arguments.length;
switch (G__248013) {
case 2:
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$2 = (function (p,ch){
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3(p,ch,null);
}));

(cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3 = (function (p,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__31897__auto___250144 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_248047){
var state_val_248048 = (state_248047[(1)]);
if((state_val_248048 === (7))){
var inst_248039 = (state_248047[(2)]);
var state_248047__$1 = state_248047;
var statearr_248059_250146 = state_248047__$1;
(statearr_248059_250146[(2)] = inst_248039);

(statearr_248059_250146[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (1))){
var state_248047__$1 = state_248047;
var statearr_248060_250147 = state_248047__$1;
(statearr_248060_250147[(2)] = null);

(statearr_248060_250147[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (4))){
var inst_248024 = (state_248047[(7)]);
var inst_248024__$1 = (state_248047[(2)]);
var inst_248025 = (inst_248024__$1 == null);
var state_248047__$1 = (function (){var statearr_248061 = state_248047;
(statearr_248061[(7)] = inst_248024__$1);

return statearr_248061;
})();
if(cljs.core.truth_(inst_248025)){
var statearr_248066_250149 = state_248047__$1;
(statearr_248066_250149[(1)] = (5));

} else {
var statearr_248068_250150 = state_248047__$1;
(statearr_248068_250150[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (6))){
var inst_248024 = (state_248047[(7)]);
var inst_248030 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_248024) : p.call(null,inst_248024));
var state_248047__$1 = state_248047;
if(cljs.core.truth_(inst_248030)){
var statearr_248069_250151 = state_248047__$1;
(statearr_248069_250151[(1)] = (8));

} else {
var statearr_248070_250152 = state_248047__$1;
(statearr_248070_250152[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (3))){
var inst_248043 = (state_248047[(2)]);
var state_248047__$1 = state_248047;
return cljs.core.async.impl.ioc_helpers.return_chan(state_248047__$1,inst_248043);
} else {
if((state_val_248048 === (2))){
var state_248047__$1 = state_248047;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_248047__$1,(4),ch);
} else {
if((state_val_248048 === (11))){
var inst_248033 = (state_248047[(2)]);
var state_248047__$1 = state_248047;
var statearr_248077_250153 = state_248047__$1;
(statearr_248077_250153[(2)] = inst_248033);

(statearr_248077_250153[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (9))){
var state_248047__$1 = state_248047;
var statearr_248079_250154 = state_248047__$1;
(statearr_248079_250154[(2)] = null);

(statearr_248079_250154[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (5))){
var inst_248028 = cljs.core.async.close_BANG_(out);
var state_248047__$1 = state_248047;
var statearr_248080_250155 = state_248047__$1;
(statearr_248080_250155[(2)] = inst_248028);

(statearr_248080_250155[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (10))){
var inst_248036 = (state_248047[(2)]);
var state_248047__$1 = (function (){var statearr_248081 = state_248047;
(statearr_248081[(8)] = inst_248036);

return statearr_248081;
})();
var statearr_248082_250156 = state_248047__$1;
(statearr_248082_250156[(2)] = null);

(statearr_248082_250156[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248048 === (8))){
var inst_248024 = (state_248047[(7)]);
var state_248047__$1 = state_248047;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248047__$1,(11),out,inst_248024);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_248090 = [null,null,null,null,null,null,null,null,null];
(statearr_248090[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_248090[(1)] = (1));

return statearr_248090;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_248047){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_248047);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e248093){var ex__31628__auto__ = e248093;
var statearr_248094_250158 = state_248047;
(statearr_248094_250158[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_248047[(4)]))){
var statearr_248095_250159 = state_248047;
(statearr_248095_250159[(1)] = cljs.core.first((state_248047[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250161 = state_248047;
state_248047 = G__250161;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_248047){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_248047);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_248102 = f__31898__auto__();
(statearr_248102[(6)] = c__31897__auto___250144);

return statearr_248102;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return out;
}));

(cljs.core.async.filter_LT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.remove_LT_ = (function cljs$core$async$remove_LT_(var_args){
var G__248120 = arguments.length;
switch (G__248120) {
case 2:
return cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$2 = (function (p,ch){
return cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$3(p,ch,null);
}));

(cljs.core.async.remove_LT_.cljs$core$IFn$_invoke$arity$3 = (function (p,ch,buf_or_n){
return cljs.core.async.filter_LT_.cljs$core$IFn$_invoke$arity$3(cljs.core.complement(p),ch,buf_or_n);
}));

(cljs.core.async.remove_LT_.cljs$lang$maxFixedArity = 3);

cljs.core.async.mapcat_STAR_ = (function cljs$core$async$mapcat_STAR_(f,in$,out){
var c__31897__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_248216){
var state_val_248218 = (state_248216[(1)]);
if((state_val_248218 === (7))){
var inst_248211 = (state_248216[(2)]);
var state_248216__$1 = state_248216;
var statearr_248229_250172 = state_248216__$1;
(statearr_248229_250172[(2)] = inst_248211);

(statearr_248229_250172[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (20))){
var inst_248173 = (state_248216[(7)]);
var inst_248188 = (state_248216[(2)]);
var inst_248189 = cljs.core.next(inst_248173);
var inst_248149 = inst_248189;
var inst_248150 = null;
var inst_248151 = (0);
var inst_248152 = (0);
var state_248216__$1 = (function (){var statearr_248232 = state_248216;
(statearr_248232[(8)] = inst_248150);

(statearr_248232[(9)] = inst_248151);

(statearr_248232[(10)] = inst_248188);

(statearr_248232[(11)] = inst_248152);

(statearr_248232[(12)] = inst_248149);

return statearr_248232;
})();
var statearr_248234_250181 = state_248216__$1;
(statearr_248234_250181[(2)] = null);

(statearr_248234_250181[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (1))){
var state_248216__$1 = state_248216;
var statearr_248237_250182 = state_248216__$1;
(statearr_248237_250182[(2)] = null);

(statearr_248237_250182[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (4))){
var inst_248134 = (state_248216[(13)]);
var inst_248134__$1 = (state_248216[(2)]);
var inst_248139 = (inst_248134__$1 == null);
var state_248216__$1 = (function (){var statearr_248245 = state_248216;
(statearr_248245[(13)] = inst_248134__$1);

return statearr_248245;
})();
if(cljs.core.truth_(inst_248139)){
var statearr_248247_250188 = state_248216__$1;
(statearr_248247_250188[(1)] = (5));

} else {
var statearr_248248_250189 = state_248216__$1;
(statearr_248248_250189[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (15))){
var state_248216__$1 = state_248216;
var statearr_248255_250194 = state_248216__$1;
(statearr_248255_250194[(2)] = null);

(statearr_248255_250194[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (21))){
var state_248216__$1 = state_248216;
var statearr_248260_250200 = state_248216__$1;
(statearr_248260_250200[(2)] = null);

(statearr_248260_250200[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (13))){
var inst_248150 = (state_248216[(8)]);
var inst_248151 = (state_248216[(9)]);
var inst_248152 = (state_248216[(11)]);
var inst_248149 = (state_248216[(12)]);
var inst_248167 = (state_248216[(2)]);
var inst_248169 = (inst_248152 + (1));
var tmp248249 = inst_248150;
var tmp248250 = inst_248151;
var tmp248251 = inst_248149;
var inst_248149__$1 = tmp248251;
var inst_248150__$1 = tmp248249;
var inst_248151__$1 = tmp248250;
var inst_248152__$1 = inst_248169;
var state_248216__$1 = (function (){var statearr_248263 = state_248216;
(statearr_248263[(8)] = inst_248150__$1);

(statearr_248263[(9)] = inst_248151__$1);

(statearr_248263[(14)] = inst_248167);

(statearr_248263[(11)] = inst_248152__$1);

(statearr_248263[(12)] = inst_248149__$1);

return statearr_248263;
})();
var statearr_248265_250212 = state_248216__$1;
(statearr_248265_250212[(2)] = null);

(statearr_248265_250212[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (22))){
var state_248216__$1 = state_248216;
var statearr_248269_250213 = state_248216__$1;
(statearr_248269_250213[(2)] = null);

(statearr_248269_250213[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (6))){
var inst_248134 = (state_248216[(13)]);
var inst_248147 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_248134) : f.call(null,inst_248134));
var inst_248148 = cljs.core.seq(inst_248147);
var inst_248149 = inst_248148;
var inst_248150 = null;
var inst_248151 = (0);
var inst_248152 = (0);
var state_248216__$1 = (function (){var statearr_248274 = state_248216;
(statearr_248274[(8)] = inst_248150);

(statearr_248274[(9)] = inst_248151);

(statearr_248274[(11)] = inst_248152);

(statearr_248274[(12)] = inst_248149);

return statearr_248274;
})();
var statearr_248277_250214 = state_248216__$1;
(statearr_248277_250214[(2)] = null);

(statearr_248277_250214[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (17))){
var inst_248173 = (state_248216[(7)]);
var inst_248180 = cljs.core.chunk_first(inst_248173);
var inst_248181 = cljs.core.chunk_rest(inst_248173);
var inst_248182 = cljs.core.count(inst_248180);
var inst_248149 = inst_248181;
var inst_248150 = inst_248180;
var inst_248151 = inst_248182;
var inst_248152 = (0);
var state_248216__$1 = (function (){var statearr_248279 = state_248216;
(statearr_248279[(8)] = inst_248150);

(statearr_248279[(9)] = inst_248151);

(statearr_248279[(11)] = inst_248152);

(statearr_248279[(12)] = inst_248149);

return statearr_248279;
})();
var statearr_248286_250218 = state_248216__$1;
(statearr_248286_250218[(2)] = null);

(statearr_248286_250218[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (3))){
var inst_248213 = (state_248216[(2)]);
var state_248216__$1 = state_248216;
return cljs.core.async.impl.ioc_helpers.return_chan(state_248216__$1,inst_248213);
} else {
if((state_val_248218 === (12))){
var inst_248197 = (state_248216[(2)]);
var state_248216__$1 = state_248216;
var statearr_248289_250220 = state_248216__$1;
(statearr_248289_250220[(2)] = inst_248197);

(statearr_248289_250220[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (2))){
var state_248216__$1 = state_248216;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_248216__$1,(4),in$);
} else {
if((state_val_248218 === (23))){
var inst_248209 = (state_248216[(2)]);
var state_248216__$1 = state_248216;
var statearr_248294_250224 = state_248216__$1;
(statearr_248294_250224[(2)] = inst_248209);

(statearr_248294_250224[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (19))){
var inst_248192 = (state_248216[(2)]);
var state_248216__$1 = state_248216;
var statearr_248296_250225 = state_248216__$1;
(statearr_248296_250225[(2)] = inst_248192);

(statearr_248296_250225[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (11))){
var inst_248173 = (state_248216[(7)]);
var inst_248149 = (state_248216[(12)]);
var inst_248173__$1 = cljs.core.seq(inst_248149);
var state_248216__$1 = (function (){var statearr_248299 = state_248216;
(statearr_248299[(7)] = inst_248173__$1);

return statearr_248299;
})();
if(inst_248173__$1){
var statearr_248300_250226 = state_248216__$1;
(statearr_248300_250226[(1)] = (14));

} else {
var statearr_248303_250227 = state_248216__$1;
(statearr_248303_250227[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (9))){
var inst_248199 = (state_248216[(2)]);
var inst_248204 = cljs.core.async.impl.protocols.closed_QMARK_(out);
var state_248216__$1 = (function (){var statearr_248309 = state_248216;
(statearr_248309[(15)] = inst_248199);

return statearr_248309;
})();
if(cljs.core.truth_(inst_248204)){
var statearr_248312_250228 = state_248216__$1;
(statearr_248312_250228[(1)] = (21));

} else {
var statearr_248313_250229 = state_248216__$1;
(statearr_248313_250229[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (5))){
var inst_248141 = cljs.core.async.close_BANG_(out);
var state_248216__$1 = state_248216;
var statearr_248315_250230 = state_248216__$1;
(statearr_248315_250230[(2)] = inst_248141);

(statearr_248315_250230[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (14))){
var inst_248173 = (state_248216[(7)]);
var inst_248178 = cljs.core.chunked_seq_QMARK_(inst_248173);
var state_248216__$1 = state_248216;
if(inst_248178){
var statearr_248321_250231 = state_248216__$1;
(statearr_248321_250231[(1)] = (17));

} else {
var statearr_248322_250232 = state_248216__$1;
(statearr_248322_250232[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (16))){
var inst_248195 = (state_248216[(2)]);
var state_248216__$1 = state_248216;
var statearr_248331_250233 = state_248216__$1;
(statearr_248331_250233[(2)] = inst_248195);

(statearr_248331_250233[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248218 === (10))){
var inst_248150 = (state_248216[(8)]);
var inst_248152 = (state_248216[(11)]);
var inst_248161 = cljs.core._nth(inst_248150,inst_248152);
var state_248216__$1 = state_248216;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248216__$1,(13),out,inst_248161);
} else {
if((state_val_248218 === (18))){
var inst_248173 = (state_248216[(7)]);
var inst_248186 = cljs.core.first(inst_248173);
var state_248216__$1 = state_248216;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248216__$1,(20),out,inst_248186);
} else {
if((state_val_248218 === (8))){
var inst_248151 = (state_248216[(9)]);
var inst_248152 = (state_248216[(11)]);
var inst_248155 = (inst_248152 < inst_248151);
var inst_248157 = inst_248155;
var state_248216__$1 = state_248216;
if(cljs.core.truth_(inst_248157)){
var statearr_248345_250235 = state_248216__$1;
(statearr_248345_250235[(1)] = (10));

} else {
var statearr_248346_250236 = state_248216__$1;
(statearr_248346_250236[(1)] = (11));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$mapcat_STAR__$_state_machine__31625__auto__ = null;
var cljs$core$async$mapcat_STAR__$_state_machine__31625__auto____0 = (function (){
var statearr_248358 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_248358[(0)] = cljs$core$async$mapcat_STAR__$_state_machine__31625__auto__);

(statearr_248358[(1)] = (1));

return statearr_248358;
});
var cljs$core$async$mapcat_STAR__$_state_machine__31625__auto____1 = (function (state_248216){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_248216);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e248360){var ex__31628__auto__ = e248360;
var statearr_248361_250237 = state_248216;
(statearr_248361_250237[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_248216[(4)]))){
var statearr_248365_250238 = state_248216;
(statearr_248365_250238[(1)] = cljs.core.first((state_248216[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250239 = state_248216;
state_248216 = G__250239;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$mapcat_STAR__$_state_machine__31625__auto__ = function(state_248216){
switch(arguments.length){
case 0:
return cljs$core$async$mapcat_STAR__$_state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$mapcat_STAR__$_state_machine__31625__auto____1.call(this,state_248216);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mapcat_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mapcat_STAR__$_state_machine__31625__auto____0;
cljs$core$async$mapcat_STAR__$_state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mapcat_STAR__$_state_machine__31625__auto____1;
return cljs$core$async$mapcat_STAR__$_state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_248381 = f__31898__auto__();
(statearr_248381[(6)] = c__31897__auto__);

return statearr_248381;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));

return c__31897__auto__;
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.mapcat_LT_ = (function cljs$core$async$mapcat_LT_(var_args){
var G__248417 = arguments.length;
switch (G__248417) {
case 2:
return cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$2 = (function (f,in$){
return cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$3(f,in$,null);
}));

(cljs.core.async.mapcat_LT_.cljs$core$IFn$_invoke$arity$3 = (function (f,in$,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
cljs.core.async.mapcat_STAR_(f,in$,out);

return out;
}));

(cljs.core.async.mapcat_LT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.mapcat_GT_ = (function cljs$core$async$mapcat_GT_(var_args){
var G__248471 = arguments.length;
switch (G__248471) {
case 2:
return cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$2 = (function (f,out){
return cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$3(f,out,null);
}));

(cljs.core.async.mapcat_GT_.cljs$core$IFn$_invoke$arity$3 = (function (f,out,buf_or_n){
var in$ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
cljs.core.async.mapcat_STAR_(f,in$,out);

return in$;
}));

(cljs.core.async.mapcat_GT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.unique = (function cljs$core$async$unique(var_args){
var G__248500 = arguments.length;
switch (G__248500) {
case 1:
return cljs.core.async.unique.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljs.core.async.unique.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.unique.cljs$core$IFn$_invoke$arity$1 = (function (ch){
return cljs.core.async.unique.cljs$core$IFn$_invoke$arity$2(ch,null);
}));

(cljs.core.async.unique.cljs$core$IFn$_invoke$arity$2 = (function (ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__31897__auto___250257 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_248555){
var state_val_248556 = (state_248555[(1)]);
if((state_val_248556 === (7))){
var inst_248550 = (state_248555[(2)]);
var state_248555__$1 = state_248555;
var statearr_248569_250258 = state_248555__$1;
(statearr_248569_250258[(2)] = inst_248550);

(statearr_248569_250258[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248556 === (1))){
var inst_248528 = null;
var state_248555__$1 = (function (){var statearr_248574 = state_248555;
(statearr_248574[(7)] = inst_248528);

return statearr_248574;
})();
var statearr_248579_250259 = state_248555__$1;
(statearr_248579_250259[(2)] = null);

(statearr_248579_250259[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248556 === (4))){
var inst_248535 = (state_248555[(8)]);
var inst_248535__$1 = (state_248555[(2)]);
var inst_248536 = (inst_248535__$1 == null);
var inst_248537 = cljs.core.not(inst_248536);
var state_248555__$1 = (function (){var statearr_248581 = state_248555;
(statearr_248581[(8)] = inst_248535__$1);

return statearr_248581;
})();
if(inst_248537){
var statearr_248582_250260 = state_248555__$1;
(statearr_248582_250260[(1)] = (5));

} else {
var statearr_248583_250261 = state_248555__$1;
(statearr_248583_250261[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248556 === (6))){
var state_248555__$1 = state_248555;
var statearr_248585_250262 = state_248555__$1;
(statearr_248585_250262[(2)] = null);

(statearr_248585_250262[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248556 === (3))){
var inst_248552 = (state_248555[(2)]);
var inst_248553 = cljs.core.async.close_BANG_(out);
var state_248555__$1 = (function (){var statearr_248589 = state_248555;
(statearr_248589[(9)] = inst_248552);

return statearr_248589;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_248555__$1,inst_248553);
} else {
if((state_val_248556 === (2))){
var state_248555__$1 = state_248555;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_248555__$1,(4),ch);
} else {
if((state_val_248556 === (11))){
var inst_248535 = (state_248555[(8)]);
var inst_248544 = (state_248555[(2)]);
var inst_248528 = inst_248535;
var state_248555__$1 = (function (){var statearr_248593 = state_248555;
(statearr_248593[(10)] = inst_248544);

(statearr_248593[(7)] = inst_248528);

return statearr_248593;
})();
var statearr_248595_250268 = state_248555__$1;
(statearr_248595_250268[(2)] = null);

(statearr_248595_250268[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248556 === (9))){
var inst_248535 = (state_248555[(8)]);
var state_248555__$1 = state_248555;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248555__$1,(11),out,inst_248535);
} else {
if((state_val_248556 === (5))){
var inst_248528 = (state_248555[(7)]);
var inst_248535 = (state_248555[(8)]);
var inst_248539 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_248535,inst_248528);
var state_248555__$1 = state_248555;
if(inst_248539){
var statearr_248619_250269 = state_248555__$1;
(statearr_248619_250269[(1)] = (8));

} else {
var statearr_248624_250270 = state_248555__$1;
(statearr_248624_250270[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248556 === (10))){
var inst_248547 = (state_248555[(2)]);
var state_248555__$1 = state_248555;
var statearr_248626_250271 = state_248555__$1;
(statearr_248626_250271[(2)] = inst_248547);

(statearr_248626_250271[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248556 === (8))){
var inst_248528 = (state_248555[(7)]);
var tmp248608 = inst_248528;
var inst_248528__$1 = tmp248608;
var state_248555__$1 = (function (){var statearr_248629 = state_248555;
(statearr_248629[(7)] = inst_248528__$1);

return statearr_248629;
})();
var statearr_248632_250272 = state_248555__$1;
(statearr_248632_250272[(2)] = null);

(statearr_248632_250272[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_248651 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_248651[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_248651[(1)] = (1));

return statearr_248651;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_248555){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_248555);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e248660){var ex__31628__auto__ = e248660;
var statearr_248663_250273 = state_248555;
(statearr_248663_250273[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_248555[(4)]))){
var statearr_248678_250274 = state_248555;
(statearr_248678_250274[(1)] = cljs.core.first((state_248555[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250275 = state_248555;
state_248555 = G__250275;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_248555){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_248555);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_248695 = f__31898__auto__();
(statearr_248695[(6)] = c__31897__auto___250257);

return statearr_248695;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return out;
}));

(cljs.core.async.unique.cljs$lang$maxFixedArity = 2);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition = (function cljs$core$async$partition(var_args){
var G__248717 = arguments.length;
switch (G__248717) {
case 2:
return cljs.core.async.partition.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.partition.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.partition.cljs$core$IFn$_invoke$arity$2 = (function (n,ch){
return cljs.core.async.partition.cljs$core$IFn$_invoke$arity$3(n,ch,null);
}));

(cljs.core.async.partition.cljs$core$IFn$_invoke$arity$3 = (function (n,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__31897__auto___250278 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_248767){
var state_val_248768 = (state_248767[(1)]);
if((state_val_248768 === (7))){
var inst_248763 = (state_248767[(2)]);
var state_248767__$1 = state_248767;
var statearr_248770_250279 = state_248767__$1;
(statearr_248770_250279[(2)] = inst_248763);

(statearr_248770_250279[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (1))){
var inst_248727 = (new Array(n));
var inst_248731 = inst_248727;
var inst_248732 = (0);
var state_248767__$1 = (function (){var statearr_248772 = state_248767;
(statearr_248772[(7)] = inst_248732);

(statearr_248772[(8)] = inst_248731);

return statearr_248772;
})();
var statearr_248774_250280 = state_248767__$1;
(statearr_248774_250280[(2)] = null);

(statearr_248774_250280[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (4))){
var inst_248735 = (state_248767[(9)]);
var inst_248735__$1 = (state_248767[(2)]);
var inst_248736 = (inst_248735__$1 == null);
var inst_248737 = cljs.core.not(inst_248736);
var state_248767__$1 = (function (){var statearr_248775 = state_248767;
(statearr_248775[(9)] = inst_248735__$1);

return statearr_248775;
})();
if(inst_248737){
var statearr_248776_250284 = state_248767__$1;
(statearr_248776_250284[(1)] = (5));

} else {
var statearr_248777_250285 = state_248767__$1;
(statearr_248777_250285[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (15))){
var inst_248757 = (state_248767[(2)]);
var state_248767__$1 = state_248767;
var statearr_248778_250286 = state_248767__$1;
(statearr_248778_250286[(2)] = inst_248757);

(statearr_248778_250286[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (13))){
var state_248767__$1 = state_248767;
var statearr_248780_250287 = state_248767__$1;
(statearr_248780_250287[(2)] = null);

(statearr_248780_250287[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (6))){
var inst_248732 = (state_248767[(7)]);
var inst_248753 = (inst_248732 > (0));
var state_248767__$1 = state_248767;
if(cljs.core.truth_(inst_248753)){
var statearr_248785_250288 = state_248767__$1;
(statearr_248785_250288[(1)] = (12));

} else {
var statearr_248788_250289 = state_248767__$1;
(statearr_248788_250289[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (3))){
var inst_248765 = (state_248767[(2)]);
var state_248767__$1 = state_248767;
return cljs.core.async.impl.ioc_helpers.return_chan(state_248767__$1,inst_248765);
} else {
if((state_val_248768 === (12))){
var inst_248731 = (state_248767[(8)]);
var inst_248755 = cljs.core.vec(inst_248731);
var state_248767__$1 = state_248767;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248767__$1,(15),out,inst_248755);
} else {
if((state_val_248768 === (2))){
var state_248767__$1 = state_248767;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_248767__$1,(4),ch);
} else {
if((state_val_248768 === (11))){
var inst_248747 = (state_248767[(2)]);
var inst_248748 = (new Array(n));
var inst_248731 = inst_248748;
var inst_248732 = (0);
var state_248767__$1 = (function (){var statearr_248793 = state_248767;
(statearr_248793[(7)] = inst_248732);

(statearr_248793[(10)] = inst_248747);

(statearr_248793[(8)] = inst_248731);

return statearr_248793;
})();
var statearr_248794_250290 = state_248767__$1;
(statearr_248794_250290[(2)] = null);

(statearr_248794_250290[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (9))){
var inst_248731 = (state_248767[(8)]);
var inst_248745 = cljs.core.vec(inst_248731);
var state_248767__$1 = state_248767;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248767__$1,(11),out,inst_248745);
} else {
if((state_val_248768 === (5))){
var inst_248732 = (state_248767[(7)]);
var inst_248731 = (state_248767[(8)]);
var inst_248735 = (state_248767[(9)]);
var inst_248740 = (state_248767[(11)]);
var inst_248739 = (inst_248731[inst_248732] = inst_248735);
var inst_248740__$1 = (inst_248732 + (1));
var inst_248741 = (inst_248740__$1 < n);
var state_248767__$1 = (function (){var statearr_248805 = state_248767;
(statearr_248805[(12)] = inst_248739);

(statearr_248805[(11)] = inst_248740__$1);

return statearr_248805;
})();
if(cljs.core.truth_(inst_248741)){
var statearr_248806_250291 = state_248767__$1;
(statearr_248806_250291[(1)] = (8));

} else {
var statearr_248807_250292 = state_248767__$1;
(statearr_248807_250292[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (14))){
var inst_248760 = (state_248767[(2)]);
var inst_248761 = cljs.core.async.close_BANG_(out);
var state_248767__$1 = (function (){var statearr_248809 = state_248767;
(statearr_248809[(13)] = inst_248760);

return statearr_248809;
})();
var statearr_248810_250293 = state_248767__$1;
(statearr_248810_250293[(2)] = inst_248761);

(statearr_248810_250293[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (10))){
var inst_248751 = (state_248767[(2)]);
var state_248767__$1 = state_248767;
var statearr_248811_250295 = state_248767__$1;
(statearr_248811_250295[(2)] = inst_248751);

(statearr_248811_250295[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248768 === (8))){
var inst_248731 = (state_248767[(8)]);
var inst_248740 = (state_248767[(11)]);
var tmp248808 = inst_248731;
var inst_248731__$1 = tmp248808;
var inst_248732 = inst_248740;
var state_248767__$1 = (function (){var statearr_248812 = state_248767;
(statearr_248812[(7)] = inst_248732);

(statearr_248812[(8)] = inst_248731__$1);

return statearr_248812;
})();
var statearr_248814_250296 = state_248767__$1;
(statearr_248814_250296[(2)] = null);

(statearr_248814_250296[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_248825 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_248825[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_248825[(1)] = (1));

return statearr_248825;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_248767){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_248767);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e248828){var ex__31628__auto__ = e248828;
var statearr_248830_250297 = state_248767;
(statearr_248830_250297[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_248767[(4)]))){
var statearr_248831_250298 = state_248767;
(statearr_248831_250298[(1)] = cljs.core.first((state_248767[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250299 = state_248767;
state_248767 = G__250299;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_248767){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_248767);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_248836 = f__31898__auto__();
(statearr_248836[(6)] = c__31897__auto___250278);

return statearr_248836;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return out;
}));

(cljs.core.async.partition.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition_by = (function cljs$core$async$partition_by(var_args){
var G__248842 = arguments.length;
switch (G__248842) {
case 2:
return cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$2 = (function (f,ch){
return cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$3(f,ch,null);
}));

(cljs.core.async.partition_by.cljs$core$IFn$_invoke$arity$3 = (function (f,ch,buf_or_n){
var out = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1(buf_or_n);
var c__31897__auto___250303 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__31898__auto__ = (function (){var switch__31624__auto__ = (function (state_248896){
var state_val_248897 = (state_248896[(1)]);
if((state_val_248897 === (7))){
var inst_248892 = (state_248896[(2)]);
var state_248896__$1 = state_248896;
var statearr_248900_250304 = state_248896__$1;
(statearr_248900_250304[(2)] = inst_248892);

(statearr_248900_250304[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (1))){
var inst_248848 = [];
var inst_248849 = inst_248848;
var inst_248850 = new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123);
var state_248896__$1 = (function (){var statearr_248902 = state_248896;
(statearr_248902[(7)] = inst_248849);

(statearr_248902[(8)] = inst_248850);

return statearr_248902;
})();
var statearr_248903_250305 = state_248896__$1;
(statearr_248903_250305[(2)] = null);

(statearr_248903_250305[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (4))){
var inst_248856 = (state_248896[(9)]);
var inst_248856__$1 = (state_248896[(2)]);
var inst_248857 = (inst_248856__$1 == null);
var inst_248858 = cljs.core.not(inst_248857);
var state_248896__$1 = (function (){var statearr_248904 = state_248896;
(statearr_248904[(9)] = inst_248856__$1);

return statearr_248904;
})();
if(inst_248858){
var statearr_248905_250306 = state_248896__$1;
(statearr_248905_250306[(1)] = (5));

} else {
var statearr_248906_250307 = state_248896__$1;
(statearr_248906_250307[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (15))){
var inst_248849 = (state_248896[(7)]);
var inst_248884 = cljs.core.vec(inst_248849);
var state_248896__$1 = state_248896;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248896__$1,(18),out,inst_248884);
} else {
if((state_val_248897 === (13))){
var inst_248879 = (state_248896[(2)]);
var state_248896__$1 = state_248896;
var statearr_248910_250308 = state_248896__$1;
(statearr_248910_250308[(2)] = inst_248879);

(statearr_248910_250308[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (6))){
var inst_248849 = (state_248896[(7)]);
var inst_248881 = inst_248849.length;
var inst_248882 = (inst_248881 > (0));
var state_248896__$1 = state_248896;
if(cljs.core.truth_(inst_248882)){
var statearr_248911_250309 = state_248896__$1;
(statearr_248911_250309[(1)] = (15));

} else {
var statearr_248912_250310 = state_248896__$1;
(statearr_248912_250310[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (17))){
var inst_248889 = (state_248896[(2)]);
var inst_248890 = cljs.core.async.close_BANG_(out);
var state_248896__$1 = (function (){var statearr_248917 = state_248896;
(statearr_248917[(10)] = inst_248889);

return statearr_248917;
})();
var statearr_248919_250311 = state_248896__$1;
(statearr_248919_250311[(2)] = inst_248890);

(statearr_248919_250311[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (3))){
var inst_248894 = (state_248896[(2)]);
var state_248896__$1 = state_248896;
return cljs.core.async.impl.ioc_helpers.return_chan(state_248896__$1,inst_248894);
} else {
if((state_val_248897 === (12))){
var inst_248849 = (state_248896[(7)]);
var inst_248871 = cljs.core.vec(inst_248849);
var state_248896__$1 = state_248896;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_248896__$1,(14),out,inst_248871);
} else {
if((state_val_248897 === (2))){
var state_248896__$1 = state_248896;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_248896__$1,(4),ch);
} else {
if((state_val_248897 === (11))){
var inst_248860 = (state_248896[(11)]);
var inst_248856 = (state_248896[(9)]);
var inst_248849 = (state_248896[(7)]);
var inst_248868 = inst_248849.push(inst_248856);
var tmp248920 = inst_248849;
var inst_248849__$1 = tmp248920;
var inst_248850 = inst_248860;
var state_248896__$1 = (function (){var statearr_248932 = state_248896;
(statearr_248932[(7)] = inst_248849__$1);

(statearr_248932[(8)] = inst_248850);

(statearr_248932[(12)] = inst_248868);

return statearr_248932;
})();
var statearr_248935_250316 = state_248896__$1;
(statearr_248935_250316[(2)] = null);

(statearr_248935_250316[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (9))){
var inst_248850 = (state_248896[(8)]);
var inst_248864 = cljs.core.keyword_identical_QMARK_(inst_248850,new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123));
var state_248896__$1 = state_248896;
var statearr_248943_250321 = state_248896__$1;
(statearr_248943_250321[(2)] = inst_248864);

(statearr_248943_250321[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (5))){
var inst_248861 = (state_248896[(13)]);
var inst_248860 = (state_248896[(11)]);
var inst_248856 = (state_248896[(9)]);
var inst_248850 = (state_248896[(8)]);
var inst_248860__$1 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_248856) : f.call(null,inst_248856));
var inst_248861__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_248860__$1,inst_248850);
var state_248896__$1 = (function (){var statearr_248950 = state_248896;
(statearr_248950[(13)] = inst_248861__$1);

(statearr_248950[(11)] = inst_248860__$1);

return statearr_248950;
})();
if(inst_248861__$1){
var statearr_248955_250329 = state_248896__$1;
(statearr_248955_250329[(1)] = (8));

} else {
var statearr_248956_250330 = state_248896__$1;
(statearr_248956_250330[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (14))){
var inst_248860 = (state_248896[(11)]);
var inst_248856 = (state_248896[(9)]);
var inst_248873 = (state_248896[(2)]);
var inst_248875 = [];
var inst_248876 = inst_248875.push(inst_248856);
var inst_248849 = inst_248875;
var inst_248850 = inst_248860;
var state_248896__$1 = (function (){var statearr_248958 = state_248896;
(statearr_248958[(14)] = inst_248873);

(statearr_248958[(15)] = inst_248876);

(statearr_248958[(7)] = inst_248849);

(statearr_248958[(8)] = inst_248850);

return statearr_248958;
})();
var statearr_248961_250336 = state_248896__$1;
(statearr_248961_250336[(2)] = null);

(statearr_248961_250336[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (16))){
var state_248896__$1 = state_248896;
var statearr_248962_250342 = state_248896__$1;
(statearr_248962_250342[(2)] = null);

(statearr_248962_250342[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (10))){
var inst_248866 = (state_248896[(2)]);
var state_248896__$1 = state_248896;
if(cljs.core.truth_(inst_248866)){
var statearr_248966_250349 = state_248896__$1;
(statearr_248966_250349[(1)] = (11));

} else {
var statearr_248967_250351 = state_248896__$1;
(statearr_248967_250351[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (18))){
var inst_248886 = (state_248896[(2)]);
var state_248896__$1 = state_248896;
var statearr_248970_250356 = state_248896__$1;
(statearr_248970_250356[(2)] = inst_248886);

(statearr_248970_250356[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_248897 === (8))){
var inst_248861 = (state_248896[(13)]);
var state_248896__$1 = state_248896;
var statearr_248971_250358 = state_248896__$1;
(statearr_248971_250358[(2)] = inst_248861);

(statearr_248971_250358[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
}
});
return (function() {
var cljs$core$async$state_machine__31625__auto__ = null;
var cljs$core$async$state_machine__31625__auto____0 = (function (){
var statearr_248978 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_248978[(0)] = cljs$core$async$state_machine__31625__auto__);

(statearr_248978[(1)] = (1));

return statearr_248978;
});
var cljs$core$async$state_machine__31625__auto____1 = (function (state_248896){
while(true){
var ret_value__31626__auto__ = (function (){try{while(true){
var result__31627__auto__ = switch__31624__auto__(state_248896);
if(cljs.core.keyword_identical_QMARK_(result__31627__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__31627__auto__;
}
break;
}
}catch (e248980){var ex__31628__auto__ = e248980;
var statearr_248982_250359 = state_248896;
(statearr_248982_250359[(2)] = ex__31628__auto__);


if(cljs.core.seq((state_248896[(4)]))){
var statearr_248984_250360 = state_248896;
(statearr_248984_250360[(1)] = cljs.core.first((state_248896[(4)])));

} else {
throw ex__31628__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__31626__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__250361 = state_248896;
state_248896 = G__250361;
continue;
} else {
return ret_value__31626__auto__;
}
break;
}
});
cljs$core$async$state_machine__31625__auto__ = function(state_248896){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__31625__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__31625__auto____1.call(this,state_248896);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__31625__auto____0;
cljs$core$async$state_machine__31625__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__31625__auto____1;
return cljs$core$async$state_machine__31625__auto__;
})()
})();
var state__31899__auto__ = (function (){var statearr_248988 = f__31898__auto__();
(statearr_248988[(6)] = c__31897__auto___250303);

return statearr_248988;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__31899__auto__);
}));


return out;
}));

(cljs.core.async.partition_by.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=cljs.core.async.js.map
