goog.provide('shadow.dom');
shadow.dom.transition_supported_QMARK_ = true;

/**
 * @interface
 */
shadow.dom.IElement = function(){};

var shadow$dom$IElement$_to_dom$dyn_14282 = (function (this$){
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
return shadow$dom$IElement$_to_dom$dyn_14282(this$);
}
});


/**
 * @interface
 */
shadow.dom.SVGElement = function(){};

var shadow$dom$SVGElement$_to_svg$dyn_14287 = (function (this$){
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
return shadow$dom$SVGElement$_to_svg$dyn_14287(this$);
}
});

shadow.dom.lazy_native_coll_seq = (function shadow$dom$lazy_native_coll_seq(coll,idx){
if((idx < coll.length)){
return (new cljs.core.LazySeq(null,(function (){
return cljs.core.cons((coll[idx]),(function (){var G__13064 = coll;
var G__13065 = (idx + (1));
return (shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2 ? shadow.dom.lazy_native_coll_seq.cljs$core$IFn$_invoke$arity$2(G__13064,G__13065) : shadow.dom.lazy_native_coll_seq.call(null,G__13064,G__13065));
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
var G__13145 = arguments.length;
switch (G__13145) {
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
var G__13155 = arguments.length;
switch (G__13155) {
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
var G__13164 = arguments.length;
switch (G__13164) {
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
var G__13180 = arguments.length;
switch (G__13180) {
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
var G__13201 = arguments.length;
switch (G__13201) {
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
var G__13242 = arguments.length;
switch (G__13242) {
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
}catch (e13258){if((e13258 instanceof Object)){
var e = e13258;
return console.log("didnt support attachEvent",el,e);
} else {
throw e13258;

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
var seq__13276 = cljs.core.seq(shadow.dom.query.cljs$core$IFn$_invoke$arity$2(selector,root_el));
var chunk__13277 = null;
var count__13278 = (0);
var i__13279 = (0);
while(true){
if((i__13279 < count__13278)){
var el = chunk__13277.cljs$core$IIndexed$_nth$arity$2(null,i__13279);
var handler_14325__$1 = ((function (seq__13276,chunk__13277,count__13278,i__13279,el){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__13276,chunk__13277,count__13278,i__13279,el))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_14325__$1);


var G__14326 = seq__13276;
var G__14327 = chunk__13277;
var G__14328 = count__13278;
var G__14329 = (i__13279 + (1));
seq__13276 = G__14326;
chunk__13277 = G__14327;
count__13278 = G__14328;
i__13279 = G__14329;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13276);
if(temp__5804__auto__){
var seq__13276__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13276__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13276__$1);
var G__14335 = cljs.core.chunk_rest(seq__13276__$1);
var G__14336 = c__5525__auto__;
var G__14337 = cljs.core.count(c__5525__auto__);
var G__14338 = (0);
seq__13276 = G__14335;
chunk__13277 = G__14336;
count__13278 = G__14337;
i__13279 = G__14338;
continue;
} else {
var el = cljs.core.first(seq__13276__$1);
var handler_14339__$1 = ((function (seq__13276,chunk__13277,count__13278,i__13279,el,seq__13276__$1,temp__5804__auto__){
return (function (e){
return (handler.cljs$core$IFn$_invoke$arity$2 ? handler.cljs$core$IFn$_invoke$arity$2(e,el) : handler.call(null,e,el));
});})(seq__13276,chunk__13277,count__13278,i__13279,el,seq__13276__$1,temp__5804__auto__))
;
shadow.dom.dom_listen(el,cljs.core.name(ev),handler_14339__$1);


var G__14343 = cljs.core.next(seq__13276__$1);
var G__14344 = null;
var G__14345 = (0);
var G__14346 = (0);
seq__13276 = G__14343;
chunk__13277 = G__14344;
count__13278 = G__14345;
i__13279 = G__14346;
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
var G__13332 = arguments.length;
switch (G__13332) {
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
var seq__13336 = cljs.core.seq(events);
var chunk__13337 = null;
var count__13338 = (0);
var i__13339 = (0);
while(true){
if((i__13339 < count__13338)){
var vec__13352 = chunk__13337.cljs$core$IIndexed$_nth$arity$2(null,i__13339);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13352,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13352,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__14356 = seq__13336;
var G__14357 = chunk__13337;
var G__14358 = count__13338;
var G__14359 = (i__13339 + (1));
seq__13336 = G__14356;
chunk__13337 = G__14357;
count__13338 = G__14358;
i__13339 = G__14359;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13336);
if(temp__5804__auto__){
var seq__13336__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13336__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13336__$1);
var G__14361 = cljs.core.chunk_rest(seq__13336__$1);
var G__14362 = c__5525__auto__;
var G__14363 = cljs.core.count(c__5525__auto__);
var G__14364 = (0);
seq__13336 = G__14361;
chunk__13337 = G__14362;
count__13338 = G__14363;
i__13339 = G__14364;
continue;
} else {
var vec__13357 = cljs.core.first(seq__13336__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13357,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13357,(1),null);
shadow.dom.on.cljs$core$IFn$_invoke$arity$3(el,k,v);


var G__14365 = cljs.core.next(seq__13336__$1);
var G__14366 = null;
var G__14367 = (0);
var G__14368 = (0);
seq__13336 = G__14365;
chunk__13337 = G__14366;
count__13338 = G__14367;
i__13339 = G__14368;
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
var seq__13363 = cljs.core.seq(styles);
var chunk__13365 = null;
var count__13366 = (0);
var i__13367 = (0);
while(true){
if((i__13367 < count__13366)){
var vec__13382 = chunk__13365.cljs$core$IIndexed$_nth$arity$2(null,i__13367);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13382,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13382,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__14371 = seq__13363;
var G__14372 = chunk__13365;
var G__14373 = count__13366;
var G__14374 = (i__13367 + (1));
seq__13363 = G__14371;
chunk__13365 = G__14372;
count__13366 = G__14373;
i__13367 = G__14374;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13363);
if(temp__5804__auto__){
var seq__13363__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13363__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13363__$1);
var G__14379 = cljs.core.chunk_rest(seq__13363__$1);
var G__14380 = c__5525__auto__;
var G__14381 = cljs.core.count(c__5525__auto__);
var G__14382 = (0);
seq__13363 = G__14379;
chunk__13365 = G__14380;
count__13366 = G__14381;
i__13367 = G__14382;
continue;
} else {
var vec__13386 = cljs.core.first(seq__13363__$1);
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13386,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13386,(1),null);
goog.style.setStyle(dom,cljs.core.name(k),(((v == null))?"":v));


var G__14383 = cljs.core.next(seq__13363__$1);
var G__14384 = null;
var G__14385 = (0);
var G__14386 = (0);
seq__13363 = G__14383;
chunk__13365 = G__14384;
count__13366 = G__14385;
i__13367 = G__14386;
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
var G__13397_14388 = key;
var G__13397_14389__$1 = (((G__13397_14388 instanceof cljs.core.Keyword))?G__13397_14388.fqn:null);
switch (G__13397_14389__$1) {
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
var ks_14393 = cljs.core.name(key);
if(cljs.core.truth_((function (){var or__5002__auto__ = goog.string.startsWith(ks_14393,"data-");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return goog.string.startsWith(ks_14393,"aria-");
}
})())){
el.setAttribute(ks_14393,value);
} else {
(el[ks_14393] = value);
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
shadow.dom.create_dom_node = (function shadow$dom$create_dom_node(tag_def,p__13422){
var map__13423 = p__13422;
var map__13423__$1 = cljs.core.__destructure_map(map__13423);
var props = map__13423__$1;
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__13423__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var tag_props = ({});
var vec__13429 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13429,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13429,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13429,(2),null);
if(cljs.core.truth_(tag_id)){
(tag_props["id"] = tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
(tag_props["class"] = shadow.dom.merge_class_string(class$,tag_classes));
} else {
}

var G__13433 = goog.dom.createDom(tag_name,tag_props);
shadow.dom.set_attrs(G__13433,cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(props,new cljs.core.Keyword(null,"class","class",-2030961996)));

return G__13433;
});
shadow.dom.append = (function shadow$dom$append(var_args){
var G__13437 = arguments.length;
switch (G__13437) {
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

shadow.dom.destructure_node = (function shadow$dom$destructure_node(create_fn,p__13447){
var vec__13448 = p__13447;
var seq__13449 = cljs.core.seq(vec__13448);
var first__13450 = cljs.core.first(seq__13449);
var seq__13449__$1 = cljs.core.next(seq__13449);
var nn = first__13450;
var first__13450__$1 = cljs.core.first(seq__13449__$1);
var seq__13449__$2 = cljs.core.next(seq__13449__$1);
var np = first__13450__$1;
var nc = seq__13449__$2;
var node = vec__13448;
if((nn instanceof cljs.core.Keyword)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("invalid dom node",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"node","node",581201198),node], null));
}

if((((np == null)) && ((nc == null)))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__13456 = nn;
var G__13457 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__13456,G__13457) : create_fn.call(null,G__13456,G__13457));
})(),cljs.core.List.EMPTY], null);
} else {
if(cljs.core.map_QMARK_(np)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(nn,np) : create_fn.call(null,nn,np)),nc], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var G__13460 = nn;
var G__13462 = cljs.core.PersistentArrayMap.EMPTY;
return (create_fn.cljs$core$IFn$_invoke$arity$2 ? create_fn.cljs$core$IFn$_invoke$arity$2(G__13460,G__13462) : create_fn.call(null,G__13460,G__13462));
})(),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(nc,np)], null);

}
}
});
shadow.dom.make_dom_node = (function shadow$dom$make_dom_node(structure){
var vec__13467 = shadow.dom.destructure_node(shadow.dom.create_dom_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13467,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13467,(1),null);
var seq__13470_14418 = cljs.core.seq(node_children);
var chunk__13471_14419 = null;
var count__13472_14420 = (0);
var i__13473_14421 = (0);
while(true){
if((i__13473_14421 < count__13472_14420)){
var child_struct_14422 = chunk__13471_14419.cljs$core$IIndexed$_nth$arity$2(null,i__13473_14421);
var children_14423 = shadow.dom.dom_node(child_struct_14422);
if(cljs.core.seq_QMARK_(children_14423)){
var seq__13560_14424 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_14423));
var chunk__13562_14425 = null;
var count__13563_14426 = (0);
var i__13564_14427 = (0);
while(true){
if((i__13564_14427 < count__13563_14426)){
var child_14428 = chunk__13562_14425.cljs$core$IIndexed$_nth$arity$2(null,i__13564_14427);
if(cljs.core.truth_(child_14428)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_14428);


var G__14429 = seq__13560_14424;
var G__14430 = chunk__13562_14425;
var G__14431 = count__13563_14426;
var G__14432 = (i__13564_14427 + (1));
seq__13560_14424 = G__14429;
chunk__13562_14425 = G__14430;
count__13563_14426 = G__14431;
i__13564_14427 = G__14432;
continue;
} else {
var G__14433 = seq__13560_14424;
var G__14434 = chunk__13562_14425;
var G__14435 = count__13563_14426;
var G__14436 = (i__13564_14427 + (1));
seq__13560_14424 = G__14433;
chunk__13562_14425 = G__14434;
count__13563_14426 = G__14435;
i__13564_14427 = G__14436;
continue;
}
} else {
var temp__5804__auto___14438 = cljs.core.seq(seq__13560_14424);
if(temp__5804__auto___14438){
var seq__13560_14439__$1 = temp__5804__auto___14438;
if(cljs.core.chunked_seq_QMARK_(seq__13560_14439__$1)){
var c__5525__auto___14440 = cljs.core.chunk_first(seq__13560_14439__$1);
var G__14441 = cljs.core.chunk_rest(seq__13560_14439__$1);
var G__14442 = c__5525__auto___14440;
var G__14443 = cljs.core.count(c__5525__auto___14440);
var G__14444 = (0);
seq__13560_14424 = G__14441;
chunk__13562_14425 = G__14442;
count__13563_14426 = G__14443;
i__13564_14427 = G__14444;
continue;
} else {
var child_14445 = cljs.core.first(seq__13560_14439__$1);
if(cljs.core.truth_(child_14445)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_14445);


var G__14447 = cljs.core.next(seq__13560_14439__$1);
var G__14448 = null;
var G__14449 = (0);
var G__14450 = (0);
seq__13560_14424 = G__14447;
chunk__13562_14425 = G__14448;
count__13563_14426 = G__14449;
i__13564_14427 = G__14450;
continue;
} else {
var G__14451 = cljs.core.next(seq__13560_14439__$1);
var G__14452 = null;
var G__14453 = (0);
var G__14454 = (0);
seq__13560_14424 = G__14451;
chunk__13562_14425 = G__14452;
count__13563_14426 = G__14453;
i__13564_14427 = G__14454;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_14423);
}


var G__14455 = seq__13470_14418;
var G__14456 = chunk__13471_14419;
var G__14457 = count__13472_14420;
var G__14458 = (i__13473_14421 + (1));
seq__13470_14418 = G__14455;
chunk__13471_14419 = G__14456;
count__13472_14420 = G__14457;
i__13473_14421 = G__14458;
continue;
} else {
var temp__5804__auto___14460 = cljs.core.seq(seq__13470_14418);
if(temp__5804__auto___14460){
var seq__13470_14461__$1 = temp__5804__auto___14460;
if(cljs.core.chunked_seq_QMARK_(seq__13470_14461__$1)){
var c__5525__auto___14462 = cljs.core.chunk_first(seq__13470_14461__$1);
var G__14463 = cljs.core.chunk_rest(seq__13470_14461__$1);
var G__14464 = c__5525__auto___14462;
var G__14465 = cljs.core.count(c__5525__auto___14462);
var G__14466 = (0);
seq__13470_14418 = G__14463;
chunk__13471_14419 = G__14464;
count__13472_14420 = G__14465;
i__13473_14421 = G__14466;
continue;
} else {
var child_struct_14467 = cljs.core.first(seq__13470_14461__$1);
var children_14468 = shadow.dom.dom_node(child_struct_14467);
if(cljs.core.seq_QMARK_(children_14468)){
var seq__13626_14469 = cljs.core.seq(cljs.core.map.cljs$core$IFn$_invoke$arity$2(shadow.dom.dom_node,children_14468));
var chunk__13628_14470 = null;
var count__13629_14471 = (0);
var i__13630_14472 = (0);
while(true){
if((i__13630_14472 < count__13629_14471)){
var child_14475 = chunk__13628_14470.cljs$core$IIndexed$_nth$arity$2(null,i__13630_14472);
if(cljs.core.truth_(child_14475)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_14475);


var G__14479 = seq__13626_14469;
var G__14480 = chunk__13628_14470;
var G__14481 = count__13629_14471;
var G__14482 = (i__13630_14472 + (1));
seq__13626_14469 = G__14479;
chunk__13628_14470 = G__14480;
count__13629_14471 = G__14481;
i__13630_14472 = G__14482;
continue;
} else {
var G__14484 = seq__13626_14469;
var G__14485 = chunk__13628_14470;
var G__14486 = count__13629_14471;
var G__14487 = (i__13630_14472 + (1));
seq__13626_14469 = G__14484;
chunk__13628_14470 = G__14485;
count__13629_14471 = G__14486;
i__13630_14472 = G__14487;
continue;
}
} else {
var temp__5804__auto___14488__$1 = cljs.core.seq(seq__13626_14469);
if(temp__5804__auto___14488__$1){
var seq__13626_14492__$1 = temp__5804__auto___14488__$1;
if(cljs.core.chunked_seq_QMARK_(seq__13626_14492__$1)){
var c__5525__auto___14493 = cljs.core.chunk_first(seq__13626_14492__$1);
var G__14494 = cljs.core.chunk_rest(seq__13626_14492__$1);
var G__14495 = c__5525__auto___14493;
var G__14496 = cljs.core.count(c__5525__auto___14493);
var G__14497 = (0);
seq__13626_14469 = G__14494;
chunk__13628_14470 = G__14495;
count__13629_14471 = G__14496;
i__13630_14472 = G__14497;
continue;
} else {
var child_14498 = cljs.core.first(seq__13626_14492__$1);
if(cljs.core.truth_(child_14498)){
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,child_14498);


var G__14500 = cljs.core.next(seq__13626_14492__$1);
var G__14501 = null;
var G__14502 = (0);
var G__14503 = (0);
seq__13626_14469 = G__14500;
chunk__13628_14470 = G__14501;
count__13629_14471 = G__14502;
i__13630_14472 = G__14503;
continue;
} else {
var G__14507 = cljs.core.next(seq__13626_14492__$1);
var G__14508 = null;
var G__14509 = (0);
var G__14510 = (0);
seq__13626_14469 = G__14507;
chunk__13628_14470 = G__14508;
count__13629_14471 = G__14509;
i__13630_14472 = G__14510;
continue;
}
}
} else {
}
}
break;
}
} else {
shadow.dom.append.cljs$core$IFn$_invoke$arity$2(node,children_14468);
}


var G__14511 = cljs.core.next(seq__13470_14461__$1);
var G__14512 = null;
var G__14513 = (0);
var G__14514 = (0);
seq__13470_14418 = G__14511;
chunk__13471_14419 = G__14512;
count__13472_14420 = G__14513;
i__13473_14421 = G__14514;
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
var seq__13754 = cljs.core.seq(node);
var chunk__13755 = null;
var count__13756 = (0);
var i__13757 = (0);
while(true){
if((i__13757 < count__13756)){
var n = chunk__13755.cljs$core$IIndexed$_nth$arity$2(null,i__13757);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__14526 = seq__13754;
var G__14527 = chunk__13755;
var G__14528 = count__13756;
var G__14529 = (i__13757 + (1));
seq__13754 = G__14526;
chunk__13755 = G__14527;
count__13756 = G__14528;
i__13757 = G__14529;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13754);
if(temp__5804__auto__){
var seq__13754__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13754__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13754__$1);
var G__14530 = cljs.core.chunk_rest(seq__13754__$1);
var G__14531 = c__5525__auto__;
var G__14532 = cljs.core.count(c__5525__auto__);
var G__14533 = (0);
seq__13754 = G__14530;
chunk__13755 = G__14531;
count__13756 = G__14532;
i__13757 = G__14533;
continue;
} else {
var n = cljs.core.first(seq__13754__$1);
(shadow.dom.remove.cljs$core$IFn$_invoke$arity$1 ? shadow.dom.remove.cljs$core$IFn$_invoke$arity$1(n) : shadow.dom.remove.call(null,n));


var G__14534 = cljs.core.next(seq__13754__$1);
var G__14535 = null;
var G__14536 = (0);
var G__14537 = (0);
seq__13754 = G__14534;
chunk__13755 = G__14535;
count__13756 = G__14536;
i__13757 = G__14537;
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
var G__13791 = arguments.length;
switch (G__13791) {
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
var G__13803 = arguments.length;
switch (G__13803) {
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
var G__13824 = arguments.length;
switch (G__13824) {
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
var len__5726__auto___14565 = arguments.length;
var i__5727__auto___14567 = (0);
while(true){
if((i__5727__auto___14567 < len__5726__auto___14565)){
args__5732__auto__.push((arguments[i__5727__auto___14567]));

var G__14569 = (i__5727__auto___14567 + (1));
i__5727__auto___14567 = G__14569;
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
var seq__13847_14576 = cljs.core.seq(nodes);
var chunk__13848_14577 = null;
var count__13849_14578 = (0);
var i__13850_14579 = (0);
while(true){
if((i__13850_14579 < count__13849_14578)){
var node_14582 = chunk__13848_14577.cljs$core$IIndexed$_nth$arity$2(null,i__13850_14579);
fragment.appendChild(shadow.dom._to_dom(node_14582));


var G__14587 = seq__13847_14576;
var G__14588 = chunk__13848_14577;
var G__14589 = count__13849_14578;
var G__14590 = (i__13850_14579 + (1));
seq__13847_14576 = G__14587;
chunk__13848_14577 = G__14588;
count__13849_14578 = G__14589;
i__13850_14579 = G__14590;
continue;
} else {
var temp__5804__auto___14594 = cljs.core.seq(seq__13847_14576);
if(temp__5804__auto___14594){
var seq__13847_14595__$1 = temp__5804__auto___14594;
if(cljs.core.chunked_seq_QMARK_(seq__13847_14595__$1)){
var c__5525__auto___14596 = cljs.core.chunk_first(seq__13847_14595__$1);
var G__14599 = cljs.core.chunk_rest(seq__13847_14595__$1);
var G__14600 = c__5525__auto___14596;
var G__14601 = cljs.core.count(c__5525__auto___14596);
var G__14602 = (0);
seq__13847_14576 = G__14599;
chunk__13848_14577 = G__14600;
count__13849_14578 = G__14601;
i__13850_14579 = G__14602;
continue;
} else {
var node_14603 = cljs.core.first(seq__13847_14595__$1);
fragment.appendChild(shadow.dom._to_dom(node_14603));


var G__14608 = cljs.core.next(seq__13847_14595__$1);
var G__14609 = null;
var G__14610 = (0);
var G__14611 = (0);
seq__13847_14576 = G__14608;
chunk__13848_14577 = G__14609;
count__13849_14578 = G__14610;
i__13850_14579 = G__14611;
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
(shadow.dom.fragment.cljs$lang$applyTo = (function (seq13841){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq13841));
}));

/**
 * given a html string, eval all <script> tags and return the html without the scripts
 * don't do this for everything, only content you trust.
 */
shadow.dom.eval_scripts = (function shadow$dom$eval_scripts(s){
var scripts = cljs.core.re_seq(/<script[^>]*?>(.+?)<\/script>/,s);
var seq__13868_14612 = cljs.core.seq(scripts);
var chunk__13869_14613 = null;
var count__13870_14614 = (0);
var i__13871_14615 = (0);
while(true){
if((i__13871_14615 < count__13870_14614)){
var vec__13886_14617 = chunk__13869_14613.cljs$core$IIndexed$_nth$arity$2(null,i__13871_14615);
var script_tag_14618 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13886_14617,(0),null);
var script_body_14619 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13886_14617,(1),null);
eval(script_body_14619);


var G__14620 = seq__13868_14612;
var G__14621 = chunk__13869_14613;
var G__14622 = count__13870_14614;
var G__14623 = (i__13871_14615 + (1));
seq__13868_14612 = G__14620;
chunk__13869_14613 = G__14621;
count__13870_14614 = G__14622;
i__13871_14615 = G__14623;
continue;
} else {
var temp__5804__auto___14624 = cljs.core.seq(seq__13868_14612);
if(temp__5804__auto___14624){
var seq__13868_14625__$1 = temp__5804__auto___14624;
if(cljs.core.chunked_seq_QMARK_(seq__13868_14625__$1)){
var c__5525__auto___14626 = cljs.core.chunk_first(seq__13868_14625__$1);
var G__14628 = cljs.core.chunk_rest(seq__13868_14625__$1);
var G__14629 = c__5525__auto___14626;
var G__14630 = cljs.core.count(c__5525__auto___14626);
var G__14631 = (0);
seq__13868_14612 = G__14628;
chunk__13869_14613 = G__14629;
count__13870_14614 = G__14630;
i__13871_14615 = G__14631;
continue;
} else {
var vec__13890_14632 = cljs.core.first(seq__13868_14625__$1);
var script_tag_14633 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13890_14632,(0),null);
var script_body_14634 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13890_14632,(1),null);
eval(script_body_14634);


var G__14635 = cljs.core.next(seq__13868_14625__$1);
var G__14636 = null;
var G__14637 = (0);
var G__14638 = (0);
seq__13868_14612 = G__14635;
chunk__13869_14613 = G__14636;
count__13870_14614 = G__14637;
i__13871_14615 = G__14638;
continue;
}
} else {
}
}
break;
}

return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (s__$1,p__13893){
var vec__13894 = p__13893;
var script_tag = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13894,(0),null);
var script_body = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13894,(1),null);
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
var G__13912 = arguments.length;
switch (G__13912) {
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
var seq__13928 = cljs.core.seq(style_keys);
var chunk__13929 = null;
var count__13930 = (0);
var i__13931 = (0);
while(true){
if((i__13931 < count__13930)){
var it = chunk__13929.cljs$core$IIndexed$_nth$arity$2(null,i__13931);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__14644 = seq__13928;
var G__14645 = chunk__13929;
var G__14646 = count__13930;
var G__14647 = (i__13931 + (1));
seq__13928 = G__14644;
chunk__13929 = G__14645;
count__13930 = G__14646;
i__13931 = G__14647;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13928);
if(temp__5804__auto__){
var seq__13928__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13928__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13928__$1);
var G__14648 = cljs.core.chunk_rest(seq__13928__$1);
var G__14649 = c__5525__auto__;
var G__14650 = cljs.core.count(c__5525__auto__);
var G__14651 = (0);
seq__13928 = G__14648;
chunk__13929 = G__14649;
count__13930 = G__14650;
i__13931 = G__14651;
continue;
} else {
var it = cljs.core.first(seq__13928__$1);
shadow.dom.remove_style_STAR_(el__$1,it);


var G__14652 = cljs.core.next(seq__13928__$1);
var G__14653 = null;
var G__14654 = (0);
var G__14655 = (0);
seq__13928 = G__14652;
chunk__13929 = G__14653;
count__13930 = G__14654;
i__13931 = G__14655;
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

(shadow.dom.Coordinate.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k13956,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__13970 = k13956;
var G__13970__$1 = (((G__13970 instanceof cljs.core.Keyword))?G__13970.fqn:null);
switch (G__13970__$1) {
case "x":
return self__.x;

break;
case "y":
return self__.y;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k13956,else__5303__auto__);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__13974){
var vec__13975 = p__13974;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13975,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13975,(1),null);
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

(shadow.dom.Coordinate.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__13955){
var self__ = this;
var G__13955__$1 = this;
return (new cljs.core.RecordIter((0),G__13955__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"x","x",2099068185),new cljs.core.Keyword(null,"y","y",-1757859776)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
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

(shadow.dom.Coordinate.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this13957,other13958){
var self__ = this;
var this13957__$1 = this;
return (((!((other13958 == null)))) && ((((this13957__$1.constructor === other13958.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this13957__$1.x,other13958.x)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this13957__$1.y,other13958.y)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this13957__$1.__extmap,other13958.__extmap)))))))));
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

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k13956){
var self__ = this;
var this__5307__auto____$1 = this;
var G__13998 = k13956;
var G__13998__$1 = (((G__13998 instanceof cljs.core.Keyword))?G__13998.fqn:null);
switch (G__13998__$1) {
case "x":
case "y":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k13956);

}
}));

(shadow.dom.Coordinate.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__13955){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__14005 = cljs.core.keyword_identical_QMARK_;
var expr__14006 = k__5309__auto__;
if(cljs.core.truth_((pred__14005.cljs$core$IFn$_invoke$arity$2 ? pred__14005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"x","x",2099068185),expr__14006) : pred__14005.call(null,new cljs.core.Keyword(null,"x","x",2099068185),expr__14006)))){
return (new shadow.dom.Coordinate(G__13955,self__.y,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__14005.cljs$core$IFn$_invoke$arity$2 ? pred__14005.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"y","y",-1757859776),expr__14006) : pred__14005.call(null,new cljs.core.Keyword(null,"y","y",-1757859776),expr__14006)))){
return (new shadow.dom.Coordinate(self__.x,G__13955,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Coordinate(self__.x,self__.y,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__13955),null));
}
}
}));

(shadow.dom.Coordinate.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"x","x",2099068185),self__.x,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"y","y",-1757859776),self__.y,null))], null),self__.__extmap));
}));

