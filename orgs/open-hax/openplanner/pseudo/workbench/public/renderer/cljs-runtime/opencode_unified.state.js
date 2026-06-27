goog.provide('opencode_unified.state');
goog.scope(function(){
  opencode_unified.state.goog$module$goog$object = goog.module.get('goog.object');
});
opencode_unified.state.default_activity_items = new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),(1),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"title","title",636505583),"Failed to connect to server",new cljs.core.Keyword(null,"time","time",1385887882),"2 mins ago",new cljs.core.Keyword(null,"timestamp","timestamp",579478971),(1700000120000)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),(2),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"title","title",636505583),"Project initialized",new cljs.core.Keyword(null,"time","time",1385887882),"1 hour ago",new cljs.core.Keyword(null,"timestamp","timestamp",579478971),(1700000000000)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),(3),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"title","title",636505583),"Dependencies installed",new cljs.core.Keyword(null,"time","time",1385887882),"2 hours ago",new cljs.core.Keyword(null,"timestamp","timestamp",579478971),(1699990000000)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),(4),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"title","title",636505583),"Compilation failed",new cljs.core.Keyword(null,"time","time",1385887882),"5 mins ago",new cljs.core.Keyword(null,"timestamp","timestamp",579478971),(1700000100000)], null)], null);
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.state !== 'undefined') && (typeof opencode_unified.state.app_state !== 'undefined')){
} else {
opencode_unified.state.app_state = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"buffers","buffers",471409492),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614),null,new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"normal","normal",-1519123858),new cljs.core.Keyword(null,"register","register",1968522516),"",new cljs.core.Keyword(null,"last-search","last-search",786765708),"",new cljs.core.Keyword(null,"search-direction","search-direction",1247946889),new cljs.core.Keyword(null,"forward","forward",-557345303),new cljs.core.Keyword(null,"count","count",2139924085),(1)], null),new cljs.core.Keyword(null,"statusbar","statusbar",-680036405),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"left","left",-399115937),"NORMAL",new cljs.core.Keyword(null,"center","center",-748944368),"",new cljs.core.Keyword(null,"right","right",-452581833),"Evil Mode - normal"], null),new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"theme","theme",-1247880880),new cljs.core.Keyword(null,"dark","dark",1818973999),new cljs.core.Keyword(null,"backend","backend",-847489124),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"openplanner","openplanner",-175854128),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"connected?","connected?",-1197551387),false,new cljs.core.Keyword(null,"endpoint","endpoint",447890044),null,new cljs.core.Keyword(null,"last-error","last-error",1848699973),null], null)], null),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"visible?","visible?",2129863715),false,new cljs.core.Keyword(null,"query","query",-1288509510),"",new cljs.core.Keyword(null,"active-tab","active-tab",1102432568),new cljs.core.Keyword(null,"sessions","sessions",-699316392),new cljs.core.Keyword(null,"filter","filter",-948537934),new cljs.core.Keyword(null,"all","all",892129742),new cljs.core.Keyword(null,"view","view",1247994814),new cljs.core.Keyword(null,"list","list",765357683),new cljs.core.Keyword(null,"page","page",849072397),(1),new cljs.core.Keyword(null,"page-size","page-size",223836073),(10)], null),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"file-path","file-path",-2005501162),"",new cljs.core.Keyword(null,"job","job",850873087),null,new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"idle","idle",-2007156861),new cljs.core.Keyword(null,"error","error",-978969032),null], null)], null),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"selection","selection",975998651),null,new cljs.core.Keyword(null,"context","context",-830191113),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"context-source","context-source",-1672882800),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"pane-error","pane-error",-1201212610),null,new cljs.core.Keyword(null,"pinned","pinned",-1216085339),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"active-pinned-key","active-pinned-key",971801250),null], null),new cljs.core.Keyword(null,"activity-items","activity-items",-1460204396),opencode_unified.state.default_activity_items], null)], null));
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.state !== 'undefined') && (typeof opencode_unified.state.chatgpt_job_poller !== 'undefined')){
} else {
opencode_unified.state.chatgpt_job_poller = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
opencode_unified.state.stop_chatgpt_job_poll_BANG_ = (function opencode_unified$state$stop_chatgpt_job_poll_BANG_(){
var temp__5804__auto__ = cljs.core.deref(opencode_unified.state.chatgpt_job_poller);
if(cljs.core.truth_(temp__5804__auto__)){
var timer = temp__5804__auto__;
clearInterval(timer);

return cljs.core.reset_BANG_(opencode_unified.state.chatgpt_job_poller,null);
} else {
return null;
}
});
opencode_unified.state.set_backend_error_BANG_ = (function opencode_unified$state$set_backend_error_BANG_(error_message){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"backend","backend",-847489124),new cljs.core.Keyword(null,"openplanner","openplanner",-175854128),new cljs.core.Keyword(null,"connected?","connected?",-1197551387)], null),false);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"backend","backend",-847489124),new cljs.core.Keyword(null,"openplanner","openplanner",-175854128),new cljs.core.Keyword(null,"last-error","last-error",1848699973)], null),error_message);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"activity-items","activity-items",-1460204396)], null),opencode_unified.state.default_activity_items);

