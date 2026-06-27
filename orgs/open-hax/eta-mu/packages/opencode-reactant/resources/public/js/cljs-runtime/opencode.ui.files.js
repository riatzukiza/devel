goog.provide('opencode.ui.files');
opencode.ui.files.set_loading_BANG_ = (function opencode$ui$files$set_loading_BANG_(path){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.update,new cljs.core.Keyword(null,"fs","fs",-2122926244),(function (p1__12606_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"entries","entries",-86943161),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"loading?","loading?",1905707049),true,new cljs.core.Keyword(null,"error","error",-978969032),null], null),p1__12606_SHARP_], 0));
}));
});
opencode.ui.files.set_error_BANG_ = (function opencode$ui$files$set_error_BANG_(msg){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"fs","fs",-2122926244),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fs","fs",-2122926244).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state))),new cljs.core.Keyword(null,"entries","entries",-86943161),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,new cljs.core.Keyword(null,"error","error",-978969032),msg], null));
});
opencode.ui.files.set_entries_BANG_ = (function opencode$ui$files$set_entries_BANG_(path,entries){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode.ui.state._BANG_state,cljs.core.assoc,new cljs.core.Keyword(null,"fs","fs",-2122926244),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"entries","entries",-86943161),entries,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,new cljs.core.Keyword(null,"error","error",-978969032),null], null));
});
opencode.ui.files.fetch_files_BANG_ = (function opencode$ui$files$fetch_files_BANG_(path){
var encoded = encodeURIComponent(path);
opencode.ui.files.set_loading_BANG_(path);

var xhr = (new XMLHttpRequest());
xhr.open("GET",["/api/files?path=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(encoded)].join(''),true);

xhr.setRequestHeader("Accept","application/json");

(xhr.onload = (function (){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(xhr.status,(200))){
var data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(JSON.parse(xhr.responseText),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
opencode.ui.files.set_entries_BANG_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(data),new cljs.core.Keyword(null,"entries","entries",-86943161).cljs$core$IFn$_invoke$arity$1(data));

return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","fs-load","ui/fs-load",-1337897576),new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(data),new cljs.core.Keyword(null,"count","count",2139924085),cljs.core.count(new cljs.core.Keyword(null,"entries","entries",-86943161).cljs$core$IFn$_invoke$arity$1(data)),new cljs.core.Keyword(null,"ts","ts",1617209904),Date.now()], null));
} else {
return opencode.ui.files.set_error_BANG_(xhr.statusText);
}
}));

(xhr.onerror = (function (){
opencode.ui.files.set_error_BANG_("Network error");

return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","fs-error","ui/fs-error",2075489417),new cljs.core.Keyword(null,"path","path",-188191168),path,new cljs.core.Keyword(null,"ts","ts",1617209904),Date.now()], null));
}));

return xhr.send();
});
opencode.ui.files.go_parent_BANG_ = (function opencode$ui$files$go_parent_BANG_(){
var current = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"fs","fs",-2122926244).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state)));
var parent = (((((current == null)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current,"."))))?".":(function (){var segments = clojure.string.split.cljs$core$IFn$_invoke$arity$2(current,/\//);
var trimmed = cljs.core.butlast(segments);
var p = clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",trimmed);
if(cljs.core.seq(p)){
return p;
} else {
return ".";
}
})());
return opencode.ui.files.fetch_files_BANG_(parent);
});

//# sourceMappingURL=opencode.ui.files.js.map