(shadow.dom.Coordinate.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__13955){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Coordinate(self__.x,self__.y,G__13955,self__.__extmap,self__.__hash));
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
shadow.dom.map__GT_Coordinate = (function shadow$dom$map__GT_Coordinate(G__13964){
var extmap__5342__auto__ = (function (){var G__14023 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__13964,new cljs.core.Keyword(null,"x","x",2099068185),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"y","y",-1757859776)], 0));
if(cljs.core.record_QMARK_(G__13964)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__14023);
} else {
return G__14023;
}
})();
return (new shadow.dom.Coordinate(new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(G__13964),new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(G__13964),null,cljs.core.not_empty(extmap__5342__auto__),null));
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

(shadow.dom.Size.prototype.cljs$core$ILookup$_lookup$arity$3 = (function (this__5302__auto__,k14037,else__5303__auto__){
var self__ = this;
var this__5302__auto____$1 = this;
var G__14044 = k14037;
var G__14044__$1 = (((G__14044 instanceof cljs.core.Keyword))?G__14044.fqn:null);
switch (G__14044__$1) {
case "w":
return self__.w;

break;
case "h":
return self__.h;

break;
default:
return cljs.core.get.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k14037,else__5303__auto__);

}
}));

(shadow.dom.Size.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = (function (this__5320__auto__,f__5321__auto__,init__5322__auto__){
var self__ = this;
var this__5320__auto____$1 = this;
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (ret__5323__auto__,p__14047){
var vec__14048 = p__14047;
var k__5324__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14048,(0),null);
var v__5325__auto__ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14048,(1),null);
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

(shadow.dom.Size.prototype.cljs$core$IIterable$_iterator$arity$1 = (function (G__14036){
var self__ = this;
var G__14036__$1 = this;
return (new cljs.core.RecordIter((0),G__14036__$1,2,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"w","w",354169001),new cljs.core.Keyword(null,"h","h",1109658740)], null),(cljs.core.truth_(self__.__extmap)?cljs.core._iterator(self__.__extmap):cljs.core.nil_iter())));
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

(shadow.dom.Size.prototype.cljs$core$IEquiv$_equiv$arity$2 = (function (this14038,other14039){
var self__ = this;
var this14038__$1 = this;
return (((!((other14039 == null)))) && ((((this14038__$1.constructor === other14039.constructor)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this14038__$1.w,other14039.w)) && (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this14038__$1.h,other14039.h)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(this14038__$1.__extmap,other14039.__extmap)))))))));
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

