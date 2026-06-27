goog.provide('shadow.dom');
shadow.dom.transition_supported_QMARK_ = true;

/**
 * @interface
 */
shadow.dom.IElement = function(){};

var shadow$dom$IElement$_to_dom$dyn_243320 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (shadow.dom._to_dom[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (shadow.dom._to_dom["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("IElement.-to-dom",this$);
}
}
});
shadow.dom._to_dom = (function shadow$dom$_to_dom(this$){
if((((!((this$ == null)))) && ((!((this$.shadow$dom$IElement$_to_dom$arity$1 == null)))))){
return this$.shadow$dom$IElement$_to_dom$arity$1(this$);
} else {
return shadow$dom$IElement$_to_dom$dyn_243320(this$);
}
});


/**
 * @interface
 */
shadow.dom.SVGElement = function(){};

var shadow$dom$SVGElement$_to_svg$dyn_243326 = (function (this$){
var x__5350__auto__ = (((this$ == null))?null:this$);
var m__5351__auto__ = (shadow.dom._to_svg[goog.typeOf(x__5350__auto__)]);
if((!((m__5351__auto__ == null)))){
return (m__5351__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5351__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5351__auto__.call(null,this$));
} else {
var m__5349__auto__ = (shadow.dom._to_svg["_"]);
if((!((m__5349__auto__ == null)))){
return (m__5349__auto__.cljs$core$IFn$_invoke$arity$1 ? m__5349__auto__.cljs$core$IFn$_invoke$arity$1(this$) : m__5349__auto__.call(null,this$));
} else {
throw cljs.core.missing_protocol("SVGElement.-to-svg",this$);
}
}
});
shadow.dom._to_svg = (function shadow$dom$_to_svg(this$){
if((((!((this$ == null)))) && ((!((this$.shadow$dom$SVGElement$_to_svg$arity$1 == null)))))){
return this$.shadow$dom$SVGElement$_to_svg$arity$1(this$);
} else {
return shadow$dom$SVGElement$_to_svg$dyn_243326(this$);
}
});

shadow.dom.lazy_native_coll_seq = (function shadow$dom$lazy_native_coll_seq(coll,idx){
if((idx < coll.length)){
return (new cljs.core.LazySeq(null,(function (){
return cljs.core.cons((coll[idx]),(function (){var G__242449 = coll;
var G__242450 = (idx + (1));
return (shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2 ? shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2(G__242449,G__242450) : shadow.dom.lazy_native_coll_seq.call(null,G__242449,G__242450));
})());
}),null,null));
} else {
return null;
}
});

/**
* @constructor
 * @implements {cljs.core.IIndexed}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IDeref}
 * @implements {shadow.dom.IElement}
*/
shadow.dom.NativeColl = (function (coll){
this.coll = coll;
this.cljs$lang$protocol_mask$partition0$ = 8421394;
this.cljs$lang$protocol_mask$partition1$ = 0;
});
(shadow.dom.NativeColl.prototype.cljs$core$IDeref$_deref$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return self__.coll;
}));

(shadow.dom.NativeColl.prototype.cljs$core$IIndexed$_nth$arity$2 = (function (this$,n){
var self__ = this;
var this$__$1 = this;
return (self__.coll[n]);
}));

(shadow.dom.NativeColl.prototype.cljs$core$IIndexed$_nth$arity$3 = (function (this$,n,not_found){
var self__ = this;
var this$__$1 = this;
var or__5002__auto__ = (self__.coll[n]);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return not_found;
}
}));

(shadow.dom.NativeColl.prototype.cljs$core$ICounted$_count$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return self__.coll.length;
}));

(shadow.dom.NativeColl.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return shadow.dom.lazy_native_coll_seq(self__.coll,(0));
}));

(shadow.dom.NativeColl.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(shadow.dom.NativeColl.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var self__ = this;
var this$__$1 = this;
return self__.coll;
}));

(shadow.dom.NativeColl.getBasis = (function (){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"coll","coll",-1006698606,null)], null);
}));

(shadow.dom.NativeColl.cljs$lang$type = true);

(shadow.dom.NativeColl.cljs$lang$ctorStr = "shadow.dom/NativeColl");

(shadow.dom.NativeColl.cljs$lang$ctorPrWriter = (function (this__5287__auto__,writer__5288__auto__,opt__5289__auto__){
return cljs.core._write(writer__5288__auto__,"shadow.dom/NativeColl");
}));

/**
 * Positional factory function for shadow.dom/NativeColl.
 */
shadow.dom.__GT_NativeColl = (function shadow$dom$__GT_NativeColl(coll){
return (new shadow.dom.NativeColl(coll));
});

