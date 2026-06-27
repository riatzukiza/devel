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
cljs.core.async.t_cljs$core$async16995 = (function (f,blockable,meta16996){
this.f = f;
this.blockable = blockable;
this.meta16996 = meta16996;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async16995.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_16997,meta16996__$1){
var self__ = this;
var _16997__$1 = this;
return (new cljs.core.async.t_cljs$core$async16995(self__.f,self__.blockable,meta16996__$1));
}));

(cljs.core.async.t_cljs$core$async16995.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_16997){
var self__ = this;
var _16997__$1 = this;
return self__.meta16996;
}));

(cljs.core.async.t_cljs$core$async16995.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async16995.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async16995.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.blockable;
}));

(cljs.core.async.t_cljs$core$async16995.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.f;
}));

(cljs.core.async.t_cljs$core$async16995.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"blockable","blockable",-28395259,null),new cljs.core.Symbol(null,"meta16996","meta16996",-2111089523,null)], null);
}));

(cljs.core.async.t_cljs$core$async16995.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async16995.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async16995");

(cljs.core.async.t_cljs$core$async16995.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async16995");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async16995.
 */
cljs.core.async.__GT_t_cljs$core$async16995 = (function cljs$core$async$__GT_t_cljs$core$async16995(f,blockable,meta16996){
return (new cljs.core.async.t_cljs$core$async16995(f,blockable,meta16996));
});


cljs.core.async.fn_handler = (function cljs$core$async$fn_handler(var_args){
var G__16990 = arguments.length;
switch (G__16990) {
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
return (new cljs.core.async.t_cljs$core$async16995(f,blockable,cljs.core.PersistentArrayMap.EMPTY));
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
var G__17009 = arguments.length;
switch (G__17009) {
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
var G__17017 = arguments.length;
switch (G__17017) {
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
var G__17026 = arguments.length;
switch (G__17026) {
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
var val_21055 = cljs.core.deref(ret);
if(cljs.core.truth_(on_caller_QMARK_)){
(fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_21055) : fn1.call(null,val_21055));
} else {
cljs.core.async.impl.dispatch.run((function (){
return (fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_21055) : fn1.call(null,val_21055));
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
var G__17029 = arguments.length;
switch (G__17029) {
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
var n__5593__auto___21062 = n;
var x_21063 = (0);
while(true){
if((x_21063 < n__5593__auto___21062)){
(a[x_21063] = x_21063);

var G__21064 = (x_21063 + (1));
x_21063 = G__21064;
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
cljs.core.async.t_cljs$core$async17047 = (function (flag,meta17048){
this.flag = flag;
this.meta17048 = meta17048;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async17047.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_17049,meta17048__$1){
var self__ = this;
var _17049__$1 = this;
return (new cljs.core.async.t_cljs$core$async17047(self__.flag,meta17048__$1));
}));

(cljs.core.async.t_cljs$core$async17047.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_17049){
var self__ = this;
var _17049__$1 = this;
return self__.meta17048;
}));

(cljs.core.async.t_cljs$core$async17047.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async17047.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.deref(self__.flag);
}));

(cljs.core.async.t_cljs$core$async17047.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async17047.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.flag,null);

return true;
}));

(cljs.core.async.t_cljs$core$async17047.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"meta17048","meta17048",-1048261112,null)], null);
}));

(cljs.core.async.t_cljs$core$async17047.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async17047.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async17047");

(cljs.core.async.t_cljs$core$async17047.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async17047");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async17047.
 */
cljs.core.async.__GT_t_cljs$core$async17047 = (function cljs$core$async$__GT_t_cljs$core$async17047(flag,meta17048){
return (new cljs.core.async.t_cljs$core$async17047(flag,meta17048));
});


cljs.core.async.alt_flag = (function cljs$core$async$alt_flag(){
var flag = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
return (new cljs.core.async.t_cljs$core$async17047(flag,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Handler}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async17057 = (function (flag,cb,meta17058){
this.flag = flag;
this.cb = cb;
this.meta17058 = meta17058;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async17057.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_17059,meta17058__$1){
var self__ = this;
var _17059__$1 = this;
return (new cljs.core.async.t_cljs$core$async17057(self__.flag,self__.cb,meta17058__$1));
}));

(cljs.core.async.t_cljs$core$async17057.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_17059){
var self__ = this;
var _17059__$1 = this;
return self__.meta17058;
}));

(cljs.core.async.t_cljs$core$async17057.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async17057.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.flag);
}));

(cljs.core.async.t_cljs$core$async17057.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async17057.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.async.impl.protocols.commit(self__.flag);

return self__.cb;
}));

(cljs.core.async.t_cljs$core$async17057.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"flag","flag",-1565787888,null),new cljs.core.Symbol(null,"cb","cb",-2064487928,null),new cljs.core.Symbol(null,"meta17058","meta17058",1406294362,null)], null);
}));