(shadow.dom.Size.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = (function (this__5307__auto__,k14037){
var self__ = this;
var this__5307__auto____$1 = this;
var G__14057 = k14037;
var G__14057__$1 = (((G__14057 instanceof cljs.core.Keyword))?G__14057.fqn:null);
switch (G__14057__$1) {
case "w":
case "h":
return true;

break;
default:
return cljs.core.contains_QMARK_(self__.__extmap,k14037);

}
}));

(shadow.dom.Size.prototype.cljs$core$IAssociative$_assoc$arity$3 = (function (this__5308__auto__,k__5309__auto__,G__14036){
var self__ = this;
var this__5308__auto____$1 = this;
var pred__14059 = cljs.core.keyword_identical_QMARK_;
var expr__14060 = k__5309__auto__;
if(cljs.core.truth_((pred__14059.cljs$core$IFn$_invoke$arity$2 ? pred__14059.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"w","w",354169001),expr__14060) : pred__14059.call(null,new cljs.core.Keyword(null,"w","w",354169001),expr__14060)))){
return (new shadow.dom.Size(G__14036,self__.h,self__.__meta,self__.__extmap,null));
} else {
if(cljs.core.truth_((pred__14059.cljs$core$IFn$_invoke$arity$2 ? pred__14059.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"h","h",1109658740),expr__14060) : pred__14059.call(null,new cljs.core.Keyword(null,"h","h",1109658740),expr__14060)))){
return (new shadow.dom.Size(self__.w,G__14036,self__.__meta,self__.__extmap,null));
} else {
return (new shadow.dom.Size(self__.w,self__.h,self__.__meta,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.__extmap,k__5309__auto__,G__14036),null));
}
}
}));