shadow.dom.native_coll = (function shadow$dom$native_coll(coll){
return (new shadow.dom.NativeColl(coll));
});
shadow.dom.dom_node = (function shadow$dom$dom_node(el){
if((el == null)){
return null;
} else {
if((((!((el == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === el.shadow$dom$IElement$))))?true:false):false)){
return el.shadow$dom$IElement$_to_dom$arity$1(null);
} else {
if(typeof el === 'string'){
return document.createTextNode(el);
} else {
if(typeof el === 'number'){
return document.createTextNode(cljs.core.str.cljs$core$IFn$_invoke$arity$1(el));
} else {
return el;

}
}
}
}
});
shadow.dom.query_one = (function shadow$dom$query_one(var_args){
var G__242511 = arguments.length;
switch (G__242511) {
case 1:
return shadow.dom.query_one.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.query_one.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.query_one.cljs$core$IFn$_invoke$arity$1 = (function (sel){
return document.querySelector(sel);
}));

(shadow.dom.query_one.cljs$core$IFn$_invoke$arity$2 = (function (sel,root){
return shadow.dom.dom_node(root).querySelector(sel);
}));

(shadow.dom.query_one.cljs$lang$maxFixedArity = 2);

shadow.dom.query = (function shadow$dom$query(var_args){
var G__242528 = arguments.length;
switch (G__242528) {
case 1:
return shadow.dom.query.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.query.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.query.cljs$core$IFn$_invoke$arity$1 = (function (sel){
return (new shadow.dom.NativeColl(document.querySelectorAll(sel)));
}));

(shadow.dom.query.cljs$core$IFn$_invoke$arity$2 = (function (sel,root){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(root).querySelectorAll(sel)));
}));

(shadow.dom.query.cljs$lang$maxFixedArity = 2);

shadow.dom.by_id = (function shadow$dom$by_id(var_args){
var G__242589 = arguments.length;
switch (G__242589) {
case 2:
return shadow.dom.by_id.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return shadow.dom.by_id.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.by_id.cljs$core$IFn$_invoke$arity$2 = (function (id,el){
return shadow.dom.dom_node(el).getElementById(id);
}));

(shadow.dom.by_id.cljs$core$IFn$_invoke$arity$1 = (function (id){
return document.getElementById(id);
}));

(shadow.dom.by_id.cljs$lang$maxFixedArity = 2);

shadow.dom.build = shadow.dom.dom_node;
shadow.dom.ev_stop = (function shadow$dom$ev_stop(var_args){
var G__242607 = arguments.length;
switch (G__242607) {
case 1:
return shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 4:
return shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1 = (function (e){
if(cljs.core.truth_(e.stopPropagation)){
e.stopPropagation();

e.preventDefault();
} else {
(e.cancelBubble = true);

(e.returnValue = false);
}

return e;
}));

(shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$2 = (function (e,el){
shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1(e);

return el;
}));

(shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$4 = (function (e,el,scope,owner){
shadow.dom.ev_stop.cljs$core$IFn$_invoke$arity$1(e);

return el;
}));

(shadow.dom.ev_stop.cljs$lang$maxFixedArity = 4);

/**
 * check wether a parent node (or the document) contains the child
 */
shadow.dom.contains_QMARK_ = (function shadow$dom$contains_QMARK_(var_args){
var G__242615 = arguments.length;
switch (G__242615) {
case 1:
return shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$1 = (function (el){
return goog.dom.contains(document,shadow.dom.dom_node(el));
}));

(shadow.dom.contains_QMARK_.cljs$core$IFn$_invoke$arity$2 = (function (parent,el){
return goog.dom.contains(shadow.dom.dom_node(parent),shadow.dom.dom_node(el));
}));

(shadow.dom.contains_QMARK_.cljs$lang$maxFixedArity = 2);

shadow.dom.add_class = (function shadow$dom$add_class(el,cls){
return goog.dom.classlist.add(shadow.dom.dom_node(el),cls);
});
shadow.dom.remove_class = (function shadow$dom$remove_class(el,cls){
return goog.dom.classlist.remove(shadow.dom.dom_node(el),cls);
});
shadow.dom.toggle_class = (function shadow$dom$toggle_class(var_args){
var G__242630 = arguments.length;
switch (G__242630) {
case 2:
return shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$2 = (function (el,cls){
return goog.dom.classlist.toggle(shadow.dom.dom_node(el),cls);
}));

(shadow.dom.toggle_class.cljs$core$IFn$_invoke$arity$3 = (function (el,cls,v){
if(cljs.core.truth_(v)){
return shadow.dom.add_class(el,cls);
} else {
return shadow.dom.remove_class(el,cls);
}
}));

(shadow.dom.toggle_class.cljs$lang$maxFixedArity = 3);

shadow.dom.dom_listen = (cljs.core.truth_((function (){var or__5002__auto__ = (!((typeof document !== 'undefined')));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return document.addEventListener;
}
})())?(function shadow$dom$dom_listen_good(el,ev,handler){
return el.addEventListener(ev,handler,false);
}):(function shadow$dom$dom_listen_ie(el,ev,handler){
try{return el.attachEvent(["on",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ev)].join(''),(function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
}));
}catch (e242654){if((e242654 instanceof Object)){
var e = e242654;
return console.log("didnt support attachEvent",el,e);
} else {
throw e242654;

}
}}));
shadow.dom.dom_listen_remove = (cljs.core.truth_((function (){var or__5002__auto__ = (!((typeof document !== 'undefined')));
if(or__5002__auto__){
return or__5002__auto__;
} else {
return document.removeEventListener;
}
})())?(function shadow$dom$dom_listen_remove_good(el,ev,handler){
return el.removeEventListener(ev,handler,false);
}):(function shadow$dom$dom_listen_remove_ie(el,ev,handler){
return el.detachEvent(["on",cljs.core.str.cljs$core$IFn$_invoke$arity$1(ev)].join(''),handler);
}));
shadow.dom.on_query = (function shadow$dom$on_query(root_el,ev,selector,handler){
var seq__242693 = cljs.core.seq(shadow.dom.query.cljs$core$IFn$_invoke$arity$2(selector,root_el));
var chunk__242694 = null;
var count__242695 = (0);
var i__242696 = (0);
while(true){
if((i__242696 < count__242695)){
var el = chunk__242694.cljs$core$IIndexed$_nth$arity$2(null,i__242696);
var handler_243353__$1 = ((function (seq__242693,chunk__242694,count__242695,i__242696,el){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__242693,chunk__242694,count__242695,i__242696,el))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_243353__$1);


var G__243354 = seq__242693;
var G__243355 = chunk__242694;
var G__243356 = count__242695;
var G__243357 = (i__242696 + (1));
seq__242693 = G__243354;
chunk__242694 = G__243355;
count__242695 = G__243356;
i__242696 = G__243357;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__242693);
if(temp__5804__auto__){
var seq__242693__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__242693__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__242693__$1);
var G__243358 = cljs.core.chunk_rest(seq__242693__$1);
var G__243359 = c__5525__auto__;
var G__243360 = cljs.core.count(c__5525__auto__);
var G__243361 = (0);
seq__242693 = G__243358;
chunk__242694 = G__243359;
count__242695 = G__243360;
i__242696 = G__243361;
continue;
} else {
var el = cljs.core.first(seq__242693__$1);
var handler_243362__$1 = ((function (seq__242693,chunk__242694,count__242695,i__242696,el,seq__242693__$1,temp__5804__auto__){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__242693,chunk__242694,count__242695,i__242696,el,seq__242693__$1,temp__5804__auto__))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_243362__$1);


var G__243363 = cljs.core.next(seq__242693__$1);
var G__243364 = null;
var G__243365 = (0);
var G__243366 = (0);
seq__242693 = G__243363;
chunk__242694 = G__243364;
count__242695 = G__243365;
i__242696 = G__243366;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.dom.on = (function shadow$dom$on(var_args){
var G__242715 = arguments.length;
switch (G__242715) {
case 3:
return shadow.dom.on.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 4:
return shadow.dom.on.cljs$core$IFn$_invoke$arity$4((arguments[(0)]),(arguments[(1)]),(arguments[(2)]),(arguments[(3)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.on.cljs$core$IFn$_invoke$arity$3 = (function (el,ev,handler){
return shadow.dom.on.cljs$core$IFn$_invoke$arity$4(el,ev,handler,false);
}));

(shadow.dom.on.cljs$core$IFn$_invoke$arity$4 = (function (el,ev,handler,capture){
if(cljs.core.vector_QMARK_(ev)){
return shadow.dom.on_query(el,cljs.core.first(ev),cljs.core.second(ev),handler);
} else {
var handler__$1 = (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});
return shadow.dom.dom_listen(shadow.dom.dom_node(el),cljs.core.name(ev),handler__$1);
}
}));

(shadow.dom.on.cljs$lang$maxFixedArity = 4);

shadow.dom.remove_event_handler = (function shadow$dom$remove_event_handler(el,ev,handler){
return shadow.dom.dom_listen_remove(shadow.dom.dom_node(el),cljs.core.name(ev),handler);
});
shadow.dom.add_event_listeners = (function shadow$dom$add_event_listeners(el,events){
var seq__242722 = cljs.core.seq(events);
var chunk__242725 = null;
var count__242726 = (0);
var i__242727 = (0);
while(true){
if((i__242727 < count__242726)){
var vec__242737 = chunk__242725.cljs$core$IIndexed$_nth$arity$2(null,i__242727);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242737,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242737,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__243373 = seq__242722;
var G__243374 = chunk__242725;
var G__243375 = count__242726;
var G__243376 = (i__242727 + (1));
seq__242722 = G__243373;
chunk__242725 = G__243374;
count__242726 = G__243375;
i__242727 = G__243376;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__242722);
if(temp__5804__auto__){
var seq__242722__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__242722__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__242722__$1);
var G__243377 = cljs.core.chunk_rest(seq__242722__$1);
var G__243378 = c__5525__auto__;
var G__243379 = cljs.core.count(c__5525__auto__);
var G__243380 = (0);
seq__242722 = G__243377;
chunk__242725 = G__243378;
count__242726 = G__243379;
i__242727 = G__243380;
continue;
} else {
var vec__242743 = cljs.core.first(seq__242722__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242743,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242743,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__243381 = cljs.core.next(seq__242722__$1);
var G__243382 = null;
var G__243383 = (0);
var G__243384 = (0);
seq__242722 = G__243381;
chunk__242725 = G__243382;
count__242726 = G__243383;
i__242727 = G__243384;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.dom.set_style = (function shadow$dom$set_style(el,styles){
var dom = shadow.dom.dom_node(el);
var seq__242748 = cljs.core.seq(styles);
var chunk__242749 = null;
var count__242750 = (0);
var i__242751 = (0);
while(true){
if((i__242751 < count__242750)){
var vec__242764 = chunk__242749.cljs$core$IIndexed$_nth$arity$2(null,i__242751);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242764,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242764,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__243392 = seq__242748;
var G__243393 = chunk__242749;
var G__243394 = count__242750;
var G__243395 = (i__242751 + (1));
seq__242748 = G__243392;
chunk__242749 = G__243393;
count__242750 = G__243394;
i__242751 = G__243395;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__242748);
if(temp__5804__auto__){
var seq__242748__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__242748__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__242748__$1);
var G__243396 = cljs.core.chunk_rest(seq__242748__$1);
var G__243397 = c__5525__auto__;
var G__243398 = cljs.core.count(c__5525__auto__);
var G__243399 = (0);
seq__242748 = G__243396;
chunk__242749 = G__243397;
count__242750 = G__243398;
i__242751 = G__243399;
continue;
} else {
var vec__242767 = cljs.core.first(seq__242748__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242767,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242767,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__243400 = cljs.core.next(seq__242748__$1);
var G__243401 = null;
var G__243402 = (0);
var G__243403 = (0);
seq__242748 = G__243400;
chunk__242749 = G__243401;
count__242750 = G__243402;
i__242751 = G__243403;
continue;
}
} else {
return null;
}
}
break;
}
});
shadow.dom.set_attr_STAR_ = (function shadow$dom$set_attr_STAR_(el,key,value){
var G__242774_243404 = key;
var G__242774_243405__$1 = (((G__242774_243404 instanceof cljs.core.Keyword))?G__242774_243404.fqn:null);
switch (G__242774_243405__$1) {
case "id":
(el.id = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));

break;
case "class":
(el.className = cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));

break;
case "for":
(el.htmlFor = value);

break;
case "cellpadding":
el.setAttribute("cellPadding",value);

break;
case "cellspacing":
el.setAttribute("cellSpacing",value);

break;
case "colspan":
el.setAttribute("colSpan",value);

break;
case "frameborder":
el.setAttribute("frameBorder",value);

break;
case "height":
el.setAttribute("height",value);

break;
case "maxlength":
el.setAttribute("maxLength",value);

break;
case "role":
el.setAttribute("role",value);

break;
case "rowspan":
el.setAttribute("rowSpan",value);

break;
case "type":
el.setAttribute("type",value);

break;
case "usemap":
el.setAttribute("useMap",value);

break;
case "valign":
el.setAttribute("vAlign",value);

break;
case "width":
el.setAttribute("width",value);

break;
case "on":
shadow.dom.add_event_listeners(el,value);

break;
case "style":
if((value == null)){
} else {
if(typeof value === 'string'){
el.setAttribute("style",value);
} else {
if(cljs.core.map_QMARK_(value)){
shadow.dom.set_style(el,value);
} else {
goog.style.setStyle(el,value);

}
}
}

break;
default:
var ks_243411 = cljs.core.name(key);
if(cljs.core.truth_((function (){var or__5002__auto__ = goog.string.startsWith(ks_243411,"data-");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.string.startsWith(ks_243411,"aria-");
}
})())){
el.setAttribute(ks_243411,value);
} else {
(el[ks_243411] = value);
}

}

return el;
});
shadow.dom.set_attrs = (function shadow$dom$set_attrs(el,attrs){
return cljs.core.reduce_kv((function (el__$1,key,value){
shadow.dom.set_attr_STAR_(el__$1,key,value);

return el__$1;
}),shadow.dom.dom_node(el),attrs);
});
shadow.dom.set_attr = (function shadow$dom$set_attr(el,key,value){
return shadow.dom.set_attr_STAR_(shadow.dom.dom_node(el),key,value);
});
shadow.dom.has_class_QMARK_ = (function shadow$dom$has_class_QMARK_(el,cls){
return goog.dom.classlist.contains(shadow.dom.dom_node(el),cls);
});
shadow.dom.merge_class_string = (function shadow$dom$merge_class_string(current,extra_class){
if(cljs.core.seq(current)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(current)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(extra_class)].join('');
} else {
return extra_class;
}
});
shadow.dom.parse_tag = (function shadow$dom$parse_tag(spec){
var spec__$1 = cljs.core.name(spec);
var fdot = spec__$1.indexOf(".");
var fhash = spec__$1.indexOf("#");
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fdot)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fhash)))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1,null,null], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fhash)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1.substring((0),fdot),null,clojure.string.replace(spec__$1.substring((fdot + (1))),/\./," ")], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),fdot)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1.substring((0),fhash),spec__$1.substring((fhash + (1))),null], null);
} else {
if((fhash > fdot)){
throw ["cant have id after class?",spec__$1].join('');
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [spec__$1.substring((0),fhash),spec__$1.substring((fhash + (1)),fdot),clojure.string.replace(spec__$1.substring((fdot + (1))),/\./," ")], null);

}
}
}
}
});
shadow.dom.create_dom_node = (function shadow$dom$create_dom_node(tag_def,p__242796){
var map__242797 = p__242796;
var map__242797__$1 = cljs.core.__destructure_map(map__242797);
var props = map__242797__$1;
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__242797__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var tag_props = ({});
var vec__242799 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242799,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242799,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242799,(2),null);
if(cljs.core.truth_(tag_id)){
(tag_props["id"] = tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
(tag_props["class"] = shadow.dom.merge_class_string(class$,tag_classes));
} else {
}

var G__242803 = goog.dom.createDom(tag_name,tag_props);
shadow.dom.set_attrs(G__242803,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(props,new cljs.core.Keyword(null,"class","class",-2030961996)));

return G__242803;
});
shadow.dom.append = (function shadow$dom$append(var_args){
var G__242808 = arguments.length;
switch (G__242808) {
case 1:
return shadow.dom.append.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.append.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.append.cljs$core$IFn$_invoke$arity$1 = (function (node){
if(cljs.core.truth_(node)){
var temp__5804__auto__ = shadow.dom.dom_node(node);
if(cljs.core.truth_(temp__5804__auto__)){
var n = temp__5804__auto__;
document.body.appendChild(n);

return n;
} else {
return null;
}
} else {
return null;
}
}));

(shadow.dom.append.cljs$core$IFn$_invoke$arity$2 = (function (el,node){
if(cljs.core.truth_(node)){
var temp__5804__auto__ = shadow.dom.dom_node(node);
if(cljs.core.truth_(temp__5804__auto__)){
var n = temp__5804__auto__;
shadow.dom.dom_node(el).appendChild(n);

return n;
} else {
return null;
}
} else {
return null;
}
}));

(shadow.dom.append.cljs$lang$maxFixedArity = 2);

shadow.dom.destructure_node = (function shadow$dom$destructure_node(create_fn,p__242815){
var vec__242816 = p__242815;
var seq__242817 = cljs.core.seq(vec__242816);
var first__242818 = cljs.core.first(seq__242817);
var seq__242817__$1 = cljs.core.next(seq__242817);
var nn = first__242818;
var first__242818__$1 = cljs.core.first(seq__242817__$1);
var seq__242817__$2 = cljs.core.next(seq__242817__$1);
var np = first__242818__$1;
var nc = seq__242817__$2;
var node = vec__242816;
if((nn instanceof cljs.core.Keyword)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid dom node",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),node], null));
}

if((((np == null)) && ((nc == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__242819 = nn;
var G__242820 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__242819,G__242820) : create_fn.call(null,G__242819,G__242820));
})(),cljs.core.List.EMPTY], null);
} else {
if(cljs.core.map_QMARK_(np)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(nn,np) : create_fn.call(null,nn,np)),nc], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__242822 = nn;
var G__242823 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__242822,G__242823) : create_fn.call(null,G__242822,G__242823));
})(),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(nc,np)], null);

}
}
});
shadow.dom.make_dom_node = (function shadow$dom$make_dom_node(structure){
var vec__242827 = shadow.dom.destructure_node(shadow.dom.create_dom_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242827,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242827,(1),null);
var seq__242830_243442 = cljs.core.seq(node_children);
var chunk__242831_243443 = null;
var count__242832_243444 = (0);
var i__242833_243445 = (0);
while(true){
if((i__242833_243445 < count__242832_243444)){
var child_struct_243448 = chunk__242831_243443.cljs$core$IIndexed$_nth$arity$2(null,i__242833_243445);
var children_243450 = shadow.dom.dom_node(child_struct_243448);
if(cljs.core.seq_QMARK_(children_243450)){
var seq__242857_243453 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_243450));
var chunk__242859_243454 = null;
var count__242860_243455 = (0);
var i__242861_243456 = (0);
while(true){
if((i__242861_243456 < count__242860_243455)){
var child_243458 = chunk__242859_243454.cljs$core$IIndexed$_nth$arity$2(null,i__242861_243456);
if(cljs.core.truth_(child_243458)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_243458);


var G__243459 = seq__242857_243453;
var G__243460 = chunk__242859_243454;
var G__243461 = count__242860_243455;
var G__243462 = (i__242861_243456 + (1));
seq__242857_243453 = G__243459;
chunk__242859_243454 = G__243460;
count__242860_243455 = G__243461;
i__242861_243456 = G__243462;
continue;
} else {
var G__243463 = seq__242857_243453;
var G__243464 = chunk__242859_243454;
var G__243465 = count__242860_243455;
var G__243466 = (i__242861_243456 + (1));
seq__242857_243453 = G__243463;
chunk__242859_243454 = G__243464;
count__242860_243455 = G__243465;
i__242861_243456 = G__243466;
continue;
}
} else {
var temp__5804__auto___243467 = cljs.core.seq(seq__242857_243453);
if(temp__5804__auto___243467){
var seq__242857_243468__$1 = temp__5804__auto___243467;
if(cljs.core.chunked_seq_QMARK_(seq__242857_243468__$1)){
var c__5525__auto___243469 = cljs.core.chunk_first(seq__242857_243468__$1);
var G__243470 = cljs.core.chunk_rest(seq__242857_243468__$1);
var G__243471 = c__5525__auto___243469;
var G__243472 = cljs.core.count(c__5525__auto___243469);
var G__243473 = (0);
seq__242857_243453 = G__243470;
chunk__242859_243454 = G__243471;
count__242860_243455 = G__243472;
i__242861_243456 = G__243473;
continue;
} else {
var child_243474 = cljs.core.first(seq__242857_243468__$1);
if(cljs.core.truth_(child_243474)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_243474);


var G__243475 = cljs.core.next(seq__242857_243468__$1);
var G__243476 = null;
var G__243477 = (0);
var G__243478 = (0);
seq__242857_243453 = G__243475;
chunk__242859_243454 = G__243476;
count__242860_243455 = G__243477;
i__242861_243456 = G__243478;
continue;
} else {
var G__243479 = cljs.core.next(seq__242857_243468__$1);
var G__243480 = null;
var G__243481 = (0);
var G__243482 = (0);
seq__242857_243453 = G__243479;
chunk__242859_243454 = G__243480;
count__242860_243455 = G__243481;
i__242861_243456 = G__243482;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_243450);
}


var G__243485 = seq__242830_243442;
var G__243486 = chunk__242831_243443;
var G__243487 = count__242832_243444;
var G__243488 = (i__242833_243445 + (1));
seq__242830_243442 = G__243485;
chunk__242831_243443 = G__243486;
count__242832_243444 = G__243487;
i__242833_243445 = G__243488;
continue;
} else {
var temp__5804__auto___243490 = cljs.core.seq(seq__242830_243442);
if(temp__5804__auto___243490){
var seq__242830_243491__$1 = temp__5804__auto___243490;
if(cljs.core.chunked_seq_QMARK_(seq__242830_243491__$1)){
var c__5525__auto___243493 = cljs.core.chunk_first(seq__242830_243491__$1);
var G__243501 = cljs.core.chunk_rest(seq__242830_243491__$1);
var G__243502 = c__5525__auto___243493;
var G__243503 = cljs.core.count(c__5525__auto___243493);
var G__243504 = (0);
seq__242830_243442 = G__243501;
chunk__242831_243443 = G__243502;
count__242832_243444 = G__243503;
i__242833_243445 = G__243504;
continue;
} else {
var child_struct_243506 = cljs.core.first(seq__242830_243491__$1);
var children_243507 = shadow.dom.dom_node(child_struct_243506);
if(cljs.core.seq_QMARK_(children_243507)){
var seq__242867_243508 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_243507));
var chunk__242869_243509 = null;
var count__242870_243510 = (0);
var i__242871_243511 = (0);
while(true){
if((i__242871_243511 < count__242870_243510)){
var child_243512 = chunk__242869_243509.cljs$core$IIndexed$_nth$arity$2(null,i__242871_243511);
if(cljs.core.truth_(child_243512)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_243512);


var G__243516 = seq__242867_243508;
var G__243517 = chunk__242869_243509;
var G__243518 = count__242870_243510;
var G__243519 = (i__242871_243511 + (1));
seq__242867_243508 = G__243516;
chunk__242869_243509 = G__243517;
count__242870_243510 = G__243518;
i__242871_243511 = G__243519;
continue;
} else {
var G__243522 = seq__242867_243508;
var G__243523 = chunk__242869_243509;
var G__243524 = count__242870_243510;
var G__243525 = (i__242871_243511 + (1));
seq__242867_243508 = G__243522;
chunk__242869_243509 = G__243523;
count__242870_243510 = G__243524;
i__242871_243511 = G__243525;
continue;
}
} else {
var temp__5804__auto___243526__$1 = cljs.core.seq(seq__242867_243508);
if(temp__5804__auto___243526__$1){
var seq__242867_243527__$1 = temp__5804__auto___243526__$1;
if(cljs.core.chunked_seq_QMARK_(seq__242867_243527__$1)){
var c__5525__auto___243528 = cljs.core.chunk_first(seq__242867_243527__$1);
var G__243529 = cljs.core.chunk_rest(seq__242867_243527__$1);
var G__243530 = c__5525__auto___243528;
var G__243531 = cljs.core.count(c__5525__auto___243528);
var G__243532 = (0);
seq__242867_243508 = G__243529;
chunk__242869_243509 = G__243530;
count__242870_243510 = G__243531;
i__242871_243511 = G__243532;
continue;
} else {
var child_243533 = cljs.core.first(seq__242867_243527__$1);
if(cljs.core.truth_(child_243533)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_243533);


var G__243534 = cljs.core.next(seq__242867_243527__$1);
var G__243535 = null;
var G__243536 = (0);
var G__243537 = (0);
seq__242867_243508 = G__243534;
chunk__242869_243509 = G__243535;
count__242870_243510 = G__243536;
i__242871_243511 = G__243537;
continue;
} else {
var G__243538 = cljs.core.next(seq__242867_243527__$1);
var G__243539 = null;
var G__243540 = (0);
var G__243541 = (0);
seq__242867_243508 = G__243538;
chunk__242869_243509 = G__243539;
count__242870_243510 = G__243540;
i__242871_243511 = G__243541;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_243507);
}


var G__243543 = cljs.core.next(seq__242830_243491__$1);
var G__243544 = null;
var G__243545 = (0);
var G__243546 = (0);
seq__242830_243442 = G__243543;
chunk__242831_243443 = G__243544;
count__242832_243444 = G__243545;
i__242833_243445 = G__243546;
continue;
}
} else {
}
}
break;
}

return node;
});
(cljs.core.Keyword.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.Keyword.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return shadow.dom.make_dom_node(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [this$__$1], null));
}));