return (opencode_unified.state.update_statusbar_BANG_.cljs$core$IFn$_invoke$arity$3 ? opencode_unified.state.update_statusbar_BANG_.cljs$core$IFn$_invoke$arity$3("NORMAL","","OpenPlanner offline - using fallback activity") : opencode_unified.state.update_statusbar_BANG_.call(null,"NORMAL","","OpenPlanner offline - using fallback activity"));
});
opencode_unified.state.set_backend_connected_BANG_ = (function opencode_unified$state$set_backend_connected_BANG_(){
var cfg = opencode_unified.openplanner.runtime_config();
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"backend","backend",-847489124),new cljs.core.Keyword(null,"openplanner","openplanner",-175854128),new cljs.core.Keyword(null,"connected?","connected?",-1197551387)], null),true);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"backend","backend",-847489124),new cljs.core.Keyword(null,"openplanner","openplanner",-175854128),new cljs.core.Keyword(null,"endpoint","endpoint",447890044)], null),new cljs.core.Keyword(null,"endpoint","endpoint",447890044).cljs$core$IFn$_invoke$arity$1(cfg));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"backend","backend",-847489124),new cljs.core.Keyword(null,"openplanner","openplanner",-175854128),new cljs.core.Keyword(null,"last-error","last-error",1848699973)], null),null);

return (opencode_unified.state.update_statusbar_BANG_.cljs$core$IFn$_invoke$arity$3 ? opencode_unified.state.update_statusbar_BANG_.cljs$core$IFn$_invoke$arity$3("NORMAL","","OpenPlanner connected") : opencode_unified.state.update_statusbar_BANG_.call(null,"NORMAL","","OpenPlanner connected"));
});
opencode_unified.state.load_openplanner_activity_BANG_ = (function opencode_unified$state$load_openplanner_activity_BANG_(var_args){
var G__14336 = arguments.length;
switch (G__14336) {
case 0:
return opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$1(null);
}));

(opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (query){
var safe_query = clojure.string.trim((function (){var or__5002__auto__ = query;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
var active_tab = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"active-tab","active-tab",1102432568)], null));
var request = ((clojure.string.blank_QMARK_(safe_query))?opencode_unified.openplanner.load_sessions_activity():((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,new cljs.core.Keyword(null,"semantic","semantic",-1174869020)))?opencode_unified.openplanner.search_vector(safe_query):opencode_unified.openplanner.search_activity(safe_query)
));
return request.then((function (items){
opencode_unified.state.set_backend_connected_BANG_();

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"activity-items","activity-items",-1460204396)], null),((cljs.core.seq(items))?items:opencode_unified.state.default_activity_items));

return items;
})).catch((function (error){
opencode_unified.state.set_backend_error_BANG_(error.message);

return opencode_unified.state.default_activity_items;
}));
}));

(opencode_unified.state.load_openplanner_activity_BANG_.cljs$lang$maxFixedArity = 1);

opencode_unified.state.set_chatgpt_import_file_path_BANG_ = (function opencode_unified$state$set_chatgpt_import_file_path_BANG_(file_path){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"file-path","file-path",-2005501162)], null),file_path);
});
opencode_unified.state.get_chatgpt_import_state = (function opencode_unified$state$get_chatgpt_import_state(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467)], null));
});
opencode_unified.state.apply_chatgpt_job_status_BANG_ = (function opencode_unified$state$apply_chatgpt_job_status_BANG_(job){
var status_key = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(job);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "idle";
}
})());
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"job","job",850873087)], null),job);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"status","status",-1997798413)], null),status_key);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"error","error",-978969032)], null),new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(job));
});
opencode_unified.state.poll_chatgpt_job_BANG_ = (function opencode_unified$state$poll_chatgpt_job_BANG_(job_id){
opencode_unified.state.stop_chatgpt_job_poll_BANG_();

var tick = (function (){
var request = opencode_unified.openplanner.fetch_job(job_id);
return request.then((function (result){
var job = new cljs.core.Keyword(null,"job","job",850873087).cljs$core$IFn$_invoke$arity$1(result);
var status = cljs.core.keyword.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(job);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "idle";
}
})());
opencode_unified.state.apply_chatgpt_job_status_BANG_(job);

if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"done","done",-889844188),null,new cljs.core.Keyword(null,"error","error",-978969032),null], null), null),status)){
opencode_unified.state.stop_chatgpt_job_poll_BANG_();

return opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$0();
} else {
return null;
}
})).catch((function (error){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"error","error",-978969032));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"error","error",-978969032)], null),error.message);

return opencode_unified.state.stop_chatgpt_job_poll_BANG_();
}));
});
tick();

return cljs.core.reset_BANG_(opencode_unified.state.chatgpt_job_poller,setInterval(tick,(2000)));
});
opencode_unified.state.start_chatgpt_import_BANG_ = (function opencode_unified$state$start_chatgpt_import_BANG_(var_args){
var G__14338 = arguments.length;
switch (G__14338) {
case 0:
return opencode_unified.state.start_chatgpt_import_BANG_.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return opencode_unified.state.start_chatgpt_import_BANG_.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(opencode_unified.state.start_chatgpt_import_BANG_.cljs$core$IFn$_invoke$arity$0 = (function (){
return opencode_unified.state.start_chatgpt_import_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"file-path","file-path",-2005501162)], null)));
}));

(opencode_unified.state.start_chatgpt_import_BANG_.cljs$core$IFn$_invoke$arity$1 = (function (file_path){
var trimmed_path = clojure.string.trim((function (){var or__5002__auto__ = file_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
if(clojure.string.blank_QMARK_(trimmed_path)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"error","error",-978969032));

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"error","error",-978969032)], null),"ChatGPT export file path is required");
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"creating","creating",446682184));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"error","error",-978969032)], null),null);

return opencode_unified.openplanner.create_chatgpt_import_job(trimmed_path).then((function (result){
var job = new cljs.core.Keyword(null,"job","job",850873087).cljs$core$IFn$_invoke$arity$1(result);
var job_id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(job);
opencode_unified.state.set_chatgpt_import_file_path_BANG_(trimmed_path);

opencode_unified.state.apply_chatgpt_job_status_BANG_(job);

if(cljs.core.truth_(job_id)){
opencode_unified.state.poll_chatgpt_job_BANG_(job_id);
} else {
}

return result;
})).catch((function (error){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"status","status",-1997798413)], null),new cljs.core.Keyword(null,"error","error",-978969032));

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"imports","imports",-1249933394),new cljs.core.Keyword(null,"chatgpt","chatgpt",-1489843467),new cljs.core.Keyword(null,"error","error",-978969032)], null),error.message);
}));
}
}));

