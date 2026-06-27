goog.provide('opencode_unified.buffers');
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.buffers !== 'undefined') && (typeof opencode_unified.buffers.buffer_id_counter !== 'undefined')){
} else {
opencode_unified.buffers.buffer_id_counter = reagent.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
opencode_unified.buffers.generate_buffer_id = (function opencode_unified$buffers$generate_buffer_id(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(opencode_unified.buffers.buffer_id_counter,cljs.core.inc);
});




opencode_unified.buffers.error_message = (function opencode_unified$buffers$error_message(error){
if(typeof error === 'string'){
return error;
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = error;
if(cljs.core.truth_(and__5000__auto__)){
return (!((error.message == null)));
} else {
return and__5000__auto__;
}
})())){
return error.message;
} else {
return "Unknown error";

}
}
});
opencode_unified.buffers.language_for_path = (function opencode_unified$buffers$language_for_path(file_path){
var ext = (function (){var G__14507 = file_path;
var G__14507__$1 = (((G__14507 == null))?null:clojure.string.split.cljs$core$IFn$_invoke$arity$2(G__14507,/\\./));
var G__14507__$2 = (((G__14507__$1 == null))?null:cljs.core.last(G__14507__$1));
if((G__14507__$2 == null)){
return null;
} else {
return clojure.string.lower_case(G__14507__$2);
}
})();
var G__14516 = ext;
switch (G__14516) {
case "clj":
return "clojure";

break;
case "cljs":
return "clojure";

break;
case "cljc":
return "clojure";

break;
case "edn":
return "clojure";

break;
case "ts":
return "typescript";

break;
case "tsx":
return "typescript";

break;
case "js":
return "javascript";

break;
case "jsx":
return "javascript";

break;
case "json":
return "json";

break;
case "md":
return "markdown";

break;
case "txt":
return "text";

break;
default:
return "text";

}
});
opencode_unified.buffers.update_status_BANG_ = (function opencode_unified$buffers$update_status_BANG_(message){
var mode = (function (){var or__5002__auto__ = opencode_unified.state.get_evil_mode();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"normal","normal",-1519123858);
}
})();
return opencode_unified.state.update_statusbar_BANG_(clojure.string.upper_case(cljs.core.name(mode)),"",message);
});
opencode_unified.buffers.update_statusbar = (function opencode_unified$buffers$update_statusbar(){
var mode = (function (){var or__5002__auto__ = opencode_unified.state.get_evil_mode();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"normal","normal",-1519123858);
}
})();
return opencode_unified.state.update_statusbar_BANG_(clojure.string.upper_case(cljs.core.name(mode)),"",["Evil mode - ",cljs.core.name(mode)].join(''));
});
opencode_unified.buffers.sorted_buffer_ids = (function opencode_unified$buffers$sorted_buffer_ids(){
return cljs.core.vec(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.keys(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)))));
});
opencode_unified.buffers.find_open_buffer_id = (function opencode_unified$buffers$find_open_buffer_id(file_path){
return cljs.core.some((function (p__14542){
var vec__14543 = p__14542;
var buffer_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14543,(0),null);
var buffer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14543,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(buffer),file_path)){
return buffer_id;
} else {
return null;
}
}),new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)));
});
opencode_unified.buffers.activate_buffer_BANG_ = (function opencode_unified$buffers$activate_buffer_BANG_(buffer_id){
opencode_unified.state.set_current_buffer_BANG_(buffer_id);

return buffer_id;
});
opencode_unified.buffers.close_buffer = (function opencode_unified$buffers$close_buffer(buffer_id){
var buffer = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),buffer_id], null));
if(cljs.core.truth_((function (){var and__5000__auto__ = buffer;
if(cljs.core.truth_(and__5000__auto__)){
return new cljs.core.Keyword(null,"modified?","modified?",-2109276969).cljs$core$IFn$_invoke$arity$1(buffer);
} else {
return and__5000__auto__;
}
})())){
if(cljs.core.truth_(confirm(["Save changes to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(buffer)),"?"].join('')))){
opencode_unified.buffers.activate_buffer_BANG_(buffer_id);

(opencode_unified.buffers.save_current_buffer.cljs$core$IFn$_invoke$arity$0 ? opencode_unified.buffers.save_current_buffer.cljs$core$IFn$_invoke$arity$0() : opencode_unified.buffers.save_current_buffer.call(null));
} else {
}
} else {
}

return opencode_unified.state.remove_buffer_BANG_(buffer_id);
});
opencode_unified.buffers.kill_current_buffer = (function opencode_unified$buffers$kill_current_buffer(){
var temp__5804__auto__ = new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
if(cljs.core.truth_(temp__5804__auto__)){
var buffer_id = temp__5804__auto__;
return opencode_unified.buffers.close_buffer(buffer_id);
} else {
return null;
}
});
opencode_unified.buffers.open_file = (function opencode_unified$buffers$open_file(file_path){
var target_path = clojure.string.trim((function (){var or__5002__auto__ = file_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
if(clojure.string.blank_QMARK_(target_path)){
opencode_unified.buffers.update_status_BANG_("Open failed: file path is required");

return Promise.reject((new Error("file path is required")));
} else {
var temp__5802__auto__ = opencode_unified.buffers.find_open_buffer_id(target_path);
if(cljs.core.truth_(temp__5802__auto__)){
var buffer_id = temp__5802__auto__;
opencode_unified.buffers.activate_buffer_BANG_(buffer_id);

opencode_unified.buffers.update_status_BANG_(["Focused ",target_path].join(''));

return Promise.resolve(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"buffer-id","buffer-id",-1512332292),buffer_id,new cljs.core.Keyword(null,"path","path",-188191168),target_path,new cljs.core.Keyword(null,"cached","cached",1437727905),true], null));
} else {
return opencode_unified.workspace.read_file(target_path).then((function (result){
var buffer_id = opencode_unified.buffers.generate_buffer_id();
var file_name = cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(target_path,/\//));
var content = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var buffer = opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic(buffer_id,content,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"name","name",1843675177),file_name,new cljs.core.Keyword(null,"path","path",-188191168),target_path,new cljs.core.Keyword(null,"language","language",-1591107564),opencode_unified.buffers.language_for_path(target_path),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),false], 0));
opencode_unified.state.add_buffer_BANG_(buffer);

opencode_unified.buffers.activate_buffer_BANG_(buffer_id);

opencode_unified.buffers.update_status_BANG_(["Opened ",target_path].join(''));

return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"buffer-id","buffer-id",-1512332292),buffer_id,new cljs.core.Keyword(null,"path","path",-188191168),target_path], null);
})).catch((function (error){
opencode_unified.buffers.update_status_BANG_(["Open failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.buffers.error_message(error))].join(''));

return Promise.reject(error);
}));
}
}
});
/**
 * Create and activate a new buffer with optional metadata/options.
 */