(cljs.core.PersistentVector.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.PersistentVector.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return shadow.dom.make_dom_node(this$__$1);
}));

(cljs.core.LazySeq.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.LazySeq.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom._to_dom,this$__$1);
}));
if(cljs.core.truth_(((typeof HTMLElement) != 'undefined'))){
(HTMLElement.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(HTMLElement.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1;
}));
} else {
}
if(cljs.core.truth_(((typeof DocumentFragment) != 'undefined'))){
(DocumentFragment.prototype.shadow$dom$IElement$ = cljs.core.PROTOCOL_SENTINEL);

(DocumentFragment.prototype.shadow$dom$IElement$_to_dom$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1;
}));
} else {
}
/**
 * clear node children
 */
shadow.dom.reset = (function shadow$dom$reset(node){
return goog.dom.removeChildren(shadow.dom.dom_node(node));
});
shadow.dom.remove = (function shadow$dom$remove(node){
if((((!((node == null))))?(((((node.cljs$lang$protocol_mask$partition0$ & (8388608))) || ((cljs.core.PROTOCOL_SENTINEL === node.cljs$core$ISeqable$))))?true:false):false)){
var seq__242890 = cljs.core.seq(node);
var chunk__242891 = null;
var count__242892 = (0);
var i__242893 = (0);
while(true){
if((i__242893 < count__242892)){
var n = chunk__242891.cljs$core$IIndexed$_nth$arity$2(null,i__242893);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__243560 = seq__242890;
var G__243561 = chunk__242891;
var G__243562 = count__242892;
var G__243563 = (i__242893 + (1));
seq__242890 = G__243560;
chunk__242891 = G__243561;
count__242892 = G__243562;
i__242893 = G__243563;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__242890);
if(temp__5804__auto__){
var seq__242890__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__242890__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__242890__$1);
var G__243565 = cljs.core.chunk_rest(seq__242890__$1);
var G__243566 = c__5525__auto__;
var G__243567 = cljs.core.count(c__5525__auto__);
var G__243568 = (0);
seq__242890 = G__243565;
chunk__242891 = G__243566;
count__242892 = G__243567;
i__242893 = G__243568;
continue;
} else {
var n = cljs.core.first(seq__242890__$1);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__243570 = cljs.core.next(seq__242890__$1);
var G__243571 = null;
var G__243572 = (0);
var G__243573 = (0);
seq__242890 = G__243570;
chunk__242891 = G__243571;
count__242892 = G__243572;
i__242893 = G__243573;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return goog.dom.removeNode(node);
}
});
shadow.dom.replace_node = (function shadow$dom$replace_node(old,new$){
return goog.dom.replaceNode(shadow.dom.dom_node(new$),shadow.dom.dom_node(old));
});
shadow.dom.text = (function shadow$dom$text(var_args){
var G__242902 = arguments.length;
switch (G__242902) {
case 2:
return shadow.dom.text.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 1:
return shadow.dom.text.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.text.cljs$core$IFn$_invoke$arity$2 = (function (el,new_text){
return (shadow.dom.dom_node(el).innerText = new_text);
}));

(shadow.dom.text.cljs$core$IFn$_invoke$arity$1 = (function (el){
return shadow.dom.dom_node(el).innerText;
}));

(shadow.dom.text.cljs$lang$maxFixedArity = 2);

shadow.dom.check = (function shadow$dom$check(var_args){
var G__242906 = arguments.length;
switch (G__242906) {
case 1:
return shadow.dom.check.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.check.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.check.cljs$core$IFn$_invoke$arity$1 = (function (el){
return shadow.dom.check.cljs$core$IFn$_invoke$arity$2(el,true);
}));

(shadow.dom.check.cljs$core$IFn$_invoke$arity$2 = (function (el,checked){
return (shadow.dom.dom_node(el).checked = checked);
}));

(shadow.dom.check.cljs$lang$maxFixedArity = 2);

shadow.dom.checked_QMARK_ = (function shadow$dom$checked_QMARK_(el){
return shadow.dom.dom_node(el).checked;
});
shadow.dom.form_elements = (function shadow$dom$form_elements(el){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(el).elements));
});
shadow.dom.children = (function shadow$dom$children(el){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(el).children));
});
shadow.dom.child_nodes = (function shadow$dom$child_nodes(el){
return (new shadow.dom.NativeColl(shadow.dom.dom_node(el).childNodes));
});
shadow.dom.attr = (function shadow$dom$attr(var_args){
var G__242919 = arguments.length;
switch (G__242919) {
case 2:
return shadow.dom.attr.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return shadow.dom.attr.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.attr.cljs$core$IFn$_invoke$arity$2 = (function (el,key){
return shadow.dom.dom_node(el).getAttribute(cljs.core.name(key));
}));

(shadow.dom.attr.cljs$core$IFn$_invoke$arity$3 = (function (el,key,default$){
var or__5002__auto__ = shadow.dom.dom_node(el).getAttribute(cljs.core.name(key));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return default$;
}
}));

(shadow.dom.attr.cljs$lang$maxFixedArity = 3);

shadow.dom.del_attr = (function shadow$dom$del_attr(el,key){
return shadow.dom.dom_node(el).removeAttribute(cljs.core.name(key));
});
shadow.dom.data = (function shadow$dom$data(el,key){
return shadow.dom.dom_node(el).getAttribute(["data-",cljs.core.name(key)].join(''));
});
shadow.dom.set_data = (function shadow$dom$set_data(el,key,value){
return shadow.dom.dom_node(el).setAttribute(["data-",cljs.core.name(key)].join(''),cljs.core.str.cljs$core$IFn$_invoke$arity$1(value));
});
shadow.dom.set_html = (function shadow$dom$set_html(node,text){
return (shadow.dom.dom_node(node).innerHTML = text);
});
shadow.dom.get_html = (function shadow$dom$get_html(node){
return shadow.dom.dom_node(node).innerHTML;
});
shadow.dom.fragment = (function shadow$dom$fragment(var_args){
var args__5732__auto__ = [];
var len__5726__auto___243591 = arguments.length;
var i__5727__auto___243593 = (0);
while(true){
if((i__5727__auto___243593 < len__5726__auto___243591)){
args__5732__auto__.push((arguments[i__5727__auto___243593]));

var G__243594 = (i__5727__auto___243593 + (1));
i__5727__auto___243593 = G__243594;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return shadow.dom.fragment.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(shadow.dom.fragment.cljs$core$IFn$_invoke$arity$variadic = (function (nodes){
var fragment = document.createDocumentFragment();
var seq__242931_243596 = cljs.core.seq(nodes);
var chunk__242932_243597 = null;
var count__242933_243598 = (0);
var i__242934_243599 = (0);
while(true){
if((i__242934_243599 < count__242933_243598)){
var node_243600 = chunk__242932_243597.cljs$core$IIndexed$_nth$arity$2(null,i__242934_243599);
fragment.appendChild(shadow.dom._to_dom(node_243600));


var G__243601 = seq__242931_243596;
var G__243602 = chunk__242932_243597;
var G__243603 = count__242933_243598;
var G__243604 = (i__242934_243599 + (1));
seq__242931_243596 = G__243601;
chunk__242932_243597 = G__243602;
count__242933_243598 = G__243603;
i__242934_243599 = G__243604;
continue;
} else {
var temp__5804__auto___243606 = cljs.core.seq(seq__242931_243596);
if(temp__5804__auto___243606){
var seq__242931_243607__$1 = temp__5804__auto___243606;
if(cljs.core.chunked_seq_QMARK_(seq__242931_243607__$1)){
var c__5525__auto___243610 = cljs.core.chunk_first(seq__242931_243607__$1);
var G__243611 = cljs.core.chunk_rest(seq__242931_243607__$1);
var G__243612 = c__5525__auto___243610;
var G__243613 = cljs.core.count(c__5525__auto___243610);
var G__243614 = (0);
seq__242931_243596 = G__243611;
chunk__242932_243597 = G__243612;
count__242933_243598 = G__243613;
i__242934_243599 = G__243614;
continue;
} else {
var node_243616 = cljs.core.first(seq__242931_243607__$1);
fragment.appendChild(shadow.dom._to_dom(node_243616));


var G__243617 = cljs.core.next(seq__242931_243607__$1);
var G__243618 = null;
var G__243619 = (0);
var G__243620 = (0);
seq__242931_243596 = G__243617;
chunk__242932_243597 = G__243618;
count__242933_243598 = G__243619;
i__242934_243599 = G__243620;
continue;
}
} else {
}
}
break;
}

return (new shadow.dom.NativeColl(fragment));
}));

(shadow.dom.fragment.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(shadow.dom.fragment.cljs$lang$applyTo = (function (seq242925){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq242925));
}));

/**
 * given a html string, eval all <script> tags and return the html without the scripts
 * don't do this for everything, only content you trust.
 */
shadow.dom.eval_scripts = (function shadow$dom$eval_scripts(s){
var scripts = cljs.core.re_seq(/<script[^>]*?>(.+?)<\/script>/,s);
var seq__242944_243623 = cljs.core.seq(scripts);
var chunk__242945_243624 = null;
var count__242946_243625 = (0);
var i__242947_243626 = (0);
while(true){
if((i__242947_243626 < count__242946_243625)){
var vec__242968_243628 = chunk__242945_243624.cljs$core$IIndexed$_nth$arity$2(null,i__242947_243626);
var script_tag_243629 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242968_243628,(0),null);
var script_body_243630 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242968_243628,(1),null);
eval(script_body_243630);


var G__243631 = seq__242944_243623;
var G__243632 = chunk__242945_243624;
var G__243633 = count__242946_243625;
var G__243634 = (i__242947_243626 + (1));
seq__242944_243623 = G__243631;
chunk__242945_243624 = G__243632;
count__242946_243625 = G__243633;
i__242947_243626 = G__243634;
continue;
} else {
var temp__5804__auto___243635 = cljs.core.seq(seq__242944_243623);
if(temp__5804__auto___243635){
var seq__242944_243636__$1 = temp__5804__auto___243635;
if(cljs.core.chunked_seq_QMARK_(seq__242944_243636__$1)){
var c__5525__auto___243637 = cljs.core.chunk_first(seq__242944_243636__$1);
var G__243638 = cljs.core.chunk_rest(seq__242944_243636__$1);
var G__243639 = c__5525__auto___243637;
var G__243640 = cljs.core.count(c__5525__auto___243637);
var G__243641 = (0);
seq__242944_243623 = G__243638;
chunk__242945_243624 = G__243639;
count__242946_243625 = G__243640;
i__242947_243626 = G__243641;
continue;
} else {
var vec__242981_243644 = cljs.core.first(seq__242944_243636__$1);
var script_tag_243645 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242981_243644,(0),null);
var script_body_243646 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242981_243644,(1),null);
eval(script_body_243646);


var G__243649 = cljs.core.next(seq__242944_243636__$1);
var G__243650 = null;
var G__243651 = (0);
var G__243652 = (0);
seq__242944_243623 = G__243649;
chunk__242945_243624 = G__243650;
count__242946_243625 = G__243651;
i__242947_243626 = G__243652;
continue;
}
} else {
}
}
break;
}

return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (s__$1,p__242986){
var vec__242987 = p__242986;
var script_tag = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242987,(0),null);
var script_body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__242987,(1),null);
return clojure.string.replace(s__$1,script_tag,"");
}),s,scripts);
});
shadow.dom.str__GT_fragment = (function shadow$dom$str__GT_fragment(s){
var el = document.createElement("div");
(el.innerHTML = s);

return (new shadow.dom.NativeColl(goog.dom.childrenToNode_(document,el)));
});
shadow.dom.node_name = (function shadow$dom$node_name(el){
return shadow.dom.dom_node(el).nodeName;
});
shadow.dom.ancestor_by_class = (function shadow$dom$ancestor_by_class(el,cls){
return goog.dom.getAncestorByClass(shadow.dom.dom_node(el),cls);
});
shadow.dom.ancestor_by_tag = (function shadow$dom$ancestor_by_tag(var_args){
var G__242994 = arguments.length;
switch (G__242994) {
case 2:
return shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$2 = (function (el,tag){
return goog.dom.getAncestorByTagNameAndClass(shadow.dom.dom_node(el),cljs.core.name(tag));
}));

(shadow.dom.ancestor_by_tag.cljs$core$IFn$_invoke$arity$3 = (function (el,tag,cls){
return goog.dom.getAncestorByTagNameAndClass(shadow.dom.dom_node(el),cljs.core.name(tag),cljs.core.name(cls));
}));

(shadow.dom.ancestor_by_tag.cljs$lang$maxFixedArity = 3);

shadow.dom.get_value = (function shadow$dom$get_value(dom){
return goog.dom.forms.getValue(shadow.dom.dom_node(dom));
});
shadow.dom.set_value = (function shadow$dom$set_value(dom,value){
return goog.dom.forms.setValue(shadow.dom.dom_node(dom),value);
});
shadow.dom.px = (function shadow$dom$px(value){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1((value | (0))),"px"].join('');
});
shadow.dom.pct = (function shadow$dom$pct(value){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(value),"%"].join('');
});
shadow.dom.remove_style_STAR_ = (function shadow$dom$remove_style_STAR_(el,style){
return el.style.removeProperty(cljs.core.name(style));
});
shadow.dom.remove_style = (function shadow$dom$remove_style(el,style){
var el__$1 = shadow.dom.dom_node(el);
return shadow.dom.remove_style_STAR_(el__$1,style);
});
shadow.dom.remove_styles = (function shadow$dom$remove_styles(el,style_keys){
var el__$1 = shadow.dom.dom_node(el);
var seq__243002 = cljs.core.seq(style_keys);
var chunk__243003 = null;
var count__243004 = (0);
var i__243005 = (0);
while(true){
if((i__243005 < count__243004)){
var it = chunk__243003.cljs$core$IIndexed$_nth$arity$2(null,i__243005);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__243669 = seq__243002;
var G__243670 = chunk__243003;
var G__243671 = count__243004;
var G__243672 = (i__243005 + (1));
seq__243002 = G__243669;
chunk__243003 = G__243670;
count__243004 = G__243671;
i__243005 = G__243672;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__243002);
if(temp__5804__auto__){
var seq__243002__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__243002__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__243002__$1);
var G__243673 = cljs.core.chunk_rest(seq__243002__$1);
var G__243674 = c__5525__auto__;
var G__243675 = cljs.core.count(c__5525__auto__);
var G__243676 = (0);
seq__243002 = G__243673;
chunk__243003 = G__243674;
count__243004 = G__243675;
i__243005 = G__243676;
continue;
} else {
var it = cljs.core.first(seq__243002__$1);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__243677 = cljs.core.next(seq__243002__$1);
var G__243678 = null;
var G__243679 = (0);
var G__243680 = (0);
seq__243002 = G__243677;
chunk__243003 = G__243678;
count__243004 = G__243679;
i__243005 = G__243680;
continue;
}
} else {
return null;
}
}
break;
}
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
shadow.dom.Coordinate = (function (x,y,__meta,__extmap,__hash){
this.x = x;
this.y = y;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(shadow.dom.Coordinate.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(shadow.dom.Coordinate.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k243008,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__243012 = k243008;
var G__243012__$1 = (((G__243012 instanceof cljs.core.Keyword))?G__243012.fqn:null);
switch (G__243012__$1) {
case "x":
return self__.x;

break;
case "y":
return self__.y;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k243008,else__5303__auto__);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__243017){
var vec__243018 = p__243017;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243018,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243018,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(shadow.dom.Coordinate.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#shadow.dom.Coordinate{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"x","x",2099068185),self__.x],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"y","y",-1757859776),self__.y],null))], null),self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__243007){
var self__ = this;
var G__243007__$1 = this;
return (new cljs.core.RecordIter((0),G__243007__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"y","y",-1757859776)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(shadow.dom.Coordinate.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,self__.__extmap,self__.__hash));
}));

(shadow.dom.Coordinate.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (145542109 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this243009,other243010){
var self__ = this;
var this243009__$1 = this;
return (((!((other243010 == null)))) && ((((this243009__$1.constructor === other243010.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this243009__$1.x,other243010.x)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this243009__$1.y,other243010.y)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this243009__$1.__extmap,other243010.__extmap)))))))));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"y","y",-1757859776),null,new cljs.core.Keyword(null,"x","x",2099068185),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k243008){
var self__ = this;
var this__5307__auto____$1 = this;
var G__243037 = k243008;
var G__243037__$1 = (((G__243037 instanceof cljs.core.Keyword))?G__243037.fqn:null);
switch (G__243037__$1) {
case "x":
case "y":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k243008);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__243007){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__243038 = cljs.core.keyword_identical_QMARK_;
var expr__243039 = k__5309__auto__;
if(cljs.core.truth_((pred__243038.cljs$core$IFn$_invoke$arity$2 ? pred__243038.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"x","x",2099068185),expr__243039) : pred__243038.call(null,new cljs.core.Keyword(null,"x","x",2099068185),expr__243039)))){
return (new shadow.dom.Coordinate(G__243007,self__.y,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__243038.cljs$core$IFn$_invoke$arity$2 ? pred__243038.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"y","y",-1757859776),expr__243039) : pred__243038.call(null,new cljs.core.Keyword(null,"y","y",-1757859776),expr__243039)))){
return (new shadow.dom.Coordinate(self__.x,G__243007,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__243007),null));
}
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"x","x",2099068185),self__.x,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"y","y",-1757859776),self__.y,null))], null),self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__243007){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Coordinate(self__.x,self__.y,G__243007,self__.__extmap,self__.__hash));
}));