(opencode_unified.state.start_chatgpt_import_BANG_.cljs$lang$maxFixedArity = 1);

opencode_unified.state.bootstrap_openplanner_BANG_ = (function opencode_unified$state$bootstrap_openplanner_BANG_(){
return opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$0();
});
/**
 * Returns true when test flags request a simulated inspector context failure.
 */
opencode_unified.state.inspector_context_failure_QMARK_ = (function opencode_unified$state$inspector_context_failure_QMARK_(){
var flags = opencode_unified.state.goog$module$goog$object.get(window,"__OPENCODE_TEST_FLAGS__");
var persistent_failure_QMARK_ = (function (){var and__5000__auto__ = flags;
if(cljs.core.truth_(and__5000__auto__)){
return opencode_unified.state.goog$module$goog$object.get(flags,"failInspectorContext") === true;
} else {
return and__5000__auto__;
}
})();
var one_shot_failure_QMARK_ = (function (){var and__5000__auto__ = flags;
if(cljs.core.truth_(and__5000__auto__)){
return opencode_unified.state.goog$module$goog$object.get(flags,"failInspectorContextOnce") === true;
} else {
return and__5000__auto__;
}
})();
if(cljs.core.truth_(one_shot_failure_QMARK_)){
opencode_unified.state.goog$module$goog$object.set(flags,"failInspectorContextOnce",false);
} else {
}

var or__5002__auto__ = persistent_failure_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return one_shot_failure_QMARK_;
}
});
/**
 * Create a new buffer with given content and metadata
 */
opencode_unified.state.create_buffer = (function opencode_unified$state$create_buffer(var_args){
var args__5732__auto__ = [];
var len__5726__auto___14396 = arguments.length;
var i__5727__auto___14397 = (0);
while(true){
if((i__5727__auto___14397 < len__5726__auto___14396)){
args__5732__auto__.push((arguments[i__5727__auto___14397]));

var G__14398 = (i__5727__auto___14397 + (1));
i__5727__auto___14397 = G__14398;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic = (function (id,content,p__14342){
var map__14343 = p__14342;
var map__14343__$1 = cljs.core.__destructure_map(map__14343);
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__14343__$1,new cljs.core.Keyword(null,"name","name",1843675177),["Buffer ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''));
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__14343__$1,new cljs.core.Keyword(null,"path","path",-188191168),null);
var language = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__14343__$1,new cljs.core.Keyword(null,"language","language",-1591107564),"text");
var modified_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__14343__$1,new cljs.core.Keyword(null,"modified?","modified?",-2109276969),false);
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"original-content","original-content",-527645724),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"scroll-pos","scroll-pos",292123569),new cljs.core.Keyword(null,"redo-stack","redo-stack",-2036358191),new cljs.core.Keyword(null,"language","language",-1591107564),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"undo-stack","undo-stack",244619892),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.Keyword(null,"metadata","metadata",1799301597)],[path,content,content,name,(0),cljs.core.PersistentVector.EMPTY,language,id,cljs.core.PersistentVector.EMPTY,modified_QMARK_,(0),null,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"created-at","created-at",-89248644),(new Date()),new cljs.core.Keyword(null,"last-modified","last-modified",1593411791),(new Date())], null)]);
}));

(opencode_unified.state.create_buffer.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(opencode_unified.state.create_buffer.cljs$lang$applyTo = (function (seq14339){
var G__14340 = cljs.core.first(seq14339);
var seq14339__$1 = cljs.core.next(seq14339);
var G__14341 = cljs.core.first(seq14339__$1);
var seq14339__$2 = cljs.core.next(seq14339__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14340,G__14341,seq14339__$2);
}));

/**
 * Add a new buffer to app state
 */
opencode_unified.state.add_buffer_BANG_ = (function opencode_unified$state$add_buffer_BANG_(buffer){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"buffers","buffers",471409492),cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(buffer),buffer], 0));

if((new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)) == null)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc,new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(buffer));
} else {
return null;
}
});
/**
 * Remove a buffer from app state
 */
opencode_unified.state.remove_buffer_BANG_ = (function opencode_unified$state$remove_buffer_BANG_(buffer_id){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"buffers","buffers",471409492),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer_id], 0));

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)),buffer_id)){
var remaining_buffers = cljs.core.keys(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)));
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc,new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614),cljs.core.first(remaining_buffers));
} else {
return null;
}
});
/**
 * Get currently active buffer
 */
opencode_unified.state.get_current_buffer = (function opencode_unified$state$get_current_buffer(){
var temp__5804__auto__ = new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
if(cljs.core.truth_(temp__5804__auto__)){
var buffer_id = temp__5804__auto__;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),buffer_id], null));
} else {
return null;
}
});
/**
 * Update the current buffer with the given function
 */
opencode_unified.state.update_current_buffer_BANG_ = (function opencode_unified$state$update_current_buffer_BANG_(f){
var temp__5804__auto__ = new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
if(cljs.core.truth_(temp__5804__auto__)){
var buffer_id = temp__5804__auto__;
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),buffer_id], null),f);
} else {
return null;
}
});
/**
 * Set the current buffer by ID
 */
opencode_unified.state.set_current_buffer_BANG_ = (function opencode_unified$state$set_current_buffer_BANG_(buffer_id){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc,new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614),buffer_id);
});
/**
 * Set the current Evil mode
 */
