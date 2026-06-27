goog.provide('reagent.debug');
reagent.debug.has_console = (typeof console !== 'undefined');
reagent.debug.tracking = false;
if((typeof reagent !== 'undefined') && (typeof reagent.debug !== 'undefined') && (typeof reagent.debug.warnings !== 'undefined')){
} else {
reagent.debug.warnings = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof reagent !== 'undefined') && (typeof reagent.debug !== 'undefined') && (typeof reagent.debug.track_console !== 'undefined')){
} else {
reagent.debug.track_console = (function (){var o = ({});
(o.warn = (function() { 
var G__19852__delegate = function (args){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(reagent.debug.warnings,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"warn","warn",-436710552)], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,args)], 0));
};
var G__19852 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__19857__i = 0, G__19857__a = new Array(arguments.length -  0);
while (G__19857__i < G__19857__a.length) {G__19857__a[G__19857__i] = arguments[G__19857__i + 0]; ++G__19857__i;}
  args = new cljs.core.IndexedSeq(G__19857__a,0,null);
} 
return G__19852__delegate.call(this,args);};
G__19852.cljs$lang$maxFixedArity = 0;
G__19852.cljs$lang$applyTo = (function (arglist__19858){
var args = cljs.core.seq(arglist__19858);
return G__19852__delegate(args);
});
G__19852.cljs$core$IFn$_invoke$arity$variadic = G__19852__delegate;
return G__19852;
})()
);

(o.error = (function() { 
var G__19862__delegate = function (args){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(reagent.debug.warnings,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"error","error",-978969032)], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,args)], 0));
};
var G__19862 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__19867__i = 0, G__19867__a = new Array(arguments.length -  0);
while (G__19867__i < G__19867__a.length) {G__19867__a[G__19867__i] = arguments[G__19867__i + 0]; ++G__19867__i;}
  args = new cljs.core.IndexedSeq(G__19867__a,0,null);
} 
return G__19862__delegate.call(this,args);};
G__19862.cljs$lang$maxFixedArity = 0;
G__19862.cljs$lang$applyTo = (function (arglist__19870){
var args = cljs.core.seq(arglist__19870);
return G__19862__delegate(args);
});
G__19862.cljs$core$IFn$_invoke$arity$variadic = G__19862__delegate;
return G__19862;
})()
);

return o;
})();
}
reagent.debug.track_warnings = (function reagent$debug$track_warnings(f){
(reagent.debug.tracking = true);

cljs.core.reset_BANG_(reagent.debug.warnings,null);

(f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));

var warns = cljs.core.deref(reagent.debug.warnings);
cljs.core.reset_BANG_(reagent.debug.warnings,null);

(reagent.debug.tracking = false);

return warns;
});

//# sourceMappingURL=reagent.debug.js.map
