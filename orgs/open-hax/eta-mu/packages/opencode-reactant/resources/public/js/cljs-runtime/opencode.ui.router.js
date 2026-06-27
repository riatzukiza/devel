goog.provide('opencode.ui.router');
if((typeof opencode !== 'undefined') && (typeof opencode.ui !== 'undefined') && (typeof opencode.ui.router !== 'undefined') && (typeof opencode.ui.router.current_page !== 'undefined')){
} else {
opencode.ui.router.current_page = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","home","opencode.ui.router/home",760828399),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null));
}
opencode.ui.router.parse_path = (function opencode$ui$router$parse_path(path){
var parts = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(path,(1));
var parts__$1 = ((cljs.core.seq(parts))?parts.split("/"):null);
if((((parts__$1 == null)) || (((cljs.core.empty_QMARK_(parts__$1)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(parts__$1,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [""], null))))))){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","home","opencode.ui.router/home",760828399),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(parts__$1),"issues")){
var temp__5802__auto__ = cljs.core.second(parts__$1);
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","issue","opencode.ui.router/issue",1018127921),new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","issues","opencode.ui.router/issues",-2012217839),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(parts__$1),"prs")){
var temp__5802__auto__ = cljs.core.second(parts__$1);
if(cljs.core.truth_(temp__5802__auto__)){
var id = temp__5802__auto__;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","pr","opencode.ui.router/pr",1581778800),new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"id","id",-1388402092),id], null)], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","prs","opencode.ui.router/prs",50239957),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(parts__$1),"worktrees")){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","worktrees","opencode.ui.router/worktrees",-516373487),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(parts__$1),"files")){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","files","opencode.ui.router/files",-1239549702),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(parts__$1),"events")){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","events","opencode.ui.router/events",1353659165),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword("opencode.ui.router","not-found","opencode.ui.router/not-found",206993008),new cljs.core.Keyword(null,"params","params",710516235),cljs.core.PersistentArrayMap.EMPTY], null);

}
}
}
}
}
}
});
opencode.ui.router.navigate_BANG_ = (function opencode$ui$router$navigate_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___12543 = arguments.length;
var i__5727__auto___12544 = (0);
while(true){
if((i__5727__auto___12544 < len__5726__auto___12543)){
args__5732__auto__.push((arguments[i__5727__auto___12544]));

var G__12545 = (i__5727__auto___12544 + (1));
i__5727__auto___12544 = G__12545;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return opencode.ui.router.navigate_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(opencode.ui.router.navigate_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (page_name,params){
var path = (function (){var G__12542 = page_name;
var G__12542__$1 = (((G__12542 instanceof cljs.core.Keyword))?G__12542.fqn:null);
switch (G__12542__$1) {
case "opencode.ui.router/home":
return "/";

break;
case "opencode.ui.router/issues":
return "/issues";

break;
case "opencode.ui.router/prs":
return "/prs";

break;
case "opencode.ui.router/worktrees":
return "/worktrees";

break;
case "opencode.ui.router/files":
return "/files";

break;
case "opencode.ui.router/events":
return "/events";

break;
case "opencode.ui.router/issue":
return ["/issues/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(params))].join('');

break;
case "opencode.ui.router/pr":
return ["/prs/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(params))].join('');

break;
default:
return "/";

}
})();
history.pushState(cljs.core.PersistentHashSet.EMPTY,"",path);

return cljs.core.reset_BANG_(opencode.ui.router.current_page,opencode.ui.router.parse_path(path));
}));

(opencode.ui.router.navigate_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(opencode.ui.router.navigate_BANG_.cljs$lang$applyTo = (function (seq12540){
var G__12541 = cljs.core.first(seq12540);
var seq12540__$1 = cljs.core.next(seq12540);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__12541,seq12540__$1);
}));

opencode.ui.router.init_router_BANG_ = (function opencode$ui$router$init_router_BANG_(){
cljs.core.reset_BANG_(opencode.ui.router.current_page,opencode.ui.router.parse_path(window.location.pathname));

return window.addEventListener("popstate",(function (e){
return cljs.core.reset_BANG_(opencode.ui.router.current_page,opencode.ui.router.parse_path(window.location.pathname));
}));
});

//# sourceMappingURL=opencode.ui.router.js.map