(shadow.dom.Size.prototype.cljs$core$ISeqable$_seq$arity$1 = (function (this__5313__auto__){
var self__ = this;
var this__5313__auto____$1 = this;
return cljs.core.seq(cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(new cljs.core.MapEntry(new cljs.core.Keyword(null,"w","w",354169001),self__.w,null)),(new cljs.core.MapEntry(new cljs.core.Keyword(null,"h","h",1109658740),self__.h,null))], null),self__.__extmap));
}));

(shadow.dom.Size.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = (function (this__5299__auto__,G__14036){
var self__ = this;
var this__5299__auto____$1 = this;
return (new shadow.dom.Size(self__.w,self__.h,G__14036,self__.__extmap,self__.__hash));
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
shadow.dom.map__GT_Size = (function shadow$dom$map__GT_Size(G__14040){
var extmap__5342__auto__ = (function (){var G__14069 = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(G__14040,new cljs.core.Keyword(null,"w","w",354169001),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"h","h",1109658740)], 0));
if(cljs.core.record_QMARK_(G__14040)){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,G__14069);
} else {
return G__14069;
}
})();
return (new shadow.dom.Size(new cljs.core.Keyword(null,"w","w",354169001).cljs$core$IFn$_invoke$arity$1(G__14040),new cljs.core.Keyword(null,"h","h",1109658740).cljs$core$IFn$_invoke$arity$1(G__14040),null,cljs.core.not_empty(extmap__5342__auto__),null));
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
var G__14695 = (i + (1));
var G__14696 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret,(opts[i]["value"]));
i = G__14695;
ret = G__14696;
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
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(path),"?",clojure.string.join.cljs$core$IFn$_invoke$arity$2("&",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p__14091){
var vec__14093 = p__14091;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14093,(0),null);
var v = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14093,(1),null);
return [cljs.core.name(k),"=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encodeURIComponent(cljs.core.str.cljs$core$IFn$_invoke$arity$1(v)))].join('');
}),query_params))].join('');
}
});
shadow.dom.redirect = (function shadow$dom$redirect(var_args){
var G__14107 = arguments.length;
switch (G__14107) {
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
var G__14700 = ps;
var G__14701 = (i + (1));
el__$1 = G__14700;
i = G__14701;
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
var vec__14130 = shadow.dom.parse_tag(tag_def);
var tag_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14130,(0),null);
var tag_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14130,(1),null);
var tag_classes = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14130,(2),null);
var el = document.createElementNS("http://www.w3.org/2000/svg",tag_name);
if(cljs.core.truth_(tag_id)){
el.setAttribute("id",tag_id);
} else {
}