opencode_unified.state.set_evil_mode_BANG_ = (function opencode_unified$state$set_evil_mode_BANG_(mode){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"mode","mode",654403691)], null),mode);
});
/**
 * Get the current Evil mode
 */
opencode_unified.state.get_evil_mode = (function opencode_unified$state$get_evil_mode(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"mode","mode",654403691)], null));
});
/**
 * Update statusbar content
 */
opencode_unified.state.update_statusbar_BANG_ = (function opencode_unified$state$update_statusbar_BANG_(left,center,right){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc,new cljs.core.Keyword(null,"statusbar","statusbar",-680036405),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"left","left",-399115937),left,new cljs.core.Keyword(null,"center","center",-748944368),center,new cljs.core.Keyword(null,"right","right",-452581833),right], null));
});
/**
 * Show which-key popup
 */
opencode_unified.state.show_which_key_BANG_ = (function opencode_unified$state$show_which_key_BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"which-key?","which-key?",207178925)], null),true);
});
/**
 * Hide which-key popup
 */
opencode_unified.state.hide_which_key_BANG_ = (function opencode_unified$state$hide_which_key_BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"which-key?","which-key?",207178925)], null),false);
});
/**
 * Get command palette state
 */
opencode_unified.state.command_palette = (function opencode_unified$state$command_palette(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"command-palette","command-palette",153522288)], null));
});
/**
 * Toggle search surface visibility
 */
opencode_unified.state.toggle_search_surface_BANG_ = (function opencode_unified$state$toggle_search_surface_BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"visible?","visible?",2129863715)], null),cljs.core.not);
});
/**
 * Focus the search input after the surface becomes visible.
 */
opencode_unified.state.focus_search_input_BANG_ = (function opencode_unified$state$focus_search_input_BANG_(){
var focus_with_retry_BANG_ = (function opencode_unified$state$focus_search_input_BANG__$_focus_with_retry_BANG_(remaining){
var temp__5804__auto__ = document.querySelector("[data-testid='search-surface'] [data-testid='search-input']");
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
input.focus();

if((((remaining > (0))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(input,document.activeElement)))){
return setTimeout((function (){
return opencode_unified$state$focus_search_input_BANG__$_focus_with_retry_BANG_((remaining - (1)));
}),(16));
} else {
return null;
}
} else {
return null;
}
});
return setTimeout((function (){
return focus_with_retry_BANG_((6));
}),(0));
});
/**
 * Open search surface and focus input.
 */
opencode_unified.state.open_search_surface_BANG_ = (function opencode_unified$state$open_search_surface_BANG_(){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"visible?","visible?",2129863715)], null),true);

return opencode_unified.state.focus_search_input_BANG_();
});
/**
 * Set search surface query
 */
opencode_unified.state.set_search_query_BANG_ = (function opencode_unified$state$set_search_query_BANG_(query){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"query","query",-1288509510)], null),query);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"page","page",849072397)], null),(1));

var active_tab = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"active-tab","active-tab",1102432568)], null));
if(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"semantic","semantic",-1174869020),null,new cljs.core.Keyword(null,"sessions","sessions",-699316392),null], null), null),active_tab)){
return opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$1(query);
} else {
return null;
}
});
/**
 * Set search surface active tab
 */
opencode_unified.state.set_search_tab_BANG_ = (function opencode_unified$state$set_search_tab_BANG_(tab){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"active-tab","active-tab",1102432568)], null),tab);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"page","page",849072397)], null),(1));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"selection","selection",975998651)], null),null);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"context","context",-830191113)], null),cljs.core.PersistentVector.EMPTY);

return opencode_unified.state.load_openplanner_activity_BANG_.cljs$core$IFn$_invoke$arity$1(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"query","query",-1288509510)], null)));
});
/**
 * Set search surface filter
 */
opencode_unified.state.set_search_filter_BANG_ = (function opencode_unified$state$set_search_filter_BANG_(filter_type){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"filter","filter",-948537934)], null),filter_type);

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"page","page",849072397)], null),(1));
});
/**
 * Set search result view mode
 */
opencode_unified.state.set_search_view_BANG_ = (function opencode_unified$state$set_search_view_BANG_(view_mode){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"view","view",1247994814)], null),view_mode);
});
/**
 * Set current search result page
 */
opencode_unified.state.set_search_page_BANG_ = (function opencode_unified$state$set_search_page_BANG_(page){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"page","page",849072397)], null),(function (){var x__5087__auto__ = (1);
var y__5088__auto__ = page;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
});
/**
 * Set search result page size
 */
opencode_unified.state.set_search_page_size_BANG_ = (function opencode_unified$state$set_search_page_size_BANG_(page_size){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"page-size","page-size",223836073)], null),(function (){var x__5087__auto__ = (1);
var y__5088__auto__ = page_size;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095),new cljs.core.Keyword(null,"page","page",849072397)], null),(1));
});
/**
 * Select an item and project context into inspector pane.
 */
opencode_unified.state.set_inspector_selection_BANG_ = (function opencode_unified$state$set_inspector_selection_BANG_(item,context_items){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"selection","selection",975998651)], null),item);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"context-source","context-source",-1672882800)], null),context_items);

if(cljs.core.truth_(opencode_unified.state.inspector_context_failure_QMARK_())){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"context","context",-830191113)], null),cljs.core.PersistentVector.EMPTY);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"pane-error","pane-error",-1201212610)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"message","message",-406056002),"Inspector context API failed. You can continue and retry context load."], null));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"context","context",-830191113)], null),context_items);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"pane-error","pane-error",-1201212610)], null),null);
}

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"active-pinned-key","active-pinned-key",971801250)], null),null);
});
/**
 * Retry loading inspector context after a recoverable pane error.
 */
