goog.provide('opencode.ui.github');
if((typeof opencode !== 'undefined') && (typeof opencode.ui !== 'undefined') && (typeof opencode.ui.github !== 'undefined') && (typeof opencode.ui.github.issue_detail_cache !== 'undefined')){
} else {
opencode.ui.github.issue_detail_cache = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
if((typeof opencode !== 'undefined') && (typeof opencode.ui !== 'undefined') && (typeof opencode.ui.github !== 'undefined') && (typeof opencode.ui.github.pr_detail_cache !== 'undefined')){
} else {
opencode.ui.github.pr_detail_cache = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
opencode.ui.github.clear_detail_caches_BANG_ = (function opencode$ui$github$clear_detail_caches_BANG_(){
cljs.core.reset_BANG_(opencode.ui.github.issue_detail_cache,cljs.core.PersistentArrayMap.EMPTY);

return cljs.core.reset_BANG_(opencode.ui.github.pr_detail_cache,cljs.core.PersistentArrayMap.EMPTY);
});
opencode.ui.github.watch_cache_once_BANG_ = (function opencode$ui$github$watch_cache_once_BANG_(cache_atom,cache_key,callback){
var watch_key = new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"cache","cache",-1237023054),cache_key], null);
cljs.core.add_watch(cache_atom,watch_key,(function (_,___$1,___$2,new_cache){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(new_cache,cache_key);
if(cljs.core.truth_(temp__5804__auto__)){
var v = temp__5804__auto__;
cljs.core.remove_watch(cache_atom,watch_key);

return (callback.cljs$core$IFn$_invoke$arity$1 ? callback.cljs$core$IFn$_invoke$arity$1(v) : callback.call(null,v));
} else {
return null;
}
}));

return (function (){
return cljs.core.remove_watch(cache_atom,watch_key);
});
});
opencode.ui.github.mark_loading_BANG_ = (function opencode$ui$github$mark_loading_BANG_(resource){
var G__14032 = resource;
var G__14032__$1 = (((G__14032 instanceof cljs.core.Keyword))?G__14032.fqn:null);
switch (G__14032__$1) {
case "issues":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"issues-loading?","issues-loading?",1903581196),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"issues-error","issues-error",-1846986794),null], 0));

break;
case "prs":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"prs-loading?","prs-loading?",-2128737010),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"prs-error","prs-error",2032821166),null], 0));

break;
case "worktrees":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"worktrees-loading?","worktrees-loading?",-2105942913),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"worktrees-error","worktrees-error",1451878027),null], 0));

break;
default:
return null;

}
});
opencode.ui.github.mark_error_BANG_ = (function opencode$ui$github$mark_error_BANG_(resource,msg){
var G__14033 = resource;
var G__14033__$1 = (((G__14033 instanceof cljs.core.Keyword))?G__14033.fqn:null);
switch (G__14033__$1) {
case "issues":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"issues-loading?","issues-loading?",1903581196),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"issues-error","issues-error",-1846986794),msg], 0));

break;
case "prs":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"prs-loading?","prs-loading?",-2128737010),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"prs-error","prs-error",2032821166),msg], 0));

break;
case "worktrees":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"worktrees-loading?","worktrees-loading?",-2105942913),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"worktrees-error","worktrees-error",1451878027),msg], 0));

break;
default:
return null;

}
});
opencode.ui.github.mark_loaded_BANG_ = (function opencode$ui$github$mark_loaded_BANG_(resource,payload){
var G__14034 = resource;
var G__14034__$1 = (((G__14034 instanceof cljs.core.Keyword))?G__14034.fqn:null);
switch (G__14034__$1) {
case "issues":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"issues","issues",1989874693),payload,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"issues-loading?","issues-loading?",1903581196),false,new cljs.core.Keyword(null,"issues-error","issues-error",-1846986794),null], 0));

