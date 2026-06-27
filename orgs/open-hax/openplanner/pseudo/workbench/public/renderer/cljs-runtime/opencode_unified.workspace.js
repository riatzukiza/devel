goog.provide('opencode_unified.workspace');
opencode_unified.workspace.runtime_config = (function opencode_unified$workspace$runtime_config(){
var cfg = (function (){var or__5002__auto__ = (function (){var G__249174 = window;
var G__249174__$1 = (((G__249174 == null))?null:(G__249174["__WORKBENCH_BACKENDS__"]));
if((G__249174__$1 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__249174__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}
})();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})();
var endpoint = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"workspace-url","workspace-url",1492360228).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"workspaceUrl","workspaceUrl",-1923338816).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "http://localhost:8788/api/workspace";
}
}
})();
var api_key = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"workspace-api-key","workspace-api-key",-1085207972).cljs$core$IFn$_invoke$arity$1(cfg);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"workspaceApiKey","workspaceApiKey",-1161106511).cljs$core$IFn$_invoke$arity$1(cfg);
}
})();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"endpoint","endpoint",447890044),endpoint,new cljs.core.Keyword(null,"api-key","api-key",1037904031),api_key], null);
});
opencode_unified.workspace.encode = (function opencode_unified$workspace$encode(value){
return encodeURIComponent((function (){var or__5002__auto__ = value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
});
opencode_unified.workspace.request_json = (function opencode_unified$workspace$request_json(var_args){
var G__249185 = arguments.length;
switch (G__249185) {
case 2:
return opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$2 = (function (method,route){
return opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$3(method,route,null);
}));

(opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$3 = (function (method,route,payload){
var map__249193 = opencode_unified.workspace.runtime_config();
var map__249193__$1 = cljs.core.__destructure_map(map__249193);
var endpoint = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249193__$1,new cljs.core.Keyword(null,"endpoint","endpoint",447890044));
var api_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__249193__$1,new cljs.core.Keyword(null,"api-key","api-key",1037904031));
var headers = (function (){var G__249199 = new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null);
if((!((api_key == null)))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__249199,"Authorization",["Bearer ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(api_key)].join(''));
} else {
return G__249199;
}
})();
var body = (((!((payload == null))))?JSON.stringify(cljs.core.clj__GT_js(payload)):null);
return fetch([cljs.core.str.cljs$core$IFn$_invoke$arity$1(endpoint),cljs.core.str.cljs$core$IFn$_invoke$arity$1(route)].join(''),cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"method","method",55703592),method,new cljs.core.Keyword(null,"headers","headers",-835030129),headers,new cljs.core.Keyword(null,"body","body",-2049205669),body], null))).then((function (response){
if(cljs.core.truth_(response.ok)){
return response.text();
} else {
return response.text().then((function (txt){
throw (new Error(["Workspace request failed (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(response.status),"): ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(txt)].join('')));
}));
}
})).then((function (text){
if(clojure.string.blank_QMARK_(text)){
return cljs.core.PersistentArrayMap.EMPTY;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(text),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}
}));
}));

(opencode_unified.workspace.request_json.cljs$lang$maxFixedArity = 3);

opencode_unified.workspace.workspace_meta = (function opencode_unified$workspace$workspace_meta(){
return opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$2("GET","/meta");
});
opencode_unified.workspace.list_directory = (function opencode_unified$workspace$list_directory(var_args){
var G__249234 = arguments.length;
switch (G__249234) {
case 0:
return opencode_unified.workspace.list_directory.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return opencode_unified.workspace.list_directory.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(opencode_unified.workspace.list_directory.cljs$core$IFn$_invoke$arity$0 = (function (){
return opencode_unified.workspace.list_directory.cljs$core$IFn$_invoke$arity$1(".");
}));

(opencode_unified.workspace.list_directory.cljs$core$IFn$_invoke$arity$1 = (function (relative_path){
return opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$2("GET",["/list?path=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.workspace.encode(relative_path)),"&limit=250"].join(''));
}));

(opencode_unified.workspace.list_directory.cljs$lang$maxFixedArity = 1);

opencode_unified.workspace.read_file = (function opencode_unified$workspace$read_file(relative_path){
return opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$2("GET",["/file?path=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.workspace.encode(relative_path))].join(''));
});
opencode_unified.workspace.write_file = (function opencode_unified$workspace$write_file(relative_path,content){
return opencode_unified.workspace.request_json.cljs$core$IFn$_invoke$arity$3("PUT","/file",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"path","path",-188191168),relative_path,new cljs.core.Keyword(null,"content","content",15833224),content], null));
});

//# sourceMappingURL=opencode_unified.workspace.js.map