(shadow.dom.Coordinate.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(shadow.dom.Coordinate.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"x","x",-555367584,null),new cljs.core.Symbol(null,"y","y",-117328249,null)], null);
}));

(shadow.dom.Coordinate.cljs$lang$type = true);

(shadow.dom.Coordinate.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"shadow.dom/Coordinate",null,(1),null));
}));

(shadow.dom.Coordinate.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"shadow.dom/Coordinate");
}));

/**
 * Positional factory function for shadow.dom/Coordinate.
 */
shadow.dom.__GT_Coordinate = (function shadow$dom$__GT_Coordinate(x,y){
return (new shadow.dom.Coordinate(x,y,null,null,null));
});

/**
 * Factory function for shadow.dom/Coordinate, taking a map of keywords to field values.
 */
shadow.dom.map__GT_Coordinate = (function shadow$dom$map__GT_Coordinate(G__243011){
var extmap__5342__auto__ = (function (){var G__243042 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__243011,new cljs.core.Keyword(null,"x","x",2099068185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"y","y",-1757859776)], 0));
if(cljs.core.record_QMARK_(G__243011)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__243042);
} else {
return G__243042;
}
})();
return (new shadow.dom.Coordinate(new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(G__243011),new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(G__243011),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

shadow.dom.get_position = (function shadow$dom$get_position(el){
var pos = goog.style.getPosition(shadow.dom.dom_node(el));
return shadow.dom.__GT_Coordinate(pos.x,pos.y);
});
shadow.dom.get_client_position = (function shadow$dom$get_client_position(el){
var pos = goog.style.getClientPosition(shadow.dom.dom_node(el));
return shadow.dom.__GT_Coordinate(pos.x,pos.y);
});
shadow.dom.get_page_offset = (function shadow$dom$get_page_offset(el){
var pos = goog.style.getPageOffset(shadow.dom.dom_node(el));
return shadow.dom.__GT_Coordinate(pos.x,pos.y);
});

/**
* @constructor
 * @implements {cljs.core.IRecord}
 * @implements {cljs.core.IKVReduce}
 * @implements {cljs.core.IEquiv}
 * @implements {cljs.core.IHash}
 * @implements {cljs.core.ICollection}
 * @implements {cljs.core.ICounted}
 * @implements {cljs.core.ISeqable}
 * @implements {cljs.core.IMeta}
 * @implements {cljs.core.ICloneable}
 * @implements {cljs.core.IPrintWithWriter}
 * @implements {cljs.core.IIterable}
 * @implements {cljs.core.IWithMeta}
 * @implements {cljs.core.IAssociative}
 * @implements {cljs.core.IMap}
 * @implements {cljs.core.ILookup}
*/
shadow.dom.Size = (function (w,h,__meta,__extmap,__hash){
this.w = w;
this.h = h;
this.__meta = __meta;
this.__extmap = __extmap;
this.__hash = __hash;
this.cljs$lang$protocol_mask$partition0$ = 2230716170;
this.cljs$lang$protocol_mask$partition1$ = 139264;
});
(shadow.dom.Size.prototype.cljs$core$ILookup$_lookup$arity$2 = (function (this__5300__auto__,k__5301__auto__){
var self__ = this;
var this__5300__auto____$1 = this;
return this__5300__auto____$1.cljs$core$ILookup$_lookup$arity$3(null,k__5301__auto__,null);
}));

(shadow.dom.Size.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k243063,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__243075 = k243063;
var G__243075__$1 = (((G__243075 instanceof cljs.core.Keyword))?G__243075.fqn:null);
switch (G__243075__$1) {
case "w":
return self__.w;

break;
case "h":
return self__.h;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k243063,else__5303__auto__);

}
}));

