goog.provide('opencode.ui.state');
/**
 * @define {string}
 */
opencode.ui.state.REPO_SLUG = goog.define("opencode.ui.state.REPO_SLUG","riatzukiza/opencode");
if((typeof opencode !== 'undefined') && (typeof opencode.ui !== 'undefined') && (typeof opencode.ui.state !== 'undefined') && (typeof opencode.ui.state._BANG_state !== 'undefined')){
} else {
opencode.ui.state._BANG_state = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"prs","prs",1421189057),new cljs.core.Keyword(null,"issues","issues",1989874693),new cljs.core.Keyword(null,"connected?","connected?",-1197551387),new cljs.core.Keyword(null,"events","events",1792552201),new cljs.core.Keyword(null,"worktrees-error","worktrees-error",1451878027),new cljs.core.Keyword(null,"issues-loading?","issues-loading?",1903581196),new cljs.core.Keyword(null,"worktrees","worktrees",865192429),new cljs.core.Keyword(null,"prs-loading?","prs-loading?",-2128737010),new cljs.core.Keyword(null,"prs-error","prs-error",2032821166),new cljs.core.Keyword(null,"issues-error","issues-error",-1846986794),new cljs.core.Keyword(null,"worktree-config","worktree-config",-605219944),new cljs.core.Keyword(null,"repo","repo",-1999060679),new cljs.core.Keyword(null,"repo-history","repo-history",-523409253),new cljs.core.Keyword(null,"fs","fs",-2122926244),new cljs.core.Keyword(null,"worktrees-loading?","worktrees-loading?",-2105942913)],[cljs.core.PersistentVector.EMPTY,cljs.core.PersistentVector.EMPTY,false,cljs.core.PersistentVector.EMPTY,null,false,cljs.core.PersistentVector.EMPTY,false,null,null,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"baseDir","baseDir",-1857916623),"worktrees"], null),(function (){var or__5002__auto__ = opencode.ui.state.REPO_SLUG;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "riatzukiza/opencode";
}
})(),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var or__5002__auto__ = opencode.ui.state.REPO_SLUG;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "riatzukiza/opencode";
}
})()], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),".",new cljs.core.Keyword(null,"entries","entries",-86943161),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,new cljs.core.Keyword(null,"error","error",-978969032),null], null),false]));
}
opencode.ui.state.persist_repo_history_BANG_ = (function opencode$ui$state$persist_repo_history_BANG_(repos){
var temp__5804__auto__ = window.localStorage;
if(cljs.core.truth_(temp__5804__auto__)){
var ls = temp__5804__auto__;
return ls.setItem("opencode/repos",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([repos], 0)));
} else {
return null;
}
});
opencode.ui.state.load_repo_history_BANG_ = (function opencode$ui$state$load_repo_history_BANG_(){
var temp__5804__auto___12607 = window.localStorage;
if(cljs.core.truth_(temp__5804__auto___12607)){
var ls_12608 = temp__5804__auto___12607;
var temp__5804__auto___12609__$1 = ls_12608.getItem("opencode/repos");
if(cljs.core.truth_(temp__5804__auto___12609__$1)){
var raw_12610 = temp__5804__auto___12609__$1;
try{var temp__5804__auto___12611__$2 = cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(raw_12610);
if(cljs.core.truth_(temp__5804__auto___12611__$2)){
var parsed_12612 = temp__5804__auto___12611__$2;
if(cljs.core.vector_QMARK_(parsed_12612)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"repo-history","repo-history",-523409253),parsed_12612);
} else {
}
} else {
}
}catch (e12604){var __12615 = e12604;
}} else {
}
} else {
}

return null;
});
opencode.ui.state.set_repo_BANG_ = (function opencode$ui$state$set_repo_BANG_(repo){
var repos = cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(opencode.ui.state._BANG_state,(function (s){
var history__$1 = cljs.core.vec(cljs.core.take.cljs$core$IFn$_invoke$arity$2((8),cljs.core.distinct.cljs$core$IFn$_invoke$arity$1(cljs.core.cons(repo,new cljs.core.Keyword(null,"repo-history","repo-history",-523409253).cljs$core$IFn$_invoke$arity$1(s)))));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(s,new cljs.core.Keyword(null,"repo","repo",-1999060679),repo),new cljs.core.Keyword(null,"issues","issues",1989874693),cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"prs","prs",1421189057),cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"worktrees","worktrees",865192429),cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"worktree-config","worktree-config",-605219944),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"baseDir","baseDir",-1857916623),"worktrees"], null)),new cljs.core.Keyword(null,"fs","fs",-2122926244),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),".",new cljs.core.Keyword(null,"entries","entries",-86943161),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,new cljs.core.Keyword(null,"error","error",-978969032),null], null)),new cljs.core.Keyword(null,"repo-history","repo-history",-523409253),history__$1);
}));
return opencode.ui.state.persist_repo_history_BANG_(new cljs.core.Keyword(null,"repo-history","repo-history",-523409253).cljs$core$IFn$_invoke$arity$1(repos));
});
opencode.ui.state.push_event_BANG_ = (function opencode$ui$state$push_event_BANG_(e){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.update,new cljs.core.Keyword(null,"events","events",1792552201),(function (p1__12605_SHARP_){
return cljs.core.take_last((500),cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__12605_SHARP_,e));
}));
});

//# sourceMappingURL=opencode.ui.state.js.map