break;
case "prs":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"prs","prs",1421189057),payload,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"prs-loading?","prs-loading?",-2128737010),false,new cljs.core.Keyword(null,"prs-error","prs-error",2032821166),null], 0));

break;
case "worktrees":
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"worktrees","worktrees",865192429),payload,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"worktrees-loading?","worktrees-loading?",-2105942913),false,new cljs.core.Keyword(null,"worktrees-error","worktrees-error",1451878027),null], 0));

break;
default:
return null;

}
});
opencode.ui.github.fetch_issues_BANG_ = (function opencode$ui$github$fetch_issues_BANG_(){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
opencode.ui.github.mark_loading_BANG_(new cljs.core.Keyword(null,"issues","issues",1989874693));

var xhr = (new XMLHttpRequest());
xhr.open("GET",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/issues?repo=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join(''),true);

xhr.setRequestHeader("Accept","application/json");

(xhr.onload = (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(xhr.status,(200))){
var response_text = xhr.responseText;
var data = JSON.parse(response_text);
var clj_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
return opencode.ui.github.mark_loaded_BANG_(new cljs.core.Keyword(null,"issues","issues",1989874693),clj_data);
} else {
return opencode.ui.github.mark_error_BANG_(new cljs.core.Keyword(null,"issues","issues",1989874693),(function (){var or__5002__auto__ = xhr.statusText;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Request failed";
}
})());
}
}));

(xhr.onerror = (function (){
return opencode.ui.github.mark_error_BANG_(new cljs.core.Keyword(null,"issues","issues",1989874693),"Network error");
}));

return xhr.send();
});
opencode.ui.github.fetch_prs_BANG_ = (function opencode$ui$github$fetch_prs_BANG_(){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var xhr = (new XMLHttpRequest());
opencode.ui.github.mark_loading_BANG_(new cljs.core.Keyword(null,"prs","prs",1421189057));

xhr.open("GET",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/prs?repo=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join(''),true);

xhr.setRequestHeader("Accept","application/json");

(xhr.onload = (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(xhr.status,(200))){
var raw = (function (){var or__5002__auto__ = xhr.__mockResponse;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return xhr.responseText;
}
})();
var data = JSON.parse(raw);
var clj_data = (function (){try{return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}catch (e14035){var _ = e14035;
return cljs.core.PersistentVector.EMPTY;
}})();
return opencode.ui.github.mark_loaded_BANG_(new cljs.core.Keyword(null,"prs","prs",1421189057),clj_data);
} else {
return opencode.ui.github.mark_error_BANG_(new cljs.core.Keyword(null,"prs","prs",1421189057),(function (){var or__5002__auto__ = xhr.statusText;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Request failed";
}
})());
}
}));

(xhr.onerror = (function (){
return opencode.ui.github.mark_error_BANG_(new cljs.core.Keyword(null,"prs","prs",1421189057),"Network error");
}));

return xhr.send();
});
opencode.ui.github.fetch_worktrees_BANG_ = (function opencode$ui$github$fetch_worktrees_BANG_(){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var xhr = (new XMLHttpRequest());
opencode.ui.github.mark_loading_BANG_(new cljs.core.Keyword(null,"worktrees","worktrees",865192429));

xhr.open("GET",[cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/worktrees?repo=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo)].join(''),true);

xhr.setRequestHeader("Accept","application/json");

(xhr.onload = (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(xhr.status,(200))){
var raw = (function (){var or__5002__auto__ = xhr.__mockResponse;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return xhr.responseText;
}
})();
var data = JSON.parse(raw);
var clj_data = (function (){try{return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}catch (e14036){var _ = e14036;
return cljs.core.PersistentVector.EMPTY;
}})();
return opencode.ui.github.mark_loaded_BANG_(new cljs.core.Keyword(null,"worktrees","worktrees",865192429),clj_data);
} else {
return opencode.ui.github.mark_error_BANG_(new cljs.core.Keyword(null,"worktrees","worktrees",865192429),(function (){var or__5002__auto__ = xhr.statusText;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Request failed";
}
})());
}
}));