if(cljs.core.truth_(tag_classes)){
el.setAttribute("class",shadow.dom.merge_class_string(new cljs.core.Keyword(null,"class","class",-2030961996).cljs$core$IFn$_invoke$arity$1(props),tag_classes));
} else {
}

var seq__14135_14703 = cljs.core.seq(props);
var chunk__14136_14704 = null;
var count__14137_14705 = (0);
var i__14138_14706 = (0);
while(true){
if((i__14138_14706 < count__14137_14705)){
var vec__14149_14709 = chunk__14136_14704.cljs$core$IIndexed$_nth$arity$2(null,i__14138_14706);
var k_14710 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14149_14709,(0),null);
var v_14711 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14149_14709,(1),null);
el.setAttributeNS((function (){var temp__5804__auto__ = cljs.core.namespace(k_14710);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_14710),v_14711);


var G__14713 = seq__14135_14703;
var G__14714 = chunk__14136_14704;
var G__14715 = count__14137_14705;
var G__14716 = (i__14138_14706 + (1));
seq__14135_14703 = G__14713;
chunk__14136_14704 = G__14714;
count__14137_14705 = G__14715;
i__14138_14706 = G__14716;
continue;
} else {
var temp__5804__auto___14717 = cljs.core.seq(seq__14135_14703);
if(temp__5804__auto___14717){
var seq__14135_14718__$1 = temp__5804__auto___14717;
if(cljs.core.chunked_seq_QMARK_(seq__14135_14718__$1)){
var c__5525__auto___14719 = cljs.core.chunk_first(seq__14135_14718__$1);
var G__14720 = cljs.core.chunk_rest(seq__14135_14718__$1);
var G__14721 = c__5525__auto___14719;
var G__14722 = cljs.core.count(c__5525__auto___14719);
var G__14723 = (0);
seq__14135_14703 = G__14720;
chunk__14136_14704 = G__14721;
count__14137_14705 = G__14722;
i__14138_14706 = G__14723;
continue;
} else {
var vec__14154_14724 = cljs.core.first(seq__14135_14718__$1);
var k_14725 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14154_14724,(0),null);
var v_14726 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14154_14724,(1),null);
el.setAttributeNS((function (){var temp__5804__auto____$1 = cljs.core.namespace(k_14725);
if(cljs.core.truth_(temp__5804__auto____$1)){
var ns = temp__5804__auto____$1;
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shadow.dom.xmlns),ns);
} else {
return null;
}
})(),cljs.core.name(k_14725),v_14726);