opencode_unified.state.retry_inspector_context_BANG_ = (function opencode_unified$state$retry_inspector_context_BANG_(){
var map__14344 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880)], null));
var map__14344__$1 = cljs.core.__destructure_map(map__14344);
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14344__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var context_source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14344__$1,new cljs.core.Keyword(null,"context-source","context-source",-1672882800));
if(cljs.core.truth_(selection)){
if(cljs.core.truth_(opencode_unified.state.inspector_context_failure_QMARK_())){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"pane-error","pane-error",-1201212610)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"message","message",-406056002),"Inspector context API still unavailable. Retry when service recovers."], null));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"context","context",-830191113)], null),(function (){var or__5002__auto__ = context_source;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})());

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"pane-error","pane-error",-1201212610)], null),null);
}
} else {
return null;
}
});
/**
 * Stable key for inspector entities across tabs/views.
 */
opencode_unified.state.inspector_entity_key = (function opencode_unified$state$inspector_entity_key(item){
var entity_type = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"item","item",249373802);
}
})();
var entity_id = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "unknown";
}
}
})();
return [cljs.core.name(entity_type),"::",cljs.core.str.cljs$core$IFn$_invoke$arity$1(entity_id)].join('');
});
/**
 * Pin the current inspector selection into persistent compare set.
 */
opencode_unified.state.pin_selected_inspector_entity_BANG_ = (function opencode_unified$state$pin_selected_inspector_entity_BANG_(){
var map__14346 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880)], null));
var map__14346__$1 = cljs.core.__destructure_map(map__14346);
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14346__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var context = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14346__$1,new cljs.core.Keyword(null,"context","context",-830191113));
if(cljs.core.truth_(selection)){
var entity_key = opencode_unified.state.inspector_entity_key(selection);
var pinned_entry = new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"key","key",-1516042587),entity_key,new cljs.core.Keyword(null,"selection","selection",975998651),selection,new cljs.core.Keyword(null,"context","context",-830191113),context], null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"pinned","pinned",-1216085339)], null),(function (pinned){
var safe_pinned = (function (){var or__5002__auto__ = pinned;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})();
if(cljs.core.truth_(cljs.core.some((function (p1__14345_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(p1__14345_SHARP_),entity_key);
}),safe_pinned))){
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (entry){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(entry),entity_key)){
return pinned_entry;
} else {
return entry;
}
}),safe_pinned);
} else {
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(safe_pinned,pinned_entry);
}
}));

return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"active-pinned-key","active-pinned-key",971801250)], null),entity_key);
} else {
return null;
}
});
/**
 * Remove a pinned entity from compare set.
 */
opencode_unified.state.unpin_inspector_entity_BANG_ = (function opencode_unified$state$unpin_inspector_entity_BANG_(entity_key){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"pinned","pinned",-1216085339)], null),(function (pinned){
return cljs.core.vec(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__14347_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(p1__14347_SHARP_),entity_key);
}),(function (){var or__5002__auto__ = pinned;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})()));
}));

var inspector_state = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880)], null));
var active_key = new cljs.core.Keyword(null,"active-pinned-key","active-pinned-key",971801250).cljs$core$IFn$_invoke$arity$1(inspector_state);
var pinned = new cljs.core.Keyword(null,"pinned","pinned",-1216085339).cljs$core$IFn$_invoke$arity$1(inspector_state);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_key,entity_key)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"active-pinned-key","active-pinned-key",971801250)], null),(function (){var G__14348 = pinned;
var G__14348__$1 = (((G__14348 == null))?null:cljs.core.first(G__14348));
if((G__14348__$1 == null)){
return null;
} else {
return new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(G__14348__$1);
}
})());
} else {
return null;
}
});
/**
 * Set active pinned entity in compare tabs.
 */
opencode_unified.state.set_active_inspector_pinned_BANG_ = (function opencode_unified$state$set_active_inspector_pinned_BANG_(entity_key){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"active-pinned-key","active-pinned-key",971801250)], null),entity_key);
});
/**
 * Check if current entity key is pinned.
 */
opencode_unified.state.inspector_entity_pinned_QMARK_ = (function opencode_unified$state$inspector_entity_pinned_QMARK_(entity_key){
return cljs.core.some((function (p1__14349_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(p1__14349_SHARP_),entity_key);
}),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880),new cljs.core.Keyword(null,"pinned","pinned",-1216085339)], null)));
});
/**
 * Get right-pane inspector state.
 */
opencode_unified.state.get_inspector_state = (function opencode_unified$state$get_inspector_state(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"inspector","inspector",1532863880)], null));
});
/**
 * Get search surface state
 */
opencode_unified.state.get_search_state = (function opencode_unified$state$get_search_state(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"search-surface","search-surface",-2130597095)], null));
});
/**
 * Get activity items
 */
opencode_unified.state.get_activity_items = (function opencode_unified$state$get_activity_items(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"activity-items","activity-items",-1460204396)], null));
});
/**
 * Load workspace from file
 */