opencode_unified.buffers.create_buffer = (function opencode_unified$buffers$create_buffer(var_args){
var args__5732__auto__ = [];
var len__5726__auto___14760 = arguments.length;
var i__5727__auto___14761 = (0);
while(true){
if((i__5727__auto___14761 < len__5726__auto___14760)){
args__5732__auto__.push((arguments[i__5727__auto___14761]));

var G__14762 = (i__5727__auto___14761 + (1));
i__5727__auto___14761 = G__14762;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return opencode_unified.buffers.create_buffer.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(opencode_unified.buffers.create_buffer.cljs$core$IFn$_invoke$arity$variadic = (function (file_path,content,p__14561){
var vec__14562 = p__14561;
var seq__14563 = cljs.core.seq(vec__14562);
var first__14564 = cljs.core.first(seq__14563);
var seq__14563__$1 = cljs.core.next(seq__14563);
var metadata = first__14564;
var options = seq__14563__$1;
var buffer_id = opencode_unified.buffers.generate_buffer_id();
var file_name = cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = file_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ["buffer-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(buffer_id)].join('');
}
})(),/\//));
var metadata_map = ((cljs.core.map_QMARK_(metadata))?metadata:cljs.core.PersistentArrayMap.EMPTY);
var option_map = ((cljs.core.seq(options))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,options):cljs.core.PersistentArrayMap.EMPTY);
var buffer = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(opencode_unified.state.create_buffer.cljs$core$IFn$_invoke$arity$variadic(buffer_id,(function (){var or__5002__auto__ = content;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"name","name",1843675177),(function (){var or__5002__auto__ = file_name;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ["buffer-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(buffer_id)].join('');
}
})(),new cljs.core.Keyword(null,"path","path",-188191168),file_path,new cljs.core.Keyword(null,"language","language",-1591107564),opencode_unified.buffers.language_for_path(file_path),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),false], 0)),new cljs.core.Keyword(null,"metadata","metadata",1799301597),metadata_map),option_map], 0));
opencode_unified.state.add_buffer_BANG_(buffer);

opencode_unified.buffers.activate_buffer_BANG_(buffer_id);

opencode_unified.buffers.update_status_BANG_(["Opened ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = file_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(buffer);
}
})())].join(''));

return buffer;
}));

(opencode_unified.buffers.create_buffer.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(opencode_unified.buffers.create_buffer.cljs$lang$applyTo = (function (seq14553){
var G__14554 = cljs.core.first(seq14553);
var seq14553__$1 = cljs.core.next(seq14553);
var G__14555 = cljs.core.first(seq14553__$1);
var seq14553__$2 = cljs.core.next(seq14553__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14554,G__14555,seq14553__$2);
}));

opencode_unified.buffers.save_current_buffer = (function opencode_unified$buffers$save_current_buffer(){
var temp__5802__auto__ = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(temp__5802__auto__)){
var buffer = temp__5802__auto__;
var target_path = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(buffer);
if(clojure.string.blank_QMARK_((function (){var or__5002__auto__ = target_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})())){
return (opencode_unified.buffers.save_current_buffer_as.cljs$core$IFn$_invoke$arity$0 ? opencode_unified.buffers.save_current_buffer_as.cljs$core$IFn$_invoke$arity$0() : opencode_unified.buffers.save_current_buffer_as.call(null));
} else {
return opencode_unified.workspace.write_file(target_path,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer)).then((function (_result){
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc_in(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"modified?","modified?",-2109276969),false),new cljs.core.Keyword(null,"saved?","saved?",-2027163192),true),new cljs.core.Keyword(null,"original-content","original-content",-527645724),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(b)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"metadata","metadata",1799301597),new cljs.core.Keyword(null,"last-modified","last-modified",1593411791)], null),(new Date()));
}));

