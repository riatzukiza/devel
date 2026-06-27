goog.provide('opencode_unified.openplanner');
var module$node_modules$$promethean_os$openplanner_cljs_client$dist$index=shadow.js.require("module$node_modules$$promethean_os$openplanner_cljs_client$dist$index", {});










opencode_unified.openplanner.now_ms = (function opencode_unified$openplanner$now_ms(){
return Date.now();
});
opencode_unified.openplanner.parse_ts = (function opencode_unified$openplanner$parse_ts(value){
if(typeof value === 'number'){
return value;
} else {
if(typeof value === 'string'){
var parsed = Date.parse(value);
if(cljs.core.truth_(isNaN(parsed))){
return opencode_unified.openplanner.now_ms();
} else {
return parsed;
}
} else {
return opencode_unified.openplanner.now_ms();

}
}
});
opencode_unified.openplanner.relative_time = (function opencode_unified$openplanner$relative_time(timestamp){
var delta_ms = (function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (opencode_unified.openplanner.now_ms() - timestamp);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var delta_sec = Math.floor((delta_ms / (1000)));
var delta_min = Math.floor((delta_sec / (60)));
var delta_hour = Math.floor((delta_min / (60)));
var delta_day = Math.floor((delta_hour / (24)));
if((delta_min < (1))){
return "just now";
} else {
if((delta_min < (60))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(delta_min)," min",((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(delta_min,(1)))?"s":null)," ago"].join('');
} else {
if((delta_hour < (24))){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(delta_hour)," hour",((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(delta_hour,(1)))?"s":null)," ago"].join('');
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(delta_day)," day",((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(delta_day,(1)))?"s":null)," ago"].join('');

}
}
}
});
opencode_unified.openplanner.classify_event_type = (function opencode_unified$openplanner$classify_event_type(kind,title,snippet){
var haystack = clojure.string.lower_case([cljs.core.str.cljs$core$IFn$_invoke$arity$1(kind)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(title)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(snippet)].join(''));
if(((clojure.string.includes_QMARK_(haystack,"error")) || (((clojure.string.includes_QMARK_(haystack,"fail")) || (clojure.string.includes_QMARK_(haystack,"exception")))))){
return new cljs.core.Keyword(null,"error","error",-978969032);
} else {
return new cljs.core.Keyword(null,"info","info",-317069002);
}
});
opencode_unified.openplanner.runtime_config = (function opencode_unified$openplanner$runtime_config(){
var cfg = (function (){var or__5002__auto__ = (function (){var G__14318 = window;
var G__14318__$1 = (((G__14318 == null))?null:(G__14318["__WORKBENCH_BACKENDS__"]));
if((G__14318__$1 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__14318__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
var endpoint = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"openplanner-url","openplanner-url",-1804248247).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"openplannerUrl","openplannerUrl",-1086696873).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "http://localhost:8788/api/openplanner";
}
}
})();
var api_key = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"openplanner-api-key","openplanner-api-key",5324020).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"openplannerApiKey","openplannerApiKey",-548897500).cljs$core$IFn$_invoke$arity$1(cfg);
}
})();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"endpoint","endpoint",447890044),endpoint,new cljs.core.Keyword(null,"api-key","api-key",1037904031),api_key], null);
});
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.openplanner !== 'undefined') && (typeof opencode_unified.openplanner.client_cache !== 'undefined')){
} else {
opencode_unified.openplanner.client_cache = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
opencode_unified.openplanner.planner_factory = (function opencode_unified$openplanner$planner_factory(){
var or__5002__auto__ = (function (){var G__14319 = module$node_modules$$promethean_os$openplanner_cljs_client$dist$index;
if((G__14319 == null)){
return null;
} else {
return (G__14319["createOpenPlannerClient"]);
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var G__14320 = module$node_modules$$promethean_os$openplanner_cljs_client$dist$index;
var G__14320__$1 = (((G__14320 == null))?null:(G__14320["default"]));
if((G__14320__$1 == null)){
return null;
} else {
return (G__14320__$1["createOpenPlannerClient"]);
}
}
});
opencode_unified.openplanner.ensure_client = (function opencode_unified$openplanner$ensure_client(){
var map__14321 = opencode_unified.openplanner.runtime_config();
var map__14321__$1 = cljs.core.__destructure_map(map__14321);
var endpoint = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14321__$1,new cljs.core.Keyword(null,"endpoint","endpoint",447890044));
var api_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14321__$1,new cljs.core.Keyword(null,"api-key","api-key",1037904031));
var cached = cljs.core.deref(opencode_unified.openplanner.client_cache);
var create_client = opencode_unified.openplanner.planner_factory();
if(cljs.core.truth_(create_client)){
} else {
throw (new Error("OpenPlanner client factory missing from @promethean-os/openplanner-cljs-client"));
}

if(cljs.core.truth_((function (){var and__5000__auto__ = cached;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(endpoint,new cljs.core.Keyword(null,"endpoint","endpoint",447890044).cljs$core$IFn$_invoke$arity$1(cached))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(api_key,new cljs.core.Keyword(null,"api-key","api-key",1037904031).cljs$core$IFn$_invoke$arity$1(cached))));
} else {
return and__5000__auto__;
}
})())){
return new cljs.core.Keyword(null,"client","client",-1323448117).cljs$core$IFn$_invoke$arity$1(cached);
} else {
var opts = ({"endpoint": endpoint});
var _ = (cljs.core.truth_(api_key)?(opts["apiKey"] = api_key):null);
var client = (create_client.cljs$core$IFn$_invoke$arity$1 ? create_client.cljs$core$IFn$_invoke$arity$1(opts) : create_client.call(null,opts));
cljs.core.reset_BANG_(opencode_unified.openplanner.client_cache,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"endpoint","endpoint",447890044),endpoint,new cljs.core.Keyword(null,"api-key","api-key",1037904031),api_key,new cljs.core.Keyword(null,"client","client",-1323448117),client], null));

