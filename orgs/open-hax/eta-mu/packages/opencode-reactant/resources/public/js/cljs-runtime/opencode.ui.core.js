goog.provide('opencode.ui.core');
if((typeof opencode !== 'undefined') && (typeof opencode.ui !== 'undefined') && (typeof opencode.ui.core !== 'undefined') && (typeof opencode.ui.core.ws_conn !== 'undefined')){
} else {
opencode.ui.core.ws_conn = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof opencode !== 'undefined') && (typeof opencode.ui !== 'undefined') && (typeof opencode.ui.core !== 'undefined') && (typeof opencode.ui.core.reconnect_timeout !== 'undefined')){
} else {
opencode.ui.core.reconnect_timeout = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
opencode.ui.core.clear_timeout_BANG_ = (function opencode$ui$core$clear_timeout_BANG_(t){
if(cljs.core.truth_(t)){
return clearTimeout(t);
} else {
return null;
}
});
opencode.ui.core.schedule_reconnect_BANG_ = (function opencode$ui$core$schedule_reconnect_BANG_(connect_fn){
opencode.ui.core.clear_timeout_BANG_(cljs.core.deref(opencode.ui.core.reconnect_timeout));

return cljs.core.reset_BANG_(opencode.ui.core.reconnect_timeout,setTimeout(connect_fn,opencode.ui.config.ws_reconnect_ms()));
});
opencode.ui.core.connect_ws_BANG_ = (function opencode$ui$core$connect_ws_BANG_(){
var connect_BANG_ = (function opencode$ui$core$connect_ws_BANG__$_connect_BANG_(){
var temp__5804__auto___14124 = cljs.core.deref(opencode.ui.core.ws_conn);
if(cljs.core.truth_(temp__5804__auto___14124)){
var existing_14125 = temp__5804__auto___14124;
existing_14125.close();
} else {
}

var ws = (new WebSocket(opencode.ui.config.ws_url()));
cljs.core.reset_BANG_(opencode.ui.core.ws_conn,ws);

(ws.onopen = (function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"connected?","connected?",-1197551387),true);
}));

(ws.onclose = (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"connected?","connected?",-1197551387),false);

return opencode.ui.core.schedule_reconnect_BANG_(opencode$ui$core$connect_ws_BANG__$_connect_BANG_);
}));

(ws.onerror = (function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"connected?","connected?",-1197551387),false);

return opencode.ui.core.schedule_reconnect_BANG_(opencode$ui$core$connect_ws_BANG__$_connect_BANG_);
}));

return (ws.onmessage = (function (m){
var e = JSON.parse(m.data);
var e__$1 = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(e,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
opencode.ui.state.push_event_BANG_(e__$1);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(e__$1),new cljs.core.Keyword("refresh","gh","refresh/gh",334053701))){
opencode.ui.github.fetch_issues_BANG_();

return opencode.ui.github.fetch_prs_BANG_();
} else {
return null;
}
}));
});
connect_BANG_();

return null;
});
opencode.ui.core.home_page = (function opencode$ui$core$home_page(){
var map__14116 = cljs.core.deref(opencode.ui.state._BANG_state);
var map__14116__$1 = cljs.core.__destructure_map(map__14116);
var issues = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14116__$1,new cljs.core.Keyword(null,"issues","issues",1989874693));
var prs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14116__$1,new cljs.core.Keyword(null,"prs","prs",1421189057));
var worktrees = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14116__$1,new cljs.core.Keyword(null,"worktrees","worktrees",865192429));
var worktree_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14116__$1,new cljs.core.Keyword(null,"worktree-config","worktree-config",-605219944));
var connected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14116__$1,new cljs.core.Keyword(null,"connected?","connected?",-1197551387));
var repo = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14116__$1,new cljs.core.Keyword(null,"repo","repo",-1999060679));
console.log("APP RENDER - issues:",issues);

console.log("APP RENDER - prs:",prs);

console.log("APP RENDER - worktrees:",worktrees);

console.log("APP RENDER - seq issues:",cljs.core.seq(issues));

console.log("APP RENDER - seq prs:",cljs.core.seq(prs));

console.log("APP RENDER - seq worktrees:",cljs.core.seq(worktrees));

console.log("APP RENDER - issues first item:",cljs.core.first(issues));

console.log("APP RENDER - current route:",cljs.core.deref(opencode.ui.router.current_page));

console.log("APP RENDER - prs first item:",cljs.core.first(prs));