opencode_unified.buffers.update_status_BANG_(["Saved ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(target_path)].join(''));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"path","path",-188191168),target_path], null);
})).catch((function (error){
opencode_unified.buffers.update_status_BANG_(["Save failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.buffers.error_message(error))].join(''));

return Promise.reject(error);
}));
}
} else {
opencode_unified.buffers.update_status_BANG_("Save skipped: no active buffer");

return Promise.resolve(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"message","message",-406056002),"No active buffer"], null));
}
});
opencode_unified.buffers.save_current_buffer_as = (function opencode_unified$buffers$save_current_buffer_as(){
var temp__5802__auto__ = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(temp__5802__auto__)){
var buffer = temp__5802__auto__;
var default_path = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(buffer);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(buffer);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "README.md";
}
}
})();
var prompt_value = prompt("Save file as:",default_path);
var target_path = clojure.string.trim((function (){var or__5002__auto__ = prompt_value;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
if(clojure.string.blank_QMARK_(target_path)){
opencode_unified.buffers.update_status_BANG_("Save as cancelled");

return Promise.resolve(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"message","message",-406056002),"Cancelled"], null));
} else {
return opencode_unified.workspace.write_file(target_path,new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer)).then((function (_result){
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc_in(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"path","path",-188191168),target_path),new cljs.core.Keyword(null,"name","name",1843675177),cljs.core.last(clojure.string.split.cljs$core$IFn$_invoke$arity$2(target_path,/\//))),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),false),new cljs.core.Keyword(null,"saved?","saved?",-2027163192),true),new cljs.core.Keyword(null,"original-content","original-content",-527645724),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(b)),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"metadata","metadata",1799301597),new cljs.core.Keyword(null,"last-modified","last-modified",1593411791)], null),(new Date()));
}));

opencode_unified.buffers.update_status_BANG_(["Saved ",target_path].join(''));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"path","path",-188191168),target_path], null);
})).catch((function (error){
opencode_unified.buffers.update_status_BANG_(["Save as failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.buffers.error_message(error))].join(''));

return Promise.reject(error);
}));
}
} else {
opencode_unified.buffers.update_status_BANG_("Save as skipped: no active buffer");

return Promise.resolve(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"message","message",-406056002),"No active buffer"], null));
}
});
opencode_unified.buffers.switch_buffer = (function opencode_unified$buffers$switch_buffer(){
var buffer_ids = opencode_unified.buffers.sorted_buffer_ids();
if(cljs.core.empty_QMARK_(buffer_ids)){
return opencode_unified.buffers.update_status_BANG_("Switch buffer: no open buffers");
} else {
var options = clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (buffer_id){
var buffer = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),buffer_id], null));
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(buffer_id)," - ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(buffer))].join('');
}),buffer_ids));
var selection = prompt(["Switch buffer (enter id):\n",options].join(''),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(buffer_ids)));
var target_id = parseInt((function (){var or__5002__auto__ = selection;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),(10));
if(cljs.core.truth_(isNaN(target_id))){
return opencode_unified.buffers.update_status_BANG_("Switch buffer cancelled");
} else {
if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),target_id], null)))){
opencode_unified.buffers.activate_buffer_BANG_(target_id);

return opencode_unified.buffers.update_status_BANG_(["Switched to buffer ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(target_id)].join(''));
} else {
return opencode_unified.buffers.update_status_BANG_(["Switch buffer failed: unknown id ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(selection)].join(''));
}
}
}
});
opencode_unified.buffers.next_buffer = (function opencode_unified$buffers$next_buffer(){
var buffer_ids = opencode_unified.buffers.sorted_buffer_ids();
var current_id = new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
var current_index = cljs.core.clj__GT_js(buffer_ids).indexOf(current_id);
if(cljs.core.seq(buffer_ids)){
var next_index = (((current_index < (0)))?(0):cljs.core.mod((current_index + (1)),cljs.core.count(buffer_ids)));
var next_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(buffer_ids,next_index);
opencode_unified.buffers.activate_buffer_BANG_(next_id);

return opencode_unified.buffers.update_status_BANG_(["Switched to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),next_id], null))))].join(''));
} else {
return null;
}
});
opencode_unified.buffers.previous_buffer = (function opencode_unified$buffers$previous_buffer(){
var buffer_ids = opencode_unified.buffers.sorted_buffer_ids();
var current_id = new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
var current_index = cljs.core.clj__GT_js(buffer_ids).indexOf(current_id);
if(cljs.core.seq(buffer_ids)){
var prev_index = (((current_index < (0)))?(0):cljs.core.mod((current_index - (1)),cljs.core.count(buffer_ids)));
var prev_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(buffer_ids,prev_index);
opencode_unified.buffers.activate_buffer_BANG_(prev_id);

return opencode_unified.buffers.update_status_BANG_(["Switched to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),prev_id], null))))].join(''));
} else {
return null;
}
});
opencode_unified.buffers.list_buffers = (function opencode_unified$buffers$list_buffers(){
var buffers = cljs.core.vals(new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state)));
var listing = ((cljs.core.seq(buffers))?clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (buffer){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(buffer))," - ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(buffer)),(cljs.core.truth_(new cljs.core.Keyword(null,"modified?","modified?",-2109276969).cljs$core$IFn$_invoke$arity$1(buffer))?" *":null)].join('');
}),buffers)):"No buffers open");
alert(listing);