(shadow.dom.Size.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__243078){
var vec__243079 = p__243078;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243079,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243079,(1),null);
return (f__5321__auto__.cljs$core$IFn$_invoke$arity$3 ? f__5321__auto__.cljs$core$IFn$_invoke$arity$3(ret__5323__auto__,k__5324__auto__,v__5325__auto__) : f__5321__auto__.call(null,ret__5323__auto__,k__5324__auto__,v__5325__auto__));
}),init__5322__auto__,this__5320__auto____$1);
}));

(shadow.dom.Size.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = (function (this__5315__auto__,writer__5316__auto__,opts__5317__auto__){
var self__ = this;
var this__5315__auto____$1 = this;
var pr_pair__5318__auto__ = (function (keyval__5319__auto__){
return cljs.core.pr_sequential_writer(writer__5316__auto__,cljs.core.pr_writer,""," ","",opts__5317__auto__,keyval__5319__auto__);
});
return cljs.core.pr_sequential_writer(writer__5316__auto__,pr_pair__5318__auto__,"#shadow.dom.Size{",", ","}",opts__5317__auto__,cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"w","w",354169001),self__.w],null)),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[new cljs.core.Keyword(null,"h","h",1109658740),self__.h],null))], null),self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__243062){
var self__ = this;
var G__243062__$1 = this;
return (new cljs.core.RecordIter((0),G__243062__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"w","w",354169001),new cljs.core.Keyword(null,"h","h",1109658740)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
}));