(xhr.onerror = (function (){
return opencode.ui.github.mark_error_BANG_(new cljs.core.Keyword(null,"worktrees","worktrees",865192429),"Network error");
}));

return xhr.send();
});
opencode.ui.github.create_worktree_BANG_ = (function opencode$ui$github$create_worktree_BANG_(issue_number){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
return ajax.core.POST.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/worktrees"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"issue","issue",1725456421),issue_number], null),new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.Keyword(null,"handler","handler",-195596612),(function (response){
opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","command-ok","ui/command-ok",1582654050),new cljs.core.Keyword(null,"cmd","cmd",-302931143),new cljs.core.Keyword(null,"worktree","worktree",-187110437),new cljs.core.Keyword(null,"data","data",-232669377),response], null));

return opencode.ui.github.fetch_worktrees_BANG_();
}),new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p1__14037_SHARP_){
return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","command-error","ui/command-error",-875658592),new cljs.core.Keyword(null,"cmd","cmd",-302931143),new cljs.core.Keyword(null,"worktree","worktree",-187110437),new cljs.core.Keyword(null,"err","err",-2089457205),p1__14037_SHARP_], null));
})], null)], 0));
});
opencode.ui.github.open_pr_BANG_ = (function opencode$ui$github$open_pr_BANG_(issue_number){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
return ajax.core.POST.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/pulls"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"issue","issue",1725456421),issue_number], null),new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.Keyword(null,"handler","handler",-195596612),(function (p1__14038_SHARP_){
return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","command-ok","ui/command-ok",1582654050),new cljs.core.Keyword(null,"cmd","cmd",-302931143),new cljs.core.Keyword(null,"pr-open","pr-open",580773068),new cljs.core.Keyword(null,"data","data",-232669377),p1__14038_SHARP_], null));
}),new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p1__14039_SHARP_){
return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","command-error","ui/command-error",-875658592),new cljs.core.Keyword(null,"cmd","cmd",-302931143),new cljs.core.Keyword(null,"pr-open","pr-open",580773068),new cljs.core.Keyword(null,"err","err",-2089457205),p1__14039_SHARP_], null));
})], null)], 0));
});
opencode.ui.github.fetch_worktree_config_BANG_ = (function opencode$ui$github$fetch_worktree_config_BANG_(){
return ajax.core.GET.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/worktrees/config"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (response){
var clj_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(response,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"worktree-config","worktree-config",-605219944),clj_data);
}),new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p__14040){
var map__14041 = p__14040;
var map__14041__$1 = cljs.core.__destructure_map(map__14041);
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14041__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var status_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14041__$1,new cljs.core.Keyword(null,"status-text","status-text",-1834235478));
return opencode.ui.github.mark_error_BANG_(new cljs.core.Keyword(null,"worktrees","worktrees",865192429),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(status)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(status_text)].join(''));
})], null)], 0));
});
opencode.ui.github.reply_comment_BANG_ = (function opencode$ui$github$reply_comment_BANG_(p__14044){
var map__14045 = p__14044;
var map__14045__$1 = cljs.core.__destructure_map(map__14045);
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14045__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
var pr_number = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14045__$1,new cljs.core.Keyword(null,"pr-number","pr-number",386555410));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14045__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
return ajax.core.POST.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/pr-comment"].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo,new cljs.core.Keyword(null,"pr","pr",-583594500),pr_number,new cljs.core.Keyword(null,"body","body",-2049205669),body], null),new cljs.core.Keyword(null,"format","format",-1306924766),new cljs.core.Keyword(null,"json","json",1279968570),new cljs.core.Keyword(null,"handler","handler",-195596612),(function (p1__14042_SHARP_){
return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","command-ok","ui/command-ok",1582654050),new cljs.core.Keyword(null,"cmd","cmd",-302931143),new cljs.core.Keyword(null,"pr-comment","pr-comment",-1518800787),new cljs.core.Keyword(null,"data","data",-232669377),p1__14042_SHARP_], null));
}),new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p1__14043_SHARP_){
return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","command-error","ui/command-error",-875658592),new cljs.core.Keyword(null,"cmd","cmd",-302931143),new cljs.core.Keyword(null,"pr-comment","pr-comment",-1518800787),new cljs.core.Keyword(null,"err","err",-2089457205),p1__14043_SHARP_], null));
})], null)], 0));
});
opencode.ui.github.fetch_issue_detail_BANG_ = (function opencode$ui$github$fetch_issue_detail_BANG_(issue_id){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var cache_key = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(issue_id)].join('');
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode.ui.github.issue_detail_cache),cache_key);
if(cljs.core.truth_(temp__5802__auto__)){
var cached_result = temp__5802__auto__;
console.log("Using cached issue detail for:",cache_key);

return cached_result;
} else {
console.log("Fetching issue detail for:",repo,"issue:",issue_id,"NEW CODE");

return ajax.core.GET.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/issues/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(issue_id)].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null),new cljs.core.Keyword(null,"handler","handler",-195596612),(function (response){
var clj_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(response,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var mapped_data = (cljs.core.truth_(new cljs.core.Keyword(null,"arr","arr",474961448).cljs$core$IFn$_invoke$arity$1(clj_data))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,new cljs.core.Keyword(null,"arr","arr",474961448).cljs$core$IFn$_invoke$arity$1(clj_data)):clj_data);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.github.issue_detail_cache,cljs.core.assoc,cache_key,mapped_data);

return mapped_data;
}),new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p__14046){
var map__14047 = p__14046;
var map__14047__$1 = cljs.core.__destructure_map(map__14047);
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14047__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var status_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14047__$1,new cljs.core.Keyword(null,"status-text","status-text",-1834235478));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.github.issue_detail_cache,cljs.core.assoc,cache_key,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(status)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(status_text)].join('')], null));