opencode_unified.buffers.update_status_BANG_("Buffer list opened");

return buffers;
});
opencode_unified.buffers.search_next = (function opencode_unified$buffers$search_next(query){
var temp__5804__auto__ = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(temp__5804__auto__)){
var buffer = temp__5804__auto__;
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var current_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var search_pos = (current_pos + (1));
var match_index = clojure.string.index_of.cljs$core$IFn$_invoke$arity$3(content,query,search_pos);
if(cljs.core.truth_(match_index)){
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),match_index),new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),match_index,new cljs.core.Keyword(null,"end","end",-268185958),(match_index + cljs.core.count(query))], null));
}));

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Found at position:",match_index], 0));
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Not found:",query], 0));
}
} else {
return null;
}
});
opencode_unified.buffers.search_prev = (function opencode_unified$buffers$search_prev(query){
var temp__5804__auto__ = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(temp__5804__auto__)){
var buffer = temp__5804__auto__;
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var current_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var search_pos = (function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (current_pos - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var match_index = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$3(content,query,search_pos);
if(cljs.core.truth_(match_index)){
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),match_index),new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),match_index,new cljs.core.Keyword(null,"end","end",-268185958),(match_index + cljs.core.count(query))], null));
}));

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Found at position:",match_index], 0));
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Not found:",query], 0));
}
} else {
return null;
}
});
/**
 * Convert buffer position to line and column numbers (0-based)
 */
opencode_unified.buffers.pos_to_line_col = (function opencode_unified$buffers$pos_to_line_col(content,pos){
if((pos === (0))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),(0)], null);
} else {
var before_pos = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),pos);
var line_count = cljs.core.count(cljs.core.filter.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, ["\n",null], null), null),before_pos));
var last_line_start = clojure.string.last_index_of.cljs$core$IFn$_invoke$arity$2(before_pos,"\n");
var col = (((last_line_start == null))?pos:(pos - (last_line_start + (1))));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [line_count,col], null);
}
});
/**
 * Convert line and column numbers (0-based) to buffer position
 */