(shadow.dom.Size.prototype.cljs$core$IMeta$_meta$arity$1 = (function (this__5298__auto__){
var self__ = this;
var this__5298__auto____$1 = this;
return self__.__meta;
}));

(shadow.dom.Size.prototype.cljs$core$ICloneable$_clone$arity$1 = (function (this__5295__auto__){
var self__ = this;
var this__5295__auto____$1 = this;
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,self__.__extmap,self__.__hash));
}));

(shadow.dom.Size.prototype.cljs$core$ICounted$_count$arity$1 = (function (this__5304__auto__){
var self__ = this;
var this__5304__auto____$1 = this;
return (2 + cljs.core.count(self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IHash$_hash$arity$1 = (function (this__5296__auto__){
var self__ = this;
var this__5296__auto____$1 = this;
var h__5111__auto__ = self__.__hash;
if((!((h__5111__auto__ == null)))){
return h__5111__auto__;
} else {
var h__5111__auto____$1 = (function (coll__5297__auto__){
return (-1228019642 ^ cljs.core.hash_unordered_coll(coll__5297__auto__));
})(this__5296__auto____$1);
(self__.__hash = h__5111__auto____$1);

return h__5111__auto____$1;
}
}));

(shadow.dom.Size.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this243064,other243065){
var self__ = this;
var this243064__$1 = this;
return (((!((other243065 == null)))) && ((((this243064__$1.constructor === other243065.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this243064__$1.w,other243065.w)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this243064__$1.h,other243065.h)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this243064__$1.__extmap,other243065.__extmap)))))))));
}));

(shadow.dom.Size.prototype.cljs$core$IMap$_dissoc$arity$2 = (function (this__5310__auto__,k__5311__auto__){
var self__ = this;
var this__5310__auto____$1 = this;
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"w","w",354169001),null,new cljs.core.Keyword(null,"h","h",1109658740),null], null), null),k__5311__auto__)){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core._with_meta(cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,this__5310__auto____$1),self__.__meta),k__5311__auto__);
} else {
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,cljs.core.not_empty(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.__extmap,k__5311__auto__)),null));
}
}));

(shadow.dom.Size.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k243063){
var self__ = this;
var this__5307__auto____$1 = this;
var G__243099 = k243063;
var G__243099__$1 = (((G__243099 instanceof cljs.core.Keyword))?G__243099.fqn:null);
switch (G__243099__$1) {
case "w":
case "h":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k243063);

}
}));

(shadow.dom.Size.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__243062){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__243100 = cljs.core.keyword_identical_QMARK_;
var expr__243101 = k__5309__auto__;
if(cljs.core.truth_((pred__243100.cljs$core$IFn$_invoke$arity$2 ? pred__243100.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"w","w",354169001),expr__243101) : pred__243100.call(null,new cljs.core.Keyword(null,"w","w",354169001),expr__243101)))){
return (new shadow.dom.Size(G__243062,self__.h,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__243100.cljs$core$IFn$_invoke$arity$2 ? pred__243100.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"h","h",1109658740),expr__243101) : pred__243100.call(null,new cljs.core.Keyword(null,"h","h",1109658740),expr__243101)))){
return (new shadow.dom.Size(self__.w,G__243062,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__243062),null));
}
}
}));

(shadow.dom.Size.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"w","w",354169001),self__.w,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"h","h",1109658740),self__.h,null))], null),self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__243062){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Size(self__.w,self__.h,G__243062,self__.__extmap,self__.__hash));
}));

(shadow.dom.Size.prototype.cljs$core$ICollection$_conj$arity$2 = (function (this__5305__auto__,entry__5306__auto__){
var self__ = this;
var this__5305__auto____$1 = this;
if(cljs.core.vector_QMARK_(entry__5306__auto__)){
return this__5305__auto____$1.cljs$core$IAssociative$_assoc$arity$3(null,cljs.core._nth(entry__5306__auto__,(0)),cljs.core._nth(entry__5306__auto__,(1)));
} else {
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj,this__5305__auto____$1,entry__5306__auto__);
}
}));

(shadow.dom.Size.getBasis = (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Symbol(null,"w","w",1994700528,null),new cljs.core.Symbol(null,"h","h",-1544777029,null)], null);
}));

(shadow.dom.Size.cljs$lang$type = true);

(shadow.dom.Size.cljs$lang$ctorPrSeq = (function (this__5346__auto__){
return (new cljs.core.List(null,"shadow.dom/Size",null,(1),null));
}));

(shadow.dom.Size.cljs$lang$ctorPrWriter = (function (this__5346__auto__,writer__5347__auto__){
return cljs.core._write(writer__5347__auto__,"shadow.dom/Size");
}));

/**
 * Positional factory function for shadow.dom/Size.
 */
shadow.dom.__GT_Size = (function shadow$dom$__GT_Size(w,h){
return (new shadow.dom.Size(w,h,null,null,null));
});

/**
 * Factory function for shadow.dom/Size, taking a map of keywords to field values.
 */
shadow.dom.map__GT_Size = (function shadow$dom$map__GT_Size(G__243067){
var extmap__5342__auto__ = (function (){var G__243132 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__243067,new cljs.core.Keyword(null,"w","w",354169001),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"h","h",1109658740)], 0));
if(cljs.core.record_QMARK_(G__243067)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__243132);
} else {
return G__243132;
}
})();
return (new shadow.dom.Size(new cljs.core.Keyword(null,"w","w",354169001).cljs$core$IFn$_invoke$arity$1(G__243067),new cljs.core.Keyword(null,"h","h",1109658740).cljs$core$IFn$_invoke$arity$1(G__243067),null,cljs.core.not_empty(extmap__5342__auto__),null));
});