return client;
}
});
opencode_unified.openplanner.request_json = (function opencode_unified$openplanner$request_json(var_args){
var G__14324 = arguments.length;
switch (G__14324) {
case 2:
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$2 = (function (method,path){
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$3(method,path,null);
}));

(opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$3 = (function (method,path,payload){
var client = opencode_unified.openplanner.ensure_client();
var response_promise = ((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(method,"GET")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"/v1/sessions"))))?client.listSessions():((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(method,"POST")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"/v1/search/fts"))))?client.searchFts(cljs.core.clj__GT_js(payload)):((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(method,"POST")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"/v1/search/vector"))))?client.searchVector(cljs.core.clj__GT_js(payload)):((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(method,"POST")) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"/v1/jobs/import/chatgpt"))))?client.createChatgptImportJob(cljs.core.clj__GT_js(payload)):((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(method,"GET")) && (clojure.string.starts_with_QMARK_(path,"/v1/jobs/"))))?client.getJob(cljs.core.subs.cljs$core$IFn$_invoke$arity$2(path,(9))):Promise.reject((new Error(["Unsupported OpenPlanner call in workbench client: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(method)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path)].join(''))))
)))));
return response_promise.then((function (p1__14322_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__14322_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}));
}));

(opencode_unified.openplanner.request_json.cljs$lang$maxFixedArity = 3);