opencode_unified.buffers.line_col_to_pos = (function opencode_unified$buffers$line_col_to_pos(content,line,col){
var lines = clojure.string.split_lines(content);
var line_count = cljs.core.count(lines);
var line_num = ((((typeof line === 'number') && ((line >= (0)))))?line:(0));
if((line_num >= line_count)){
return cljs.core.count(content);
} else {
var current_line = (0);
var pos = (0);
var remaining_lines = lines;
while(true){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(current_line,line_num)){
return (pos + (function (){var x__5090__auto__ = col;
var y__5091__auto__ = cljs.core.count(cljs.core.first(remaining_lines));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
} else {
var G__14766 = (current_line + (1));
var G__14767 = (pos + (cljs.core.count(cljs.core.first(remaining_lines)) + (1)));
var G__14768 = cljs.core.rest(remaining_lines);
current_line = G__14766;
pos = G__14767;
remaining_lines = G__14768;
continue;
}
break;
}
}
});
/**
 * Get content of specific line (0-based)
 */
opencode_unified.buffers.get_line_content = (function opencode_unified$buffers$get_line_content(content,line_num){
var lines = clojure.string.split_lines(content);
if((line_num < cljs.core.count(lines))){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(lines,line_num);
} else {
return null;
}
});
/**
 * Get total number of lines in content
 */
opencode_unified.buffers.get_line_count = (function opencode_unified$buffers$get_line_count(content){
return cljs.core.count(clojure.string.split_lines(content));
});
/**
 * Get start and end positions of a line (0-based)
 */
opencode_unified.buffers.get_line_range = (function opencode_unified$buffers$get_line_range(content,line_num){
var lines = clojure.string.split_lines(content);
var line_count = cljs.core.count(lines);
if((line_num < line_count)){
var start_pos = opencode_unified.buffers.line_col_to_pos(content,line_num,(0));
var line_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(lines,line_num);
var end_pos = (start_pos + cljs.core.count(line_content));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [start_pos,end_pos], null);
} else {
return null;
}
});
opencode_unified.buffers.move_cursor_left = (function opencode_unified$buffers$move_cursor_left(e){
var el = e.target;
var current_pos = el.selectionStart;
if((current_pos > (0))){
(el.selectionStart = (current_pos - (1)));

(el.selectionEnd = (current_pos - (1)));

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(current_pos - (1)));
}));
} else {
return null;
}
});
opencode_unified.buffers.move_cursor_right = (function opencode_unified$buffers$move_cursor_right(e){
var el = e.target;
var current_pos = el.selectionStart;
var max_pos = el.value.length;
if((current_pos < max_pos)){
(el.selectionStart = (current_pos + (1)));

(el.selectionEnd = (current_pos + (1)));

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(current_pos + (1)));
}));
} else {
return null;
}
});
opencode_unified.buffers.move_cursor_up = (function opencode_unified$buffers$move_cursor_up(e){
var el = e.target;
var content = el.value;
var current_pos = el.selectionStart;
var vec__14721 = opencode_unified.buffers.pos_to_line_col(content,current_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14721,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14721,(1),null);
if((line > (0))){
var new_pos = opencode_unified.buffers.line_col_to_pos(content,(line - (1)),col);
(el.selectionStart = new_pos);

(el.selectionEnd = new_pos);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new_pos);
}));
} else {
return null;
}
});
opencode_unified.buffers.move_cursor_down = (function opencode_unified$buffers$move_cursor_down(e){
var el = e.target;
var content = el.value;
var current_pos = el.selectionStart;
var vec__14724 = opencode_unified.buffers.pos_to_line_col(content,current_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14724,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14724,(1),null);
var line_count = opencode_unified.buffers.get_line_count(content);
if((line < (line_count - (1)))){
var new_pos = opencode_unified.buffers.line_col_to_pos(content,(line + (1)),col);
(el.selectionStart = new_pos);

(el.selectionEnd = new_pos);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new_pos);
}));
} else {
return null;
}
});
opencode_unified.buffers.move_to_line_start = (function opencode_unified$buffers$move_to_line_start(e){
var el = e.target;
var content = el.value;
var current_pos = el.selectionStart;
var vec__14727 = opencode_unified.buffers.pos_to_line_col(content,current_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14727,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14727,(1),null);
var new_pos = opencode_unified.buffers.line_col_to_pos(content,line,(0));
(el.selectionStart = new_pos);

(el.selectionEnd = new_pos);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new_pos);
}));
});
opencode_unified.buffers.move_to_line_end = (function opencode_unified$buffers$move_to_line_end(e){
var el = e.target;
var content = el.value;
var current_pos = el.selectionStart;
var vec__14730 = opencode_unified.buffers.pos_to_line_col(content,current_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14730,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14730,(1),null);
var line_content = opencode_unified.buffers.get_line_content(content,line);
var new_pos = opencode_unified.buffers.line_col_to_pos(content,line,cljs.core.count(line_content));
(el.selectionStart = new_pos);

(el.selectionEnd = new_pos);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new_pos);
}));
});
opencode_unified.buffers.delete_char = (function opencode_unified$buffers$delete_char(e){
var el = e.target;
var content = el.value;
var current_pos = el.selectionStart;
if((current_pos < cljs.core.count(content))){
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),current_pos),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,(current_pos + (1)))].join('');
(el.value = new_content);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),current_pos),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));
} else {
return null;
}
});
opencode_unified.buffers.delete_line = (function opencode_unified$buffers$delete_line(e){
var el = e.target;
var content = el.value;
var current_pos = el.selectionStart;
var vec__14733 = opencode_unified.buffers.pos_to_line_col(content,current_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14733,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14733,(1),null);
var line_range = opencode_unified.buffers.get_line_range(content,line);
var vec__14736 = line_range;
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14736,(0),null);
var end_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14736,(1),null);
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),start_pos),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,end_pos)].join('');
(el.value = new_content);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),start_pos),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));
});
opencode_unified.buffers.extend_selection_left = (function opencode_unified$buffers$extend_selection_left(e){
var el = e.target;
var current_end = el.selectionEnd;
if((current_end > (0))){
(el.selectionEnd = (current_end - (1)));

return opencode_unified.state.update_current_buffer_BANG_((function (b){
var start = el.selectionStart;
var end = el.selectionEnd;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),(function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),new cljs.core.Keyword(null,"end","end",-268185958),(function (){var x__5087__auto__ = start;
var y__5088__auto__ = end;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()], null));
}));
} else {
return null;
}
});
opencode_unified.buffers.extend_selection_right = (function opencode_unified$buffers$extend_selection_right(e){
var el = e.target;
var current_end = el.selectionEnd;
var max_pos = el.value.length;
if((current_end < max_pos)){
(el.selectionEnd = (current_end + (1)));

return opencode_unified.state.update_current_buffer_BANG_((function (b){
var start = el.selectionStart;
var end = el.selectionEnd;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),(function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),new cljs.core.Keyword(null,"end","end",-268185958),(function (){var x__5087__auto__ = start;
var y__5088__auto__ = end;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()], null));
}));
} else {
return null;
}
});
opencode_unified.buffers.extend_selection_up = (function opencode_unified$buffers$extend_selection_up(e){
var el = e.target;
var content = el.value;
var current_end = el.selectionEnd;
var vec__14739 = opencode_unified.buffers.pos_to_line_col(content,current_end);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14739,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14739,(1),null);
if((line > (0))){
var new_pos = opencode_unified.buffers.line_col_to_pos(content,(line - (1)),col);
(el.selectionEnd = new_pos);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
var start = el.selectionStart;
var end = el.selectionEnd;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),(function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),new cljs.core.Keyword(null,"end","end",-268185958),(function (){var x__5087__auto__ = start;
var y__5088__auto__ = end;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()], null));
}));
} else {
return null;
}
});
opencode_unified.buffers.extend_selection_down = (function opencode_unified$buffers$extend_selection_down(e){
var el = e.target;
var content = el.value;
var current_end = el.selectionEnd;
var vec__14742 = opencode_unified.buffers.pos_to_line_col(content,current_end);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14742,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14742,(1),null);
var line_count = opencode_unified.buffers.get_line_count(content);
if((line < (line_count - (1)))){
var new_pos = opencode_unified.buffers.line_col_to_pos(content,(line + (1)),col);
(el.selectionEnd = new_pos);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
var start = el.selectionStart;
var end = el.selectionEnd;
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),(function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),new cljs.core.Keyword(null,"end","end",-268185958),(function (){var x__5087__auto__ = start;
var y__5088__auto__ = end;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()], null));
}));
} else {
return null;
}
});
opencode_unified.buffers.yank_selection = (function opencode_unified$buffers$yank_selection(e){
var el = e.target;
var content = el.value;
var start = el.selectionStart;
var end = el.selectionEnd;
var selected_text = content.substring((function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(function (){var x__5087__auto__ = start;
var y__5088__auto__ = end;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
opencode_unified.state.set_evil_register_BANG_(selected_text);

return (opencode_unified.buffers.exit_visual_mode.cljs$core$IFn$_invoke$arity$0 ? opencode_unified.buffers.exit_visual_mode.cljs$core$IFn$_invoke$arity$0() : opencode_unified.buffers.exit_visual_mode.call(null));
});
opencode_unified.buffers.delete_selection = (function opencode_unified$buffers$delete_selection(e){
var el = e.target;
var content = el.value;
var start = el.selectionStart;
var end = el.selectionEnd;
var selected_text = content.substring((function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(function (){var x__5087__auto__ = start;
var y__5088__auto__ = end;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),(function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,(function (){var x__5087__auto__ = start;
var y__5088__auto__ = end;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})())].join('');
opencode_unified.state.set_evil_register_BANG_(selected_text);

(el.value = new_content);

(el.selectionStart = (function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());

(el.selectionEnd = (function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());

opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(function (){var x__5090__auto__ = start;
var y__5091__auto__ = end;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()),new cljs.core.Keyword(null,"selection","selection",975998651),null),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));

return (opencode_unified.buffers.enter_normal_mode.cljs$core$IFn$_invoke$arity$0 ? opencode_unified.buffers.enter_normal_mode.cljs$core$IFn$_invoke$arity$0() : opencode_unified.buffers.enter_normal_mode.call(null));
});
opencode_unified.buffers.enter_insert_mode = (function opencode_unified$buffers$enter_insert_mode(){
opencode_unified.state.set_evil_mode_BANG_(new cljs.core.Keyword(null,"insert","insert",1286475395));

return opencode_unified.buffers.update_statusbar();
});
opencode_unified.buffers.enter_normal_mode = (function opencode_unified$buffers$enter_normal_mode(){
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),null);
}));

opencode_unified.state.set_evil_mode_BANG_(new cljs.core.Keyword(null,"normal","normal",-1519123858));

return opencode_unified.buffers.update_statusbar();
});
opencode_unified.buffers.enter_visual_mode = (function opencode_unified$buffers$enter_visual_mode(){
var current_buffer = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(current_buffer)){
var cursor_pos_14769 = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(current_buffer);
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),cursor_pos_14769,new cljs.core.Keyword(null,"end","end",-268185958),cursor_pos_14769], null));
}));
} else {
}