return null;
})], null)], 0));
}
});
opencode.ui.github.fetch_pr_detail_BANG_ = (function opencode$ui$github$fetch_pr_detail_BANG_(pr_id){
var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var cache_key = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pr_id)].join('');
var temp__5802__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode.ui.github.pr_detail_cache),cache_key);
if(cljs.core.truth_(temp__5802__auto__)){
var cached_result = temp__5802__auto__;
console.log("Using cached PR detail for:",cache_key);

return cached_result;
} else {
console.log("Fetching PR detail for:",repo,"PR:",pr_id);

return ajax.core.GET.cljs$core$IFn$_invoke$arity$variadic([cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode.ui.config.api_base()),"/prs/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pr_id)].join(''),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"repo","repo",-1999060679),repo], null),new cljs.core.Keyword(null,"handler","handler",-195596612),(function (response){
var clj_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(response,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var mapped_data = (cljs.core.truth_(new cljs.core.Keyword(null,"arr","arr",474961448).cljs$core$IFn$_invoke$arity$1(clj_data))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,new cljs.core.Keyword(null,"arr","arr",474961448).cljs$core$IFn$_invoke$arity$1(clj_data)):clj_data);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.github.pr_detail_cache,cljs.core.assoc,cache_key,mapped_data);

return mapped_data;
}),new cljs.core.Keyword(null,"error-handler","error-handler",-484945776),(function (p__14048){
var map__14049 = p__14048;
var map__14049__$1 = cljs.core.__destructure_map(map__14049);
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14049__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var status_text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14049__$1,new cljs.core.Keyword(null,"status-text","status-text",-1834235478));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.github.pr_detail_cache,cljs.core.assoc,cache_key,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"error","error",-978969032),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(status)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(status_text)].join('')], null));

return null;
})], null)], 0));
}
});

//# sourceMappingURL=opencode.ui.github.js.map