(cljs.core.async.t_cljs$core$async17057.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async17057.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async17057");

(cljs.core.async.t_cljs$core$async17057.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async17057");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async17057.
 */
cljs.core.async.__GT_t_cljs$core$async17057 = (function cljs$core$async$__GT_t_cljs$core$async17057(flag,cb,meta17058){
return (new cljs.core.async.t_cljs$core$async17057(flag,cb,meta17058));
});


cljs.core.async.alt_handler = (function cljs$core$async$alt_handler(flag,cb){
return (new cljs.core.async.t_cljs$core$async17057(flag,cb,cljs.core.PersistentArrayMap.EMPTY));
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
return (function (p1__17067_SHARP_){
var G__17074 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__17067_SHARP_,wport], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__17074) : fret.call(null,G__17074));
});})(i,val,idx,port,wport,flag,n,idxs,priority))
));
})():cljs.core.async.impl.protocols.take_BANG_(port,cljs.core.async.alt_handler(flag,((function (i,idx,port,wport,flag,n,idxs,priority){
return (function (p1__17068_SHARP_){
var G__17075 = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [p1__17068_SHARP_,port], null);
return (fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(G__17075) : fret.call(null,G__17075));
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
var G__21070 = (i + (1));
i = G__21070;
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
var len__5726__auto___21072 = arguments.length;
var i__5727__auto___21073 = (0);
while(true){
if((i__5727__auto___21073 < len__5726__auto___21072)){
args__5732__auto__.push((arguments[i__5727__auto___21073]));

var G__21074 = (i__5727__auto___21073 + (1));
i__5727__auto___21073 = G__21074;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(cljs.core.async.alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (ports,p__17091){
var map__17092 = p__17091;
var map__17092__$1 = cljs.core.__destructure_map(map__17092);
var opts = map__17092__$1;
throw (new Error("alts! used not in (go ...) block"));
}));

(cljs.core.async.alts_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(cljs.core.async.alts_BANG_.cljs$lang$applyTo = (function (seq17083){
var G__17084 = cljs.core.first(seq17083);
var seq17083__$1 = cljs.core.next(seq17083);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__17084,seq17083__$1);
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
var G__17118 = arguments.length;
switch (G__17118) {
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
var c__16829__auto___21084 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17150){
var state_val_17151 = (state_17150[(1)]);
if((state_val_17151 === (7))){
var inst_17146 = (state_17150[(2)]);
var state_17150__$1 = state_17150;
var statearr_17158_21085 = state_17150__$1;
(statearr_17158_21085[(2)] = inst_17146);

(statearr_17158_21085[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (1))){
var state_17150__$1 = state_17150;
var statearr_17166_21087 = state_17150__$1;
(statearr_17166_21087[(2)] = null);

(statearr_17166_21087[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (4))){
var inst_17125 = (state_17150[(7)]);
var inst_17125__$1 = (state_17150[(2)]);
var inst_17127 = (inst_17125__$1 == null);
var state_17150__$1 = (function (){var statearr_17168 = state_17150;
(statearr_17168[(7)] = inst_17125__$1);

return statearr_17168;
})();
if(cljs.core.truth_(inst_17127)){
var statearr_17169_21089 = state_17150__$1;
(statearr_17169_21089[(1)] = (5));

} else {
var statearr_17170_21090 = state_17150__$1;
(statearr_17170_21090[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (13))){
var state_17150__$1 = state_17150;
var statearr_17172_21093 = state_17150__$1;
(statearr_17172_21093[(2)] = null);

(statearr_17172_21093[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (6))){
var inst_17125 = (state_17150[(7)]);
var state_17150__$1 = state_17150;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_17150__$1,(11),to,inst_17125);
} else {
if((state_val_17151 === (3))){
var inst_17148 = (state_17150[(2)]);
var state_17150__$1 = state_17150;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17150__$1,inst_17148);
} else {
if((state_val_17151 === (12))){
var state_17150__$1 = state_17150;
var statearr_17176_21099 = state_17150__$1;
(statearr_17176_21099[(2)] = null);

(statearr_17176_21099[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (2))){
var state_17150__$1 = state_17150;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17150__$1,(4),from);
} else {
if((state_val_17151 === (11))){
var inst_17139 = (state_17150[(2)]);
var state_17150__$1 = state_17150;
if(cljs.core.truth_(inst_17139)){
var statearr_17179_21101 = state_17150__$1;
(statearr_17179_21101[(1)] = (12));

} else {
var statearr_17181_21102 = state_17150__$1;
(statearr_17181_21102[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (9))){
var state_17150__$1 = state_17150;
var statearr_17182_21103 = state_17150__$1;
(statearr_17182_21103[(2)] = null);

(statearr_17182_21103[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (5))){
var state_17150__$1 = state_17150;
if(cljs.core.truth_(close_QMARK_)){
var statearr_17185_21104 = state_17150__$1;
(statearr_17185_21104[(1)] = (8));

} else {
var statearr_17186_21106 = state_17150__$1;
(statearr_17186_21106[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (14))){
var inst_17144 = (state_17150[(2)]);
var state_17150__$1 = state_17150;
var statearr_17192_21107 = state_17150__$1;
(statearr_17192_21107[(2)] = inst_17144);

(statearr_17192_21107[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (10))){
var inst_17133 = (state_17150[(2)]);
var state_17150__$1 = state_17150;
var statearr_17193_21109 = state_17150__$1;
(statearr_17193_21109[(2)] = inst_17133);

(statearr_17193_21109[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17151 === (8))){
var inst_17130 = cljs.core.async.close_BANG_(to);
var state_17150__$1 = state_17150;
var statearr_17194_21118 = state_17150__$1;
(statearr_17194_21118[(2)] = inst_17130);

(statearr_17194_21118[(1)] = (10));


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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_17195 = [null,null,null,null,null,null,null,null];
(statearr_17195[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_17195[(1)] = (1));

return statearr_17195;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_17150){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17150);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17196){var ex__15985__auto__ = e17196;
var statearr_17197_21124 = state_17150;
(statearr_17197_21124[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17150[(4)]))){
var statearr_17198_21126 = state_17150;
(statearr_17198_21126[(1)] = cljs.core.first((state_17150[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21127 = state_17150;
state_17150 = G__21127;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_17150){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_17150);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17199 = f__16830__auto__();
(statearr_17199[(6)] = c__16829__auto___21084);

return statearr_17199;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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
var process__$1 = (function (p__17202){
var vec__17203 = p__17202;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__17203,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__17203,(1),null);
var job = vec__17203;
if((job == null)){
cljs.core.async.close_BANG_(results);

return null;
} else {
var res = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$3((1),xf,ex_handler);
var c__16829__auto___21129 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17210){
var state_val_17211 = (state_17210[(1)]);
if((state_val_17211 === (1))){
var state_17210__$1 = state_17210;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_17210__$1,(2),res,v);
} else {
if((state_val_17211 === (2))){
var inst_17207 = (state_17210[(2)]);
var inst_17208 = cljs.core.async.close_BANG_(res);
var state_17210__$1 = (function (){var statearr_17216 = state_17210;
(statearr_17216[(7)] = inst_17207);

return statearr_17216;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_17210__$1,inst_17208);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0 = (function (){
var statearr_17223 = [null,null,null,null,null,null,null,null];
(statearr_17223[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__);

(statearr_17223[(1)] = (1));

return statearr_17223;
});
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1 = (function (state_17210){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17210);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17224){var ex__15985__auto__ = e17224;
var statearr_17225_21136 = state_17210;
(statearr_17225_21136[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17210[(4)]))){
var statearr_17226_21137 = state_17210;
(statearr_17226_21137[(1)] = cljs.core.first((state_17210[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21139 = state_17210;
state_17210 = G__21139;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = function(state_17210){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1.call(this,state_17210);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17227 = f__16830__auto__();
(statearr_17227[(6)] = c__16829__auto___21129);

return statearr_17227;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));


cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(p,res);

return true;
}
});
var async = (function (p__17228){
var vec__17229 = p__17228;
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__17229,(0),null);
var p = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__17229,(1),null);
var job = vec__17229;
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
var n__5593__auto___21140 = n;
var __21141 = (0);
while(true){
if((__21141 < n__5593__auto___21140)){
var G__17233_21142 = type;
var G__17233_21143__$1 = (((G__17233_21142 instanceof cljs.core.Keyword))?G__17233_21142.fqn:null);
switch (G__17233_21143__$1) {
case "compute":
var c__16829__auto___21145 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__21141,c__16829__auto___21145,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async){
return (function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = ((function (__21141,c__16829__auto___21145,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async){
return (function (state_17247){
var state_val_17248 = (state_17247[(1)]);
if((state_val_17248 === (1))){
var state_17247__$1 = state_17247;
var statearr_17254_21146 = state_17247__$1;
(statearr_17254_21146[(2)] = null);

(statearr_17254_21146[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17248 === (2))){
var state_17247__$1 = state_17247;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17247__$1,(4),jobs);
} else {
if((state_val_17248 === (3))){
var inst_17245 = (state_17247[(2)]);
var state_17247__$1 = state_17247;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17247__$1,inst_17245);
} else {
if((state_val_17248 === (4))){
var inst_17237 = (state_17247[(2)]);
var inst_17238 = process__$1(inst_17237);
var state_17247__$1 = state_17247;
if(cljs.core.truth_(inst_17238)){
var statearr_17256_21148 = state_17247__$1;
(statearr_17256_21148[(1)] = (5));

} else {
var statearr_17257_21149 = state_17247__$1;
(statearr_17257_21149[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17248 === (5))){
var state_17247__$1 = state_17247;
var statearr_17259_21156 = state_17247__$1;
(statearr_17259_21156[(2)] = null);

(statearr_17259_21156[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17248 === (6))){
var state_17247__$1 = state_17247;
var statearr_17260_21157 = state_17247__$1;
(statearr_17260_21157[(2)] = null);

(statearr_17260_21157[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17248 === (7))){
var inst_17243 = (state_17247[(2)]);
var state_17247__$1 = state_17247;
var statearr_17261_21158 = state_17247__$1;
(statearr_17261_21158[(2)] = inst_17243);

(statearr_17261_21158[(1)] = (3));


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
});})(__21141,c__16829__auto___21145,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async))
;
return ((function (__21141,switch__15981__auto__,c__16829__auto___21145,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0 = (function (){
var statearr_17262 = [null,null,null,null,null,null,null];
(statearr_17262[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__);

(statearr_17262[(1)] = (1));

return statearr_17262;
});
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1 = (function (state_17247){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17247);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17263){var ex__15985__auto__ = e17263;
var statearr_17268_21163 = state_17247;
(statearr_17268_21163[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17247[(4)]))){
var statearr_17270_21164 = state_17247;
(statearr_17270_21164[(1)] = cljs.core.first((state_17247[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21165 = state_17247;
state_17247 = G__21165;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = function(state_17247){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1.call(this,state_17247);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__;
})()
;})(__21141,switch__15981__auto__,c__16829__auto___21145,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async))
})();
var state__16831__auto__ = (function (){var statearr_17271 = f__16830__auto__();
(statearr_17271[(6)] = c__16829__auto___21145);

return statearr_17271;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
});})(__21141,c__16829__auto___21145,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async))
);


break;
case "async":
var c__16829__auto___21166 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run(((function (__21141,c__16829__auto___21166,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async){
return (function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = ((function (__21141,c__16829__auto___21166,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async){
return (function (state_17284){
var state_val_17288 = (state_17284[(1)]);
if((state_val_17288 === (1))){
var state_17284__$1 = state_17284;
var statearr_17289_21167 = state_17284__$1;
(statearr_17289_21167[(2)] = null);

(statearr_17289_21167[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17288 === (2))){
var state_17284__$1 = state_17284;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17284__$1,(4),jobs);
} else {
if((state_val_17288 === (3))){
var inst_17282 = (state_17284[(2)]);
var state_17284__$1 = state_17284;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17284__$1,inst_17282);
} else {
if((state_val_17288 === (4))){
var inst_17274 = (state_17284[(2)]);
var inst_17275 = async(inst_17274);
var state_17284__$1 = state_17284;
if(cljs.core.truth_(inst_17275)){
var statearr_17290_21173 = state_17284__$1;
(statearr_17290_21173[(1)] = (5));

} else {
var statearr_17291_21174 = state_17284__$1;
(statearr_17291_21174[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17288 === (5))){
var state_17284__$1 = state_17284;
var statearr_17292_21175 = state_17284__$1;
(statearr_17292_21175[(2)] = null);

(statearr_17292_21175[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17288 === (6))){
var state_17284__$1 = state_17284;
var statearr_17294_21176 = state_17284__$1;
(statearr_17294_21176[(2)] = null);

(statearr_17294_21176[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17288 === (7))){
var inst_17280 = (state_17284[(2)]);
var state_17284__$1 = state_17284;
var statearr_17295_21177 = state_17284__$1;
(statearr_17295_21177[(2)] = inst_17280);

(statearr_17295_21177[(1)] = (3));


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
});})(__21141,c__16829__auto___21166,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async))
;
return ((function (__21141,switch__15981__auto__,c__16829__auto___21166,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async){
return (function() {
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0 = (function (){
var statearr_17297 = [null,null,null,null,null,null,null];
(statearr_17297[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__);

(statearr_17297[(1)] = (1));

return statearr_17297;
});
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1 = (function (state_17284){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17284);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17298){var ex__15985__auto__ = e17298;
var statearr_17299_21186 = state_17284;
(statearr_17299_21186[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17284[(4)]))){
var statearr_17304_21187 = state_17284;
(statearr_17304_21187[(1)] = cljs.core.first((state_17284[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21189 = state_17284;
state_17284 = G__21189;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = function(state_17284){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1.call(this,state_17284);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__;
})()
;})(__21141,switch__15981__auto__,c__16829__auto___21166,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async))
})();
var state__16831__auto__ = (function (){var statearr_17306 = f__16830__auto__();
(statearr_17306[(6)] = c__16829__auto___21166);

return statearr_17306;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
});})(__21141,c__16829__auto___21166,G__17233_21142,G__17233_21143__$1,n__5593__auto___21140,jobs,results,process__$1,async))
);


break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__17233_21143__$1)].join('')));

}

var G__21190 = (__21141 + (1));
__21141 = G__21190;
continue;
} else {
}
break;
}

var c__16829__auto___21192 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17332){
var state_val_17333 = (state_17332[(1)]);
if((state_val_17333 === (7))){
var inst_17328 = (state_17332[(2)]);
var state_17332__$1 = state_17332;
var statearr_17346_21194 = state_17332__$1;
(statearr_17346_21194[(2)] = inst_17328);

(statearr_17346_21194[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17333 === (1))){
var state_17332__$1 = state_17332;
var statearr_17347_21198 = state_17332__$1;
(statearr_17347_21198[(2)] = null);

(statearr_17347_21198[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17333 === (4))){
var inst_17313 = (state_17332[(7)]);
var inst_17313__$1 = (state_17332[(2)]);
var inst_17314 = (inst_17313__$1 == null);
var state_17332__$1 = (function (){var statearr_17348 = state_17332;
(statearr_17348[(7)] = inst_17313__$1);

return statearr_17348;
})();
if(cljs.core.truth_(inst_17314)){
var statearr_17349_21201 = state_17332__$1;
(statearr_17349_21201[(1)] = (5));

} else {
var statearr_17350_21202 = state_17332__$1;
(statearr_17350_21202[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17333 === (6))){
var inst_17318 = (state_17332[(8)]);
var inst_17313 = (state_17332[(7)]);
var inst_17318__$1 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var inst_17319 = cljs.core.PersistentVector.EMPTY_NODE;
var inst_17320 = [inst_17313,inst_17318__$1];
var inst_17321 = (new cljs.core.PersistentVector(null,2,(5),inst_17319,inst_17320,null));
var state_17332__$1 = (function (){var statearr_17351 = state_17332;
(statearr_17351[(8)] = inst_17318__$1);

return statearr_17351;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_17332__$1,(8),jobs,inst_17321);
} else {
if((state_val_17333 === (3))){
var inst_17330 = (state_17332[(2)]);
var state_17332__$1 = state_17332;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17332__$1,inst_17330);
} else {
if((state_val_17333 === (2))){
var state_17332__$1 = state_17332;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17332__$1,(4),from);
} else {
if((state_val_17333 === (9))){
var inst_17325 = (state_17332[(2)]);
var state_17332__$1 = (function (){var statearr_17359 = state_17332;
(statearr_17359[(9)] = inst_17325);

return statearr_17359;
})();
var statearr_17360_21207 = state_17332__$1;
(statearr_17360_21207[(2)] = null);

(statearr_17360_21207[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17333 === (5))){
var inst_17316 = cljs.core.async.close_BANG_(jobs);
var state_17332__$1 = state_17332;
var statearr_17362_21209 = state_17332__$1;
(statearr_17362_21209[(2)] = inst_17316);

(statearr_17362_21209[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17333 === (8))){
var inst_17318 = (state_17332[(8)]);
var inst_17323 = (state_17332[(2)]);
var state_17332__$1 = (function (){var statearr_17363 = state_17332;
(statearr_17363[(10)] = inst_17323);

return statearr_17363;
})();
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_17332__$1,(9),results,inst_17318);
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
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0 = (function (){
var statearr_17364 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_17364[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__);

(statearr_17364[(1)] = (1));

return statearr_17364;
});
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1 = (function (state_17332){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17332);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17365){var ex__15985__auto__ = e17365;
var statearr_17366_21214 = state_17332;
(statearr_17366_21214[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17332[(4)]))){
var statearr_17367_21215 = state_17332;
(statearr_17367_21215[(1)] = cljs.core.first((state_17332[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21216 = state_17332;
state_17332 = G__21216;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = function(state_17332){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1.call(this,state_17332);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17368 = f__16830__auto__();
(statearr_17368[(6)] = c__16829__auto___21192);

return statearr_17368;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));


var c__16829__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17408){
var state_val_17409 = (state_17408[(1)]);
if((state_val_17409 === (7))){
var inst_17404 = (state_17408[(2)]);
var state_17408__$1 = state_17408;
var statearr_17413_21220 = state_17408__$1;
(statearr_17413_21220[(2)] = inst_17404);

(statearr_17413_21220[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (20))){
var state_17408__$1 = state_17408;
var statearr_17415_21224 = state_17408__$1;
(statearr_17415_21224[(2)] = null);

(statearr_17415_21224[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (1))){
var state_17408__$1 = state_17408;
var statearr_17418_21225 = state_17408__$1;
(statearr_17418_21225[(2)] = null);

(statearr_17418_21225[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (4))){
var inst_17373 = (state_17408[(7)]);
var inst_17373__$1 = (state_17408[(2)]);
var inst_17374 = (inst_17373__$1 == null);
var state_17408__$1 = (function (){var statearr_17419 = state_17408;
(statearr_17419[(7)] = inst_17373__$1);

return statearr_17419;
})();
if(cljs.core.truth_(inst_17374)){
var statearr_17420_21227 = state_17408__$1;
(statearr_17420_21227[(1)] = (5));

} else {
var statearr_17421_21229 = state_17408__$1;
(statearr_17421_21229[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (15))){
var inst_17386 = (state_17408[(8)]);
var state_17408__$1 = state_17408;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_17408__$1,(18),to,inst_17386);
} else {
if((state_val_17409 === (21))){
var inst_17399 = (state_17408[(2)]);
var state_17408__$1 = state_17408;
var statearr_17422_21232 = state_17408__$1;
(statearr_17422_21232[(2)] = inst_17399);

(statearr_17422_21232[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (13))){
var inst_17401 = (state_17408[(2)]);
var state_17408__$1 = (function (){var statearr_17423 = state_17408;
(statearr_17423[(9)] = inst_17401);

return statearr_17423;
})();
var statearr_17430_21234 = state_17408__$1;
(statearr_17430_21234[(2)] = null);

(statearr_17430_21234[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (6))){
var inst_17373 = (state_17408[(7)]);
var state_17408__$1 = state_17408;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17408__$1,(11),inst_17373);
} else {
if((state_val_17409 === (17))){
var inst_17394 = (state_17408[(2)]);
var state_17408__$1 = state_17408;
if(cljs.core.truth_(inst_17394)){
var statearr_17435_21235 = state_17408__$1;
(statearr_17435_21235[(1)] = (19));

} else {
var statearr_17436_21236 = state_17408__$1;
(statearr_17436_21236[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (3))){
var inst_17406 = (state_17408[(2)]);
var state_17408__$1 = state_17408;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17408__$1,inst_17406);
} else {
if((state_val_17409 === (12))){
var inst_17383 = (state_17408[(10)]);
var state_17408__$1 = state_17408;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17408__$1,(14),inst_17383);
} else {
if((state_val_17409 === (2))){
var state_17408__$1 = state_17408;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17408__$1,(4),results);
} else {
if((state_val_17409 === (19))){
var state_17408__$1 = state_17408;
var statearr_17437_21237 = state_17408__$1;
(statearr_17437_21237[(2)] = null);

(statearr_17437_21237[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (11))){
var inst_17383 = (state_17408[(2)]);
var state_17408__$1 = (function (){var statearr_17438 = state_17408;
(statearr_17438[(10)] = inst_17383);

return statearr_17438;
})();
var statearr_17439_21238 = state_17408__$1;
(statearr_17439_21238[(2)] = null);

(statearr_17439_21238[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (9))){
var state_17408__$1 = state_17408;
var statearr_17440_21239 = state_17408__$1;
(statearr_17440_21239[(2)] = null);

(statearr_17440_21239[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (5))){
var state_17408__$1 = state_17408;
if(cljs.core.truth_(close_QMARK_)){
var statearr_17444_21240 = state_17408__$1;
(statearr_17444_21240[(1)] = (8));

} else {
var statearr_17447_21241 = state_17408__$1;
(statearr_17447_21241[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (14))){
var inst_17388 = (state_17408[(11)]);
var inst_17386 = (state_17408[(8)]);
var inst_17386__$1 = (state_17408[(2)]);
var inst_17387 = (inst_17386__$1 == null);
var inst_17388__$1 = cljs.core.not(inst_17387);
var state_17408__$1 = (function (){var statearr_17452 = state_17408;
(statearr_17452[(11)] = inst_17388__$1);

(statearr_17452[(8)] = inst_17386__$1);

return statearr_17452;
})();
if(inst_17388__$1){
var statearr_17454_21245 = state_17408__$1;
(statearr_17454_21245[(1)] = (15));

} else {
var statearr_17455_21246 = state_17408__$1;
(statearr_17455_21246[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (16))){
var inst_17388 = (state_17408[(11)]);
var state_17408__$1 = state_17408;
var statearr_17456_21248 = state_17408__$1;
(statearr_17456_21248[(2)] = inst_17388);

(statearr_17456_21248[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (10))){
var inst_17380 = (state_17408[(2)]);
var state_17408__$1 = state_17408;
var statearr_17460_21250 = state_17408__$1;
(statearr_17460_21250[(2)] = inst_17380);

(statearr_17460_21250[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (18))){
var inst_17391 = (state_17408[(2)]);
var state_17408__$1 = state_17408;
var statearr_17461_21252 = state_17408__$1;
(statearr_17461_21252[(2)] = inst_17391);

(statearr_17461_21252[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17409 === (8))){
var inst_17377 = cljs.core.async.close_BANG_(to);
var state_17408__$1 = state_17408;
var statearr_17463_21253 = state_17408__$1;
(statearr_17463_21253[(2)] = inst_17377);

(statearr_17463_21253[(1)] = (10));


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
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = null;
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0 = (function (){
var statearr_17464 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_17464[(0)] = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__);

(statearr_17464[(1)] = (1));

return statearr_17464;
});
var cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1 = (function (state_17408){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17408);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17465){var ex__15985__auto__ = e17465;
var statearr_17466_21256 = state_17408;
(statearr_17466_21256[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17408[(4)]))){
var statearr_17467_21258 = state_17408;
(statearr_17467_21258[(1)] = cljs.core.first((state_17408[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21259 = state_17408;
state_17408 = G__21259;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__ = function(state_17408){
switch(arguments.length){
case 0:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1.call(this,state_17408);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____0;
cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$pipeline_STAR__$_state_machine__15982__auto____1;
return cljs$core$async$pipeline_STAR__$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17468 = f__16830__auto__();
(statearr_17468[(6)] = c__16829__auto__);

return statearr_17468;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));

return c__16829__auto__;
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
var G__17479 = arguments.length;
switch (G__17479) {
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
var G__17503 = arguments.length;
switch (G__17503) {
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
var G__17518 = arguments.length;
switch (G__17518) {
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
var c__16829__auto___21273 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17546){
var state_val_17547 = (state_17546[(1)]);
if((state_val_17547 === (7))){
var inst_17542 = (state_17546[(2)]);
var state_17546__$1 = state_17546;
var statearr_17548_21277 = state_17546__$1;
(statearr_17548_21277[(2)] = inst_17542);

(statearr_17548_21277[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (1))){
var state_17546__$1 = state_17546;
var statearr_17551_21278 = state_17546__$1;
(statearr_17551_21278[(2)] = null);

(statearr_17551_21278[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (4))){
var inst_17523 = (state_17546[(7)]);
var inst_17523__$1 = (state_17546[(2)]);
var inst_17524 = (inst_17523__$1 == null);
var state_17546__$1 = (function (){var statearr_17553 = state_17546;
(statearr_17553[(7)] = inst_17523__$1);

return statearr_17553;
})();
if(cljs.core.truth_(inst_17524)){
var statearr_17554_21279 = state_17546__$1;
(statearr_17554_21279[(1)] = (5));

} else {
var statearr_17555_21280 = state_17546__$1;
(statearr_17555_21280[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (13))){
var state_17546__$1 = state_17546;
var statearr_17556_21282 = state_17546__$1;
(statearr_17556_21282[(2)] = null);

(statearr_17556_21282[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (6))){
var inst_17523 = (state_17546[(7)]);
var inst_17529 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_17523) : p.call(null,inst_17523));
var state_17546__$1 = state_17546;
if(cljs.core.truth_(inst_17529)){
var statearr_17557_21286 = state_17546__$1;
(statearr_17557_21286[(1)] = (9));

} else {
var statearr_17558_21287 = state_17546__$1;
(statearr_17558_21287[(1)] = (10));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (3))){
var inst_17544 = (state_17546[(2)]);
var state_17546__$1 = state_17546;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17546__$1,inst_17544);
} else {
if((state_val_17547 === (12))){
var state_17546__$1 = state_17546;
var statearr_17560_21291 = state_17546__$1;
(statearr_17560_21291[(2)] = null);

(statearr_17560_21291[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (2))){
var state_17546__$1 = state_17546;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17546__$1,(4),ch);
} else {
if((state_val_17547 === (11))){
var inst_17523 = (state_17546[(7)]);
var inst_17533 = (state_17546[(2)]);
var state_17546__$1 = state_17546;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_17546__$1,(8),inst_17533,inst_17523);
} else {
if((state_val_17547 === (9))){
var state_17546__$1 = state_17546;
var statearr_17570_21292 = state_17546__$1;
(statearr_17570_21292[(2)] = tc);

(statearr_17570_21292[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (5))){
var inst_17526 = cljs.core.async.close_BANG_(tc);
var inst_17527 = cljs.core.async.close_BANG_(fc);
var state_17546__$1 = (function (){var statearr_17571 = state_17546;
(statearr_17571[(8)] = inst_17526);

return statearr_17571;
})();
var statearr_17572_21294 = state_17546__$1;
(statearr_17572_21294[(2)] = inst_17527);

(statearr_17572_21294[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (14))){
var inst_17540 = (state_17546[(2)]);
var state_17546__$1 = state_17546;
var statearr_17577_21295 = state_17546__$1;
(statearr_17577_21295[(2)] = inst_17540);

(statearr_17577_21295[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (10))){
var state_17546__$1 = state_17546;
var statearr_17578_21299 = state_17546__$1;
(statearr_17578_21299[(2)] = fc);

(statearr_17578_21299[(1)] = (11));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17547 === (8))){
var inst_17535 = (state_17546[(2)]);
var state_17546__$1 = state_17546;
if(cljs.core.truth_(inst_17535)){
var statearr_17579_21300 = state_17546__$1;
(statearr_17579_21300[(1)] = (12));

} else {
var statearr_17580_21301 = state_17546__$1;
(statearr_17580_21301[(1)] = (13));

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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_17581 = [null,null,null,null,null,null,null,null,null];
(statearr_17581[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_17581[(1)] = (1));

return statearr_17581;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_17546){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17546);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17582){var ex__15985__auto__ = e17582;
var statearr_17583_21306 = state_17546;
(statearr_17583_21306[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17546[(4)]))){
var statearr_17584_21307 = state_17546;
(statearr_17584_21307[(1)] = cljs.core.first((state_17546[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21309 = state_17546;
state_17546 = G__21309;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_17546){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_17546);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17586 = f__16830__auto__();
(statearr_17586[(6)] = c__16829__auto___21273);

return statearr_17586;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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
var c__16829__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17618){
var state_val_17619 = (state_17618[(1)]);
if((state_val_17619 === (7))){
var inst_17614 = (state_17618[(2)]);
var state_17618__$1 = state_17618;
var statearr_17622_21313 = state_17618__$1;
(statearr_17622_21313[(2)] = inst_17614);

(statearr_17622_21313[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17619 === (1))){
var inst_17588 = init;
var inst_17593 = inst_17588;
var state_17618__$1 = (function (){var statearr_17623 = state_17618;
(statearr_17623[(7)] = inst_17593);

return statearr_17623;
})();
var statearr_17624_21319 = state_17618__$1;
(statearr_17624_21319[(2)] = null);

(statearr_17624_21319[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17619 === (4))){
var inst_17596 = (state_17618[(8)]);
var inst_17596__$1 = (state_17618[(2)]);
var inst_17597 = (inst_17596__$1 == null);
var state_17618__$1 = (function (){var statearr_17625 = state_17618;
(statearr_17625[(8)] = inst_17596__$1);

return statearr_17625;
})();
if(cljs.core.truth_(inst_17597)){
var statearr_17626_21321 = state_17618__$1;
(statearr_17626_21321[(1)] = (5));

} else {
var statearr_17627_21322 = state_17618__$1;
(statearr_17627_21322[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17619 === (6))){
var inst_17593 = (state_17618[(7)]);
var inst_17596 = (state_17618[(8)]);
var inst_17601 = (state_17618[(9)]);
var inst_17601__$1 = (f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(inst_17593,inst_17596) : f.call(null,inst_17593,inst_17596));
var inst_17602 = cljs.core.reduced_QMARK_(inst_17601__$1);
var state_17618__$1 = (function (){var statearr_17632 = state_17618;
(statearr_17632[(9)] = inst_17601__$1);

return statearr_17632;
})();
if(inst_17602){
var statearr_17633_21325 = state_17618__$1;
(statearr_17633_21325[(1)] = (8));

} else {
var statearr_17634_21327 = state_17618__$1;
(statearr_17634_21327[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17619 === (3))){
var inst_17616 = (state_17618[(2)]);
var state_17618__$1 = state_17618;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17618__$1,inst_17616);
} else {
if((state_val_17619 === (2))){
var state_17618__$1 = state_17618;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17618__$1,(4),ch);
} else {
if((state_val_17619 === (9))){
var inst_17601 = (state_17618[(9)]);
var inst_17593 = inst_17601;
var state_17618__$1 = (function (){var statearr_17635 = state_17618;
(statearr_17635[(7)] = inst_17593);

return statearr_17635;
})();
var statearr_17636_21331 = state_17618__$1;
(statearr_17636_21331[(2)] = null);

(statearr_17636_21331[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17619 === (5))){
var inst_17593 = (state_17618[(7)]);
var state_17618__$1 = state_17618;
var statearr_17637_21334 = state_17618__$1;
(statearr_17637_21334[(2)] = inst_17593);

(statearr_17637_21334[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17619 === (10))){
var inst_17612 = (state_17618[(2)]);
var state_17618__$1 = state_17618;
var statearr_17638_21336 = state_17618__$1;
(statearr_17638_21336[(2)] = inst_17612);

(statearr_17638_21336[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17619 === (8))){
var inst_17601 = (state_17618[(9)]);
var inst_17608 = cljs.core.deref(inst_17601);
var state_17618__$1 = state_17618;
var statearr_17639_21337 = state_17618__$1;
(statearr_17639_21337[(2)] = inst_17608);

(statearr_17639_21337[(1)] = (10));


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
var cljs$core$async$reduce_$_state_machine__15982__auto__ = null;
var cljs$core$async$reduce_$_state_machine__15982__auto____0 = (function (){
var statearr_17641 = [null,null,null,null,null,null,null,null,null,null];
(statearr_17641[(0)] = cljs$core$async$reduce_$_state_machine__15982__auto__);

(statearr_17641[(1)] = (1));

return statearr_17641;
});
var cljs$core$async$reduce_$_state_machine__15982__auto____1 = (function (state_17618){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17618);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17642){var ex__15985__auto__ = e17642;
var statearr_17643_21339 = state_17618;
(statearr_17643_21339[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17618[(4)]))){
var statearr_17644_21341 = state_17618;
(statearr_17644_21341[(1)] = cljs.core.first((state_17618[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21342 = state_17618;
state_17618 = G__21342;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$reduce_$_state_machine__15982__auto__ = function(state_17618){
switch(arguments.length){
case 0:
return cljs$core$async$reduce_$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$reduce_$_state_machine__15982__auto____1.call(this,state_17618);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$reduce_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$reduce_$_state_machine__15982__auto____0;
cljs$core$async$reduce_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$reduce_$_state_machine__15982__auto____1;
return cljs$core$async$reduce_$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17649 = f__16830__auto__();
(statearr_17649[(6)] = c__16829__auto__);

return statearr_17649;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));

return c__16829__auto__;
});
/**
 * async/reduces a channel with a transformation (xform f).
 *   Returns a channel containing the result.  ch must close before
 *   transduce produces a result.
 */
cljs.core.async.transduce = (function cljs$core$async$transduce(xform,f,init,ch){
var f__$1 = (xform.cljs$core$IFn$_invoke$arity$1 ? xform.cljs$core$IFn$_invoke$arity$1(f) : xform.call(null,f));
var c__16829__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17660){
var state_val_17661 = (state_17660[(1)]);
if((state_val_17661 === (1))){
var inst_17655 = cljs.core.async.reduce(f__$1,init,ch);
var state_17660__$1 = state_17660;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17660__$1,(2),inst_17655);
} else {
if((state_val_17661 === (2))){
var inst_17657 = (state_17660[(2)]);
var inst_17658 = (f__$1.cljs$core$IFn$_invoke$arity$1 ? f__$1.cljs$core$IFn$_invoke$arity$1(inst_17657) : f__$1.call(null,inst_17657));
var state_17660__$1 = state_17660;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17660__$1,inst_17658);
} else {
return null;
}
}
});
return (function() {
var cljs$core$async$transduce_$_state_machine__15982__auto__ = null;
var cljs$core$async$transduce_$_state_machine__15982__auto____0 = (function (){
var statearr_17662 = [null,null,null,null,null,null,null];
(statearr_17662[(0)] = cljs$core$async$transduce_$_state_machine__15982__auto__);

(statearr_17662[(1)] = (1));

return statearr_17662;
});
var cljs$core$async$transduce_$_state_machine__15982__auto____1 = (function (state_17660){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17660);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17663){var ex__15985__auto__ = e17663;
var statearr_17664_21343 = state_17660;
(statearr_17664_21343[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17660[(4)]))){
var statearr_17665_21344 = state_17660;
(statearr_17665_21344[(1)] = cljs.core.first((state_17660[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21348 = state_17660;
state_17660 = G__21348;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$transduce_$_state_machine__15982__auto__ = function(state_17660){
switch(arguments.length){
case 0:
return cljs$core$async$transduce_$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$transduce_$_state_machine__15982__auto____1.call(this,state_17660);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$transduce_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$transduce_$_state_machine__15982__auto____0;
cljs$core$async$transduce_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$transduce_$_state_machine__15982__auto____1;
return cljs$core$async$transduce_$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17666 = f__16830__auto__();
(statearr_17666[(6)] = c__16829__auto__);

return statearr_17666;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));

return c__16829__auto__;
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
var G__17673 = arguments.length;
switch (G__17673) {
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
var c__16829__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17705){
var state_val_17706 = (state_17705[(1)]);
if((state_val_17706 === (7))){
var inst_17685 = (state_17705[(2)]);
var state_17705__$1 = state_17705;
var statearr_17711_21359 = state_17705__$1;
(statearr_17711_21359[(2)] = inst_17685);

(statearr_17711_21359[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (1))){
var inst_17675 = cljs.core.seq(coll);
var inst_17676 = inst_17675;
var state_17705__$1 = (function (){var statearr_17712 = state_17705;
(statearr_17712[(7)] = inst_17676);

return statearr_17712;
})();
var statearr_17713_21361 = state_17705__$1;
(statearr_17713_21361[(2)] = null);

(statearr_17713_21361[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (4))){
var inst_17676 = (state_17705[(7)]);
var inst_17683 = cljs.core.first(inst_17676);
var state_17705__$1 = state_17705;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_17705__$1,(7),ch,inst_17683);
} else {
if((state_val_17706 === (13))){
var inst_17699 = (state_17705[(2)]);
var state_17705__$1 = state_17705;
var statearr_17714_21368 = state_17705__$1;
(statearr_17714_21368[(2)] = inst_17699);

(statearr_17714_21368[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (6))){
var inst_17688 = (state_17705[(2)]);
var state_17705__$1 = state_17705;
if(cljs.core.truth_(inst_17688)){
var statearr_17716_21370 = state_17705__$1;
(statearr_17716_21370[(1)] = (8));

} else {
var statearr_17717_21371 = state_17705__$1;
(statearr_17717_21371[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (3))){
var inst_17703 = (state_17705[(2)]);
var state_17705__$1 = state_17705;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17705__$1,inst_17703);
} else {
if((state_val_17706 === (12))){
var state_17705__$1 = state_17705;
var statearr_17718_21372 = state_17705__$1;
(statearr_17718_21372[(2)] = null);

(statearr_17718_21372[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (2))){
var inst_17676 = (state_17705[(7)]);
var state_17705__$1 = state_17705;
if(cljs.core.truth_(inst_17676)){
var statearr_17719_21377 = state_17705__$1;
(statearr_17719_21377[(1)] = (4));

} else {
var statearr_17720_21378 = state_17705__$1;
(statearr_17720_21378[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (11))){
var inst_17694 = cljs.core.async.close_BANG_(ch);
var state_17705__$1 = state_17705;
var statearr_17721_21379 = state_17705__$1;
(statearr_17721_21379[(2)] = inst_17694);

(statearr_17721_21379[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (9))){
var state_17705__$1 = state_17705;
if(cljs.core.truth_(close_QMARK_)){
var statearr_17722_21381 = state_17705__$1;
(statearr_17722_21381[(1)] = (11));

} else {
var statearr_17723_21382 = state_17705__$1;
(statearr_17723_21382[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (5))){
var inst_17676 = (state_17705[(7)]);
var state_17705__$1 = state_17705;
var statearr_17724_21384 = state_17705__$1;
(statearr_17724_21384[(2)] = inst_17676);

(statearr_17724_21384[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (10))){
var inst_17701 = (state_17705[(2)]);
var state_17705__$1 = state_17705;
var statearr_17727_21385 = state_17705__$1;
(statearr_17727_21385[(2)] = inst_17701);

(statearr_17727_21385[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17706 === (8))){
var inst_17676 = (state_17705[(7)]);
var inst_17690 = cljs.core.next(inst_17676);
var inst_17676__$1 = inst_17690;
var state_17705__$1 = (function (){var statearr_17728 = state_17705;
(statearr_17728[(7)] = inst_17676__$1);

return statearr_17728;
})();
var statearr_17729_21387 = state_17705__$1;
(statearr_17729_21387[(2)] = null);

(statearr_17729_21387[(1)] = (2));


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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_17730 = [null,null,null,null,null,null,null,null];
(statearr_17730[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_17730[(1)] = (1));

return statearr_17730;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_17705){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17705);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e17731){var ex__15985__auto__ = e17731;
var statearr_17732_21401 = state_17705;
(statearr_17732_21401[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17705[(4)]))){
var statearr_17733_21408 = state_17705;
(statearr_17733_21408[(1)] = cljs.core.first((state_17705[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21410 = state_17705;
state_17705 = G__21410;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_17705){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_17705);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_17740 = f__16830__auto__();
(statearr_17740[(6)] = c__16829__auto__);

return statearr_17740;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));

return c__16829__auto__;
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
var G__17744 = arguments.length;
switch (G__17744) {
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

var cljs$core$async$Mux$muxch_STAR_$dyn_21426 = (function (_){
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
return cljs$core$async$Mux$muxch_STAR_$dyn_21426(_);
}
});


/**
 * @interface
 */
cljs.core.async.Mult = function(){};

var cljs$core$async$Mult$tap_STAR_$dyn_21429 = (function (m,ch,close_QMARK_){
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
return cljs$core$async$Mult$tap_STAR_$dyn_21429(m,ch,close_QMARK_);
}
});

var cljs$core$async$Mult$untap_STAR_$dyn_21437 = (function (m,ch){
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
return cljs$core$async$Mult$untap_STAR_$dyn_21437(m,ch);
}
});

var cljs$core$async$Mult$untap_all_STAR_$dyn_21442 = (function (m){
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
return cljs$core$async$Mult$untap_all_STAR_$dyn_21442(m);
}
});


/**
* @constructor
 * @implements {cljs.core.async.Mult}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async17766 = (function (ch,cs,meta17767){
this.ch = ch;
this.cs = cs;
this.meta17767 = meta17767;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_17768,meta17767__$1){
var self__ = this;
var _17768__$1 = this;
return (new cljs.core.async.t_cljs$core$async17766(self__.ch,self__.cs,meta17767__$1));
}));

(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_17768){
var self__ = this;
var _17768__$1 = this;
return self__.meta17767;
}));

(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$async$Mult$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$async$Mult$tap_STAR_$arity$3 = (function (_,ch__$1,close_QMARK_){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch__$1,close_QMARK_);

return null;
}));

(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$async$Mult$untap_STAR_$arity$2 = (function (_,ch__$1){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch__$1);

return null;
}));

(cljs.core.async.t_cljs$core$async17766.prototype.cljs$core$async$Mult$untap_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return null;
}));

(cljs.core.async.t_cljs$core$async17766.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"meta17767","meta17767",-981711225,null)], null);
}));

(cljs.core.async.t_cljs$core$async17766.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async17766.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async17766");

(cljs.core.async.t_cljs$core$async17766.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async17766");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async17766.
 */
cljs.core.async.__GT_t_cljs$core$async17766 = (function cljs$core$async$__GT_t_cljs$core$async17766(ch,cs,meta17767){
return (new cljs.core.async.t_cljs$core$async17766(ch,cs,meta17767));
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
var m = (new cljs.core.async.t_cljs$core$async17766(ch,cs,cljs.core.PersistentArrayMap.EMPTY));
var dchan = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
var dctr = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var done = (function (_){
if((cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec) === (0))){
return cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$2(dchan,true);
} else {
return null;
}
});
var c__16829__auto___21459 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_17923){
var state_val_17924 = (state_17923[(1)]);
if((state_val_17924 === (7))){
var inst_17916 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_17929_21461 = state_17923__$1;
(statearr_17929_21461[(2)] = inst_17916);

(statearr_17929_21461[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (20))){
var inst_17813 = (state_17923[(7)]);
var inst_17825 = cljs.core.first(inst_17813);
var inst_17826 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_17825,(0),null);
var inst_17827 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_17825,(1),null);
var state_17923__$1 = (function (){var statearr_17930 = state_17923;
(statearr_17930[(8)] = inst_17826);

return statearr_17930;
})();
if(cljs.core.truth_(inst_17827)){
var statearr_17932_21464 = state_17923__$1;
(statearr_17932_21464[(1)] = (22));

} else {
var statearr_17933_21466 = state_17923__$1;
(statearr_17933_21466[(1)] = (23));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (27))){
var inst_17775 = (state_17923[(9)]);
var inst_17862 = (state_17923[(10)]);
var inst_17867 = (state_17923[(11)]);
var inst_17860 = (state_17923[(12)]);
var inst_17867__$1 = cljs.core._nth(inst_17860,inst_17862);
var inst_17868 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_17867__$1,inst_17775,done);
var state_17923__$1 = (function (){var statearr_17937 = state_17923;
(statearr_17937[(11)] = inst_17867__$1);

return statearr_17937;
})();
if(cljs.core.truth_(inst_17868)){
var statearr_17939_21471 = state_17923__$1;
(statearr_17939_21471[(1)] = (30));

} else {
var statearr_17940_21473 = state_17923__$1;
(statearr_17940_21473[(1)] = (31));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (1))){
var state_17923__$1 = state_17923;
var statearr_17941_21475 = state_17923__$1;
(statearr_17941_21475[(2)] = null);

(statearr_17941_21475[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (24))){
var inst_17813 = (state_17923[(7)]);
var inst_17832 = (state_17923[(2)]);
var inst_17833 = cljs.core.next(inst_17813);
var inst_17789 = inst_17833;
var inst_17790 = null;
var inst_17791 = (0);
var inst_17792 = (0);
var state_17923__$1 = (function (){var statearr_17945 = state_17923;
(statearr_17945[(13)] = inst_17792);

(statearr_17945[(14)] = inst_17790);

(statearr_17945[(15)] = inst_17789);

(statearr_17945[(16)] = inst_17791);

(statearr_17945[(17)] = inst_17832);

return statearr_17945;
})();
var statearr_17946_21481 = state_17923__$1;
(statearr_17946_21481[(2)] = null);

(statearr_17946_21481[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (39))){
var state_17923__$1 = state_17923;
var statearr_17950_21483 = state_17923__$1;
(statearr_17950_21483[(2)] = null);

(statearr_17950_21483[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (4))){
var inst_17775 = (state_17923[(9)]);
var inst_17775__$1 = (state_17923[(2)]);
var inst_17779 = (inst_17775__$1 == null);
var state_17923__$1 = (function (){var statearr_17955 = state_17923;
(statearr_17955[(9)] = inst_17775__$1);

return statearr_17955;
})();
if(cljs.core.truth_(inst_17779)){
var statearr_17956_21484 = state_17923__$1;
(statearr_17956_21484[(1)] = (5));

} else {
var statearr_17957_21485 = state_17923__$1;
(statearr_17957_21485[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (15))){
var inst_17792 = (state_17923[(13)]);
var inst_17790 = (state_17923[(14)]);
var inst_17789 = (state_17923[(15)]);
var inst_17791 = (state_17923[(16)]);
var inst_17809 = (state_17923[(2)]);
var inst_17810 = (inst_17792 + (1));
var tmp17947 = inst_17790;
var tmp17948 = inst_17789;
var tmp17949 = inst_17791;
var inst_17789__$1 = tmp17948;
var inst_17790__$1 = tmp17947;
var inst_17791__$1 = tmp17949;
var inst_17792__$1 = inst_17810;
var state_17923__$1 = (function (){var statearr_17958 = state_17923;
(statearr_17958[(13)] = inst_17792__$1);

(statearr_17958[(14)] = inst_17790__$1);

(statearr_17958[(15)] = inst_17789__$1);

(statearr_17958[(16)] = inst_17791__$1);

(statearr_17958[(18)] = inst_17809);

return statearr_17958;
})();
var statearr_17959_21493 = state_17923__$1;
(statearr_17959_21493[(2)] = null);

(statearr_17959_21493[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (21))){
var inst_17836 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_17963_21495 = state_17923__$1;
(statearr_17963_21495[(2)] = inst_17836);

(statearr_17963_21495[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (31))){
var inst_17867 = (state_17923[(11)]);
var inst_17871 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_17867);
var state_17923__$1 = state_17923;
var statearr_17964_21497 = state_17923__$1;
(statearr_17964_21497[(2)] = inst_17871);

(statearr_17964_21497[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (32))){
var inst_17862 = (state_17923[(10)]);
var inst_17861 = (state_17923[(19)]);
var inst_17859 = (state_17923[(20)]);
var inst_17860 = (state_17923[(12)]);
var inst_17873 = (state_17923[(2)]);
var inst_17874 = (inst_17862 + (1));
var tmp17960 = inst_17861;
var tmp17961 = inst_17859;
var tmp17962 = inst_17860;
var inst_17859__$1 = tmp17961;
var inst_17860__$1 = tmp17962;
var inst_17861__$1 = tmp17960;
var inst_17862__$1 = inst_17874;
var state_17923__$1 = (function (){var statearr_17965 = state_17923;
(statearr_17965[(10)] = inst_17862__$1);

(statearr_17965[(19)] = inst_17861__$1);

(statearr_17965[(20)] = inst_17859__$1);

(statearr_17965[(21)] = inst_17873);

(statearr_17965[(12)] = inst_17860__$1);

return statearr_17965;
})();
var statearr_17966_21501 = state_17923__$1;
(statearr_17966_21501[(2)] = null);

(statearr_17966_21501[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (40))){
var inst_17889 = (state_17923[(22)]);
var inst_17893 = m.cljs$core$async$Mult$untap_STAR_$arity$2(null,inst_17889);
var state_17923__$1 = state_17923;
var statearr_17967_21504 = state_17923__$1;
(statearr_17967_21504[(2)] = inst_17893);

(statearr_17967_21504[(1)] = (41));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (33))){
var inst_17877 = (state_17923[(23)]);
var inst_17879 = cljs.core.chunked_seq_QMARK_(inst_17877);
var state_17923__$1 = state_17923;
if(inst_17879){
var statearr_17968_21506 = state_17923__$1;
(statearr_17968_21506[(1)] = (36));

} else {
var statearr_17969_21507 = state_17923__$1;
(statearr_17969_21507[(1)] = (37));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (13))){
var inst_17803 = (state_17923[(24)]);
var inst_17806 = cljs.core.async.close_BANG_(inst_17803);
var state_17923__$1 = state_17923;
var statearr_17971_21510 = state_17923__$1;
(statearr_17971_21510[(2)] = inst_17806);

(statearr_17971_21510[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (22))){
var inst_17826 = (state_17923[(8)]);
var inst_17829 = cljs.core.async.close_BANG_(inst_17826);
var state_17923__$1 = state_17923;
var statearr_17972_21513 = state_17923__$1;
(statearr_17972_21513[(2)] = inst_17829);

(statearr_17972_21513[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (36))){
var inst_17877 = (state_17923[(23)]);
var inst_17884 = cljs.core.chunk_first(inst_17877);
var inst_17885 = cljs.core.chunk_rest(inst_17877);
var inst_17886 = cljs.core.count(inst_17884);
var inst_17859 = inst_17885;
var inst_17860 = inst_17884;
var inst_17861 = inst_17886;
var inst_17862 = (0);
var state_17923__$1 = (function (){var statearr_17973 = state_17923;
(statearr_17973[(10)] = inst_17862);

(statearr_17973[(19)] = inst_17861);

(statearr_17973[(20)] = inst_17859);

(statearr_17973[(12)] = inst_17860);

return statearr_17973;
})();
var statearr_17974_21522 = state_17923__$1;
(statearr_17974_21522[(2)] = null);

(statearr_17974_21522[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (41))){
var inst_17877 = (state_17923[(23)]);
var inst_17895 = (state_17923[(2)]);
var inst_17896 = cljs.core.next(inst_17877);
var inst_17859 = inst_17896;
var inst_17860 = null;
var inst_17861 = (0);
var inst_17862 = (0);
var state_17923__$1 = (function (){var statearr_17975 = state_17923;
(statearr_17975[(25)] = inst_17895);

(statearr_17975[(10)] = inst_17862);

(statearr_17975[(19)] = inst_17861);

(statearr_17975[(20)] = inst_17859);

(statearr_17975[(12)] = inst_17860);

return statearr_17975;
})();
var statearr_17976_21524 = state_17923__$1;
(statearr_17976_21524[(2)] = null);

(statearr_17976_21524[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (43))){
var state_17923__$1 = state_17923;
var statearr_17977_21526 = state_17923__$1;
(statearr_17977_21526[(2)] = null);

(statearr_17977_21526[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (29))){
var inst_17904 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_17978_21529 = state_17923__$1;
(statearr_17978_21529[(2)] = inst_17904);

(statearr_17978_21529[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (44))){
var inst_17913 = (state_17923[(2)]);
var state_17923__$1 = (function (){var statearr_17979 = state_17923;
(statearr_17979[(26)] = inst_17913);

return statearr_17979;
})();
var statearr_17980_21534 = state_17923__$1;
(statearr_17980_21534[(2)] = null);

(statearr_17980_21534[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (6))){
var inst_17846 = (state_17923[(27)]);
var inst_17845 = cljs.core.deref(cs);
var inst_17846__$1 = cljs.core.keys(inst_17845);
var inst_17848 = cljs.core.count(inst_17846__$1);
var inst_17851 = cljs.core.reset_BANG_(dctr,inst_17848);
var inst_17858 = cljs.core.seq(inst_17846__$1);
var inst_17859 = inst_17858;
var inst_17860 = null;
var inst_17861 = (0);
var inst_17862 = (0);
var state_17923__$1 = (function (){var statearr_17981 = state_17923;
(statearr_17981[(27)] = inst_17846__$1);

(statearr_17981[(10)] = inst_17862);

(statearr_17981[(28)] = inst_17851);

(statearr_17981[(19)] = inst_17861);

(statearr_17981[(20)] = inst_17859);

(statearr_17981[(12)] = inst_17860);

return statearr_17981;
})();
var statearr_17982_21542 = state_17923__$1;
(statearr_17982_21542[(2)] = null);

(statearr_17982_21542[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (28))){
var inst_17877 = (state_17923[(23)]);
var inst_17859 = (state_17923[(20)]);
var inst_17877__$1 = cljs.core.seq(inst_17859);
var state_17923__$1 = (function (){var statearr_17984 = state_17923;
(statearr_17984[(23)] = inst_17877__$1);

return statearr_17984;
})();
if(inst_17877__$1){
var statearr_17985_21547 = state_17923__$1;
(statearr_17985_21547[(1)] = (33));

} else {
var statearr_17986_21549 = state_17923__$1;
(statearr_17986_21549[(1)] = (34));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (25))){
var inst_17862 = (state_17923[(10)]);
var inst_17861 = (state_17923[(19)]);
var inst_17864 = (inst_17862 < inst_17861);
var inst_17865 = inst_17864;
var state_17923__$1 = state_17923;
if(cljs.core.truth_(inst_17865)){
var statearr_17987_21552 = state_17923__$1;
(statearr_17987_21552[(1)] = (27));

} else {
var statearr_17988_21562 = state_17923__$1;
(statearr_17988_21562[(1)] = (28));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (34))){
var state_17923__$1 = state_17923;
var statearr_17989_21563 = state_17923__$1;
(statearr_17989_21563[(2)] = null);

(statearr_17989_21563[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (17))){
var state_17923__$1 = state_17923;
var statearr_17991_21578 = state_17923__$1;
(statearr_17991_21578[(2)] = null);

(statearr_17991_21578[(1)] = (18));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (3))){
var inst_17918 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
return cljs.core.async.impl.ioc_helpers.return_chan(state_17923__$1,inst_17918);
} else {
if((state_val_17924 === (12))){
var inst_17841 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_17993_21592 = state_17923__$1;
(statearr_17993_21592[(2)] = inst_17841);

(statearr_17993_21592[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (2))){
var state_17923__$1 = state_17923;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17923__$1,(4),ch);
} else {
if((state_val_17924 === (23))){
var state_17923__$1 = state_17923;
var statearr_17998_21597 = state_17923__$1;
(statearr_17998_21597[(2)] = null);

(statearr_17998_21597[(1)] = (24));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (35))){
var inst_17902 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_18001_21598 = state_17923__$1;
(statearr_18001_21598[(2)] = inst_17902);

(statearr_18001_21598[(1)] = (29));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (19))){
var inst_17813 = (state_17923[(7)]);
var inst_17817 = cljs.core.chunk_first(inst_17813);
var inst_17818 = cljs.core.chunk_rest(inst_17813);
var inst_17819 = cljs.core.count(inst_17817);
var inst_17789 = inst_17818;
var inst_17790 = inst_17817;
var inst_17791 = inst_17819;
var inst_17792 = (0);
var state_17923__$1 = (function (){var statearr_18002 = state_17923;
(statearr_18002[(13)] = inst_17792);

(statearr_18002[(14)] = inst_17790);

(statearr_18002[(15)] = inst_17789);

(statearr_18002[(16)] = inst_17791);

return statearr_18002;
})();
var statearr_18005_21611 = state_17923__$1;
(statearr_18005_21611[(2)] = null);

(statearr_18005_21611[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (11))){
var inst_17813 = (state_17923[(7)]);
var inst_17789 = (state_17923[(15)]);
var inst_17813__$1 = cljs.core.seq(inst_17789);
var state_17923__$1 = (function (){var statearr_18007 = state_17923;
(statearr_18007[(7)] = inst_17813__$1);

return statearr_18007;
})();
if(inst_17813__$1){
var statearr_18008_21612 = state_17923__$1;
(statearr_18008_21612[(1)] = (16));

} else {
var statearr_18010_21613 = state_17923__$1;
(statearr_18010_21613[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (9))){
var inst_17843 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_18013_21614 = state_17923__$1;
(statearr_18013_21614[(2)] = inst_17843);

(statearr_18013_21614[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (5))){
var inst_17787 = cljs.core.deref(cs);
var inst_17788 = cljs.core.seq(inst_17787);
var inst_17789 = inst_17788;
var inst_17790 = null;
var inst_17791 = (0);
var inst_17792 = (0);
var state_17923__$1 = (function (){var statearr_18014 = state_17923;
(statearr_18014[(13)] = inst_17792);

(statearr_18014[(14)] = inst_17790);

(statearr_18014[(15)] = inst_17789);

(statearr_18014[(16)] = inst_17791);

return statearr_18014;
})();
var statearr_18016_21628 = state_17923__$1;
(statearr_18016_21628[(2)] = null);

(statearr_18016_21628[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (14))){
var state_17923__$1 = state_17923;
var statearr_18017_21636 = state_17923__$1;
(statearr_18017_21636[(2)] = null);

(statearr_18017_21636[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (45))){
var inst_17910 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_18019_21645 = state_17923__$1;
(statearr_18019_21645[(2)] = inst_17910);

(statearr_18019_21645[(1)] = (44));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (26))){
var inst_17846 = (state_17923[(27)]);
var inst_17906 = (state_17923[(2)]);
var inst_17907 = cljs.core.seq(inst_17846);
var state_17923__$1 = (function (){var statearr_18024 = state_17923;
(statearr_18024[(29)] = inst_17906);

return statearr_18024;
})();
if(inst_17907){
var statearr_18025_21666 = state_17923__$1;
(statearr_18025_21666[(1)] = (42));

} else {
var statearr_18026_21668 = state_17923__$1;
(statearr_18026_21668[(1)] = (43));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (16))){
var inst_17813 = (state_17923[(7)]);
var inst_17815 = cljs.core.chunked_seq_QMARK_(inst_17813);
var state_17923__$1 = state_17923;
if(inst_17815){
var statearr_18030_21676 = state_17923__$1;
(statearr_18030_21676[(1)] = (19));

} else {
var statearr_18031_21686 = state_17923__$1;
(statearr_18031_21686[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (38))){
var inst_17899 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_18032_21687 = state_17923__$1;
(statearr_18032_21687[(2)] = inst_17899);

(statearr_18032_21687[(1)] = (35));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (30))){
var state_17923__$1 = state_17923;
var statearr_18033_21698 = state_17923__$1;
(statearr_18033_21698[(2)] = null);

(statearr_18033_21698[(1)] = (32));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (10))){
var inst_17792 = (state_17923[(13)]);
var inst_17790 = (state_17923[(14)]);
var inst_17802 = cljs.core._nth(inst_17790,inst_17792);
var inst_17803 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_17802,(0),null);
var inst_17804 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_17802,(1),null);
var state_17923__$1 = (function (){var statearr_18042 = state_17923;
(statearr_18042[(24)] = inst_17803);

return statearr_18042;
})();
if(cljs.core.truth_(inst_17804)){
var statearr_18043_21719 = state_17923__$1;
(statearr_18043_21719[(1)] = (13));

} else {
var statearr_18044_21726 = state_17923__$1;
(statearr_18044_21726[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (18))){
var inst_17839 = (state_17923[(2)]);
var state_17923__$1 = state_17923;
var statearr_18046_21731 = state_17923__$1;
(statearr_18046_21731[(2)] = inst_17839);

(statearr_18046_21731[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (42))){
var state_17923__$1 = state_17923;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_17923__$1,(45),dchan);
} else {
if((state_val_17924 === (37))){
var inst_17877 = (state_17923[(23)]);
var inst_17775 = (state_17923[(9)]);
var inst_17889 = (state_17923[(22)]);
var inst_17889__$1 = cljs.core.first(inst_17877);
var inst_17890 = cljs.core.async.put_BANG_.cljs$core$IFn$_invoke$arity$3(inst_17889__$1,inst_17775,done);
var state_17923__$1 = (function (){var statearr_18047 = state_17923;
(statearr_18047[(22)] = inst_17889__$1);

return statearr_18047;
})();
if(cljs.core.truth_(inst_17890)){
var statearr_18049_21742 = state_17923__$1;
(statearr_18049_21742[(1)] = (39));

} else {
var statearr_18050_21749 = state_17923__$1;
(statearr_18050_21749[(1)] = (40));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_17924 === (8))){
var inst_17792 = (state_17923[(13)]);
var inst_17791 = (state_17923[(16)]);
var inst_17795 = (inst_17792 < inst_17791);
var inst_17796 = inst_17795;
var state_17923__$1 = state_17923;
if(cljs.core.truth_(inst_17796)){
var statearr_18051_21762 = state_17923__$1;
(statearr_18051_21762[(1)] = (10));

} else {
var statearr_18052_21767 = state_17923__$1;
(statearr_18052_21767[(1)] = (11));

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
var cljs$core$async$mult_$_state_machine__15982__auto__ = null;
var cljs$core$async$mult_$_state_machine__15982__auto____0 = (function (){
var statearr_18054 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_18054[(0)] = cljs$core$async$mult_$_state_machine__15982__auto__);

(statearr_18054[(1)] = (1));

return statearr_18054;
});
var cljs$core$async$mult_$_state_machine__15982__auto____1 = (function (state_17923){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_17923);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e18056){var ex__15985__auto__ = e18056;
var statearr_18057_21780 = state_17923;
(statearr_18057_21780[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_17923[(4)]))){
var statearr_18059_21785 = state_17923;
(statearr_18059_21785[(1)] = cljs.core.first((state_17923[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21786 = state_17923;
state_17923 = G__21786;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$mult_$_state_machine__15982__auto__ = function(state_17923){
switch(arguments.length){
case 0:
return cljs$core$async$mult_$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$mult_$_state_machine__15982__auto____1.call(this,state_17923);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mult_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mult_$_state_machine__15982__auto____0;
cljs$core$async$mult_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mult_$_state_machine__15982__auto____1;
return cljs$core$async$mult_$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_18062 = f__16830__auto__();
(statearr_18062[(6)] = c__16829__auto___21459);

return statearr_18062;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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
var G__18064 = arguments.length;
switch (G__18064) {
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

var cljs$core$async$Mix$admix_STAR_$dyn_21800 = (function (m,ch){
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
return cljs$core$async$Mix$admix_STAR_$dyn_21800(m,ch);
}
});

var cljs$core$async$Mix$unmix_STAR_$dyn_21803 = (function (m,ch){
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
return cljs$core$async$Mix$unmix_STAR_$dyn_21803(m,ch);
}
});

var cljs$core$async$Mix$unmix_all_STAR_$dyn_21813 = (function (m){
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
return cljs$core$async$Mix$unmix_all_STAR_$dyn_21813(m);
}
});

var cljs$core$async$Mix$toggle_STAR_$dyn_21822 = (function (m,state_map){
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
return cljs$core$async$Mix$toggle_STAR_$dyn_21822(m,state_map);
}
});

var cljs$core$async$Mix$solo_mode_STAR_$dyn_21829 = (function (m,mode){
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
return cljs$core$async$Mix$solo_mode_STAR_$dyn_21829(m,mode);
}
});

cljs.core.async.ioc_alts_BANG_ = (function cljs$core$async$ioc_alts_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___21830 = arguments.length;
var i__5727__auto___21831 = (0);
while(true){
if((i__5727__auto___21831 < len__5726__auto___21830)){
args__5732__auto__.push((arguments[i__5727__auto___21831]));

var G__21833 = (i__5727__auto___21831 + (1));
i__5727__auto___21831 = G__21833;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((3) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((3)),(0),null)):null);
return cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),argseq__5733__auto__);
});

(cljs.core.async.ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (state,cont_block,ports,p__18087){
var map__18088 = p__18087;
var map__18088__$1 = cljs.core.__destructure_map(map__18088);
var opts = map__18088__$1;
var statearr_18090_21838 = state;
(statearr_18090_21838[(1)] = cont_block);


var temp__5804__auto__ = cljs.core.async.do_alts((function (val){
var statearr_18095_21839 = state;
(statearr_18095_21839[(2)] = val);


return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state);
}),ports,opts);
if(cljs.core.truth_(temp__5804__auto__)){
var cb = temp__5804__auto__;
var statearr_18097_21840 = state;
(statearr_18097_21840[(2)] = cljs.core.deref(cb));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
return null;
}
}));

(cljs.core.async.ioc_alts_BANG_.cljs$lang$maxFixedArity = (3));

/** @this {Function} */
(cljs.core.async.ioc_alts_BANG_.cljs$lang$applyTo = (function (seq18082){
var G__18083 = cljs.core.first(seq18082);
var seq18082__$1 = cljs.core.next(seq18082);
var G__18084 = cljs.core.first(seq18082__$1);
var seq18082__$2 = cljs.core.next(seq18082__$1);
var G__18085 = cljs.core.first(seq18082__$2);
var seq18082__$3 = cljs.core.next(seq18082__$2);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__18083,G__18084,G__18085,seq18082__$3);
}));


/**
* @constructor
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.async.Mix}
 * @implements {cljs.core.async.Mux}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async18125 = (function (change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta18126){
this.change = change;
this.solo_mode = solo_mode;
this.pick = pick;
this.cs = cs;
this.calc_state = calc_state;
this.out = out;
this.changed = changed;
this.solo_modes = solo_modes;
this.attrs = attrs;
this.meta18126 = meta18126;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_18127,meta18126__$1){
var self__ = this;
var _18127__$1 = this;
return (new cljs.core.async.t_cljs$core$async18125(self__.change,self__.solo_mode,self__.pick,self__.cs,self__.calc_state,self__.out,self__.changed,self__.solo_modes,self__.attrs,meta18126__$1));
}));

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_18127){
var self__ = this;
var _18127__$1 = this;
return self__.meta18126;
}));

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.out;
}));

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mix$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mix$admix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.cs,cljs.core.assoc,ch,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mix$unmix_STAR_$arity$2 = (function (_,ch){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.dissoc,ch);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mix$unmix_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
cljs.core.reset_BANG_(self__.cs,cljs.core.PersistentArrayMap.EMPTY);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mix$toggle_STAR_$arity$2 = (function (_,state_map){
var self__ = this;
var ___$1 = this;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.cs,cljs.core.partial.cljs$core$IFn$_invoke$arity$2(cljs.core.merge_with,cljs.core.merge),state_map);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async18125.prototype.cljs$core$async$Mix$solo_mode_STAR_$arity$2 = (function (_,mode){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.solo_modes.cljs$core$IFn$_invoke$arity$1 ? self__.solo_modes.cljs$core$IFn$_invoke$arity$1(mode) : self__.solo_modes.call(null,mode)))){
} else {
throw (new Error(["Assert failed: ",["mode must be one of: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(self__.solo_modes)].join(''),"\n","(solo-modes mode)"].join('')));
}

cljs.core.reset_BANG_(self__.solo_mode,mode);

return (self__.changed.cljs$core$IFn$_invoke$arity$0 ? self__.changed.cljs$core$IFn$_invoke$arity$0() : self__.changed.call(null));
}));

(cljs.core.async.t_cljs$core$async18125.getBasis = (function (){
return new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"change","change",477485025,null),new cljs.core.Symbol(null,"solo-mode","solo-mode",2031788074,null),new cljs.core.Symbol(null,"pick","pick",1300068175,null),new cljs.core.Symbol(null,"cs","cs",-117024463,null),new cljs.core.Symbol(null,"calc-state","calc-state",-349968968,null),new cljs.core.Symbol(null,"out","out",729986010,null),new cljs.core.Symbol(null,"changed","changed",-2083710852,null),new cljs.core.Symbol(null,"solo-modes","solo-modes",882180540,null),new cljs.core.Symbol(null,"attrs","attrs",-450137186,null),new cljs.core.Symbol(null,"meta18126","meta18126",-1109834210,null)], null);
}));

(cljs.core.async.t_cljs$core$async18125.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async18125.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async18125");

(cljs.core.async.t_cljs$core$async18125.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async18125");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async18125.
 */
cljs.core.async.__GT_t_cljs$core$async18125 = (function cljs$core$async$__GT_t_cljs$core$async18125(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta18126){
return (new cljs.core.async.t_cljs$core$async18125(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,meta18126));
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
var m = (new cljs.core.async.t_cljs$core$async18125(change,solo_mode,pick,cs,calc_state,out,changed,solo_modes,attrs,cljs.core.PersistentArrayMap.EMPTY));
var c__16829__auto___21847 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_18220){
var state_val_18222 = (state_18220[(1)]);
if((state_val_18222 === (7))){
var inst_18175 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
if(cljs.core.truth_(inst_18175)){
var statearr_18243_21849 = state_18220__$1;
(statearr_18243_21849[(1)] = (8));

} else {
var statearr_18247_21850 = state_18220__$1;
(statearr_18247_21850[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (20))){
var inst_18168 = (state_18220[(7)]);
var state_18220__$1 = state_18220;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_18220__$1,(23),out,inst_18168);
} else {
if((state_val_18222 === (1))){
var inst_18151 = calc_state();
var inst_18152 = cljs.core.__destructure_map(inst_18151);
var inst_18153 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_18152,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_18154 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_18152,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_18155 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_18152,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var inst_18156 = inst_18151;
var state_18220__$1 = (function (){var statearr_18291 = state_18220;
(statearr_18291[(8)] = inst_18156);

(statearr_18291[(9)] = inst_18155);

(statearr_18291[(10)] = inst_18154);

(statearr_18291[(11)] = inst_18153);

return statearr_18291;
})();
var statearr_18292_21854 = state_18220__$1;
(statearr_18292_21854[(2)] = null);

(statearr_18292_21854[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (24))){
var inst_18159 = (state_18220[(12)]);
var inst_18156 = inst_18159;
var state_18220__$1 = (function (){var statearr_18294 = state_18220;
(statearr_18294[(8)] = inst_18156);

return statearr_18294;
})();
var statearr_18296_21855 = state_18220__$1;
(statearr_18296_21855[(2)] = null);

(statearr_18296_21855[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (4))){
var inst_18170 = (state_18220[(13)]);
var inst_18168 = (state_18220[(7)]);
var inst_18167 = (state_18220[(2)]);
var inst_18168__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_18167,(0),null);
var inst_18169 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_18167,(1),null);
var inst_18170__$1 = (inst_18168__$1 == null);
var state_18220__$1 = (function (){var statearr_18298 = state_18220;
(statearr_18298[(14)] = inst_18169);

(statearr_18298[(13)] = inst_18170__$1);

(statearr_18298[(7)] = inst_18168__$1);

return statearr_18298;
})();
if(cljs.core.truth_(inst_18170__$1)){
var statearr_18299_21856 = state_18220__$1;
(statearr_18299_21856[(1)] = (5));

} else {
var statearr_18300_21857 = state_18220__$1;
(statearr_18300_21857[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (15))){
var inst_18160 = (state_18220[(15)]);
var inst_18191 = (state_18220[(16)]);
var inst_18191__$1 = cljs.core.empty_QMARK_(inst_18160);
var state_18220__$1 = (function (){var statearr_18303 = state_18220;
(statearr_18303[(16)] = inst_18191__$1);

return statearr_18303;
})();
if(inst_18191__$1){
var statearr_18304_21858 = state_18220__$1;
(statearr_18304_21858[(1)] = (17));

} else {
var statearr_18306_21859 = state_18220__$1;
(statearr_18306_21859[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (21))){
var inst_18159 = (state_18220[(12)]);
var inst_18156 = inst_18159;
var state_18220__$1 = (function (){var statearr_18310 = state_18220;
(statearr_18310[(8)] = inst_18156);

return statearr_18310;
})();
var statearr_18311_21860 = state_18220__$1;
(statearr_18311_21860[(2)] = null);

(statearr_18311_21860[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (13))){
var inst_18182 = (state_18220[(2)]);
var inst_18183 = calc_state();
var inst_18156 = inst_18183;
var state_18220__$1 = (function (){var statearr_18315 = state_18220;
(statearr_18315[(8)] = inst_18156);

(statearr_18315[(17)] = inst_18182);

return statearr_18315;
})();
var statearr_18317_21861 = state_18220__$1;
(statearr_18317_21861[(2)] = null);

(statearr_18317_21861[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (22))){
var inst_18213 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
var statearr_18326_21863 = state_18220__$1;
(statearr_18326_21863[(2)] = inst_18213);

(statearr_18326_21863[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (6))){
var inst_18169 = (state_18220[(14)]);
var inst_18173 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_18169,change);
var state_18220__$1 = state_18220;
var statearr_18333_21864 = state_18220__$1;
(statearr_18333_21864[(2)] = inst_18173);

(statearr_18333_21864[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (25))){
var state_18220__$1 = state_18220;
var statearr_18346_21866 = state_18220__$1;
(statearr_18346_21866[(2)] = null);

(statearr_18346_21866[(1)] = (26));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (17))){
var inst_18169 = (state_18220[(14)]);
var inst_18161 = (state_18220[(18)]);
var inst_18195 = (inst_18161.cljs$core$IFn$_invoke$arity$1 ? inst_18161.cljs$core$IFn$_invoke$arity$1(inst_18169) : inst_18161.call(null,inst_18169));
var inst_18196 = cljs.core.not(inst_18195);
var state_18220__$1 = state_18220;
var statearr_18352_21867 = state_18220__$1;
(statearr_18352_21867[(2)] = inst_18196);

(statearr_18352_21867[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (3))){
var inst_18217 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
return cljs.core.async.impl.ioc_helpers.return_chan(state_18220__$1,inst_18217);
} else {
if((state_val_18222 === (12))){
var state_18220__$1 = state_18220;
var statearr_18358_21869 = state_18220__$1;
(statearr_18358_21869[(2)] = null);

(statearr_18358_21869[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (2))){
var inst_18159 = (state_18220[(12)]);
var inst_18156 = (state_18220[(8)]);
var inst_18159__$1 = cljs.core.__destructure_map(inst_18156);
var inst_18160 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_18159__$1,new cljs.core.Keyword(null,"solos","solos",1441458643));
var inst_18161 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_18159__$1,new cljs.core.Keyword(null,"mutes","mutes",1068806309));
var inst_18162 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_18159__$1,new cljs.core.Keyword(null,"reads","reads",-1215067361));
var state_18220__$1 = (function (){var statearr_18363 = state_18220;
(statearr_18363[(12)] = inst_18159__$1);

(statearr_18363[(15)] = inst_18160);

(statearr_18363[(18)] = inst_18161);

return statearr_18363;
})();
return cljs.core.async.ioc_alts_BANG_(state_18220__$1,(4),inst_18162);
} else {
if((state_val_18222 === (23))){
var inst_18204 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
if(cljs.core.truth_(inst_18204)){
var statearr_18369_21870 = state_18220__$1;
(statearr_18369_21870[(1)] = (24));

} else {
var statearr_18371_21871 = state_18220__$1;
(statearr_18371_21871[(1)] = (25));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (19))){
var inst_18199 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
var statearr_18374_21872 = state_18220__$1;
(statearr_18374_21872[(2)] = inst_18199);

(statearr_18374_21872[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (11))){
var inst_18169 = (state_18220[(14)]);
var inst_18179 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(cs,cljs.core.dissoc,inst_18169);
var state_18220__$1 = state_18220;
var statearr_18376_21873 = state_18220__$1;
(statearr_18376_21873[(2)] = inst_18179);

(statearr_18376_21873[(1)] = (13));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (9))){
var inst_18169 = (state_18220[(14)]);
var inst_18160 = (state_18220[(15)]);
var inst_18186 = (state_18220[(19)]);
var inst_18186__$1 = (inst_18160.cljs$core$IFn$_invoke$arity$1 ? inst_18160.cljs$core$IFn$_invoke$arity$1(inst_18169) : inst_18160.call(null,inst_18169));
var state_18220__$1 = (function (){var statearr_18380 = state_18220;
(statearr_18380[(19)] = inst_18186__$1);

return statearr_18380;
})();
if(cljs.core.truth_(inst_18186__$1)){
var statearr_18381_21874 = state_18220__$1;
(statearr_18381_21874[(1)] = (14));

} else {
var statearr_18383_21879 = state_18220__$1;
(statearr_18383_21879[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (5))){
var inst_18170 = (state_18220[(13)]);
var state_18220__$1 = state_18220;
var statearr_18387_21880 = state_18220__$1;
(statearr_18387_21880[(2)] = inst_18170);

(statearr_18387_21880[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (14))){
var inst_18186 = (state_18220[(19)]);
var state_18220__$1 = state_18220;
var statearr_18390_21881 = state_18220__$1;
(statearr_18390_21881[(2)] = inst_18186);

(statearr_18390_21881[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (26))){
var inst_18209 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
var statearr_18392_21882 = state_18220__$1;
(statearr_18392_21882[(2)] = inst_18209);

(statearr_18392_21882[(1)] = (22));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (16))){
var inst_18201 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
if(cljs.core.truth_(inst_18201)){
var statearr_18399_21883 = state_18220__$1;
(statearr_18399_21883[(1)] = (20));

} else {
var statearr_18404_21884 = state_18220__$1;
(statearr_18404_21884[(1)] = (21));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (10))){
var inst_18215 = (state_18220[(2)]);
var state_18220__$1 = state_18220;
var statearr_18405_21885 = state_18220__$1;
(statearr_18405_21885[(2)] = inst_18215);

(statearr_18405_21885[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (18))){
var inst_18191 = (state_18220[(16)]);
var state_18220__$1 = state_18220;
var statearr_18409_21886 = state_18220__$1;
(statearr_18409_21886[(2)] = inst_18191);

(statearr_18409_21886[(1)] = (19));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18222 === (8))){
var inst_18168 = (state_18220[(7)]);
var inst_18177 = (inst_18168 == null);
var state_18220__$1 = state_18220;
if(cljs.core.truth_(inst_18177)){
var statearr_18414_21887 = state_18220__$1;
(statearr_18414_21887[(1)] = (11));

} else {
var statearr_18415_21888 = state_18220__$1;
(statearr_18415_21888[(1)] = (12));

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
var cljs$core$async$mix_$_state_machine__15982__auto__ = null;
var cljs$core$async$mix_$_state_machine__15982__auto____0 = (function (){
var statearr_18419 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_18419[(0)] = cljs$core$async$mix_$_state_machine__15982__auto__);

(statearr_18419[(1)] = (1));

return statearr_18419;
});
var cljs$core$async$mix_$_state_machine__15982__auto____1 = (function (state_18220){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_18220);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e18425){var ex__15985__auto__ = e18425;
var statearr_18426_21894 = state_18220;
(statearr_18426_21894[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_18220[(4)]))){
var statearr_18428_21895 = state_18220;
(statearr_18428_21895[(1)] = cljs.core.first((state_18220[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21896 = state_18220;
state_18220 = G__21896;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$mix_$_state_machine__15982__auto__ = function(state_18220){
switch(arguments.length){
case 0:
return cljs$core$async$mix_$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$mix_$_state_machine__15982__auto____1.call(this,state_18220);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mix_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mix_$_state_machine__15982__auto____0;
cljs$core$async$mix_$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mix_$_state_machine__15982__auto____1;
return cljs$core$async$mix_$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_18432 = f__16830__auto__();
(statearr_18432[(6)] = c__16829__auto___21847);

return statearr_18432;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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

var cljs$core$async$Pub$sub_STAR_$dyn_21899 = (function (p,v,ch,close_QMARK_){
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
return cljs$core$async$Pub$sub_STAR_$dyn_21899(p,v,ch,close_QMARK_);
}
});

var cljs$core$async$Pub$unsub_STAR_$dyn_21900 = (function (p,v,ch){
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
return cljs$core$async$Pub$unsub_STAR_$dyn_21900(p,v,ch);
}
});

var cljs$core$async$Pub$unsub_all_STAR_$dyn_21905 = (function() {
var G__21906 = null;
var G__21906__1 = (function (p){
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
var G__21906__2 = (function (p,v){
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
G__21906 = function(p,v){
switch(arguments.length){
case 1:
return G__21906__1.call(this,p);
case 2:
return G__21906__2.call(this,p,v);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
G__21906.cljs$core$IFn$_invoke$arity$1 = G__21906__1;
G__21906.cljs$core$IFn$_invoke$arity$2 = G__21906__2;
return G__21906;
})()
;
cljs.core.async.unsub_all_STAR_ = (function cljs$core$async$unsub_all_STAR_(var_args){
var G__18501 = arguments.length;
switch (G__18501) {
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
return cljs$core$async$Pub$unsub_all_STAR_$dyn_21905(p);
}
}));

(cljs.core.async.unsub_all_STAR_.cljs$core$IFn$_invoke$arity$2 = (function (p,v){
if((((!((p == null)))) && ((!((p.cljs$core$async$Pub$unsub_all_STAR_$arity$2 == null)))))){
return p.cljs$core$async$Pub$unsub_all_STAR_$arity$2(p,v);
} else {
return cljs$core$async$Pub$unsub_all_STAR_$dyn_21905(p,v);
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
cljs.core.async.t_cljs$core$async18536 = (function (ch,topic_fn,buf_fn,mults,ensure_mult,meta18537){
this.ch = ch;
this.topic_fn = topic_fn;
this.buf_fn = buf_fn;
this.mults = mults;
this.ensure_mult = ensure_mult;
this.meta18537 = meta18537;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_18538,meta18537__$1){
var self__ = this;
var _18538__$1 = this;
return (new cljs.core.async.t_cljs$core$async18536(self__.ch,self__.topic_fn,self__.buf_fn,self__.mults,self__.ensure_mult,meta18537__$1));
}));

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_18538){
var self__ = this;
var _18538__$1 = this;
return self__.meta18537;
}));

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$async$Mux$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$async$Mux$muxch_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return self__.ch;
}));

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$async$Pub$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$async$Pub$sub_STAR_$arity$4 = (function (p,topic,ch__$1,close_QMARK_){
var self__ = this;
var p__$1 = this;
var m = (self__.ensure_mult.cljs$core$IFn$_invoke$arity$1 ? self__.ensure_mult.cljs$core$IFn$_invoke$arity$1(topic) : self__.ensure_mult.call(null,topic));
return cljs.core.async.tap.cljs$core$IFn$_invoke$arity$3(m,ch__$1,close_QMARK_);
}));

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$async$Pub$unsub_STAR_$arity$3 = (function (p,topic,ch__$1){
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

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.reset_BANG_(self__.mults,cljs.core.PersistentArrayMap.EMPTY);
}));

(cljs.core.async.t_cljs$core$async18536.prototype.cljs$core$async$Pub$unsub_all_STAR_$arity$2 = (function (_,topic){
var self__ = this;
var ___$1 = this;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.mults,cljs.core.dissoc,topic);
}));

(cljs.core.async.t_cljs$core$async18536.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"topic-fn","topic-fn",-862449736,null),new cljs.core.Symbol(null,"buf-fn","buf-fn",-1200281591,null),new cljs.core.Symbol(null,"mults","mults",-461114485,null),new cljs.core.Symbol(null,"ensure-mult","ensure-mult",1796584816,null),new cljs.core.Symbol(null,"meta18537","meta18537",-879905453,null)], null);
}));

(cljs.core.async.t_cljs$core$async18536.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async18536.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async18536");

(cljs.core.async.t_cljs$core$async18536.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async18536");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async18536.
 */
cljs.core.async.__GT_t_cljs$core$async18536 = (function cljs$core$async$__GT_t_cljs$core$async18536(ch,topic_fn,buf_fn,mults,ensure_mult,meta18537){
return (new cljs.core.async.t_cljs$core$async18536(ch,topic_fn,buf_fn,mults,ensure_mult,meta18537));
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
var G__18521 = arguments.length;
switch (G__18521) {
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
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(mults,(function (p1__18514_SHARP_){
if(cljs.core.truth_((p1__18514_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__18514_SHARP_.cljs$core$IFn$_invoke$arity$1(topic) : p1__18514_SHARP_.call(null,topic)))){
return p1__18514_SHARP_;
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__18514_SHARP_,topic,cljs.core.async.mult(cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((buf_fn.cljs$core$IFn$_invoke$arity$1 ? buf_fn.cljs$core$IFn$_invoke$arity$1(topic) : buf_fn.call(null,topic)))));
}
})),topic);
}
});
var p = (new cljs.core.async.t_cljs$core$async18536(ch,topic_fn,buf_fn,mults,ensure_mult,cljs.core.PersistentArrayMap.EMPTY));
var c__16829__auto___21920 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_18699){
var state_val_18701 = (state_18699[(1)]);
if((state_val_18701 === (7))){
var inst_18691 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
var statearr_18720_21922 = state_18699__$1;
(statearr_18720_21922[(2)] = inst_18691);

(statearr_18720_21922[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (20))){
var state_18699__$1 = state_18699;
var statearr_18723_21923 = state_18699__$1;
(statearr_18723_21923[(2)] = null);

(statearr_18723_21923[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (1))){
var state_18699__$1 = state_18699;
var statearr_18726_21928 = state_18699__$1;
(statearr_18726_21928[(2)] = null);

(statearr_18726_21928[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (24))){
var inst_18667 = (state_18699[(7)]);
var inst_18682 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(mults,cljs.core.dissoc,inst_18667);
var state_18699__$1 = state_18699;
var statearr_18738_21930 = state_18699__$1;
(statearr_18738_21930[(2)] = inst_18682);

(statearr_18738_21930[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (4))){
var inst_18606 = (state_18699[(8)]);
var inst_18606__$1 = (state_18699[(2)]);
var inst_18607 = (inst_18606__$1 == null);
var state_18699__$1 = (function (){var statearr_18751 = state_18699;
(statearr_18751[(8)] = inst_18606__$1);

return statearr_18751;
})();
if(cljs.core.truth_(inst_18607)){
var statearr_18753_21932 = state_18699__$1;
(statearr_18753_21932[(1)] = (5));

} else {
var statearr_18754_21933 = state_18699__$1;
(statearr_18754_21933[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (15))){
var inst_18656 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
var statearr_18769_21935 = state_18699__$1;
(statearr_18769_21935[(2)] = inst_18656);

(statearr_18769_21935[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (21))){
var inst_18688 = (state_18699[(2)]);
var state_18699__$1 = (function (){var statearr_18778 = state_18699;
(statearr_18778[(9)] = inst_18688);

return statearr_18778;
})();
var statearr_18780_21936 = state_18699__$1;
(statearr_18780_21936[(2)] = null);

(statearr_18780_21936[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (13))){
var inst_18635 = (state_18699[(10)]);
var inst_18637 = cljs.core.chunked_seq_QMARK_(inst_18635);
var state_18699__$1 = state_18699;
if(inst_18637){
var statearr_18792_21942 = state_18699__$1;
(statearr_18792_21942[(1)] = (16));

} else {
var statearr_18793_21943 = state_18699__$1;
(statearr_18793_21943[(1)] = (17));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (22))){
var inst_18677 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
if(cljs.core.truth_(inst_18677)){
var statearr_18796_21944 = state_18699__$1;
(statearr_18796_21944[(1)] = (23));

} else {
var statearr_18799_21945 = state_18699__$1;
(statearr_18799_21945[(1)] = (24));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (6))){
var inst_18606 = (state_18699[(8)]);
var inst_18671 = (state_18699[(11)]);
var inst_18667 = (state_18699[(7)]);
var inst_18667__$1 = (topic_fn.cljs$core$IFn$_invoke$arity$1 ? topic_fn.cljs$core$IFn$_invoke$arity$1(inst_18606) : topic_fn.call(null,inst_18606));
var inst_18670 = cljs.core.deref(mults);
var inst_18671__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(inst_18670,inst_18667__$1);
var state_18699__$1 = (function (){var statearr_18801 = state_18699;
(statearr_18801[(11)] = inst_18671__$1);

(statearr_18801[(7)] = inst_18667__$1);

return statearr_18801;
})();
if(cljs.core.truth_(inst_18671__$1)){
var statearr_18803_21946 = state_18699__$1;
(statearr_18803_21946[(1)] = (19));

} else {
var statearr_18804_21948 = state_18699__$1;
(statearr_18804_21948[(1)] = (20));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (25))){
var inst_18684 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
var statearr_18809_21949 = state_18699__$1;
(statearr_18809_21949[(2)] = inst_18684);

(statearr_18809_21949[(1)] = (21));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (17))){
var inst_18635 = (state_18699[(10)]);
var inst_18647 = cljs.core.first(inst_18635);
var inst_18648 = cljs.core.async.muxch_STAR_(inst_18647);
var inst_18649 = cljs.core.async.close_BANG_(inst_18648);
var inst_18650 = cljs.core.next(inst_18635);
var inst_18620 = inst_18650;
var inst_18621 = null;
var inst_18622 = (0);
var inst_18623 = (0);
var state_18699__$1 = (function (){var statearr_18818 = state_18699;
(statearr_18818[(12)] = inst_18649);

(statearr_18818[(13)] = inst_18621);

(statearr_18818[(14)] = inst_18623);

(statearr_18818[(15)] = inst_18622);

(statearr_18818[(16)] = inst_18620);

return statearr_18818;
})();
var statearr_18831_21950 = state_18699__$1;
(statearr_18831_21950[(2)] = null);

(statearr_18831_21950[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (3))){
var inst_18693 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
return cljs.core.async.impl.ioc_helpers.return_chan(state_18699__$1,inst_18693);
} else {
if((state_val_18701 === (12))){
var inst_18658 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
var statearr_18844_21951 = state_18699__$1;
(statearr_18844_21951[(2)] = inst_18658);

(statearr_18844_21951[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (2))){
var state_18699__$1 = state_18699;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_18699__$1,(4),ch);
} else {
if((state_val_18701 === (23))){
var state_18699__$1 = state_18699;
var statearr_18869_21953 = state_18699__$1;
(statearr_18869_21953[(2)] = null);

(statearr_18869_21953[(1)] = (25));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (19))){
var inst_18606 = (state_18699[(8)]);
var inst_18671 = (state_18699[(11)]);
var inst_18675 = cljs.core.async.muxch_STAR_(inst_18671);
var state_18699__$1 = state_18699;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_18699__$1,(22),inst_18675,inst_18606);
} else {
if((state_val_18701 === (11))){
var inst_18635 = (state_18699[(10)]);
var inst_18620 = (state_18699[(16)]);
var inst_18635__$1 = cljs.core.seq(inst_18620);
var state_18699__$1 = (function (){var statearr_18912 = state_18699;
(statearr_18912[(10)] = inst_18635__$1);

return statearr_18912;
})();
if(inst_18635__$1){
var statearr_18913_21954 = state_18699__$1;
(statearr_18913_21954[(1)] = (13));

} else {
var statearr_18915_21955 = state_18699__$1;
(statearr_18915_21955[(1)] = (14));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (9))){
var inst_18662 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
var statearr_18924_21956 = state_18699__$1;
(statearr_18924_21956[(2)] = inst_18662);

(statearr_18924_21956[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (5))){
var inst_18617 = cljs.core.deref(mults);
var inst_18618 = cljs.core.vals(inst_18617);
var inst_18619 = cljs.core.seq(inst_18618);
var inst_18620 = inst_18619;
var inst_18621 = null;
var inst_18622 = (0);
var inst_18623 = (0);
var state_18699__$1 = (function (){var statearr_18930 = state_18699;
(statearr_18930[(13)] = inst_18621);

(statearr_18930[(14)] = inst_18623);

(statearr_18930[(15)] = inst_18622);

(statearr_18930[(16)] = inst_18620);

return statearr_18930;
})();
var statearr_18933_21957 = state_18699__$1;
(statearr_18933_21957[(2)] = null);

(statearr_18933_21957[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (14))){
var state_18699__$1 = state_18699;
var statearr_18938_21959 = state_18699__$1;
(statearr_18938_21959[(2)] = null);

(statearr_18938_21959[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (16))){
var inst_18635 = (state_18699[(10)]);
var inst_18639 = cljs.core.chunk_first(inst_18635);
var inst_18640 = cljs.core.chunk_rest(inst_18635);
var inst_18641 = cljs.core.count(inst_18639);
var inst_18620 = inst_18640;
var inst_18621 = inst_18639;
var inst_18622 = inst_18641;
var inst_18623 = (0);
var state_18699__$1 = (function (){var statearr_18947 = state_18699;
(statearr_18947[(13)] = inst_18621);

(statearr_18947[(14)] = inst_18623);

(statearr_18947[(15)] = inst_18622);

(statearr_18947[(16)] = inst_18620);

return statearr_18947;
})();
var statearr_18949_21961 = state_18699__$1;
(statearr_18949_21961[(2)] = null);

(statearr_18949_21961[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (10))){
var inst_18621 = (state_18699[(13)]);
var inst_18623 = (state_18699[(14)]);
var inst_18622 = (state_18699[(15)]);
var inst_18620 = (state_18699[(16)]);
var inst_18628 = cljs.core._nth(inst_18621,inst_18623);
var inst_18629 = cljs.core.async.muxch_STAR_(inst_18628);
var inst_18630 = cljs.core.async.close_BANG_(inst_18629);
var inst_18631 = (inst_18623 + (1));
var tmp18935 = inst_18621;
var tmp18936 = inst_18622;
var tmp18937 = inst_18620;
var inst_18620__$1 = tmp18937;
var inst_18621__$1 = tmp18935;
var inst_18622__$1 = tmp18936;
var inst_18623__$1 = inst_18631;
var state_18699__$1 = (function (){var statearr_18954 = state_18699;
(statearr_18954[(13)] = inst_18621__$1);

(statearr_18954[(14)] = inst_18623__$1);

(statearr_18954[(15)] = inst_18622__$1);

(statearr_18954[(16)] = inst_18620__$1);

(statearr_18954[(17)] = inst_18630);

return statearr_18954;
})();
var statearr_18955_21965 = state_18699__$1;
(statearr_18955_21965[(2)] = null);

(statearr_18955_21965[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (18))){
var inst_18653 = (state_18699[(2)]);
var state_18699__$1 = state_18699;
var statearr_18956_21966 = state_18699__$1;
(statearr_18956_21966[(2)] = inst_18653);

(statearr_18956_21966[(1)] = (15));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_18701 === (8))){
var inst_18623 = (state_18699[(14)]);
var inst_18622 = (state_18699[(15)]);
var inst_18625 = (inst_18623 < inst_18622);
var inst_18626 = inst_18625;
var state_18699__$1 = state_18699;
if(cljs.core.truth_(inst_18626)){
var statearr_18966_21967 = state_18699__$1;
(statearr_18966_21967[(1)] = (10));

} else {
var statearr_18967_21968 = state_18699__$1;
(statearr_18967_21968[(1)] = (11));

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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_18976 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_18976[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_18976[(1)] = (1));

return statearr_18976;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_18699){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_18699);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e18990){var ex__15985__auto__ = e18990;
var statearr_18993_21973 = state_18699;
(statearr_18993_21973[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_18699[(4)]))){
var statearr_18994_21974 = state_18699;
(statearr_18994_21974[(1)] = cljs.core.first((state_18699[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__21975 = state_18699;
state_18699 = G__21975;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_18699){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_18699);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_19010 = f__16830__auto__();
(statearr_19010[(6)] = c__16829__auto___21920);

return statearr_19010;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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
var G__19027 = arguments.length;
switch (G__19027) {
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
var G__19051 = arguments.length;
switch (G__19051) {
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
var G__19063 = arguments.length;
switch (G__19063) {
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
var c__16829__auto___21986 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_19134){
var state_val_19136 = (state_19134[(1)]);
if((state_val_19136 === (7))){
var state_19134__$1 = state_19134;
var statearr_19141_21987 = state_19134__$1;
(statearr_19141_21987[(2)] = null);

(statearr_19141_21987[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (1))){
var state_19134__$1 = state_19134;
var statearr_19142_21988 = state_19134__$1;
(statearr_19142_21988[(2)] = null);

(statearr_19142_21988[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (4))){
var inst_19086 = (state_19134[(7)]);
var inst_19085 = (state_19134[(8)]);
var inst_19088 = (inst_19086 < inst_19085);
var state_19134__$1 = state_19134;
if(cljs.core.truth_(inst_19088)){
var statearr_19148_21990 = state_19134__$1;
(statearr_19148_21990[(1)] = (6));

} else {
var statearr_19149_21991 = state_19134__$1;
(statearr_19149_21991[(1)] = (7));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (15))){
var inst_19120 = (state_19134[(9)]);
var inst_19125 = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f,inst_19120);
var state_19134__$1 = state_19134;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_19134__$1,(17),out,inst_19125);
} else {
if((state_val_19136 === (13))){
var inst_19120 = (state_19134[(9)]);
var inst_19120__$1 = (state_19134[(2)]);
var inst_19121 = cljs.core.some(cljs.core.nil_QMARK_,inst_19120__$1);
var state_19134__$1 = (function (){var statearr_19153 = state_19134;
(statearr_19153[(9)] = inst_19120__$1);

return statearr_19153;
})();
if(cljs.core.truth_(inst_19121)){
var statearr_19154_21994 = state_19134__$1;
(statearr_19154_21994[(1)] = (14));

} else {
var statearr_19155_21998 = state_19134__$1;
(statearr_19155_21998[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (6))){
var state_19134__$1 = state_19134;
var statearr_19160_21999 = state_19134__$1;
(statearr_19160_21999[(2)] = null);

(statearr_19160_21999[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (17))){
var inst_19127 = (state_19134[(2)]);
var state_19134__$1 = (function (){var statearr_19173 = state_19134;
(statearr_19173[(10)] = inst_19127);

return statearr_19173;
})();
var statearr_19174_22000 = state_19134__$1;
(statearr_19174_22000[(2)] = null);

(statearr_19174_22000[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (3))){
var inst_19132 = (state_19134[(2)]);
var state_19134__$1 = state_19134;
return cljs.core.async.impl.ioc_helpers.return_chan(state_19134__$1,inst_19132);
} else {
if((state_val_19136 === (12))){
var _ = (function (){var statearr_19175 = state_19134;
(statearr_19175[(4)] = cljs.core.rest((state_19134[(4)])));

return statearr_19175;
})();
var state_19134__$1 = state_19134;
var ex19172 = (state_19134__$1[(2)]);
var statearr_19176_22001 = state_19134__$1;
(statearr_19176_22001[(5)] = ex19172);


if((ex19172 instanceof Object)){
var statearr_19179_22004 = state_19134__$1;
(statearr_19179_22004[(1)] = (11));

(statearr_19179_22004[(5)] = null);

} else {
throw ex19172;

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (2))){
var inst_19084 = cljs.core.reset_BANG_(dctr,cnt);
var inst_19085 = cnt;
var inst_19086 = (0);
var state_19134__$1 = (function (){var statearr_19184 = state_19134;
(statearr_19184[(11)] = inst_19084);

(statearr_19184[(7)] = inst_19086);

(statearr_19184[(8)] = inst_19085);

return statearr_19184;
})();
var statearr_19188_22008 = state_19134__$1;
(statearr_19188_22008[(2)] = null);

(statearr_19188_22008[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (11))){
var inst_19095 = (state_19134[(2)]);
var inst_19100 = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(dctr,cljs.core.dec);
var state_19134__$1 = (function (){var statearr_19190 = state_19134;
(statearr_19190[(12)] = inst_19095);

return statearr_19190;
})();
var statearr_19191_22013 = state_19134__$1;
(statearr_19191_22013[(2)] = inst_19100);

(statearr_19191_22013[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (9))){
var inst_19086 = (state_19134[(7)]);
var _ = (function (){var statearr_19193 = state_19134;
(statearr_19193[(4)] = cljs.core.cons((12),(state_19134[(4)])));

return statearr_19193;
})();
var inst_19106 = (chs__$1.cljs$core$IFn$_invoke$arity$1 ? chs__$1.cljs$core$IFn$_invoke$arity$1(inst_19086) : chs__$1.call(null,inst_19086));
var inst_19107 = (done.cljs$core$IFn$_invoke$arity$1 ? done.cljs$core$IFn$_invoke$arity$1(inst_19086) : done.call(null,inst_19086));
var inst_19108 = cljs.core.async.take_BANG_.cljs$core$IFn$_invoke$arity$2(inst_19106,inst_19107);
var ___$1 = (function (){var statearr_19194 = state_19134;
(statearr_19194[(4)] = cljs.core.rest((state_19134[(4)])));

return statearr_19194;
})();
var state_19134__$1 = state_19134;
var statearr_19195_22019 = state_19134__$1;
(statearr_19195_22019[(2)] = inst_19108);

(statearr_19195_22019[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (5))){
var inst_19118 = (state_19134[(2)]);
var state_19134__$1 = (function (){var statearr_19196 = state_19134;
(statearr_19196[(13)] = inst_19118);

return statearr_19196;
})();
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_19134__$1,(13),dchan);
} else {
if((state_val_19136 === (14))){
var inst_19123 = cljs.core.async.close_BANG_(out);
var state_19134__$1 = state_19134;
var statearr_19197_22021 = state_19134__$1;
(statearr_19197_22021[(2)] = inst_19123);

(statearr_19197_22021[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (16))){
var inst_19130 = (state_19134[(2)]);
var state_19134__$1 = state_19134;
var statearr_19198_22024 = state_19134__$1;
(statearr_19198_22024[(2)] = inst_19130);

(statearr_19198_22024[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (10))){
var inst_19086 = (state_19134[(7)]);
var inst_19111 = (state_19134[(2)]);
var inst_19112 = (inst_19086 + (1));
var inst_19086__$1 = inst_19112;
var state_19134__$1 = (function (){var statearr_19199 = state_19134;
(statearr_19199[(14)] = inst_19111);

(statearr_19199[(7)] = inst_19086__$1);

return statearr_19199;
})();
var statearr_19200_22028 = state_19134__$1;
(statearr_19200_22028[(2)] = null);

(statearr_19200_22028[(1)] = (4));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19136 === (8))){
var inst_19116 = (state_19134[(2)]);
var state_19134__$1 = state_19134;
var statearr_19201_22033 = state_19134__$1;
(statearr_19201_22033[(2)] = inst_19116);

(statearr_19201_22033[(1)] = (5));


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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_19209 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_19209[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_19209[(1)] = (1));

return statearr_19209;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_19134){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_19134);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e19211){var ex__15985__auto__ = e19211;
var statearr_19216_22037 = state_19134;
(statearr_19216_22037[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_19134[(4)]))){
var statearr_19221_22038 = state_19134;
(statearr_19221_22038[(1)] = cljs.core.first((state_19134[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22046 = state_19134;
state_19134 = G__22046;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_19134){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_19134);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_19226 = f__16830__auto__();
(statearr_19226[(6)] = c__16829__auto___21986);

return statearr_19226;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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
var G__19233 = arguments.length;
switch (G__19233) {
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
var c__16829__auto___22049 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_19285){
var state_val_19286 = (state_19285[(1)]);
if((state_val_19286 === (7))){
var inst_19247 = (state_19285[(7)]);
var inst_19248 = (state_19285[(8)]);
var inst_19247__$1 = (state_19285[(2)]);
var inst_19248__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_19247__$1,(0),null);
var inst_19249 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(inst_19247__$1,(1),null);
var inst_19250 = (inst_19248__$1 == null);
var state_19285__$1 = (function (){var statearr_19303 = state_19285;
(statearr_19303[(9)] = inst_19249);

(statearr_19303[(7)] = inst_19247__$1);

(statearr_19303[(8)] = inst_19248__$1);

return statearr_19303;
})();
if(cljs.core.truth_(inst_19250)){
var statearr_19310_22053 = state_19285__$1;
(statearr_19310_22053[(1)] = (8));

} else {
var statearr_19314_22054 = state_19285__$1;
(statearr_19314_22054[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19286 === (1))){
var inst_19237 = cljs.core.vec(chs);
var inst_19238 = inst_19237;
var state_19285__$1 = (function (){var statearr_19324 = state_19285;
(statearr_19324[(10)] = inst_19238);

return statearr_19324;
})();
var statearr_19326_22060 = state_19285__$1;
(statearr_19326_22060[(2)] = null);

(statearr_19326_22060[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19286 === (4))){
var inst_19238 = (state_19285[(10)]);
var state_19285__$1 = state_19285;
return cljs.core.async.ioc_alts_BANG_(state_19285__$1,(7),inst_19238);
} else {
if((state_val_19286 === (6))){
var inst_19274 = (state_19285[(2)]);
var state_19285__$1 = state_19285;
var statearr_19343_22063 = state_19285__$1;
(statearr_19343_22063[(2)] = inst_19274);

(statearr_19343_22063[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19286 === (3))){
var inst_19276 = (state_19285[(2)]);
var state_19285__$1 = state_19285;
return cljs.core.async.impl.ioc_helpers.return_chan(state_19285__$1,inst_19276);
} else {
if((state_val_19286 === (2))){
var inst_19238 = (state_19285[(10)]);
var inst_19240 = cljs.core.count(inst_19238);
var inst_19241 = (inst_19240 > (0));
var state_19285__$1 = state_19285;
if(cljs.core.truth_(inst_19241)){
var statearr_19356_22065 = state_19285__$1;
(statearr_19356_22065[(1)] = (4));

} else {
var statearr_19357_22066 = state_19285__$1;
(statearr_19357_22066[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19286 === (11))){
var inst_19238 = (state_19285[(10)]);
var inst_19263 = (state_19285[(2)]);
var tmp19347 = inst_19238;
var inst_19238__$1 = tmp19347;
var state_19285__$1 = (function (){var statearr_19365 = state_19285;
(statearr_19365[(10)] = inst_19238__$1);

(statearr_19365[(11)] = inst_19263);

return statearr_19365;
})();
var statearr_19366_22070 = state_19285__$1;
(statearr_19366_22070[(2)] = null);

(statearr_19366_22070[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19286 === (9))){
var inst_19248 = (state_19285[(8)]);
var state_19285__$1 = state_19285;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_19285__$1,(11),out,inst_19248);
} else {
if((state_val_19286 === (5))){
var inst_19272 = cljs.core.async.close_BANG_(out);
var state_19285__$1 = state_19285;
var statearr_19407_22076 = state_19285__$1;
(statearr_19407_22076[(2)] = inst_19272);

(statearr_19407_22076[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19286 === (10))){
var inst_19268 = (state_19285[(2)]);
var state_19285__$1 = state_19285;
var statearr_19416_22077 = state_19285__$1;
(statearr_19416_22077[(2)] = inst_19268);

(statearr_19416_22077[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19286 === (8))){
var inst_19238 = (state_19285[(10)]);
var inst_19249 = (state_19285[(9)]);
var inst_19247 = (state_19285[(7)]);
var inst_19248 = (state_19285[(8)]);
var inst_19254 = (function (){var cs = inst_19238;
var vec__19243 = inst_19247;
var v = inst_19248;
var c = inst_19249;
return (function (p1__19227_SHARP_){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(c,p1__19227_SHARP_);
});
})();
var inst_19255 = cljs.core.filterv(inst_19254,inst_19238);
var inst_19238__$1 = inst_19255;
var state_19285__$1 = (function (){var statearr_19427 = state_19285;
(statearr_19427[(10)] = inst_19238__$1);

return statearr_19427;
})();
var statearr_19432_22078 = state_19285__$1;
(statearr_19432_22078[(2)] = null);

(statearr_19432_22078[(1)] = (2));


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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_19455 = [null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_19455[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_19455[(1)] = (1));

return statearr_19455;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_19285){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_19285);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e19462){var ex__15985__auto__ = e19462;
var statearr_19465_22087 = state_19285;
(statearr_19465_22087[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_19285[(4)]))){
var statearr_19468_22088 = state_19285;
(statearr_19468_22088[(1)] = cljs.core.first((state_19285[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22090 = state_19285;
state_19285 = G__22090;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_19285){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_19285);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_19485 = f__16830__auto__();
(statearr_19485[(6)] = c__16829__auto___22049);

return statearr_19485;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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
var G__19529 = arguments.length;
switch (G__19529) {
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
var c__16829__auto___22093 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_19621){
var state_val_19622 = (state_19621[(1)]);
if((state_val_19622 === (7))){
var inst_19588 = (state_19621[(7)]);
var inst_19588__$1 = (state_19621[(2)]);
var inst_19594 = (inst_19588__$1 == null);
var inst_19595 = cljs.core.not(inst_19594);
var state_19621__$1 = (function (){var statearr_19638 = state_19621;
(statearr_19638[(7)] = inst_19588__$1);

return statearr_19638;
})();
if(inst_19595){
var statearr_19639_22095 = state_19621__$1;
(statearr_19639_22095[(1)] = (8));

} else {
var statearr_19641_22096 = state_19621__$1;
(statearr_19641_22096[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (1))){
var inst_19577 = (0);
var state_19621__$1 = (function (){var statearr_19646 = state_19621;
(statearr_19646[(8)] = inst_19577);

return statearr_19646;
})();
var statearr_19648_22103 = state_19621__$1;
(statearr_19648_22103[(2)] = null);

(statearr_19648_22103[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (4))){
var state_19621__$1 = state_19621;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_19621__$1,(7),ch);
} else {
if((state_val_19622 === (6))){
var inst_19614 = (state_19621[(2)]);
var state_19621__$1 = state_19621;
var statearr_19655_22104 = state_19621__$1;
(statearr_19655_22104[(2)] = inst_19614);

(statearr_19655_22104[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (3))){
var inst_19616 = (state_19621[(2)]);
var inst_19617 = cljs.core.async.close_BANG_(out);
var state_19621__$1 = (function (){var statearr_19672 = state_19621;
(statearr_19672[(9)] = inst_19616);

return statearr_19672;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_19621__$1,inst_19617);
} else {
if((state_val_19622 === (2))){
var inst_19577 = (state_19621[(8)]);
var inst_19579 = (inst_19577 < n);
var state_19621__$1 = state_19621;
if(cljs.core.truth_(inst_19579)){
var statearr_19676_22105 = state_19621__$1;
(statearr_19676_22105[(1)] = (4));

} else {
var statearr_19677_22106 = state_19621__$1;
(statearr_19677_22106[(1)] = (5));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (11))){
var inst_19577 = (state_19621[(8)]);
var inst_19602 = (state_19621[(2)]);
var inst_19605 = (inst_19577 + (1));
var inst_19577__$1 = inst_19605;
var state_19621__$1 = (function (){var statearr_19680 = state_19621;
(statearr_19680[(8)] = inst_19577__$1);

(statearr_19680[(10)] = inst_19602);

return statearr_19680;
})();
var statearr_19681_22107 = state_19621__$1;
(statearr_19681_22107[(2)] = null);

(statearr_19681_22107[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (9))){
var state_19621__$1 = state_19621;
var statearr_19686_22109 = state_19621__$1;
(statearr_19686_22109[(2)] = null);

(statearr_19686_22109[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (5))){
var state_19621__$1 = state_19621;
var statearr_19690_22111 = state_19621__$1;
(statearr_19690_22111[(2)] = null);

(statearr_19690_22111[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (10))){
var inst_19609 = (state_19621[(2)]);
var state_19621__$1 = state_19621;
var statearr_19695_22113 = state_19621__$1;
(statearr_19695_22113[(2)] = inst_19609);

(statearr_19695_22113[(1)] = (6));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_19622 === (8))){
var inst_19588 = (state_19621[(7)]);
var state_19621__$1 = state_19621;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_19621__$1,(11),out,inst_19588);
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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_19705 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_19705[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_19705[(1)] = (1));

return statearr_19705;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_19621){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_19621);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e19706){var ex__15985__auto__ = e19706;
var statearr_19708_22114 = state_19621;
(statearr_19708_22114[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_19621[(4)]))){
var statearr_19709_22115 = state_19621;
(statearr_19709_22115[(1)] = cljs.core.first((state_19621[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22116 = state_19621;
state_19621 = G__22116;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_19621){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_19621);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_19717 = f__16830__auto__();
(statearr_19717[(6)] = c__16829__auto___22093);

return statearr_19717;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
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
cljs.core.async.t_cljs$core$async19753 = (function (f,ch,meta19727,_,fn1,meta19754){
this.f = f;
this.ch = ch;
this.meta19727 = meta19727;
this._ = _;
this.fn1 = fn1;
this.meta19754 = meta19754;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async19753.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_19755,meta19754__$1){
var self__ = this;
var _19755__$1 = this;
return (new cljs.core.async.t_cljs$core$async19753(self__.f,self__.ch,self__.meta19727,self__._,self__.fn1,meta19754__$1));
}));

(cljs.core.async.t_cljs$core$async19753.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_19755){
var self__ = this;
var _19755__$1 = this;
return self__.meta19754;
}));

(cljs.core.async.t_cljs$core$async19753.prototype.cljs$core$async$impl$protocols$Handler$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19753.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return cljs.core.async.impl.protocols.active_QMARK_(self__.fn1);
}));

(cljs.core.async.t_cljs$core$async19753.prototype.cljs$core$async$impl$protocols$Handler$blockable_QMARK_$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
return true;
}));

(cljs.core.async.t_cljs$core$async19753.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = (function (___$1){
var self__ = this;
var ___$2 = this;
var f1 = cljs.core.async.impl.protocols.commit(self__.fn1);
return (function (p1__19723_SHARP_){
var G__19771 = (((p1__19723_SHARP_ == null))?null:(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(p1__19723_SHARP_) : self__.f.call(null,p1__19723_SHARP_)));
return (f1.cljs$core$IFn$_invoke$arity$1 ? f1.cljs$core$IFn$_invoke$arity$1(G__19771) : f1.call(null,G__19771));
});
}));

(cljs.core.async.t_cljs$core$async19753.getBasis = (function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta19727","meta19727",-1553488837,null),cljs.core.with_meta(new cljs.core.Symbol(null,"_","_",-1201019570,null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"tag","tag",-1290361223),new cljs.core.Symbol("cljs.core.async","t_cljs$core$async19726","cljs.core.async/t_cljs$core$async19726",713375762,null)], null)),new cljs.core.Symbol(null,"fn1","fn1",895834444,null),new cljs.core.Symbol(null,"meta19754","meta19754",-407595073,null)], null);
}));

(cljs.core.async.t_cljs$core$async19753.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async19753.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async19753");

(cljs.core.async.t_cljs$core$async19753.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async19753");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async19753.
 */
cljs.core.async.__GT_t_cljs$core$async19753 = (function cljs$core$async$__GT_t_cljs$core$async19753(f,ch,meta19727,_,fn1,meta19754){
return (new cljs.core.async.t_cljs$core$async19753(f,ch,meta19727,_,fn1,meta19754));
});



/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async19726 = (function (f,ch,meta19727){
this.f = f;
this.ch = ch;
this.meta19727 = meta19727;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_19728,meta19727__$1){
var self__ = this;
var _19728__$1 = this;
return (new cljs.core.async.t_cljs$core$async19726(self__.f,self__.ch,meta19727__$1));
}));

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_19728){
var self__ = this;
var _19728__$1 = this;
return self__.meta19727;
}));

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
var ret = cljs.core.async.impl.protocols.take_BANG_(self__.ch,(new cljs.core.async.t_cljs$core$async19753(self__.f,self__.ch,self__.meta19727,___$1,fn1,cljs.core.PersistentArrayMap.EMPTY)));
if(cljs.core.truth_((function (){var and__5000__auto__ = ret;
if(cljs.core.truth_(and__5000__auto__)){
return (!((cljs.core.deref(ret) == null)));
} else {
return and__5000__auto__;
}
})())){
return cljs.core.async.impl.channels.box((function (){var G__19789 = cljs.core.deref(ret);
return (self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(G__19789) : self__.f.call(null,G__19789));
})());
} else {
return ret;
}
}));

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19726.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
}));

(cljs.core.async.t_cljs$core$async19726.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta19727","meta19727",-1553488837,null)], null);
}));

(cljs.core.async.t_cljs$core$async19726.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async19726.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async19726");

(cljs.core.async.t_cljs$core$async19726.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async19726");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async19726.
 */
cljs.core.async.__GT_t_cljs$core$async19726 = (function cljs$core$async$__GT_t_cljs$core$async19726(f,ch,meta19727){
return (new cljs.core.async.t_cljs$core$async19726(f,ch,meta19727));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_LT_ = (function cljs$core$async$map_LT_(f,ch){
return (new cljs.core.async.t_cljs$core$async19726(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async19812 = (function (f,ch,meta19813){
this.f = f;
this.ch = ch;
this.meta19813 = meta19813;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_19814,meta19813__$1){
var self__ = this;
var _19814__$1 = this;
return (new cljs.core.async.t_cljs$core$async19812(self__.f,self__.ch,meta19813__$1));
}));

(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_19814){
var self__ = this;
var _19814__$1 = this;
return self__.meta19813;
}));

(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19812.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,(self__.f.cljs$core$IFn$_invoke$arity$1 ? self__.f.cljs$core$IFn$_invoke$arity$1(val) : self__.f.call(null,val)),fn1);
}));

(cljs.core.async.t_cljs$core$async19812.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"f","f",43394975,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta19813","meta19813",57130925,null)], null);
}));

(cljs.core.async.t_cljs$core$async19812.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async19812.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async19812");

(cljs.core.async.t_cljs$core$async19812.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async19812");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async19812.
 */
cljs.core.async.__GT_t_cljs$core$async19812 = (function cljs$core$async$__GT_t_cljs$core$async19812(f,ch,meta19813){
return (new cljs.core.async.t_cljs$core$async19812(f,ch,meta19813));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.map_GT_ = (function cljs$core$async$map_GT_(f,ch){
return (new cljs.core.async.t_cljs$core$async19812(f,ch,cljs.core.PersistentArrayMap.EMPTY));
});

/**
* @constructor
 * @implements {cljs.core.async.impl.protocols.Channel}
 * @implements {cljs.core.async.impl.protocols.WritePort}
 * @implements {cljs.core.async.impl.protocols.ReadPort}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.IWithMeta}
*/
cljs.core.async.t_cljs$core$async19872 = (function (p,ch,meta19873){
this.p = p;
this.ch = ch;
this.meta19873 = meta19873;
this.cljs$lang$protocol_mask$partition0$ = 393216;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (_19874,meta19873__$1){
var self__ = this;
var _19874__$1 = this;
return (new cljs.core.async.t_cljs$core$async19872(self__.p,self__.ch,meta19873__$1));
}));

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$IMeta$_meta$arity$1 = (function (_19874){
var self__ = this;
var _19874__$1 = this;
return self__.meta19873;
}));

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$async$impl$protocols$Channel$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.close_BANG_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$async$impl$protocols$Channel$closed_QMARK_$arity$1 = (function (_){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.closed_QMARK_(self__.ch);
}));

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$async$impl$protocols$ReadPort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = (function (_,fn1){
var self__ = this;
var ___$1 = this;
return cljs.core.async.impl.protocols.take_BANG_(self__.ch,fn1);
}));

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$async$impl$protocols$WritePort$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.async.t_cljs$core$async19872.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = (function (_,val,fn1){
var self__ = this;
var ___$1 = this;
if(cljs.core.truth_((self__.p.cljs$core$IFn$_invoke$arity$1 ? self__.p.cljs$core$IFn$_invoke$arity$1(val) : self__.p.call(null,val)))){
return cljs.core.async.impl.protocols.put_BANG_(self__.ch,val,fn1);
} else {
return cljs.core.async.impl.channels.box(cljs.core.not(cljs.core.async.impl.protocols.closed_QMARK_(self__.ch)));
}
}));

(cljs.core.async.t_cljs$core$async19872.getBasis = (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"p","p",1791580836,null),new cljs.core.Symbol(null,"ch","ch",1085813622,null),new cljs.core.Symbol(null,"meta19873","meta19873",944561310,null)], null);
}));

(cljs.core.async.t_cljs$core$async19872.cljs$lang$type = true);

(cljs.core.async.t_cljs$core$async19872.cljs$lang$ctorStr = "cljs.core.async/t_cljs$core$async19872");

(cljs.core.async.t_cljs$core$async19872.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"cljs.core.async/t_cljs$core$async19872");
}));

/**
 * Positional factory function for cljs.core.async/t_cljs$core$async19872.
 */
cljs.core.async.__GT_t_cljs$core$async19872 = (function cljs$core$async$__GT_t_cljs$core$async19872(p,ch,meta19873){
return (new cljs.core.async.t_cljs$core$async19872(p,ch,meta19873));
});


/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.filter_GT_ = (function cljs$core$async$filter_GT_(p,ch){
return (new cljs.core.async.t_cljs$core$async19872(p,ch,cljs.core.PersistentArrayMap.EMPTY));
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
var G__20023 = arguments.length;
switch (G__20023) {
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
var c__16829__auto___22128 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_20080){
var state_val_20081 = (state_20080[(1)]);
if((state_val_20081 === (7))){
var inst_20076 = (state_20080[(2)]);
var state_20080__$1 = state_20080;
var statearr_20091_22129 = state_20080__$1;
(statearr_20091_22129[(2)] = inst_20076);

(statearr_20091_22129[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (1))){
var state_20080__$1 = state_20080;
var statearr_20093_22130 = state_20080__$1;
(statearr_20093_22130[(2)] = null);

(statearr_20093_22130[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (4))){
var inst_20054 = (state_20080[(7)]);
var inst_20054__$1 = (state_20080[(2)]);
var inst_20059 = (inst_20054__$1 == null);
var state_20080__$1 = (function (){var statearr_20102 = state_20080;
(statearr_20102[(7)] = inst_20054__$1);

return statearr_20102;
})();
if(cljs.core.truth_(inst_20059)){
var statearr_20104_22131 = state_20080__$1;
(statearr_20104_22131[(1)] = (5));

} else {
var statearr_20108_22133 = state_20080__$1;
(statearr_20108_22133[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (6))){
var inst_20054 = (state_20080[(7)]);
var inst_20066 = (p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(inst_20054) : p.call(null,inst_20054));
var state_20080__$1 = state_20080;
if(cljs.core.truth_(inst_20066)){
var statearr_20110_22134 = state_20080__$1;
(statearr_20110_22134[(1)] = (8));

} else {
var statearr_20111_22135 = state_20080__$1;
(statearr_20111_22135[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (3))){
var inst_20078 = (state_20080[(2)]);
var state_20080__$1 = state_20080;
return cljs.core.async.impl.ioc_helpers.return_chan(state_20080__$1,inst_20078);
} else {
if((state_val_20081 === (2))){
var state_20080__$1 = state_20080;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_20080__$1,(4),ch);
} else {
if((state_val_20081 === (11))){
var inst_20070 = (state_20080[(2)]);
var state_20080__$1 = state_20080;
var statearr_20115_22136 = state_20080__$1;
(statearr_20115_22136[(2)] = inst_20070);

(statearr_20115_22136[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (9))){
var state_20080__$1 = state_20080;
var statearr_20118_22138 = state_20080__$1;
(statearr_20118_22138[(2)] = null);

(statearr_20118_22138[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (5))){
var inst_20064 = cljs.core.async.close_BANG_(out);
var state_20080__$1 = state_20080;
var statearr_20119_22141 = state_20080__$1;
(statearr_20119_22141[(2)] = inst_20064);

(statearr_20119_22141[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (10))){
var inst_20073 = (state_20080[(2)]);
var state_20080__$1 = (function (){var statearr_20120 = state_20080;
(statearr_20120[(8)] = inst_20073);

return statearr_20120;
})();
var statearr_20123_22142 = state_20080__$1;
(statearr_20123_22142[(2)] = null);

(statearr_20123_22142[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20081 === (8))){
var inst_20054 = (state_20080[(7)]);
var state_20080__$1 = state_20080;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20080__$1,(11),out,inst_20054);
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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_20152 = [null,null,null,null,null,null,null,null,null];
(statearr_20152[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_20152[(1)] = (1));

return statearr_20152;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_20080){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_20080);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e20155){var ex__15985__auto__ = e20155;
var statearr_20156_22145 = state_20080;
(statearr_20156_22145[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_20080[(4)]))){
var statearr_20158_22146 = state_20080;
(statearr_20158_22146[(1)] = cljs.core.first((state_20080[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22147 = state_20080;
state_20080 = G__22147;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_20080){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_20080);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_20166 = f__16830__auto__();
(statearr_20166[(6)] = c__16829__auto___22128);

return statearr_20166;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));


return out;
}));

(cljs.core.async.filter_LT_.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.remove_LT_ = (function cljs$core$async$remove_LT_(var_args){
var G__20172 = arguments.length;
switch (G__20172) {
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
var c__16829__auto__ = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_20284){
var state_val_20285 = (state_20284[(1)]);
if((state_val_20285 === (7))){
var inst_20275 = (state_20284[(2)]);
var state_20284__$1 = state_20284;
var statearr_20314_22155 = state_20284__$1;
(statearr_20314_22155[(2)] = inst_20275);

(statearr_20314_22155[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (20))){
var inst_20235 = (state_20284[(7)]);
var inst_20253 = (state_20284[(2)]);
var inst_20254 = cljs.core.next(inst_20235);
var inst_20210 = inst_20254;
var inst_20211 = null;
var inst_20212 = (0);
var inst_20216 = (0);
var state_20284__$1 = (function (){var statearr_20345 = state_20284;
(statearr_20345[(8)] = inst_20216);

(statearr_20345[(9)] = inst_20211);

(statearr_20345[(10)] = inst_20212);

(statearr_20345[(11)] = inst_20210);

(statearr_20345[(12)] = inst_20253);

return statearr_20345;
})();
var statearr_20347_22156 = state_20284__$1;
(statearr_20347_22156[(2)] = null);

(statearr_20347_22156[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (1))){
var state_20284__$1 = state_20284;
var statearr_20352_22158 = state_20284__$1;
(statearr_20352_22158[(2)] = null);

(statearr_20352_22158[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (4))){
var inst_20194 = (state_20284[(13)]);
var inst_20194__$1 = (state_20284[(2)]);
var inst_20195 = (inst_20194__$1 == null);
var state_20284__$1 = (function (){var statearr_20353 = state_20284;
(statearr_20353[(13)] = inst_20194__$1);

return statearr_20353;
})();
if(cljs.core.truth_(inst_20195)){
var statearr_20355_22159 = state_20284__$1;
(statearr_20355_22159[(1)] = (5));

} else {
var statearr_20359_22160 = state_20284__$1;
(statearr_20359_22160[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (15))){
var state_20284__$1 = state_20284;
var statearr_20371_22161 = state_20284__$1;
(statearr_20371_22161[(2)] = null);

(statearr_20371_22161[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (21))){
var state_20284__$1 = state_20284;
var statearr_20372_22162 = state_20284__$1;
(statearr_20372_22162[(2)] = null);

(statearr_20372_22162[(1)] = (23));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (13))){
var inst_20216 = (state_20284[(8)]);
var inst_20211 = (state_20284[(9)]);
var inst_20212 = (state_20284[(10)]);
var inst_20210 = (state_20284[(11)]);
var inst_20227 = (state_20284[(2)]);
var inst_20229 = (inst_20216 + (1));
var tmp20366 = inst_20211;
var tmp20367 = inst_20212;
var tmp20368 = inst_20210;
var inst_20210__$1 = tmp20368;
var inst_20211__$1 = tmp20366;
var inst_20212__$1 = tmp20367;
var inst_20216__$1 = inst_20229;
var state_20284__$1 = (function (){var statearr_20380 = state_20284;
(statearr_20380[(8)] = inst_20216__$1);

(statearr_20380[(9)] = inst_20211__$1);

(statearr_20380[(14)] = inst_20227);

(statearr_20380[(10)] = inst_20212__$1);

(statearr_20380[(11)] = inst_20210__$1);

return statearr_20380;
})();
var statearr_20382_22166 = state_20284__$1;
(statearr_20382_22166[(2)] = null);

(statearr_20382_22166[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (22))){
var state_20284__$1 = state_20284;
var statearr_20388_22167 = state_20284__$1;
(statearr_20388_22167[(2)] = null);

(statearr_20388_22167[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (6))){
var inst_20194 = (state_20284[(13)]);
var inst_20206 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_20194) : f.call(null,inst_20194));
var inst_20207 = cljs.core.seq(inst_20206);
var inst_20210 = inst_20207;
var inst_20211 = null;
var inst_20212 = (0);
var inst_20216 = (0);
var state_20284__$1 = (function (){var statearr_20396 = state_20284;
(statearr_20396[(8)] = inst_20216);

(statearr_20396[(9)] = inst_20211);

(statearr_20396[(10)] = inst_20212);

(statearr_20396[(11)] = inst_20210);

return statearr_20396;
})();
var statearr_20397_22169 = state_20284__$1;
(statearr_20397_22169[(2)] = null);

(statearr_20397_22169[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (17))){
var inst_20235 = (state_20284[(7)]);
var inst_20242 = cljs.core.chunk_first(inst_20235);
var inst_20243 = cljs.core.chunk_rest(inst_20235);
var inst_20244 = cljs.core.count(inst_20242);
var inst_20210 = inst_20243;
var inst_20211 = inst_20242;
var inst_20212 = inst_20244;
var inst_20216 = (0);
var state_20284__$1 = (function (){var statearr_20400 = state_20284;
(statearr_20400[(8)] = inst_20216);

(statearr_20400[(9)] = inst_20211);

(statearr_20400[(10)] = inst_20212);

(statearr_20400[(11)] = inst_20210);

return statearr_20400;
})();
var statearr_20401_22171 = state_20284__$1;
(statearr_20401_22171[(2)] = null);

(statearr_20401_22171[(1)] = (8));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (3))){
var inst_20277 = (state_20284[(2)]);
var state_20284__$1 = state_20284;
return cljs.core.async.impl.ioc_helpers.return_chan(state_20284__$1,inst_20277);
} else {
if((state_val_20285 === (12))){
var inst_20264 = (state_20284[(2)]);
var state_20284__$1 = state_20284;
var statearr_20404_22173 = state_20284__$1;
(statearr_20404_22173[(2)] = inst_20264);

(statearr_20404_22173[(1)] = (9));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (2))){
var state_20284__$1 = state_20284;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_20284__$1,(4),in$);
} else {
if((state_val_20285 === (23))){
var inst_20272 = (state_20284[(2)]);
var state_20284__$1 = state_20284;
var statearr_20410_22177 = state_20284__$1;
(statearr_20410_22177[(2)] = inst_20272);

(statearr_20410_22177[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (19))){
var inst_20259 = (state_20284[(2)]);
var state_20284__$1 = state_20284;
var statearr_20412_22183 = state_20284__$1;
(statearr_20412_22183[(2)] = inst_20259);

(statearr_20412_22183[(1)] = (16));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (11))){
var inst_20235 = (state_20284[(7)]);
var inst_20210 = (state_20284[(11)]);
var inst_20235__$1 = cljs.core.seq(inst_20210);
var state_20284__$1 = (function (){var statearr_20420 = state_20284;
(statearr_20420[(7)] = inst_20235__$1);

return statearr_20420;
})();
if(inst_20235__$1){
var statearr_20422_22189 = state_20284__$1;
(statearr_20422_22189[(1)] = (14));

} else {
var statearr_20424_22190 = state_20284__$1;
(statearr_20424_22190[(1)] = (15));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (9))){
var inst_20266 = (state_20284[(2)]);
var inst_20267 = cljs.core.async.impl.protocols.closed_QMARK_(out);
var state_20284__$1 = (function (){var statearr_20428 = state_20284;
(statearr_20428[(15)] = inst_20266);

return statearr_20428;
})();
if(cljs.core.truth_(inst_20267)){
var statearr_20429_22196 = state_20284__$1;
(statearr_20429_22196[(1)] = (21));

} else {
var statearr_20431_22197 = state_20284__$1;
(statearr_20431_22197[(1)] = (22));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (5))){
var inst_20197 = cljs.core.async.close_BANG_(out);
var state_20284__$1 = state_20284;
var statearr_20432_22198 = state_20284__$1;
(statearr_20432_22198[(2)] = inst_20197);

(statearr_20432_22198[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (14))){
var inst_20235 = (state_20284[(7)]);
var inst_20237 = cljs.core.chunked_seq_QMARK_(inst_20235);
var state_20284__$1 = state_20284;
if(inst_20237){
var statearr_20433_22203 = state_20284__$1;
(statearr_20433_22203[(1)] = (17));

} else {
var statearr_20434_22204 = state_20284__$1;
(statearr_20434_22204[(1)] = (18));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (16))){
var inst_20262 = (state_20284[(2)]);
var state_20284__$1 = state_20284;
var statearr_20435_22206 = state_20284__$1;
(statearr_20435_22206[(2)] = inst_20262);

(statearr_20435_22206[(1)] = (12));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20285 === (10))){
var inst_20216 = (state_20284[(8)]);
var inst_20211 = (state_20284[(9)]);
var inst_20223 = cljs.core._nth(inst_20211,inst_20216);
var state_20284__$1 = state_20284;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20284__$1,(13),out,inst_20223);
} else {
if((state_val_20285 === (18))){
var inst_20235 = (state_20284[(7)]);
var inst_20247 = cljs.core.first(inst_20235);
var state_20284__$1 = state_20284;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20284__$1,(20),out,inst_20247);
} else {
if((state_val_20285 === (8))){
var inst_20216 = (state_20284[(8)]);
var inst_20212 = (state_20284[(10)]);
var inst_20219 = (inst_20216 < inst_20212);
var inst_20220 = inst_20219;
var state_20284__$1 = state_20284;
if(cljs.core.truth_(inst_20220)){
var statearr_20456_22219 = state_20284__$1;
(statearr_20456_22219[(1)] = (10));

} else {
var statearr_20458_22220 = state_20284__$1;
(statearr_20458_22220[(1)] = (11));

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
var cljs$core$async$mapcat_STAR__$_state_machine__15982__auto__ = null;
var cljs$core$async$mapcat_STAR__$_state_machine__15982__auto____0 = (function (){
var statearr_20479 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_20479[(0)] = cljs$core$async$mapcat_STAR__$_state_machine__15982__auto__);

(statearr_20479[(1)] = (1));

return statearr_20479;
});
var cljs$core$async$mapcat_STAR__$_state_machine__15982__auto____1 = (function (state_20284){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_20284);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e20486){var ex__15985__auto__ = e20486;
var statearr_20488_22228 = state_20284;
(statearr_20488_22228[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_20284[(4)]))){
var statearr_20489_22229 = state_20284;
(statearr_20489_22229[(1)] = cljs.core.first((state_20284[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22230 = state_20284;
state_20284 = G__22230;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$mapcat_STAR__$_state_machine__15982__auto__ = function(state_20284){
switch(arguments.length){
case 0:
return cljs$core$async$mapcat_STAR__$_state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$mapcat_STAR__$_state_machine__15982__auto____1.call(this,state_20284);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$mapcat_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$mapcat_STAR__$_state_machine__15982__auto____0;
cljs$core$async$mapcat_STAR__$_state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$mapcat_STAR__$_state_machine__15982__auto____1;
return cljs$core$async$mapcat_STAR__$_state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_20491 = f__16830__auto__();
(statearr_20491[(6)] = c__16829__auto__);

return statearr_20491;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));

return c__16829__auto__;
});
/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.mapcat_LT_ = (function cljs$core$async$mapcat_LT_(var_args){
var G__20496 = arguments.length;
switch (G__20496) {
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
var G__20498 = arguments.length;
switch (G__20498) {
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
var G__20519 = arguments.length;
switch (G__20519) {
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
var c__16829__auto___22247 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_20560){
var state_val_20561 = (state_20560[(1)]);
if((state_val_20561 === (7))){
var inst_20553 = (state_20560[(2)]);
var state_20560__$1 = state_20560;
var statearr_20579_22249 = state_20560__$1;
(statearr_20579_22249[(2)] = inst_20553);

(statearr_20579_22249[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20561 === (1))){
var inst_20533 = null;
var state_20560__$1 = (function (){var statearr_20587 = state_20560;
(statearr_20587[(7)] = inst_20533);

return statearr_20587;
})();
var statearr_20588_22250 = state_20560__$1;
(statearr_20588_22250[(2)] = null);

(statearr_20588_22250[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20561 === (4))){
var inst_20537 = (state_20560[(8)]);
var inst_20537__$1 = (state_20560[(2)]);
var inst_20538 = (inst_20537__$1 == null);
var inst_20539 = cljs.core.not(inst_20538);
var state_20560__$1 = (function (){var statearr_20593 = state_20560;
(statearr_20593[(8)] = inst_20537__$1);

return statearr_20593;
})();
if(inst_20539){
var statearr_20595_22251 = state_20560__$1;
(statearr_20595_22251[(1)] = (5));

} else {
var statearr_20597_22252 = state_20560__$1;
(statearr_20597_22252[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20561 === (6))){
var state_20560__$1 = state_20560;
var statearr_20600_22253 = state_20560__$1;
(statearr_20600_22253[(2)] = null);

(statearr_20600_22253[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20561 === (3))){
var inst_20555 = (state_20560[(2)]);
var inst_20556 = cljs.core.async.close_BANG_(out);
var state_20560__$1 = (function (){var statearr_20605 = state_20560;
(statearr_20605[(9)] = inst_20555);

return statearr_20605;
})();
return cljs.core.async.impl.ioc_helpers.return_chan(state_20560__$1,inst_20556);
} else {
if((state_val_20561 === (2))){
var state_20560__$1 = state_20560;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_20560__$1,(4),ch);
} else {
if((state_val_20561 === (11))){
var inst_20537 = (state_20560[(8)]);
var inst_20547 = (state_20560[(2)]);
var inst_20533 = inst_20537;
var state_20560__$1 = (function (){var statearr_20609 = state_20560;
(statearr_20609[(7)] = inst_20533);

(statearr_20609[(10)] = inst_20547);

return statearr_20609;
})();
var statearr_20610_22255 = state_20560__$1;
(statearr_20610_22255[(2)] = null);

(statearr_20610_22255[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20561 === (9))){
var inst_20537 = (state_20560[(8)]);
var state_20560__$1 = state_20560;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20560__$1,(11),out,inst_20537);
} else {
if((state_val_20561 === (5))){
var inst_20533 = (state_20560[(7)]);
var inst_20537 = (state_20560[(8)]);
var inst_20541 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_20537,inst_20533);
var state_20560__$1 = state_20560;
if(inst_20541){
var statearr_20614_22259 = state_20560__$1;
(statearr_20614_22259[(1)] = (8));

} else {
var statearr_20615_22260 = state_20560__$1;
(statearr_20615_22260[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20561 === (10))){
var inst_20550 = (state_20560[(2)]);
var state_20560__$1 = state_20560;
var statearr_20616_22261 = state_20560__$1;
(statearr_20616_22261[(2)] = inst_20550);

(statearr_20616_22261[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20561 === (8))){
var inst_20533 = (state_20560[(7)]);
var tmp20612 = inst_20533;
var inst_20533__$1 = tmp20612;
var state_20560__$1 = (function (){var statearr_20618 = state_20560;
(statearr_20618[(7)] = inst_20533__$1);

return statearr_20618;
})();
var statearr_20619_22262 = state_20560__$1;
(statearr_20619_22262[(2)] = null);

(statearr_20619_22262[(1)] = (2));


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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_20623 = [null,null,null,null,null,null,null,null,null,null,null];
(statearr_20623[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_20623[(1)] = (1));

return statearr_20623;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_20560){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_20560);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e20625){var ex__15985__auto__ = e20625;
var statearr_20626_22264 = state_20560;
(statearr_20626_22264[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_20560[(4)]))){
var statearr_20631_22265 = state_20560;
(statearr_20631_22265[(1)] = cljs.core.first((state_20560[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22267 = state_20560;
state_20560 = G__22267;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_20560){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_20560);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_20642 = f__16830__auto__();
(statearr_20642[(6)] = c__16829__auto___22247);

return statearr_20642;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));


return out;
}));

(cljs.core.async.unique.cljs$lang$maxFixedArity = 2);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition = (function cljs$core$async$partition(var_args){
var G__20659 = arguments.length;
switch (G__20659) {
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
var c__16829__auto___22284 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_20720){
var state_val_20721 = (state_20720[(1)]);
if((state_val_20721 === (7))){
var inst_20716 = (state_20720[(2)]);
var state_20720__$1 = state_20720;
var statearr_20722_22287 = state_20720__$1;
(statearr_20722_22287[(2)] = inst_20716);

(statearr_20722_22287[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (1))){
var inst_20683 = (new Array(n));
var inst_20684 = inst_20683;
var inst_20685 = (0);
var state_20720__$1 = (function (){var statearr_20723 = state_20720;
(statearr_20723[(7)] = inst_20685);

(statearr_20723[(8)] = inst_20684);

return statearr_20723;
})();
var statearr_20724_22292 = state_20720__$1;
(statearr_20724_22292[(2)] = null);

(statearr_20724_22292[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (4))){
var inst_20688 = (state_20720[(9)]);
var inst_20688__$1 = (state_20720[(2)]);
var inst_20689 = (inst_20688__$1 == null);
var inst_20690 = cljs.core.not(inst_20689);
var state_20720__$1 = (function (){var statearr_20725 = state_20720;
(statearr_20725[(9)] = inst_20688__$1);

return statearr_20725;
})();
if(inst_20690){
var statearr_20727_22293 = state_20720__$1;
(statearr_20727_22293[(1)] = (5));

} else {
var statearr_20729_22294 = state_20720__$1;
(statearr_20729_22294[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (15))){
var inst_20710 = (state_20720[(2)]);
var state_20720__$1 = state_20720;
var statearr_20733_22295 = state_20720__$1;
(statearr_20733_22295[(2)] = inst_20710);

(statearr_20733_22295[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (13))){
var state_20720__$1 = state_20720;
var statearr_20736_22296 = state_20720__$1;
(statearr_20736_22296[(2)] = null);

(statearr_20736_22296[(1)] = (14));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (6))){
var inst_20685 = (state_20720[(7)]);
var inst_20706 = (inst_20685 > (0));
var state_20720__$1 = state_20720;
if(cljs.core.truth_(inst_20706)){
var statearr_20747_22297 = state_20720__$1;
(statearr_20747_22297[(1)] = (12));

} else {
var statearr_20748_22298 = state_20720__$1;
(statearr_20748_22298[(1)] = (13));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (3))){
var inst_20718 = (state_20720[(2)]);
var state_20720__$1 = state_20720;
return cljs.core.async.impl.ioc_helpers.return_chan(state_20720__$1,inst_20718);
} else {
if((state_val_20721 === (12))){
var inst_20684 = (state_20720[(8)]);
var inst_20708 = cljs.core.vec(inst_20684);
var state_20720__$1 = state_20720;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20720__$1,(15),out,inst_20708);
} else {
if((state_val_20721 === (2))){
var state_20720__$1 = state_20720;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_20720__$1,(4),ch);
} else {
if((state_val_20721 === (11))){
var inst_20700 = (state_20720[(2)]);
var inst_20701 = (new Array(n));
var inst_20684 = inst_20701;
var inst_20685 = (0);
var state_20720__$1 = (function (){var statearr_20758 = state_20720;
(statearr_20758[(10)] = inst_20700);

(statearr_20758[(7)] = inst_20685);

(statearr_20758[(8)] = inst_20684);

return statearr_20758;
})();
var statearr_20762_22299 = state_20720__$1;
(statearr_20762_22299[(2)] = null);

(statearr_20762_22299[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (9))){
var inst_20684 = (state_20720[(8)]);
var inst_20698 = cljs.core.vec(inst_20684);
var state_20720__$1 = state_20720;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20720__$1,(11),out,inst_20698);
} else {
if((state_val_20721 === (5))){
var inst_20685 = (state_20720[(7)]);
var inst_20693 = (state_20720[(11)]);
var inst_20688 = (state_20720[(9)]);
var inst_20684 = (state_20720[(8)]);
var inst_20692 = (inst_20684[inst_20685] = inst_20688);
var inst_20693__$1 = (inst_20685 + (1));
var inst_20694 = (inst_20693__$1 < n);
var state_20720__$1 = (function (){var statearr_20764 = state_20720;
(statearr_20764[(11)] = inst_20693__$1);

(statearr_20764[(12)] = inst_20692);

return statearr_20764;
})();
if(cljs.core.truth_(inst_20694)){
var statearr_20765_22300 = state_20720__$1;
(statearr_20765_22300[(1)] = (8));

} else {
var statearr_20766_22301 = state_20720__$1;
(statearr_20766_22301[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (14))){
var inst_20713 = (state_20720[(2)]);
var inst_20714 = cljs.core.async.close_BANG_(out);
var state_20720__$1 = (function (){var statearr_20768 = state_20720;
(statearr_20768[(13)] = inst_20713);

return statearr_20768;
})();
var statearr_20769_22302 = state_20720__$1;
(statearr_20769_22302[(2)] = inst_20714);

(statearr_20769_22302[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (10))){
var inst_20704 = (state_20720[(2)]);
var state_20720__$1 = state_20720;
var statearr_20771_22303 = state_20720__$1;
(statearr_20771_22303[(2)] = inst_20704);

(statearr_20771_22303[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20721 === (8))){
var inst_20693 = (state_20720[(11)]);
var inst_20684 = (state_20720[(8)]);
var tmp20767 = inst_20684;
var inst_20684__$1 = tmp20767;
var inst_20685 = inst_20693;
var state_20720__$1 = (function (){var statearr_20772 = state_20720;
(statearr_20772[(7)] = inst_20685);

(statearr_20772[(8)] = inst_20684__$1);

return statearr_20772;
})();
var statearr_20775_22308 = state_20720__$1;
(statearr_20775_22308[(2)] = null);

(statearr_20775_22308[(1)] = (2));


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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_20777 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_20777[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_20777[(1)] = (1));

return statearr_20777;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_20720){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_20720);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e20778){var ex__15985__auto__ = e20778;
var statearr_20779_22310 = state_20720;
(statearr_20779_22310[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_20720[(4)]))){
var statearr_20780_22311 = state_20720;
(statearr_20780_22311[(1)] = cljs.core.first((state_20720[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22312 = state_20720;
state_20720 = G__22312;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_20720){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_20720);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_20790 = f__16830__auto__();
(statearr_20790[(6)] = c__16829__auto___22284);

return statearr_20790;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));


return out;
}));

(cljs.core.async.partition.cljs$lang$maxFixedArity = 3);

/**
 * Deprecated - this function will be removed. Use transducer instead
 */
cljs.core.async.partition_by = (function cljs$core$async$partition_by(var_args){
var G__20793 = arguments.length;
switch (G__20793) {
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
var c__16829__auto___22314 = cljs.core.async.chan.cljs$core$IFn$_invoke$arity$1((1));
cljs.core.async.impl.dispatch.run((function (){
var f__16830__auto__ = (function (){var switch__15981__auto__ = (function (state_20842){
var state_val_20843 = (state_20842[(1)]);
if((state_val_20843 === (7))){
var inst_20838 = (state_20842[(2)]);
var state_20842__$1 = state_20842;
var statearr_20861_22315 = state_20842__$1;
(statearr_20861_22315[(2)] = inst_20838);

(statearr_20861_22315[(1)] = (3));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (1))){
var inst_20796 = [];
var inst_20797 = inst_20796;
var inst_20798 = new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123);
var state_20842__$1 = (function (){var statearr_20862 = state_20842;
(statearr_20862[(7)] = inst_20798);

(statearr_20862[(8)] = inst_20797);

return statearr_20862;
})();
var statearr_20869_22316 = state_20842__$1;
(statearr_20869_22316[(2)] = null);

(statearr_20869_22316[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (4))){
var inst_20801 = (state_20842[(9)]);
var inst_20801__$1 = (state_20842[(2)]);
var inst_20802 = (inst_20801__$1 == null);
var inst_20803 = cljs.core.not(inst_20802);
var state_20842__$1 = (function (){var statearr_20879 = state_20842;
(statearr_20879[(9)] = inst_20801__$1);

return statearr_20879;
})();
if(inst_20803){
var statearr_20880_22318 = state_20842__$1;
(statearr_20880_22318[(1)] = (5));

} else {
var statearr_20881_22319 = state_20842__$1;
(statearr_20881_22319[(1)] = (6));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (15))){
var inst_20797 = (state_20842[(8)]);
var inst_20830 = cljs.core.vec(inst_20797);
var state_20842__$1 = state_20842;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20842__$1,(18),out,inst_20830);
} else {
if((state_val_20843 === (13))){
var inst_20825 = (state_20842[(2)]);
var state_20842__$1 = state_20842;
var statearr_20887_22321 = state_20842__$1;
(statearr_20887_22321[(2)] = inst_20825);

(statearr_20887_22321[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (6))){
var inst_20797 = (state_20842[(8)]);
var inst_20827 = inst_20797.length;
var inst_20828 = (inst_20827 > (0));
var state_20842__$1 = state_20842;
if(cljs.core.truth_(inst_20828)){
var statearr_20895_22323 = state_20842__$1;
(statearr_20895_22323[(1)] = (15));

} else {
var statearr_20896_22324 = state_20842__$1;
(statearr_20896_22324[(1)] = (16));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (17))){
var inst_20835 = (state_20842[(2)]);
var inst_20836 = cljs.core.async.close_BANG_(out);
var state_20842__$1 = (function (){var statearr_20898 = state_20842;
(statearr_20898[(10)] = inst_20835);

return statearr_20898;
})();
var statearr_20900_22325 = state_20842__$1;
(statearr_20900_22325[(2)] = inst_20836);

(statearr_20900_22325[(1)] = (7));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (3))){
var inst_20840 = (state_20842[(2)]);
var state_20842__$1 = state_20842;
return cljs.core.async.impl.ioc_helpers.return_chan(state_20842__$1,inst_20840);
} else {
if((state_val_20843 === (12))){
var inst_20797 = (state_20842[(8)]);
var inst_20818 = cljs.core.vec(inst_20797);
var state_20842__$1 = state_20842;
return cljs.core.async.impl.ioc_helpers.put_BANG_(state_20842__$1,(14),out,inst_20818);
} else {
if((state_val_20843 === (2))){
var state_20842__$1 = state_20842;
return cljs.core.async.impl.ioc_helpers.take_BANG_(state_20842__$1,(4),ch);
} else {
if((state_val_20843 === (11))){
var inst_20801 = (state_20842[(9)]);
var inst_20797 = (state_20842[(8)]);
var inst_20805 = (state_20842[(11)]);
var inst_20815 = inst_20797.push(inst_20801);
var tmp20906 = inst_20797;
var inst_20797__$1 = tmp20906;
var inst_20798 = inst_20805;
var state_20842__$1 = (function (){var statearr_20908 = state_20842;
(statearr_20908[(7)] = inst_20798);

(statearr_20908[(12)] = inst_20815);

(statearr_20908[(8)] = inst_20797__$1);

return statearr_20908;
})();
var statearr_20909_22327 = state_20842__$1;
(statearr_20909_22327[(2)] = null);

(statearr_20909_22327[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (9))){
var inst_20798 = (state_20842[(7)]);
var inst_20810 = cljs.core.keyword_identical_QMARK_(inst_20798,new cljs.core.Keyword("cljs.core.async","nothing","cljs.core.async/nothing",-69252123));
var state_20842__$1 = state_20842;
var statearr_20919_22328 = state_20842__$1;
(statearr_20919_22328[(2)] = inst_20810);

(statearr_20919_22328[(1)] = (10));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (5))){
var inst_20801 = (state_20842[(9)]);
var inst_20807 = (state_20842[(13)]);
var inst_20798 = (state_20842[(7)]);
var inst_20805 = (state_20842[(11)]);
var inst_20805__$1 = (f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(inst_20801) : f.call(null,inst_20801));
var inst_20807__$1 = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(inst_20805__$1,inst_20798);
var state_20842__$1 = (function (){var statearr_20922 = state_20842;
(statearr_20922[(13)] = inst_20807__$1);

(statearr_20922[(11)] = inst_20805__$1);

return statearr_20922;
})();
if(inst_20807__$1){
var statearr_20926_22330 = state_20842__$1;
(statearr_20926_22330[(1)] = (8));

} else {
var statearr_20927_22331 = state_20842__$1;
(statearr_20927_22331[(1)] = (9));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (14))){
var inst_20801 = (state_20842[(9)]);
var inst_20805 = (state_20842[(11)]);
var inst_20820 = (state_20842[(2)]);
var inst_20821 = [];
var inst_20822 = inst_20821.push(inst_20801);
var inst_20797 = inst_20821;
var inst_20798 = inst_20805;
var state_20842__$1 = (function (){var statearr_20932 = state_20842;
(statearr_20932[(14)] = inst_20822);

(statearr_20932[(7)] = inst_20798);

(statearr_20932[(15)] = inst_20820);

(statearr_20932[(8)] = inst_20797);

return statearr_20932;
})();
var statearr_20933_22333 = state_20842__$1;
(statearr_20933_22333[(2)] = null);

(statearr_20933_22333[(1)] = (2));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (16))){
var state_20842__$1 = state_20842;
var statearr_20935_22334 = state_20842__$1;
(statearr_20935_22334[(2)] = null);

(statearr_20935_22334[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (10))){
var inst_20812 = (state_20842[(2)]);
var state_20842__$1 = state_20842;
if(cljs.core.truth_(inst_20812)){
var statearr_20937_22335 = state_20842__$1;
(statearr_20937_22335[(1)] = (11));

} else {
var statearr_20938_22336 = state_20842__$1;
(statearr_20938_22336[(1)] = (12));

}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (18))){
var inst_20832 = (state_20842[(2)]);
var state_20842__$1 = state_20842;
var statearr_20940_22337 = state_20842__$1;
(statearr_20940_22337[(2)] = inst_20832);

(statearr_20940_22337[(1)] = (17));


return new cljs.core.Keyword(null,"recur","recur",-437573268);
} else {
if((state_val_20843 === (8))){
var inst_20807 = (state_20842[(13)]);
var state_20842__$1 = state_20842;
var statearr_20943_22339 = state_20842__$1;
(statearr_20943_22339[(2)] = inst_20807);

(statearr_20943_22339[(1)] = (10));


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
var cljs$core$async$state_machine__15982__auto__ = null;
var cljs$core$async$state_machine__15982__auto____0 = (function (){
var statearr_20945 = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
(statearr_20945[(0)] = cljs$core$async$state_machine__15982__auto__);

(statearr_20945[(1)] = (1));

return statearr_20945;
});
var cljs$core$async$state_machine__15982__auto____1 = (function (state_20842){
while(true){
var ret_value__15983__auto__ = (function (){try{while(true){
var result__15984__auto__ = switch__15981__auto__(state_20842);
if(cljs.core.keyword_identical_QMARK_(result__15984__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
continue;
} else {
return result__15984__auto__;
}
break;
}
}catch (e20950){var ex__15985__auto__ = e20950;
var statearr_20951_22346 = state_20842;
(statearr_20951_22346[(2)] = ex__15985__auto__);


if(cljs.core.seq((state_20842[(4)]))){
var statearr_20952_22348 = state_20842;
(statearr_20952_22348[(1)] = cljs.core.first((state_20842[(4)])));

} else {
throw ex__15985__auto__;
}

return new cljs.core.Keyword(null,"recur","recur",-437573268);
}})();
if(cljs.core.keyword_identical_QMARK_(ret_value__15983__auto__,new cljs.core.Keyword(null,"recur","recur",-437573268))){
var G__22351 = state_20842;
state_20842 = G__22351;
continue;
} else {
return ret_value__15983__auto__;
}
break;
}
});
cljs$core$async$state_machine__15982__auto__ = function(state_20842){
switch(arguments.length){
case 0:
return cljs$core$async$state_machine__15982__auto____0.call(this);
case 1:
return cljs$core$async$state_machine__15982__auto____1.call(this,state_20842);
}
throw(new Error('Invalid arity: ' + arguments.length));
};
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$0 = cljs$core$async$state_machine__15982__auto____0;
cljs$core$async$state_machine__15982__auto__.cljs$core$IFn$_invoke$arity$1 = cljs$core$async$state_machine__15982__auto____1;
return cljs$core$async$state_machine__15982__auto__;
})()
})();
var state__16831__auto__ = (function (){var statearr_20961 = f__16830__auto__();
(statearr_20961[(6)] = c__16829__auto___22314);

return statearr_20961;
})();
return cljs.core.async.impl.ioc_helpers.run_state_machine_wrapped(state__16831__auto__);
}));


return out;
}));

(cljs.core.async.partition_by.cljs$lang$maxFixedArity = 3);


//# sourceMappingURL=cljs.core.async.js.map