opencode_unified.state.set_evil_mode_BANG_(new cljs.core.Keyword(null,"visual","visual",942787224));

return opencode_unified.buffers.update_statusbar();
});
opencode_unified.buffers.enter_visual_line_mode = (function opencode_unified$buffers$enter_visual_line_mode(){
var current_buffer = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(current_buffer)){
var content_14770 = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(current_buffer);
var cursor_pos_14771 = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(current_buffer);
var vec__14745_14772 = opencode_unified.buffers.pos_to_line_col(content_14770,cursor_pos_14771);
var line_14773 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14745_14772,(0),null);
var __14774 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14745_14772,(1),null);
var line_range_14775 = opencode_unified.buffers.get_line_range(content_14770,line_14773);
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),cljs.core.first(line_range_14775),new cljs.core.Keyword(null,"end","end",-268185958),cljs.core.second(line_range_14775)], null));
}));
} else {
}

opencode_unified.state.set_evil_mode_BANG_(new cljs.core.Keyword(null,"visual-line","visual-line",-1293084027));

return opencode_unified.buffers.update_statusbar();
});
opencode_unified.buffers.exit_visual_mode = (function opencode_unified$buffers$exit_visual_mode(){
opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"selection","selection",975998651),null);
}));

return opencode_unified.buffers.enter_normal_mode();
});
opencode_unified.buffers.command_palette = (function opencode_unified$buffers$command_palette(){
return opencode_unified.command_palette.open_BANG_();
});
opencode_unified.buffers.show_command_palette = (function opencode_unified$buffers$show_command_palette(){
return opencode_unified.command_palette.open_BANG_();
});
opencode_unified.buffers.other_window = (function opencode_unified$buffers$other_window(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Other window not implemented yet"], 0));
});
opencode_unified.buffers.split_window = (function opencode_unified$buffers$split_window(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Split window not implemented yet"], 0));
});
opencode_unified.buffers.vsplit_window = (function opencode_unified$buffers$vsplit_window(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Vertical split window not implemented yet"], 0));
});
opencode_unified.buffers.close_window = (function opencode_unified$buffers$close_window(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Close window not implemented yet"], 0));
});
opencode_unified.buffers.find_file = (function opencode_unified$buffers$find_file(){
var file_path = clojure.string.trim((function (){var or__5002__auto__ = prompt("Open file (workspace-relative path):","README.md");
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
if(clojure.string.blank_QMARK_(file_path)){
return opencode_unified.buffers.update_status_BANG_("Open file cancelled");
} else {
return opencode_unified.buffers.open_file(file_path);
}
});
opencode_unified.buffers.find_file_in_project = (function opencode_unified$buffers$find_file_in_project(){
return opencode_unified.buffers.find_file();
});
opencode_unified.buffers.switch_project = (function opencode_unified$buffers$switch_project(){
return opencode_unified.buffers.update_status_BANG_("Switch project is managed by the backend WORKSPACE_ROOT setting");
});
opencode_unified.buffers.eval_expression = (function opencode_unified$buffers$eval_expression(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Eval expression not implemented yet"], 0));
});
opencode_unified.buffers.toggle_terminal = (function opencode_unified$buffers$toggle_terminal(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Toggle terminal not implemented yet"], 0));
});
opencode_unified.buffers.toggle_fullscreen = (function opencode_unified$buffers$toggle_fullscreen(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Toggle fullscreen not implemented yet"], 0));
});
opencode_unified.buffers.open_settings = (function opencode_unified$buffers$open_settings(){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Open settings not implemented yet"], 0));
});
/**
 * Find buffer by file path
 */
opencode_unified.buffers.find_buffer_by_path = (function opencode_unified$buffers$find_buffer_by_path(path){
var buffers = new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
return cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__14748_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(p1__14748_SHARP_),path);
}),cljs.core.vals(buffers)));
});
/**
 * Find the next word boundary starting from pos
 */
