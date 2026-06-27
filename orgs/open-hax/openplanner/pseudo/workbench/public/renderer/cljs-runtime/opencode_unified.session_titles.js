goog.provide('opencode_unified.session_titles');
var module$node_modules$$promethean_os$opencode_cljs_client$dist$index=shadow.js.require("module$node_modules$$promethean_os$opencode_cljs_client$dist$index", {});
opencode_unified.session_titles.backend_config = (function opencode_unified$session_titles$backend_config(){
if((typeof window !== 'undefined')){
var or__5002__auto__ = (function (){var G__13839 = window;
var G__13839__$1 = (((G__13839 == null))?null:(G__13839["__WORKBENCH_BACKENDS__"]));
if((G__13839__$1 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__13839__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
});
opencode_unified.session_titles.configured_api_endpoint = (function opencode_unified$session_titles$configured_api_endpoint(){
var cfg = opencode_unified.session_titles.backend_config();
var or__5002__auto__ = new cljs.core.Keyword(null,"opencode-url","opencode-url",462759830).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"opencodeUrl","opencodeUrl",-685951358).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "http://localhost:8788/api/opencode";
}
}
});
opencode_unified.session_titles.configured_api_key = (function opencode_unified$session_titles$configured_api_key(){
var cfg = opencode_unified.session_titles.backend_config();
var or__5002__auto__ = new cljs.core.Keyword(null,"opencode-api-key","opencode-api-key",-854113335).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"opencodeApiKey","opencodeApiKey",-979926530).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"openplanner-api-key","openplanner-api-key",5324020).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return new cljs.core.Keyword(null,"openplannerApiKey","openplannerApiKey",-548897500).cljs$core$IFn$_invoke$arity$1(cfg);
}
}
}
});
opencode_unified.session_titles.make_client = (function opencode_unified$session_titles$make_client(){
var opts = ({"baseUrl": opencode_unified.session_titles.configured_api_endpoint()});
var api_key = opencode_unified.session_titles.configured_api_key();
var create_client = (function (){var or__5002__auto__ = (function (){var G__13859 = module$node_modules$$promethean_os$opencode_cljs_client$dist$index;
if((G__13859 == null)){
return null;
} else {
return (G__13859["createOpencodeClient"]);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__13862 = module$node_modules$$promethean_os$opencode_cljs_client$dist$index;
var G__13862__$1 = (((G__13862 == null))?null:(G__13862["default"]));
if((G__13862__$1 == null)){
return null;
} else {
return (G__13862__$1["createOpencodeClient"]);
}
}
})();
if(cljs.core.truth_(create_client)){
} else {
throw (new Error("OpenCode client factory missing from @promethean-os/opencode-cljs-client"));
}

if(cljs.core.truth_(api_key)){
(opts["apiKey"] = api_key);
} else {
}

return (create_client.cljs$core$IFn$_invoke$arity$1 ? create_client.cljs$core$IFn$_invoke$arity$1(opts) : create_client.call(null,opts));
});
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.session_titles !== 'undefined') && (typeof opencode_unified.session_titles.client_ref !== 'undefined')){
} else {
opencode_unified.session_titles.client_ref = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
opencode_unified.session_titles.ensure_client = (function opencode_unified$session_titles$ensure_client(){
var or__5002__auto__ = cljs.core.deref(opencode_unified.session_titles.client_ref);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var c = opencode_unified.session_titles.make_client();
cljs.core.reset_BANG_(opencode_unified.session_titles.client_ref,c);

return c;
}
});
opencode_unified.session_titles.list_opencode_sessions = (function opencode_unified$session_titles$list_opencode_sessions(){

var client = opencode_unified.session_titles.ensure_client();
return client.listSessions().then((function (result){
var sessions = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(result,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
var rows = ((cljs.core.vector_QMARK_(sessions))?sessions:((cljs.core.map_QMARK_(sessions))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"sessions","sessions",-699316392).cljs$core$IFn$_invoke$arity$1(sessions);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(sessions);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(sessions);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return cljs.core.PersistentVector.EMPTY;
}
}
}
})():cljs.core.PersistentVector.EMPTY
));
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(cljs.core.PersistentArrayMap.EMPTY,cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (s){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(s);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"sessionID","sessionID",244679263).cljs$core$IFn$_invoke$arity$1(s);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return new cljs.core.Keyword(null,"session-id","session-id",-1147060351).cljs$core$IFn$_invoke$arity$1(s);
}
}
})(),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(s);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(s);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "Untitled Session";
}
}
})()], null);
}),rows));
})).catch((function (error){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error fetching OpenCode sessions:",(function (){var or__5002__auto__ = error.message;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(error);
}
})()], 0));

return cljs.core.PersistentArrayMap.EMPTY;
}));
});

//# sourceMappingURL=opencode_unified.session_titles.js.map
