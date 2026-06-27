goog.provide('opencode_unified.main');
opencode_unified.main.init = (function opencode_unified$main$init(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["Starting Opencode on platform: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.env.get_platform())].join('')], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Initializing app state..."], 0));

opencode_unified.keymap.init();

opencode_unified.command_palette.init_BANG_();

opencode_unified.evil.init();

opencode_unified.plugins.initialize_plugin_system();

opencode_unified.ui.init();

opencode_unified.opencode.init_opencode();

if(opencode_unified.env.electron_QMARK_()){
var electron_api_15109 = opencode_unified.env.electron_api();
electron_api_15109.onMenuAction((function (action){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Menu action:",action], 0));

var G__15102 = action;
switch (G__15102) {
case "open-file":
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Open file requested"], 0));

break;
case "save-file":
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Save file requested"], 0));

break;
case "new-file":
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["New file requested"], 0));

break;
case "quit":
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Quit requested"], 0));

break;
default:
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Unknown menu action:",action], 0));

}
}));

electron_api_15109.onPluginEvent((function (event){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Plugin event:",event], 0));
}));

electron_api_15109.onMainMessage("opencode-response",(function (response){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Opencode response:",response], 0));
}));
} else {
}

if(opencode_unified.env.web_QMARK_()){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Running in web mode - some Electron features will be unavailable"], 0));
} else {
}

var opencode_api_15111 = ({"listTools": (function (){
return opencode_unified.opencode.list_available_tools().then((function (res){
return cljs.core.clj__GT_js((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"tools","tools",-1241731990).cljs$core$IFn$_invoke$arity$1(res);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return res;
}
})());
}));
}), "executeTool": (function (name,params){
return opencode_unified.opencode.execute_tool(name,params).then(cljs.core.clj__GT_js);
}), "listFiles": (function (path){
return Promise.resolve([]);
}), "listAgents": (function (){
return opencode_unified.opencode.list_active_agents().then((function (res){
return cljs.core.clj__GT_js((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"agents","agents",-1112413700).cljs$core$IFn$_invoke$arity$1(res);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return res;
}
})());
}));
}), "getDebugInfo": (function (){
return Promise.resolve(cljs.core.clj__GT_js(cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opencode_unified.opencode.get_opencode_state(),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"version","version",425292698),"1.0.0",new cljs.core.Keyword(null,"connectionStatus","connectionStatus",-914714610),"connected",new cljs.core.Keyword(null,"activeSessions","activeSessions",103595678),(0)], null)], 0))));
}), "sendMessage": (function (id,msg){
return opencode_unified.opencode.send_agent_message(id,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(msg,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)))).then(cljs.core.clj__GT_js);
}), "updateSession": (function (id,updates){
return opencode_unified.opencode.update_session(id,cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(updates,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))).then(cljs.core.clj__GT_js);
}), "deleteSession": (function (id){
return opencode_unified.opencode.delete_session(id).then(cljs.core.clj__GT_js);
}), "listSessions": (function (){
return opencode_unified.opencode.list_sessions().then((function (res){
return cljs.core.clj__GT_js((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"sessions","sessions",-699316392).cljs$core$IFn$_invoke$arity$1(res);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return res;
}
})());
}));
}), "on": (function (event,handler){
return null;
}), "executeCommand": (function (cmd,params){
return opencode_unified.opencode.execute_tool(cmd,params).then(cljs.core.clj__GT_js);
}), "createSession": (function (config){
return opencode_unified.opencode.create_session().then(cljs.core.clj__GT_js);
})});
Object.defineProperty(opencode_api_15111,"connected",({"get": (function (){
return new cljs.core.Keyword(null,"connected?","connected?",-1197551387).cljs$core$IFn$_invoke$arity$1(opencode_unified.opencode.get_opencode_state());
}), "enumerable": true}));

Object.defineProperty(opencode_api_15111,"currentSessionId",({"get": (function (){
return new cljs.core.Keyword(null,"session-id","session-id",-1147060351).cljs$core$IFn$_invoke$arity$1(opencode_unified.opencode.get_opencode_state());
}), "enumerable": true}));

(window.opencodeApp = ({"initialized": true, "plugins": ({}), "opencode": opencode_api_15111}));

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Opencode started successfully!"], 0));
});
if((typeof document !== 'undefined')){
if(cljs.core.truth_((function (){var and__5000__auto__ = document;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(document.readyState,"loading");
} else {
return and__5000__auto__;
}
})())){
opencode_unified.main.init();
} else {
document.addEventListener("DOMContentLoaded",opencode_unified.main.init);
}
} else {
}
opencode_unified.main.reload = (function opencode_unified$main$reload(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Hot reloading main..."], 0));

return opencode_unified.ui.reload();
});
goog.exportSymbol('opencode_unified.main.reload', opencode_unified.main.reload);
opencode_unified.main.clear = (function opencode_unified$main$clear(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Clearing main..."], 0));

return opencode_unified.ui.clear();
});
goog.exportSymbol('opencode_unified.main.clear', opencode_unified.main.clear);
/**
 * Main entry point for the application
 */
opencode_unified.main.main = (function opencode_unified$main$main(){
return opencode_unified.main.init();
});
goog.exportSymbol('opencode_unified.main.main', opencode_unified.main.main);

//# sourceMappingURL=opencode_unified.main.js.map