opencode_unified.state.load_workspace_BANG_ = (function opencode_unified$state$load_workspace_BANG_(workspace_path){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Loading workspace from:",workspace_path], 0));

if((((typeof require !== 'undefined')) && (cljs.core.not(opencode_unified.env.web_QMARK_)))){
try{var fs = require("fs");
var workspace_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(fs.readFileSync(workspace_path,"utf8")),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
if(cljs.core.truth_(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(workspace_data))){
var seq__14351_14415 = cljs.core.seq(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(workspace_data));
var chunk__14352_14416 = null;
var count__14353_14417 = (0);
var i__14354_14418 = (0);
while(true){
if((i__14354_14418 < count__14353_14417)){
var buffer_data_14419 = chunk__14352_14416.cljs$core$IIndexed$_nth$arity$2(null,i__14354_14418);
var buffer_14420 = opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(buffer_data_14419),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer_data_14419),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer_data_14419], 0));
opencode_unified.state.add_buffer_BANG_(buffer_14420);


var G__14421 = seq__14351_14415;
var G__14422 = chunk__14352_14416;
var G__14423 = count__14353_14417;
var G__14424 = (i__14354_14418 + (1));
seq__14351_14415 = G__14421;
chunk__14352_14416 = G__14422;
count__14353_14417 = G__14423;
i__14354_14418 = G__14424;
continue;
} else {
var temp__5804__auto___14425 = cljs.core.seq(seq__14351_14415);
if(temp__5804__auto___14425){
var seq__14351_14426__$1 = temp__5804__auto___14425;
if(cljs.core.chunked_seq_QMARK_(seq__14351_14426__$1)){
var c__5525__auto___14427 = cljs.core.chunk_first(seq__14351_14426__$1);
var G__14428 = cljs.core.chunk_rest(seq__14351_14426__$1);
var G__14429 = c__5525__auto___14427;
var G__14430 = cljs.core.count(c__5525__auto___14427);
var G__14431 = (0);
seq__14351_14415 = G__14428;
chunk__14352_14416 = G__14429;
count__14353_14417 = G__14430;
i__14354_14418 = G__14431;
continue;
} else {
var buffer_data_14432 = cljs.core.first(seq__14351_14426__$1);
var buffer_14433 = opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(buffer_data_14432),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer_data_14432),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer_data_14432], 0));
opencode_unified.state.add_buffer_BANG_(buffer_14433);


var G__14434 = cljs.core.next(seq__14351_14426__$1);
var G__14435 = null;
var G__14436 = (0);
var G__14437 = (0);
seq__14351_14415 = G__14434;
chunk__14352_14416 = G__14435;
count__14353_14417 = G__14436;
i__14354_14418 = G__14437;
continue;
}
} else {
}
}
break;
}
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(workspace_data))){
opencode_unified.state.set_current_buffer_BANG_(new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(workspace_data));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"ui","ui",-469653645).cljs$core$IFn$_invoke$arity$1(workspace_data))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"ui","ui",-469653645),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"ui","ui",-469653645).cljs$core$IFn$_invoke$arity$1(workspace_data)], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091).cljs$core$IFn$_invoke$arity$1(workspace_data))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091).cljs$core$IFn$_invoke$arity$1(workspace_data)], 0));
} else {
}

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Workspace loaded successfully"], 0));

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"success","success",1890645906),true], null);
}catch (e14350){if((e14350 instanceof Error)){
var e = e14350;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error loading workspace:",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14350;

}
}} else {
try{var temp__5802__auto__ = (function (){var G__14356 = window;
if((G__14356 == null)){
return null;
} else {
return (G__14356["localStorage"]);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var storage = temp__5802__auto__;
var workspace_key = ["workspace-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.hash(workspace_path))].join('');
var stored_data = storage.getItem(workspace_key);
if(cljs.core.truth_(stored_data)){
var workspace_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(stored_data),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
if(cljs.core.truth_(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(workspace_data))){
var seq__14357_14439 = cljs.core.seq(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(workspace_data));
var chunk__14358_14440 = null;
var count__14359_14441 = (0);
var i__14360_14442 = (0);
while(true){
if((i__14360_14442 < count__14359_14441)){
var buffer_data_14443 = chunk__14358_14440.cljs$core$IIndexed$_nth$arity$2(null,i__14360_14442);
var buffer_14444 = opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(buffer_data_14443),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer_data_14443),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer_data_14443], 0));
opencode_unified.state.add_buffer_BANG_(buffer_14444);


var G__14445 = seq__14357_14439;
var G__14446 = chunk__14358_14440;
var G__14447 = count__14359_14441;
var G__14448 = (i__14360_14442 + (1));
seq__14357_14439 = G__14445;
chunk__14358_14440 = G__14446;
count__14359_14441 = G__14447;
i__14360_14442 = G__14448;
continue;
} else {
var temp__5804__auto___14449 = cljs.core.seq(seq__14357_14439);
if(temp__5804__auto___14449){
var seq__14357_14450__$1 = temp__5804__auto___14449;
if(cljs.core.chunked_seq_QMARK_(seq__14357_14450__$1)){
var c__5525__auto___14451 = cljs.core.chunk_first(seq__14357_14450__$1);
var G__14452 = cljs.core.chunk_rest(seq__14357_14450__$1);
var G__14453 = c__5525__auto___14451;
var G__14454 = cljs.core.count(c__5525__auto___14451);
var G__14455 = (0);
seq__14357_14439 = G__14452;
chunk__14358_14440 = G__14453;
count__14359_14441 = G__14454;
i__14360_14442 = G__14455;
continue;
} else {
var buffer_data_14456 = cljs.core.first(seq__14357_14450__$1);
var buffer_14457 = opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(buffer_data_14456),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer_data_14456),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer_data_14456], 0));
opencode_unified.state.add_buffer_BANG_(buffer_14457);


var G__14458 = cljs.core.next(seq__14357_14450__$1);
var G__14459 = null;
var G__14460 = (0);
var G__14461 = (0);
seq__14357_14439 = G__14458;
chunk__14358_14440 = G__14459;
count__14359_14441 = G__14460;
i__14360_14442 = G__14461;
continue;
}
} else {
}
}
break;
}
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(workspace_data))){
opencode_unified.state.set_current_buffer_BANG_(new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(workspace_data));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"ui","ui",-469653645).cljs$core$IFn$_invoke$arity$1(workspace_data))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"ui","ui",-469653645),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"ui","ui",-469653645).cljs$core$IFn$_invoke$arity$1(workspace_data)], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091).cljs$core$IFn$_invoke$arity$1(workspace_data))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091).cljs$core$IFn$_invoke$arity$1(workspace_data)], 0));
} else {
}

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Workspace loaded from localStorage"], 0));

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"success","success",1890645906),true], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),"No workspace found in storage"], null);
}
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),"localStorage unavailable"], null);
}
}catch (e14355){if((e14355 instanceof Error)){
var e = e14355;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error loading workspace from localStorage:",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14355;

}
}}
});
/**
 * Save current workspace to file
 */