return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.main_layout,issues,prs,worktrees,worktree_config,connected_QMARK_,repo], null);
});
opencode.ui.core.issues_page = (function opencode$ui$core$issues_page(){
var map__14117 = cljs.core.deref(opencode.ui.state._BANG_state);
var map__14117__$1 = cljs.core.__destructure_map(map__14117);
var issues = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14117__$1,new cljs.core.Keyword(null,"issues","issues",1989874693));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.issues_section,issues], null);
});
opencode.ui.core.prs_page = (function opencode$ui$core$prs_page(){
var map__14119 = cljs.core.deref(opencode.ui.state._BANG_state);
var map__14119__$1 = cljs.core.__destructure_map(map__14119);
var prs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14119__$1,new cljs.core.Keyword(null,"prs","prs",1421189057));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.prs_section,prs], null);
});
opencode.ui.core.worktrees_page = (function opencode$ui$core$worktrees_page(){
var map__14120 = cljs.core.deref(opencode.ui.state._BANG_state);
var map__14120__$1 = cljs.core.__destructure_map(map__14120);
var worktrees = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14120__$1,new cljs.core.Keyword(null,"worktrees","worktrees",865192429));
var worktree_config = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14120__$1,new cljs.core.Keyword(null,"worktree-config","worktree-config",-605219944));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.worktrees_section,worktrees,worktree_config], null);
});
opencode.ui.core.files_page = (function opencode$ui$core$files_page(){
var map__14121 = cljs.core.deref(opencode.ui.state._BANG_state);
var map__14121__$1 = cljs.core.__destructure_map(map__14121);
var fs = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14121__$1,new cljs.core.Keyword(null,"fs","fs",-2122926244));
if(((cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"entries","entries",-86943161).cljs$core$IFn$_invoke$arity$1(fs))) && (cljs.core.not(new cljs.core.Keyword(null,"loading?","loading?",1905707049).cljs$core$IFn$_invoke$arity$1(fs))))){
opencode.ui.files.fetch_files_BANG_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(fs));
} else {
}

return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.file_explorer], null);
});
opencode.ui.core.events_page = (function opencode$ui$core$events_page(){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.events_log], null);
});
opencode.ui.core.not_found_page = (function opencode$ui$core$not_found_page(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.h-screen.bg-gray-50.flex.items-center.justify-center","div.h-screen.bg-gray-50.flex.items-center.justify-center",2070813573),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-center","div.text-center",921869624),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-2xl.font-bold.text-gray-900","h1.text-2xl.font-bold.text-gray-900",1174671046),"404 - Page Not Found"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-600.mt-2","p.text-gray-600.mt-2",1847186435),"The page you're looking for doesn't exist."], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-blue-500.hover:bg-blue-600.text-white.px-4.py-2.rounded-md.mt-4","button.bg-blue-500.hover:bg-blue-600.text-white.px-4.py-2.rounded-md.mt-4",2046915533),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode.ui.router.navigate_BANG_(new cljs.core.Keyword("opencode.ui.router","home","opencode.ui.router/home",760828399));
})], null),"Go Home"], null)], null)], null);
});
opencode.ui.core.app = (function opencode$ui$core$app(){
var current_route = cljs.core.deref(opencode.ui.router.current_page);
var G__14123 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(current_route);
var G__14123__$1 = (((G__14123 instanceof cljs.core.Keyword))?G__14123.fqn:null);
switch (G__14123__$1) {
case "opencode.ui.router/home":
return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.main_layout,new cljs.core.Keyword(null,"issues","issues",1989874693).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state)),new cljs.core.Keyword(null,"prs","prs",1421189057).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state)),new cljs.core.Keyword(null,"worktrees","worktrees",865192429).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state)),new cljs.core.Keyword(null,"worktree-config","worktree-config",-605219944).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state)),new cljs.core.Keyword(null,"connected?","connected?",-1197551387).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state)),new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state))], null);

break;
case "opencode.ui.router/issues":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.core.issues_page], null);

break;
case "opencode.ui.router/prs":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.core.prs_page], null);

break;
case "opencode.ui.router/worktrees":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.core.worktrees_page], null);

break;
case "opencode.ui.router/files":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.core.files_page], null);

break;
case "opencode.ui.router/events":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.core.events_page], null);

break;
case "opencode.ui.router/issue":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.issue_detail], null);

break;
case "opencode.ui.router/pr":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.pr_detail], null);

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.core.not_found_page], null);

}
});
opencode.ui.core.init = (function opencode$ui$core$init(){
console.log("Initializing app v4 with routing...");

opencode.ui.state.load_repo_history_BANG_();

opencode.ui.router.init_router_BANG_();

opencode.ui.core.connect_ws_BANG_();

setTimeout((function (){
console.log("Fetching data...");

opencode.ui.github.fetch_issues_BANG_();

opencode.ui.github.fetch_prs_BANG_();

opencode.ui.github.fetch_worktrees_BANG_();

opencode.ui.github.fetch_worktree_config_BANG_();

return opencode.ui.files.fetch_files_BANG_(".");
}),(500));

return reagent.dom.render.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.core.app], null),document.getElementById("app"));
});

//# sourceMappingURL=opencode.ui.core.js.map