var G__14728 = cljs.core.next(seq__14135_14718__$1);
var G__14729 = null;
var G__14730 = (0);
var G__14731 = (0);
seq__14135_14703 = G__14728;
chunk__14136_14704 = G__14729;
count__14137_14705 = G__14730;
i__14138_14706 = G__14731;
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
var vec__14164 = shadow.dom.destructure_node(shadow.dom.create_svg_node,structure);
var node = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14164,(0),null);
var node_children = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14164,(1),null);
var seq__14167_14734 = cljs.core.seq(node_children);
var chunk__14169_14735 = null;
var count__14170_14736 = (0);
var i__14171_14737 = (0);
while(true){
if((i__14171_14737 < count__14170_14736)){
var child_struct_14740 = chunk__14169_14735.cljs$core$IIndexed$_nth$arity$2(null,i__14171_14737);
if((!((child_struct_14740 == null)))){
if(typeof child_struct_14740 === 'string'){
var text_14742 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_14742),child_struct_14740].join(''));
} else {
var children_14743 = shadow.dom.svg_node(child_struct_14740);
if(cljs.core.seq_QMARK_(children_14743)){
var seq__14205_14744 = cljs.core.seq(children_14743);
var chunk__14207_14745 = null;
var count__14208_14746 = (0);
var i__14209_14747 = (0);
while(true){
if((i__14209_14747 < count__14208_14746)){
var child_14748 = chunk__14207_14745.cljs$core$IIndexed$_nth$arity$2(null,i__14209_14747);
if(cljs.core.truth_(child_14748)){
node.appendChild(child_14748);


var G__14750 = seq__14205_14744;
var G__14751 = chunk__14207_14745;
var G__14752 = count__14208_14746;
var G__14753 = (i__14209_14747 + (1));
seq__14205_14744 = G__14750;
chunk__14207_14745 = G__14751;
count__14208_14746 = G__14752;
i__14209_14747 = G__14753;
continue;
} else {
var G__14754 = seq__14205_14744;
var G__14755 = chunk__14207_14745;
var G__14756 = count__14208_14746;
var G__14757 = (i__14209_14747 + (1));
seq__14205_14744 = G__14754;
chunk__14207_14745 = G__14755;
count__14208_14746 = G__14756;
i__14209_14747 = G__14757;
continue;
}
} else {
var temp__5804__auto___14758 = cljs.core.seq(seq__14205_14744);
if(temp__5804__auto___14758){
var seq__14205_14759__$1 = temp__5804__auto___14758;
if(cljs.core.chunked_seq_QMARK_(seq__14205_14759__$1)){
var c__5525__auto___14760 = cljs.core.chunk_first(seq__14205_14759__$1);
var G__14761 = cljs.core.chunk_rest(seq__14205_14759__$1);
var G__14762 = c__5525__auto___14760;
var G__14763 = cljs.core.count(c__5525__auto___14760);
var G__14764 = (0);
seq__14205_14744 = G__14761;
chunk__14207_14745 = G__14762;
count__14208_14746 = G__14763;
i__14209_14747 = G__14764;
continue;
} else {
var child_14765 = cljs.core.first(seq__14205_14759__$1);
if(cljs.core.truth_(child_14765)){
node.appendChild(child_14765);


var G__14766 = cljs.core.next(seq__14205_14759__$1);
var G__14767 = null;
var G__14768 = (0);
var G__14769 = (0);
seq__14205_14744 = G__14766;
chunk__14207_14745 = G__14767;
count__14208_14746 = G__14768;
i__14209_14747 = G__14769;
continue;
} else {
var G__14770 = cljs.core.next(seq__14205_14759__$1);
var G__14771 = null;
var G__14772 = (0);
var G__14773 = (0);
seq__14205_14744 = G__14770;
chunk__14207_14745 = G__14771;
count__14208_14746 = G__14772;
i__14209_14747 = G__14773;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_14743);
}
}


var G__14774 = seq__14167_14734;
var G__14775 = chunk__14169_14735;
var G__14776 = count__14170_14736;
var G__14777 = (i__14171_14737 + (1));
seq__14167_14734 = G__14774;
chunk__14169_14735 = G__14775;
count__14170_14736 = G__14776;
i__14171_14737 = G__14777;
continue;
} else {
var G__14778 = seq__14167_14734;
var G__14779 = chunk__14169_14735;
var G__14780 = count__14170_14736;
var G__14781 = (i__14171_14737 + (1));
seq__14167_14734 = G__14778;
chunk__14169_14735 = G__14779;
count__14170_14736 = G__14780;
i__14171_14737 = G__14781;
continue;
}
} else {
var temp__5804__auto___14782 = cljs.core.seq(seq__14167_14734);
if(temp__5804__auto___14782){
var seq__14167_14783__$1 = temp__5804__auto___14782;
if(cljs.core.chunked_seq_QMARK_(seq__14167_14783__$1)){
var c__5525__auto___14784 = cljs.core.chunk_first(seq__14167_14783__$1);
var G__14785 = cljs.core.chunk_rest(seq__14167_14783__$1);
var G__14786 = c__5525__auto___14784;
var G__14787 = cljs.core.count(c__5525__auto___14784);
var G__14788 = (0);
seq__14167_14734 = G__14785;
chunk__14169_14735 = G__14786;
count__14170_14736 = G__14787;
i__14171_14737 = G__14788;
continue;
} else {
var child_struct_14789 = cljs.core.first(seq__14167_14783__$1);
if((!((child_struct_14789 == null)))){
if(typeof child_struct_14789 === 'string'){
var text_14790 = (node["textContent"]);
(node["textContent"] = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(text_14790),child_struct_14789].join(''));
} else {
var children_14791 = shadow.dom.svg_node(child_struct_14789);
if(cljs.core.seq_QMARK_(children_14791)){
var seq__14233_14792 = cljs.core.seq(children_14791);
var chunk__14235_14793 = null;
var count__14236_14794 = (0);
var i__14237_14795 = (0);
while(true){
if((i__14237_14795 < count__14236_14794)){
var child_14796 = chunk__14235_14793.cljs$core$IIndexed$_nth$arity$2(null,i__14237_14795);
if(cljs.core.truth_(child_14796)){
node.appendChild(child_14796);


var G__14798 = seq__14233_14792;
var G__14799 = chunk__14235_14793;
var G__14800 = count__14236_14794;
var G__14801 = (i__14237_14795 + (1));
seq__14233_14792 = G__14798;
chunk__14235_14793 = G__14799;
count__14236_14794 = G__14800;
i__14237_14795 = G__14801;
continue;
} else {
var G__14802 = seq__14233_14792;
var G__14803 = chunk__14235_14793;
var G__14804 = count__14236_14794;
var G__14805 = (i__14237_14795 + (1));
seq__14233_14792 = G__14802;
chunk__14235_14793 = G__14803;
count__14236_14794 = G__14804;
i__14237_14795 = G__14805;
continue;
}
} else {
var temp__5804__auto___14806__$1 = cljs.core.seq(seq__14233_14792);
if(temp__5804__auto___14806__$1){
var seq__14233_14807__$1 = temp__5804__auto___14806__$1;
if(cljs.core.chunked_seq_QMARK_(seq__14233_14807__$1)){
var c__5525__auto___14808 = cljs.core.chunk_first(seq__14233_14807__$1);
var G__14809 = cljs.core.chunk_rest(seq__14233_14807__$1);
var G__14810 = c__5525__auto___14808;
var G__14811 = cljs.core.count(c__5525__auto___14808);
var G__14812 = (0);
seq__14233_14792 = G__14809;
chunk__14235_14793 = G__14810;
count__14236_14794 = G__14811;
i__14237_14795 = G__14812;
continue;
} else {
var child_14813 = cljs.core.first(seq__14233_14807__$1);
if(cljs.core.truth_(child_14813)){
node.appendChild(child_14813);


var G__14814 = cljs.core.next(seq__14233_14807__$1);
var G__14815 = null;
var G__14816 = (0);
var G__14817 = (0);
seq__14233_14792 = G__14814;
chunk__14235_14793 = G__14815;
count__14236_14794 = G__14816;
i__14237_14795 = G__14817;
continue;
} else {
var G__14820 = cljs.core.next(seq__14233_14807__$1);
var G__14821 = null;
var G__14822 = (0);
var G__14823 = (0);
seq__14233_14792 = G__14820;
chunk__14235_14793 = G__14821;
count__14236_14794 = G__14822;
i__14237_14795 = G__14823;
continue;
}
}
} else {
}
}
break;
}
} else {
node.appendChild(children_14791);
}
}


var G__14826 = cljs.core.next(seq__14167_14783__$1);
var G__14827 = null;
var G__14828 = (0);
var G__14829 = (0);
seq__14167_14734 = G__14826;
chunk__14169_14735 = G__14827;
count__14170_14736 = G__14828;
i__14171_14737 = G__14829;
continue;
} else {
var G__14830 = cljs.core.next(seq__14167_14783__$1);
var G__14831 = null;
var G__14832 = (0);
var G__14833 = (0);
seq__14167_14734 = G__14830;
chunk__14169_14735 = G__14831;
count__14170_14736 = G__14832;
i__14171_14737 = G__14833;
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
var len__5726__auto___14863 = arguments.length;
var i__5727__auto___14864 = (0);
while(true){
if((i__5727__auto___14864 < len__5726__auto___14863)){
args__5732__auto__.push((arguments[i__5727__auto___14864]));

var G__14865 = (i__5727__auto___14864 + (1));
i__5727__auto___14864 = G__14865;
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
(shadow.dom.svg.cljs$lang$applyTo = (function (seq14261){
var G__14262 = cljs.core.first(seq14261);
var seq14261__$1 = cljs.core.next(seq14261);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14262,seq14261__$1);
}));


//# sourceMappingURL=shadow.dom.js.map