opencode_unified.state.save_workspace_BANG_ = (function opencode_unified$state$save_workspace_BANG_(workspace_path){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Saving workspace to:",workspace_path], 0));

var workspace_data = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"buffers","buffers",471409492),cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,(function (){var iter__5480__auto__ = (function opencode_unified$state$save_workspace_BANG__$_iter__14361(s__14362){
return (new cljs.core.LazySeq(null,(function (){
var s__14362__$1 = s__14362;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14362__$1);
if(temp__5804__auto__){
var s__14362__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14362__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14362__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14364 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14363 = (0);
while(true){
if((i__14363 < size__5479__auto__)){
var vec__14365 = cljs.core._nth(c__5478__auto__,i__14363);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14365,(0),null);
var buffer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14365,(1),null);
cljs.core.chunk_append(b__14364,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"language","language",-1591107564),new cljs.core.Keyword(null,"language","language",-1591107564).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"saved?","saved?",-2027163192),new cljs.core.Keyword(null,"saved?","saved?",-2027163192).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"metadata","metadata",1799301597),new cljs.core.Keyword(null,"metadata","metadata",1799301597).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"created-at","created-at",-89248644),new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"modified-at","modified-at",-932048179),new cljs.core.Keyword(null,"modified-at","modified-at",-932048179).cljs$core$IFn$_invoke$arity$1(buffer)], null)], null));

var G__14464 = (i__14363 + (1));
i__14363 = G__14464;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14364),opencode_unified$state$save_workspace_BANG__$_iter__14361(cljs.core.chunk_rest(s__14362__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14364),null);
}
} else {
var vec__14368 = cljs.core.first(s__14362__$2);
var id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14368,(0),null);
var buffer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14368,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"content","content",15833224),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"language","language",-1591107564),new cljs.core.Keyword(null,"language","language",-1591107564).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"saved?","saved?",-2027163192),new cljs.core.Keyword(null,"saved?","saved?",-2027163192).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"metadata","metadata",1799301597),new cljs.core.Keyword(null,"metadata","metadata",1799301597).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"created-at","created-at",-89248644),new cljs.core.Keyword(null,"created-at","created-at",-89248644).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"modified-at","modified-at",-932048179),new cljs.core.Keyword(null,"modified-at","modified-at",-932048179).cljs$core$IFn$_invoke$arity$1(buffer)], null)], null),opencode_unified$state$save_workspace_BANG__$_iter__14361(cljs.core.rest(s__14362__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)));
})()),new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614),new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)),new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"ui","ui",-469653645).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)),new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)),new cljs.core.Keyword(null,"version","version",425292698),"1.0.0",new cljs.core.Keyword(null,"saved-at","saved-at",-1192920864),(new Date())], null);
if((((typeof require !== 'undefined')) && (cljs.core.not(opencode_unified.env.web_QMARK_)))){
try{var fs = require("fs");
var path = require("path");
var workspace_dir = path.dirname(workspace_path);
if(cljs.core.truth_(fs.existsSync(workspace_dir))){
} else {
fs.mkdirSync(workspace_dir,({"recursive": true}));
}

fs.writeFileSync(workspace_path,JSON.stringify(cljs.core.clj__GT_js(workspace_data),null,(2)),"utf8");

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Workspace saved successfully"], 0));

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"success","success",1890645906),true], null);
}catch (e14371){if((e14371 instanceof Error)){
var e = e14371;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error saving workspace:",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14371;

}
}} else {
try{var temp__5802__auto__ = (function (){var G__14373 = window;
if((G__14373 == null)){
return null;
} else {
return (G__14373["localStorage"]);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var storage = temp__5802__auto__;
var workspace_key = ["workspace-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.hash(workspace_path))].join('');
var json_data = JSON.stringify(cljs.core.clj__GT_js(workspace_data),null,(2));
storage.setItem(workspace_key,json_data);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Workspace saved to localStorage"], 0));

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"success","success",1890645906),true], null);
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),"localStorage unavailable"], null);
}
}catch (e14372){if((e14372 instanceof Error)){
var e = e14372;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error saving workspace to localStorage:",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14372;

}
}}
});
/**
 * Get all buffers
 */
opencode_unified.state.get_buffers = (function opencode_unified$state$get_buffers(){
return new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
});
/**
 * Get all buffers (alias for get-buffers)
 */
opencode_unified.state.buffers = (function opencode_unified$state$buffers(){
return opencode_unified.state.get_buffers();
});
/**
 * Get the entire Evil state
 */
opencode_unified.state.get_evil_state = (function opencode_unified$state$get_evil_state(){
return new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
});
/**
 * Set the Evil register (yank buffer)
 */
opencode_unified.state.set_evil_register_BANG_ = (function opencode_unified$state$set_evil_register_BANG_(text){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"register","register",1968522516)], null),text);
});
/**
 * Get the Evil register content
 */
opencode_unified.state.get_evil_register = (function opencode_unified$state$get_evil_register(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"register","register",1968522516)], null));
});
/**
 * Set the Evil count for commands
 */
opencode_unified.state.set_evil_count_BANG_ = (function opencode_unified$state$set_evil_count_BANG_(count){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"count","count",2139924085)], null),count);
});
/**
 * Get the current Evil count
 */
opencode_unified.state.get_evil_count = (function opencode_unified$state$get_evil_count(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"count","count",2139924085)], null),(1));
});
/**
 * Set the last search query
 */