opencode_unified.buffers.find_next_word_boundary = (function opencode_unified$buffers$find_next_word_boundary(content,pos){
var word_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
var content_len = cljs.core.count(content);
var current_pos = pos;
var phase = new cljs.core.Keyword(null,"consume-word","consume-word",739941881);
while(true){
if((current_pos >= content_len)){
return content_len;
} else {
var char$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(content,current_pos);
var is_word_QMARK_ = clojure.string.includes_QMARK_(word_chars,char$);
var G__14749 = phase;
var G__14749__$1 = (((G__14749 instanceof cljs.core.Keyword))?G__14749.fqn:null);
switch (G__14749__$1) {
case "consume-word":
if(is_word_QMARK_){
var G__14777 = (current_pos + (1));
var G__14778 = new cljs.core.Keyword(null,"consume-word","consume-word",739941881);
current_pos = G__14777;
phase = G__14778;
continue;
} else {
var G__14779 = current_pos;
var G__14780 = new cljs.core.Keyword(null,"consume-space","consume-space",305859957);
current_pos = G__14779;
phase = G__14780;
continue;
}

break;
case "consume-space":
if((!(is_word_QMARK_))){
var G__14781 = (current_pos + (1));
var G__14782 = new cljs.core.Keyword(null,"consume-space","consume-space",305859957);
current_pos = G__14781;
phase = G__14782;
continue;
} else {
return current_pos;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__14749__$1)].join('')));

}
}
break;
}
});
/**
 * Find the previous word boundary starting from pos
 */