shadow.dom.size__GT_clj = (function shadow$dom$size__GT_clj(size){
return (new shadow.dom.Size(size.width,size.height,null,null,null));
});
shadow.dom.get_size = (function shadow$dom$get_size(el){
return shadow.dom.size__GT_clj(goog.style.getSize(shadow.dom.dom_node(el)));
});
shadow.dom.get_height = (function shadow$dom$get_height(el){
return shadow.dom.get_size(el).h;
});
shadow.dom.get_viewport_size = (function shadow$dom$get_viewport_size(){
return shadow.dom.size__GT_clj(goog.dom.getViewportSize());
});
shadow.dom.first_child = (function shadow$dom$first_child(el){
return (shadow.dom.dom_node(el).children[(0)]);
});
shadow.dom.select_option_values = (function shadow$dom$select_option_values(el){
var native$ = shadow.dom.dom_node(el);
var opts = (native$["options"]);
var a__5590__auto__ = opts;
var l__5591__auto__ = a__5590__auto__.length;
var i = (0);
var ret = cljs.core.PersistentVector.EMPTY;
while(true){
if((i < l__5591__auto__)){
var G__243780 = (i + (1));
var G__243781 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,(opts[i]["value"]));
i = G__243780;
ret = G__243781;
continue;
} else {
return ret;
}
break;
}
});
shadow.dom.build_url = (function shadow$dom$build_url(path,query_params){
if(cljs.core.empty_QMARK_(query_params)){
return path;
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"?",clojure.string.join.cljs$core$IFn$_invoke$arity$2("&",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__243166){
var vec__243167 = p__243166;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243167,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243167,(1),null);
return [cljs.core.name(k),"=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)))].join('');
}),query_params))].join('');
}
});
shadow.dom.redirect = (function shadow$dom$redirect(var_args){
var G__243173 = arguments.length;
switch (G__243173) {
case 1:
return shadow.dom.redirect.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return shadow.dom.redirect.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(shadow.dom.redirect.cljs$core$IFn$_invoke$arity$1 = (function (path){
return shadow.dom.redirect.cljs$core$IFn$_invoke$arity$2(path,cljs.core.PersistentArrayMap.EMPTY);
}));

(shadow.dom.redirect.cljs$core$IFn$_invoke$arity$2 = (function (path,query_params){
return (document["location"]["href"] = shadow.dom.build_url(path,query_params));
}));

(shadow.dom.redirect.cljs$lang$maxFixedArity = 2);

shadow.dom.reload_BANG_ = (function shadow$dom$reload_BANG_(){
return (document.location.href = document.location.href);
});
shadow.dom.tag_name = (function shadow$dom$tag_name(el){
var dom = shadow.dom.dom_node(el);
return dom.tagName;
});
shadow.dom.insert_after = (function shadow$dom$insert_after(ref,new$){
var new_node = shadow.dom.dom_node(new$);
goog.dom.insertSiblingAfter(new_node,shadow.dom.dom_node(ref));

return new_node;
});
shadow.dom.insert_before = (function shadow$dom$insert_before(ref,new$){
var new_node = shadow.dom.dom_node(new$);
goog.dom.insertSiblingBefore(new_node,shadow.dom.dom_node(ref));

return new_node;
});
shadow.dom.insert_first = (function shadow$dom$insert_first(ref,new$){
var temp__5802__auto__ = shadow.dom.dom_node(ref).firstChild;
if(cljs.core.truth_(temp__5802__auto__)){
var child = temp__5802__auto__;
return shadow.dom.insert_before(child,new$);
} else {
return shadow.dom.append.cljs$core$IFn$_invoke$arity$2(ref,new$);
}
});
shadow.dom.index_of = (function shadow$dom$index_of(el){
var el__$1 = shadow.dom.dom_node(el);
var i = (0);
while(true){
var ps = el__$1.previousSibling;
if((ps == null)){
return i;
} else {
var G__243824 = ps;
var G__243825 = (i + (1));
el__$1 = G__243824;
i = G__243825;
continue;
}
break;
}
});
shadow.dom.get_parent = (function shadow$dom$get_parent(el){
return goog.dom.getParentElement(shadow.dom.dom_node(el));
});
shadow.dom.parents = (function shadow$dom$parents(el){
var parent = shadow.dom.get_parent(el);
if(cljs.core.truth_(parent)){
return cljs.core.cons(parent,(new cljs.core.LazySeq(null,(function (){
return (shadow.dom.parents.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.parents.cljs$core$IFn$_invoke$arity$1(parent) : shadow.dom.parents.call(null,parent));
}),null,null)));
} else {
return null;
}
});
shadow.dom.matches = (function shadow$dom$matches(el,sel){
return shadow.dom.dom_node(el).matches(sel);
});
shadow.dom.get_next_sibling = (function shadow$dom$get_next_sibling(el){
return goog.dom.getNextElementSibling(shadow.dom.dom_node(el));
});
shadow.dom.get_previous_sibling = (function shadow$dom$get_previous_sibling(el){
return goog.dom.getPreviousElementSibling(shadow.dom.dom_node(el));
});
shadow.dom.xmlns = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, ["svg","http://www.w3.org/2000/svg","xlink","http://www.w3.org/1999/xlink"], null));
shadow.dom.create_svg_node = (function shadow$dom$create_svg_node(tag_def,props){
var vec__243183 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243183,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243183,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243183,(2),null);
var el = document.createElementNS("http://www.w3.org/2000/svg",tag_name);
if(cljs.core.truth_(tag_id)){
el.setAttribute("id",tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
el.setAttribute("class",shadow.dom.merge_class_string(new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(props),tag_classes));
} else {
}

var seq__243186_243829 = cljs.core.seq(props);
var chunk__243187_243830 = null;
var count__243188_243831 = (0);
var i__243189_243832 = (0);
while(true){
if((i__243189_243832 < count__243188_243831)){
var vec__243201_243833 = chunk__243187_243830.cljs$core$IIndexed$_nth$arity$2(null,i__243189_243832);
var k_243834 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243201_243833,(0),null);
var v_243835 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243201_243833,(1),null);
el.setAttributeNS((function (){var temp__5804__auto__ = cljs.core.namespace(k_243834);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_243834),v_243835);


var G__243837 = seq__243186_243829;
var G__243838 = chunk__243187_243830;
var G__243839 = count__243188_243831;
var G__243840 = (i__243189_243832 + (1));
seq__243186_243829 = G__243837;
chunk__243187_243830 = G__243838;
count__243188_243831 = G__243839;
i__243189_243832 = G__243840;
continue;
} else {
var temp__5804__auto___243841 = cljs.core.seq(seq__243186_243829);
if(temp__5804__auto___243841){
var seq__243186_243842__$1 = temp__5804__auto___243841;
if(cljs.core.chunked_seq_QMARK_(seq__243186_243842__$1)){
var c__5525__auto___243843 = cljs.core.chunk_first(seq__243186_243842__$1);
var G__243844 = cljs.core.chunk_rest(seq__243186_243842__$1);
var G__243845 = c__5525__auto___243843;
var G__243846 = cljs.core.count(c__5525__auto___243843);
var G__243847 = (0);
seq__243186_243829 = G__243844;
chunk__243187_243830 = G__243845;
count__243188_243831 = G__243846;
i__243189_243832 = G__243847;
continue;
} else {
var vec__243204_243848 = cljs.core.first(seq__243186_243842__$1);
var k_243849 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243204_243848,(0),null);
var v_243850 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243204_243848,(1),null);
el.setAttributeNS((function (){var temp__5804__auto____$1 = cljs.core.namespace(k_243849);
if(cljs.core.truth_(temp__5804__auto____$1)){
var ns = temp__5804__auto____$1;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_243849),v_243850);


var G__243855 = cljs.core.next(seq__243186_243842__$1);
var G__243856 = null;
var G__243857 = (0);
var G__243858 = (0);
seq__243186_243829 = G__243855;
chunk__243187_243830 = G__243856;
count__243188_243831 = G__243857;
i__243189_243832 = G__243858;
continue;
}
} else {
}
}
break;
}

return el;
});
shadow.dom.svg_node = (function shadow$dom$svg_node(el){
if((el == null)){
return null;
} else {
if((((!((el == null))))?((((false) || ((cljs.core.PROTOCOL_SENTINEL === el.shadow$dom$SVGElement$))))?true:false):false)){
return el.shadow$dom$SVGElement$_to_svg$arity$1(null);
} else {
return el;

}
}
});
shadow.dom.make_svg_node = (function shadow$dom$make_svg_node(structure){
var vec__243217 = shadow.dom.destructure_node(shadow.dom.create_svg_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243217,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__243217,(1),null);
var seq__243220_243866 = cljs.core.seq(node_children);
var chunk__243222_243867 = null;
var count__243223_243868 = (0);
var i__243224_243869 = (0);
while(true){
if((i__243224_243869 < count__243223_243868)){
var child_struct_243871 = chunk__243222_243867.cljs$core$IIndexed$_nth$arity$2(null,i__243224_243869);
if((!((child_struct_243871 == null)))){
if(typeof child_struct_243871 === 'string'){
var text_243873 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_243873),child_struct_243871].join(''));
} else {
var children_243879 = shadow.dom.svg_node(child_struct_243871);
if(cljs.core.seq_QMARK_(children_243879)){
var seq__243246_243880 = cljs.core.seq(children_243879);
var chunk__243248_243881 = null;
var count__243249_243882 = (0);
var i__243250_243883 = (0);
while(true){
if((i__243250_243883 < count__243249_243882)){
var child_243885 = chunk__243248_243881.cljs$core$IIndexed$_nth$arity$2(null,i__243250_243883);
if(cljs.core.truth_(child_243885)){
node.appendChild(child_243885);


var G__243886 = seq__243246_243880;
var G__243887 = chunk__243248_243881;
var G__243888 = count__243249_243882;
var G__243889 = (i__243250_243883 + (1));
seq__243246_243880 = G__243886;
chunk__243248_243881 = G__243887;
count__243249_243882 = G__243888;
i__243250_243883 = G__243889;
continue;
} else {
var G__243890 = seq__243246_243880;
var G__243891 = chunk__243248_243881;
var G__243892 = count__243249_243882;
var G__243893 = (i__243250_243883 + (1));
seq__243246_243880 = G__243890;
chunk__243248_243881 = G__243891;
count__243249_243882 = G__243892;
i__243250_243883 = G__243893;
continue;
}
} else {
var temp__5804__auto___243895 = cljs.core.seq(seq__243246_243880);
if(temp__5804__auto___243895){
var seq__243246_243900__$1 = temp__5804__auto___243895;
if(cljs.core.chunked_seq_QMARK_(seq__243246_243900__$1)){
var c__5525__auto___243901 = cljs.core.chunk_first(seq__243246_243900__$1);
var G__243902 = cljs.core.chunk_rest(seq__243246_243900__$1);
var G__243903 = c__5525__auto___243901;
var G__243904 = cljs.core.count(c__5525__auto___243901);
var G__243905 = (0);
seq__243246_243880 = G__243902;
chunk__243248_243881 = G__243903;
count__243249_243882 = G__243904;
i__243250_243883 = G__243905;
continue;
} else {
var child_243908 = cljs.core.first(seq__243246_243900__$1);
if(cljs.core.truth_(child_243908)){
node.appendChild(child_243908);


var G__243910 = cljs.core.next(seq__243246_243900__$1);
var G__243911 = null;
var G__243912 = (0);
var G__243913 = (0);
seq__243246_243880 = G__243910;
chunk__243248_243881 = G__243911;
count__243249_243882 = G__243912;
i__243250_243883 = G__243913;
continue;
} else {
var G__243914 = cljs.core.next(seq__243246_243900__$1);
var G__243915 = null;
var G__243916 = (0);
var G__243917 = (0);
seq__243246_243880 = G__243914;
chunk__243248_243881 = G__243915;
count__243249_243882 = G__243916;
i__243250_243883 = G__243917;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_243879);
}
}


var G__243918 = seq__243220_243866;
var G__243919 = chunk__243222_243867;
var G__243920 = count__243223_243868;
var G__243921 = (i__243224_243869 + (1));
seq__243220_243866 = G__243918;
chunk__243222_243867 = G__243919;
count__243223_243868 = G__243920;
i__243224_243869 = G__243921;
continue;
} else {
var G__243922 = seq__243220_243866;
var G__243923 = chunk__243222_243867;
var G__243924 = count__243223_243868;
var G__243925 = (i__243224_243869 + (1));
seq__243220_243866 = G__243922;
chunk__243222_243867 = G__243923;
count__243223_243868 = G__243924;
i__243224_243869 = G__243925;
continue;
}
} else {
var temp__5804__auto___243926 = cljs.core.seq(seq__243220_243866);
if(temp__5804__auto___243926){
var seq__243220_243927__$1 = temp__5804__auto___243926;
if(cljs.core.chunked_seq_QMARK_(seq__243220_243927__$1)){
var c__5525__auto___243928 = cljs.core.chunk_first(seq__243220_243927__$1);
var G__243929 = cljs.core.chunk_rest(seq__243220_243927__$1);
var G__243930 = c__5525__auto___243928;
var G__243931 = cljs.core.count(c__5525__auto___243928);
var G__243932 = (0);
seq__243220_243866 = G__243929;
chunk__243222_243867 = G__243930;
count__243223_243868 = G__243931;
i__243224_243869 = G__243932;
continue;
} else {
var child_struct_243933 = cljs.core.first(seq__243220_243927__$1);
if((!((child_struct_243933 == null)))){
if(typeof child_struct_243933 === 'string'){
var text_243934 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_243934),child_struct_243933].join(''));
} else {
var children_243935 = shadow.dom.svg_node(child_struct_243933);
if(cljs.core.seq_QMARK_(children_243935)){
var seq__243260_243936 = cljs.core.seq(children_243935);
var chunk__243262_243937 = null;
var count__243263_243938 = (0);
var i__243264_243939 = (0);
while(true){
if((i__243264_243939 < count__243263_243938)){
var child_243944 = chunk__243262_243937.cljs$core$IIndexed$_nth$arity$2(null,i__243264_243939);
if(cljs.core.truth_(child_243944)){
node.appendChild(child_243944);


var G__243945 = seq__243260_243936;
var G__243946 = chunk__243262_243937;
var G__243947 = count__243263_243938;
var G__243948 = (i__243264_243939 + (1));
seq__243260_243936 = G__243945;
chunk__243262_243937 = G__243946;
count__243263_243938 = G__243947;
i__243264_243939 = G__243948;
continue;
} else {
var G__243949 = seq__243260_243936;
var G__243950 = chunk__243262_243937;
var G__243951 = count__243263_243938;
var G__243952 = (i__243264_243939 + (1));
seq__243260_243936 = G__243949;
chunk__243262_243937 = G__243950;
count__243263_243938 = G__243951;
i__243264_243939 = G__243952;
continue;
}
} else {
var temp__5804__auto___243953__$1 = cljs.core.seq(seq__243260_243936);
if(temp__5804__auto___243953__$1){
var seq__243260_243954__$1 = temp__5804__auto___243953__$1;
if(cljs.core.chunked_seq_QMARK_(seq__243260_243954__$1)){
var c__5525__auto___243955 = cljs.core.chunk_first(seq__243260_243954__$1);
var G__243956 = cljs.core.chunk_rest(seq__243260_243954__$1);
var G__243957 = c__5525__auto___243955;
var G__243958 = cljs.core.count(c__5525__auto___243955);
var G__243959 = (0);
seq__243260_243936 = G__243956;
chunk__243262_243937 = G__243957;
count__243263_243938 = G__243958;
i__243264_243939 = G__243959;
continue;
} else {
var child_243960 = cljs.core.first(seq__243260_243954__$1);
if(cljs.core.truth_(child_243960)){
node.appendChild(child_243960);


var G__243961 = cljs.core.next(seq__243260_243954__$1);
var G__243962 = null;
var G__243963 = (0);
var G__243964 = (0);
seq__243260_243936 = G__243961;
chunk__243262_243937 = G__243962;
count__243263_243938 = G__243963;
i__243264_243939 = G__243964;
continue;
} else {
var G__243965 = cljs.core.next(seq__243260_243954__$1);
var G__243966 = null;
var G__243967 = (0);
var G__243968 = (0);
seq__243260_243936 = G__243965;
chunk__243262_243937 = G__243966;
count__243263_243938 = G__243967;
i__243264_243939 = G__243968;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_243935);
}
}


var G__243969 = cljs.core.next(seq__243220_243927__$1);
var G__243970 = null;
var G__243971 = (0);
var G__243972 = (0);
seq__243220_243866 = G__243969;
chunk__243222_243867 = G__243970;
count__243223_243868 = G__243971;
i__243224_243869 = G__243972;
continue;
} else {
var G__243973 = cljs.core.next(seq__243220_243927__$1);
var G__243974 = null;
var G__243975 = (0);
var G__243976 = (0);
seq__243220_243866 = G__243973;
chunk__243222_243867 = G__243974;
count__243223_243868 = G__243975;
i__243224_243869 = G__243976;
continue;
}
}
} else {
}
}
break;
}

return node;
});
(shadow.dom.SVGElement["string"] = true);

(shadow.dom._to_svg["string"] = (function (this$){
if((this$ instanceof cljs.core.Keyword)){
return shadow.dom.make_svg_node(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [this$], null));
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("strings cannot be in svgs",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"this","this",-611633625),this$], null));
}
}));