opencode_unified.openplanner.load_sessions_activity = (function opencode_unified$openplanner$load_sessions_activity(){
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$2("GET","/v1/sessions").then((function (result){
var rows = new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(result);
return opencode_unified.session_titles.list_opencode_sessions().then((function (title_map){
return cljs.core.vec(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,row){
var ts = opencode_unified.openplanner.parse_ts(new cljs.core.Keyword(null,"last_ts","last_ts",1415613512).cljs$core$IFn$_invoke$arity$1(row));
var session_name = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"session","session",1008279103).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "unspecified";
}
})();
var opencode_title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(title_map,session_name);
var session_title = (function (){var or__5002__auto__ = opencode_title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"session_title","session_title",-2116421851).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = new cljs.core.Keyword(null,"sessionTitle","sessionTitle",1593053678).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return "OpenCode Session";
}
}
}
}
}
})();
var project_name = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"project","project",1124394579).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "default";
}
})();
var event_count = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"event_count","event_count",-1889732422).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"session-id","session-id",-1147060351),new cljs.core.Keyword(null,"time","time",1385887882),new cljs.core.Keyword(null,"snippet","snippet",953581994),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"source","source",-433931539),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"session-title","session-title",-1519746063),new cljs.core.Keyword(null,"project","project",1124394579),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"kind","kind",-717265803),new cljs.core.Keyword(null,"timestamp","timestamp",579478971),new cljs.core.Keyword(null,"session","session",1008279103)],[session_name,opencode_unified.openplanner.relative_time(ts),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(event_count)," events"].join(''),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"openplanner","openplanner",-175854128),session_title,session_title,project_name,["session-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(session_name),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join(''),"session.summary",ts,session_name]);
}),rows));
}));
}));
});
opencode_unified.openplanner.search_activity = (function opencode_unified$openplanner$search_activity(query){
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$3("POST","/v1/search/fts",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"q","q",689001697),query,new cljs.core.Keyword(null,"limit","limit",-1355822363),(60)], null)).then((function (result){
var rows = new cljs.core.Keyword(null,"rows","rows",850049680).cljs$core$IFn$_invoke$arity$1(result);
return cljs.core.vec(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,row){
var ts = opencode_unified.openplanner.parse_ts(new cljs.core.Keyword(null,"ts","ts",1617209904).cljs$core$IFn$_invoke$arity$1(row));
var title = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "Search result";
}
}
})();
var snippet = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var kind = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"kind","kind",-717265803).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"time","time",1385887882),new cljs.core.Keyword(null,"snippet","snippet",953581994),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"source","source",-433931539),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"project","project",1124394579),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"kind","kind",-717265803),new cljs.core.Keyword(null,"timestamp","timestamp",579478971),new cljs.core.Keyword(null,"session","session",1008279103)],[opencode_unified.openplanner.relative_time(ts),snippet,opencode_unified.openplanner.classify_event_type(kind,title,snippet),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "openplanner";
}
})(),title,new cljs.core.Keyword(null,"project","project",1124394579).cljs$core$IFn$_invoke$arity$1(row),["event-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(row);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return idx;
}
})())].join(''),kind,ts,new cljs.core.Keyword(null,"session","session",1008279103).cljs$core$IFn$_invoke$arity$1(row)]);
}),rows));
}));
});
opencode_unified.openplanner.search_vector = (function opencode_unified$openplanner$search_vector(var_args){
var args__5732__auto__ = [];
var len__5726__auto___14332 = arguments.length;
var i__5727__auto___14333 = (0);
while(true){
if((i__5727__auto___14333 < len__5726__auto___14332)){
args__5732__auto__.push((arguments[i__5727__auto___14333]));

var G__14334 = (i__5727__auto___14333 + (1));
i__5727__auto___14333 = G__14334;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return opencode_unified.openplanner.search_vector.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(opencode_unified.openplanner.search_vector.cljs$core$IFn$_invoke$arity$variadic = (function (query,p__14327){
var vec__14328 = p__14327;
var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14328,(0),null);
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$3("POST","/v1/search/vector",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"q","q",689001697),query,new cljs.core.Keyword(null,"k","k",-2146297393),(function (){var or__5002__auto__ = k;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (20);
}
})()], null)).then((function (result){
var chroma_result = new cljs.core.Keyword(null,"result","result",1415092211).cljs$core$IFn$_invoke$arity$1(result);
var ids = cljs.core.first(new cljs.core.Keyword(null,"ids","ids",-998535796).cljs$core$IFn$_invoke$arity$1(chroma_result));
var metadatas = cljs.core.first(new cljs.core.Keyword(null,"metadatas","metadatas",-1319371457).cljs$core$IFn$_invoke$arity$1(chroma_result));
var documents = cljs.core.first(new cljs.core.Keyword(null,"documents","documents",-1582333455).cljs$core$IFn$_invoke$arity$1(chroma_result));
var distances = cljs.core.first(new cljs.core.Keyword(null,"distances","distances",-1026444268).cljs$core$IFn$_invoke$arity$1(chroma_result));
return cljs.core.vec(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,id){
var metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(metadatas,idx);
var ts = opencode_unified.openplanner.parse_ts((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"ts","ts",1617209904).cljs$core$IFn$_invoke$arity$1(metadata);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"timestamp","timestamp",579478971).cljs$core$IFn$_invoke$arity$1(metadata);
}
})());
var kind = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"kind","kind",-717265803).cljs$core$IFn$_invoke$arity$1(metadata);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "vector.result";
}
})();
var content = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(documents,idx);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var title = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(metadata);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.first(clojure.string.split_lines(content));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "Semantic result";
}
}
})();
return cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"time","time",1385887882),new cljs.core.Keyword(null,"snippet","snippet",953581994),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"source","source",-433931539),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"project","project",1124394579),new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"kind","kind",-717265803),new cljs.core.Keyword(null,"distance","distance",-1671893894),new cljs.core.Keyword(null,"timestamp","timestamp",579478971),new cljs.core.Keyword(null,"metadata","metadata",1799301597),new cljs.core.Keyword(null,"session","session",1008279103),new cljs.core.Keyword(null,"text","text",-1790561697)],[opencode_unified.openplanner.relative_time(ts),content,opencode_unified.openplanner.classify_event_type(kind,title,content),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(metadata);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "vector-search";
}
})(),title,new cljs.core.Keyword(null,"project","project",1124394579).cljs$core$IFn$_invoke$arity$1(metadata),["vector-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),kind,cljs.core.get.cljs$core$IFn$_invoke$arity$2(distances,idx),ts,metadata,new cljs.core.Keyword(null,"session","session",1008279103).cljs$core$IFn$_invoke$arity$1(metadata),content]);
}),ids));
}));
}));

(opencode_unified.openplanner.search_vector.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(opencode_unified.openplanner.search_vector.cljs$lang$applyTo = (function (seq14325){
var G__14326 = cljs.core.first(seq14325);
var seq14325__$1 = cljs.core.next(seq14325);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14326,seq14325__$1);
}));

opencode_unified.openplanner.create_chatgpt_import_job = (function opencode_unified$openplanner$create_chatgpt_import_job(file_path){
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$3("POST","/v1/jobs/import/chatgpt",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"filePath","filePath",688035028),file_path], null));
});
opencode_unified.openplanner.fetch_job = (function opencode_unified$openplanner$fetch_job(job_id){
return opencode_unified.openplanner.request_json.cljs$core$IFn$_invoke$arity$2("GET",["/v1/jobs/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(job_id)].join(''));
});

//# sourceMappingURL=opencode_unified.openplanner.js.map