opencode_unified.state.set_last_search_BANG_ = (function opencode_unified$state$set_last_search_BANG_(query){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"last-search","last-search",786765708)], null),query);
});
/**
 * Get the last search query
 */
opencode_unified.state.get_last_search = (function opencode_unified$state$get_last_search(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"last-search","last-search",786765708)], null));
});
/**
 * Set the search direction
 */
opencode_unified.state.set_search_direction_BANG_ = (function opencode_unified$state$set_search_direction_BANG_(direction){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"search-direction","search-direction",1247946889)], null),direction);
});
/**
 * Get the search direction
 */
opencode_unified.state.get_search_direction = (function opencode_unified$state$get_search_direction(){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"search-direction","search-direction",1247946889)], null),new cljs.core.Keyword(null,"forward","forward",-557345303));
});
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.state !== 'undefined') && (typeof opencode_unified.state.auto_save_timer !== 'undefined')){
} else {
opencode_unified.state.auto_save_timer = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
/**
 * Enable auto-save with specified interval in milliseconds
 */
opencode_unified.state.enable_auto_save_BANG_ = (function opencode_unified$state$enable_auto_save_BANG_(interval_ms,workspace_path){
if(cljs.core.truth_(cljs.core.deref(opencode_unified.state.auto_save_timer))){
clearInterval(cljs.core.deref(opencode_unified.state.auto_save_timer));
} else {
}

cljs.core.reset_BANG_(opencode_unified.state.auto_save_timer,setInterval((function (){
if(cljs.core.truth_(new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)))){
return opencode_unified.state.save_workspace_BANG_(workspace_path);
} else {
return null;
}
}),interval_ms));

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Auto-save enabled with",interval_ms,"ms interval"], 0));
});
/**
 * Disable auto-save
 */
opencode_unified.state.disable_auto_save_BANG_ = (function opencode_unified$state$disable_auto_save_BANG_(){
if(cljs.core.truth_(cljs.core.deref(opencode_unified.state.auto_save_timer))){
clearInterval(cljs.core.deref(opencode_unified.state.auto_save_timer));

cljs.core.reset_BANG_(opencode_unified.state.auto_save_timer,null);

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Auto-save disabled"], 0));
} else {
return null;
}
});
/**
 * Get current auto-save status
 */
opencode_unified.state.get_auto_save_status = (function opencode_unified$state$get_auto_save_status(){
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"enabled","enabled",1195909756),(!((cljs.core.deref(opencode_unified.state.auto_save_timer) == null))),new cljs.core.Keyword(null,"interval","interval",1708495417),(cljs.core.truth_(cljs.core.deref(opencode_unified.state.auto_save_timer))?"active":null)], null);
});
/**
 * Get workspace-related commands for command palette
 */
opencode_unified.state.workspace_commands = (function opencode_unified$state$workspace_commands(){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),"Save Workspace",new cljs.core.Keyword(null,"description","description",-1428560544),"Save current workspace to file",new cljs.core.Keyword(null,"keys","keys",1068423698),"SPC w s",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
var workspace_path = (function (){var or__5002__auto__ = prompt("Workspace path:","./workspace.json");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "./workspace.json";
}
})();
if(cljs.core.truth_(workspace_path)){
return opencode_unified.state.save_workspace_BANG_(workspace_path);
} else {
return null;
}
})], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),"Load Workspace",new cljs.core.Keyword(null,"description","description",-1428560544),"Load workspace from file",new cljs.core.Keyword(null,"keys","keys",1068423698),"SPC w l",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
var workspace_path = (function (){var or__5002__auto__ = prompt("Workspace path:","./workspace.json");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "./workspace.json";
}
})();
if(cljs.core.truth_(workspace_path)){
return opencode_unified.state.load_workspace_BANG_(workspace_path);
} else {
return null;
}
})], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),"Enable Auto-Save",new cljs.core.Keyword(null,"description","description",-1428560544),"Enable auto-save with custom interval",new cljs.core.Keyword(null,"keys","keys",1068423698),"SPC w a",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
var interval = (function (){var or__5002__auto__ = prompt("Auto-save interval (ms):","30000");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "30000";
}
})();
var workspace_path = (function (){var or__5002__auto__ = prompt("Workspace path for auto-save:","./workspace.json");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "./workspace.json";
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = interval;
if(cljs.core.truth_(and__5000__auto__)){
return workspace_path;
} else {
return and__5000__auto__;
}
})())){
return opencode_unified.state.enable_auto_save_BANG_(parseInt(interval,(10)),workspace_path);
} else {
return null;
}
})], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),"Disable Auto-Save",new cljs.core.Keyword(null,"description","description",-1428560544),"Disable auto-save",new cljs.core.Keyword(null,"keys","keys",1068423698),"SPC w d",new cljs.core.Keyword(null,"handler","handler",-195596612),opencode_unified.state.disable_auto_save_BANG_], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"name","name",1843675177),"New Workspace",new cljs.core.Keyword(null,"description","description",-1428560544),"Create new workspace (clear current state)",new cljs.core.Keyword(null,"keys","keys",1068423698),"SPC w n",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
if(cljs.core.truth_(confirm("Clear current workspace and create new one?"))){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc,new cljs.core.Keyword(null,"buffers","buffers",471409492),cljs.core.PersistentArrayMap.EMPTY);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc,new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614),null);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"ui","ui",-469653645),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"theme","theme",-1247880880),new cljs.core.Keyword(null,"dark","dark",1818973999)], null)], 0));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"normal","normal",-1519123858)], null)], 0));

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["New workspace created"], 0));
} else {
return null;
}
})], null)], null);
});

//# sourceMappingURL=opencode_unified.state.js.map