(cljs.core.PersistentVector.prototype.shadow$dom$SVGElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.PersistentVector.prototype.shadow$dom$SVGElement$_to_svg$arity$1 = (function (this$){
var this$__$1 = this;
return shadow.dom.make_svg_node(this$__$1);
}));

(cljs.core.LazySeq.prototype.shadow$dom$SVGElement$ = cljs.core.PROTOCOL_SENTINEL);

(cljs.core.LazySeq.prototype.shadow$dom$SVGElement$_to_svg$arity$1 = (function (this$){
var this$__$1 = this;
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom._to_svg,this$__$1);
}));

(shadow.dom.SVGElement["null"] = true);

(shadow.dom._to_svg["null"] = (function (_){
return null;
}));
shadow.dom.svg = (function shadow$dom$svg(var_args){
var args__5732__auto__ = [];
var len__5726__auto___243992 = arguments.length;
var i__5727__auto___243993 = (0);
while(true){
if((i__5727__auto___243993 < len__5726__auto___243992)){
args__5732__auto__.push((arguments[i__5727__auto___243993]));

var G__243994 = (i__5727__auto___243993 + (1));
i__5727__auto___243993 = G__243994;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return shadow.dom.svg.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(shadow.dom.svg.cljs$core$IFn$_invoke$arity$variadic = (function (attrs,children){
return shadow.dom._to_svg(cljs.core.vec(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"svg","svg",856789142),attrs], null),children)));
}));

(shadow.dom.svg.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(shadow.dom.svg.cljs$lang$applyTo = (function (seq243295){
var G__243296 = cljs.core.first(seq243295);
var seq243295__$1 = cljs.core.next(seq243295);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__243296,seq243295__$1);
}));


//# sourceMappingURL=shadow.dom.js.map