opencode_unified.buffers.find_prev_word_boundary = (function opencode_unified$buffers$find_prev_word_boundary(content,pos){
var word_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
var current_pos = (pos - (1));
var phase = new cljs.core.Keyword(null,"skip-space","skip-space",-64387488);
while(true){
if((current_pos < (0))){
return (0);
} else {
var char$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(content,current_pos);
var is_word_QMARK_ = clojure.string.includes_QMARK_(word_chars,char$);
var G__14751 = phase;
var G__14751__$1 = (((G__14751 instanceof cljs.core.Keyword))?G__14751.fqn:null);
switch (G__14751__$1) {
case "skip-space":
if((!(is_word_QMARK_))){
var G__14784 = (current_pos - (1));
var G__14785 = new cljs.core.Keyword(null,"skip-space","skip-space",-64387488);
current_pos = G__14784;
phase = G__14785;
continue;
} else {
var G__14786 = current_pos;
var G__14787 = new cljs.core.Keyword(null,"consume-word","consume-word",739941881);
current_pos = G__14786;
phase = G__14787;
continue;
}

break;
case "consume-word":
if(is_word_QMARK_){
var G__14788 = (current_pos - (1));
var G__14789 = new cljs.core.Keyword(null,"consume-word","consume-word",739941881);
current_pos = G__14788;
phase = G__14789;
continue;
} else {
return (current_pos + (1));
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__14751__$1)].join('')));

}
}
break;
}
});
opencode_unified.buffers.handle_normal_mode_key = (function opencode_unified$buffers$handle_normal_mode_key(e,key){
var G__14752 = key;
switch (G__14752) {
case "i":
e.preventDefault();

return opencode_unified.buffers.enter_insert_mode();

break;
case "v":
e.preventDefault();

return opencode_unified.buffers.enter_visual_mode();

break;
case "V":
e.preventDefault();

return opencode_unified.buffers.enter_visual_line_mode();

break;
case "h":
e.preventDefault();

return opencode_unified.buffers.move_cursor_left(e);

break;
case "j":
e.preventDefault();

return opencode_unified.buffers.move_cursor_down(e);

break;
case "k":
e.preventDefault();

return opencode_unified.buffers.move_cursor_up(e);

break;
case "l":
e.preventDefault();

return opencode_unified.buffers.move_cursor_right(e);

break;
case "0":
e.preventDefault();

return opencode_unified.buffers.move_to_line_start(e);

break;
case "$":
e.preventDefault();

return opencode_unified.buffers.move_to_line_end(e);

break;
case "x":
e.preventDefault();

return opencode_unified.buffers.delete_char(e);

break;
case "dd":
e.preventDefault();

return opencode_unified.buffers.delete_line(e);

break;
default:
return null;

}
});
opencode_unified.buffers.handle_visual_mode_key = (function opencode_unified$buffers$handle_visual_mode_key(e,key){
var G__14753 = key;
switch (G__14753) {
case "Escape":
e.preventDefault();

return opencode_unified.buffers.exit_visual_mode();

break;
case "h":
e.preventDefault();

return opencode_unified.buffers.extend_selection_left(e);

break;
case "j":
e.preventDefault();

return opencode_unified.buffers.extend_selection_down(e);

break;
case "k":
e.preventDefault();

return opencode_unified.buffers.extend_selection_up(e);

break;
case "l":
e.preventDefault();

return opencode_unified.buffers.extend_selection_right(e);

break;
case "y":
e.preventDefault();

return opencode_unified.buffers.yank_selection(e);

break;
case "d":
e.preventDefault();

return opencode_unified.buffers.delete_selection(e);

break;
default:
return null;

}
});
opencode_unified.buffers.editor = (function opencode_unified$buffers$editor(buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(buffer);
var evil_mode = opencode_unified.state.get_evil_mode();
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"textarea.editor-content","textarea.editor-content",1817386282),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"value","value",305978217),content,new cljs.core.Keyword(null,"read-only","read-only",-191706886),false,new cljs.core.Keyword(null,"ref","ref",1289896967),(function (el){
if(cljs.core.truth_(el)){
if(cljs.core.truth_(selection)){
(el.selectionStart = (function (){var x__5090__auto__ = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(selection);
var y__5091__auto__ = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(selection);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());

return (el.selectionEnd = (function (){var x__5087__auto__ = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(selection);
var y__5088__auto__ = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(selection);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
} else {
var pos = (function (){var x__5090__auto__ = cljs.core.count(content);
var y__5091__auto__ = (function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (function (){var or__5002__auto__ = cursor_pos;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
(el.selectionStart = pos);

return (el.selectionEnd = pos);
}
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-before-input","on-before-input",-1582133469),(function (e){
if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(evil_mode,new cljs.core.Keyword(null,"insert","insert",1286475395))){
return e.preventDefault();
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (e){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(evil_mode,new cljs.core.Keyword(null,"insert","insert",1286475395))){
var new_value = e.target.value;
var new_cursor_pos = e.target.selectionStart;
return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"content","content",15833224),new_value),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new_cursor_pos),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));
} else {
return null;
}
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (e){
var key = e.key;
var ctrl_key = e.ctrlKey;
var alt_key = e.altKey;
var meta_key = e.metaKey;
if(cljs.core.truth_((function (){var or__5002__auto__ = ctrl_key;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = alt_key;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return meta_key;
}
}
})())){
return null;
} else {
var G__14754 = evil_mode;
var G__14754__$1 = (((G__14754 instanceof cljs.core.Keyword))?G__14754.fqn:null);
switch (G__14754__$1) {
case "normal":
e.preventDefault();

return opencode_unified.buffers.handle_normal_mode_key(e,key);

break;
case "insert":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"Escape")){
e.preventDefault();

return opencode_unified.buffers.enter_normal_mode();
} else {
return null;
}

break;
case "visual":
e.preventDefault();

return opencode_unified.buffers.handle_visual_mode_key(e,key);

break;
default:
return null;

}
}
}),new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"line-height","line-height",1870784992),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"white-space","white-space",-707351930),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"overflow","overflow",2058931880),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"background","background",-863952629),new cljs.core.Keyword(null,"resize","resize",297367086),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"caret-color","caret-color",997187317),new cljs.core.Keyword(null,"outline","outline",793464534),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"font-family","font-family",-667419874),new cljs.core.Keyword(null,"height","height",1025178622)],["1.5","var(--text-primary)","pre","14px","auto","100%","transparent","none","1rem",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(evil_mode,new cljs.core.Keyword(null,"insert","insert",1286475395)))?"var(--accent)":"var(--text-primary)"),"none","none","monospace","100%"])], null)], null);
});

//# sourceMappingURL=opencode_unified.buffers.js.map
