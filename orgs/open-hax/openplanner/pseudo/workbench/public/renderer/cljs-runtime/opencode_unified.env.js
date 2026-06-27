goog.provide('opencode_unified.env');
/**
 * Check if running in Electron environment
 */
opencode_unified.env.electron_QMARK_ = (function opencode_unified$env$electron_QMARK_(){
return (((typeof window !== 'undefined')) && ((!(((window["electronAPI"]) == null)))));
});
/**
 * Check if running in Node.js environment
 */
opencode_unified.env.node_QMARK_ = (function opencode_unified$env$node_QMARK_(){
return (typeof process !== 'undefined');
});
/**
 * Check if running in web browser environment
 */
opencode_unified.env.web_QMARK_ = (function opencode_unified$env$web_QMARK_(){
return (((typeof window !== 'undefined')) && ((((!(opencode_unified.env.electron_QMARK_()))) && ((!(opencode_unified.env.node_QMARK_()))))));
});
/**
 * Get the current platform: :electron, :web, or :node
 */
opencode_unified.env.get_platform = (function opencode_unified$env$get_platform(){
if(opencode_unified.env.electron_QMARK_()){
return new cljs.core.Keyword(null,"electron","electron",1312019442);
} else {
if(opencode_unified.env.web_QMARK_()){
return new cljs.core.Keyword(null,"web","web",-654701153);
} else {
if(opencode_unified.env.node_QMARK_()){
return new cljs.core.Keyword(null,"node","node",581201198);
} else {
return new cljs.core.Keyword(null,"unknown","unknown",-935977881);

}
}
}
});
/**
 * Get Electron API if available
 */
opencode_unified.env.electron_api = (function opencode_unified$env$electron_api(){
if(opencode_unified.env.electron_QMARK_()){
return (window["electronAPI"]);
} else {
return null;
}
});
/**
 * Check if notifications are supported
 */
opencode_unified.env.show_notification_QMARK_ = (function opencode_unified$env$show_notification_QMARK_(){
return ((opencode_unified.env.electron_QMARK_()) || (((opencode_unified.env.web_QMARK_()) && ((((typeof Notification !== 'undefined')) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(Notification.permission,"granted")))))));
});
/**
 * Check if file system access is available
 */
opencode_unified.env.file_system_access_QMARK_ = (function opencode_unified$env$file_system_access_QMARK_(){
return opencode_unified.env.electron_QMARK_();
});
/**
 * Get application version
 */
opencode_unified.env.get_app_version = (function opencode_unified$env$get_app_version(){
if(opencode_unified.env.electron_QMARK_()){
var temp__5802__auto__ = (function (){var G__248948 = opencode_unified.env.electron_api();
if((G__248948 == null)){
return null;
} else {
return (G__248948["getAppVersion"]);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var get_app_version = temp__5802__auto__;
return (get_app_version.cljs$core$IFn$_invoke$arity$0 ? get_app_version.cljs$core$IFn$_invoke$arity$0() : get_app_version.call(null));
} else {
return "web-version";
}
} else {
return "web-version";

}
});
/**
 * Open URL in external browser
 */
opencode_unified.env.open_external_url = (function opencode_unified$env$open_external_url(url){
if(opencode_unified.env.electron_QMARK_()){
var temp__5802__auto__ = (function (){var G__248957 = opencode_unified.env.electron_api();
if((G__248957 == null)){
return null;
} else {
return (G__248957["openExternal"]);
}
})();
if(cljs.core.truth_(temp__5802__auto__)){
var open_external = temp__5802__auto__;
return (open_external.cljs$core$IFn$_invoke$arity$1 ? open_external.cljs$core$IFn$_invoke$arity$1(url) : open_external.call(null,url));
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Cannot open external URL:",url], 0));
}
} else {
if(opencode_unified.env.web_QMARK_()){
return window.open(url,"_blank");
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Cannot open external URL:",url], 0));

}
}
});

//# sourceMappingURL=opencode_unified.env.js.map
