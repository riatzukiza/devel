goog.provide('opencode_unified.ui');
opencode_unified.ui.KEY_ROUTE = "workbench.route";
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.ui !== 'undefined') && (typeof opencode_unified.ui.current_route !== 'undefined')){
} else {
opencode_unified.ui.current_route = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(opencode_unified.persistence.load_state(opencode_unified.ui.KEY_ROUTE,"#/"));
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.ui !== 'undefined') && (typeof opencode_unified.ui.route_listener_installed_QMARK_ !== 'undefined')){
} else {
opencode_unified.ui.route_listener_installed_QMARK_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(false);
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.ui !== 'undefined') && (typeof opencode_unified.ui.ui_root !== 'undefined')){
} else {
opencode_unified.ui.ui_root = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.ui !== 'undefined') && (typeof opencode_unified.ui.chat_draft !== 'undefined')){
} else {
opencode_unified.ui.chat_draft = reagent.core.atom.cljs$core$IFn$_invoke$arity$1("");
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.ui !== 'undefined') && (typeof opencode_unified.ui.chat_session_draft !== 'undefined')){
} else {
opencode_unified.ui.chat_session_draft = reagent.core.atom.cljs$core$IFn$_invoke$arity$1("");
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.ui !== 'undefined') && (typeof opencode_unified.ui.prompt_response_drafts !== 'undefined')){
} else {
opencode_unified.ui.prompt_response_drafts = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.ui !== 'undefined') && (typeof opencode_unified.ui.chat_scroll_node !== 'undefined')){
} else {
opencode_unified.ui.chat_scroll_node = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
opencode_unified.ui.scroll_chat_to_bottom_BANG_ = (function opencode_unified$ui$scroll_chat_to_bottom_BANG_(){
var temp__5804__auto__ = cljs.core.deref(opencode_unified.ui.chat_scroll_node);
if(cljs.core.truth_(temp__5804__auto__)){
var node = temp__5804__auto__;
return (node.scrollTop = node.scrollHeight);
} else {
return null;
}
});
opencode_unified.ui.send_chat_draft_BANG_ = (function opencode_unified$ui$send_chat_draft_BANG_(){
var message = clojure.string.trim(cljs.core.deref(opencode_unified.ui.chat_draft));
if(clojure.string.blank_QMARK_(message)){
return null;
} else {
cljs.core.reset_BANG_(opencode_unified.ui.chat_draft,"");

return opencode_unified.opencode.send_session_message(message);
}
});
opencode_unified.ui.chat_stream_panel = (function opencode_unified$ui$chat_stream_panel(){
var op_state = reagent.core.track(opencode_unified.opencode.get_opencode_state);
reagent.core.after_render((function (){
return opencode_unified.ui.scroll_chat_to_bottom_BANG_();
}));

return (function (){
var map__15056 = cljs.core.deref(op_state);
var map__15056__$1 = cljs.core.__destructure_map(map__15056);
var chat_stream = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15056__$1,new cljs.core.Keyword(null,"chat-stream","chat-stream",-419494010));
var chat_pending_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15056__$1,new cljs.core.Keyword(null,"chat-pending?","chat-pending?",-8175716));
var connected_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15056__$1,new cljs.core.Keyword(null,"connected?","connected?",-1197551387));
var session_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15056__$1,new cljs.core.Keyword(null,"session-id","session-id",-1147060351));
var last_error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15056__$1,new cljs.core.Keyword(null,"last-error","last-error",1848699973));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-stream-panel",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"min-height","min-height",398480837),"140px",new cljs.core.Keyword(null,"max-height","max-height",-612563804),"240px",new cljs.core.Keyword(null,"border-top","border-top",-158897573),"1px solid var(--border)",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.45rem 0.7rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),["Chat Stream",(cljs.core.truth_(session_id)?[" \u2022 session ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(session_id)].join(''):null)].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),(cljs.core.truth_(connected_QMARK_)?"var(--success)":"var(--warning)")], null)], null),(cljs.core.truth_(connected_QMARK_)?"connected":"disconnected")], null)], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-stream",new cljs.core.Keyword(null,"ref","ref",1289896967),(function (p1__15055_SHARP_){
if(cljs.core.truth_(p1__15055_SHARP_)){
return cljs.core.reset_BANG_(opencode_unified.ui.chat_scroll_node,p1__15055_SHARP_);
} else {
return null;
}
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.6rem 0.7rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.45rem"], null)], null),((cljs.core.seq(chat_stream))?(function (){var iter__5480__auto__ = (function opencode_unified$ui$chat_stream_panel_$_iter__15057(s__15058){
return (new cljs.core.LazySeq(null,(function (){
var s__15058__$1 = s__15058;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15058__$1);
if(temp__5804__auto__){
var s__15058__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15058__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15058__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15060 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15059 = (0);
while(true){
if((i__15059 < size__5479__auto__)){
var map__15061 = cljs.core._nth(c__5478__auto__,i__15059);
var map__15061__$1 = cljs.core.__destructure_map(map__15061);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15061__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var role = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15061__$1,new cljs.core.Keyword(null,"role","role",-736691072));
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15061__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
cljs.core.chunk_append(b__15060,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"align-self","align-self",1475936794),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(role,new cljs.core.Keyword(null,"user","user",1532431356)))?"flex-end":"flex-start"),new cljs.core.Keyword(null,"max-width","max-width",-1939924051),"86%",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(role,new cljs.core.Keyword(null,"user","user",1532431356)))?"var(--bg-tertiary)":"var(--bg-primary)"),new cljs.core.Keyword(null,"padding","padding",1660304693),"0.45rem 0.55rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"uppercase",new cljs.core.Keyword(null,"letter-spacing","letter-spacing",-948993767),"0.03em",new cljs.core.Keyword(null,"margin-bottom","margin-bottom",388334941),"0.2rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),cljs.core.name(role)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"line-height","line-height",1870784992),"1.35",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"word-break","word-break",-407281356),"break-word",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),text], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null)));

var G__15101 = (i__15059 + (1));
i__15059 = G__15101;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15060),opencode_unified$ui$chat_stream_panel_$_iter__15057(cljs.core.chunk_rest(s__15058__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15060),null);
}
} else {
var map__15062 = cljs.core.first(s__15058__$2);
var map__15062__$1 = cljs.core.__destructure_map(map__15062);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15062__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var role = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15062__$1,new cljs.core.Keyword(null,"role","role",-736691072));
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15062__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"align-self","align-self",1475936794),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(role,new cljs.core.Keyword(null,"user","user",1532431356)))?"flex-end":"flex-start"),new cljs.core.Keyword(null,"max-width","max-width",-1939924051),"86%",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(role,new cljs.core.Keyword(null,"user","user",1532431356)))?"var(--bg-tertiary)":"var(--bg-primary)"),new cljs.core.Keyword(null,"padding","padding",1660304693),"0.45rem 0.55rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"uppercase",new cljs.core.Keyword(null,"letter-spacing","letter-spacing",-948993767),"0.03em",new cljs.core.Keyword(null,"margin-bottom","margin-bottom",388334941),"0.2rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),cljs.core.name(role)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"line-height","line-height",1870784992),"1.35",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"word-break","word-break",-407281356),"break-word",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),text], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null)),opencode_unified$ui$chat_stream_panel_$_iter__15057(cljs.core.rest(s__15058__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(chat_stream);
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"No messages yet. The first message creates a session."], null)),(cljs.core.truth_(chat_pending_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),"Sending message..."], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = last_error;
if(cljs.core.truth_(and__5000__auto__)){
return (!(clojure.string.blank_QMARK_(last_error)));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--error)"], null)], null),last_error], null):null)], null)], null);
});
});
opencode_unified.ui.chat_input_panel = (function opencode_unified$ui$chat_input_panel(){
var op_state = reagent.core.track(opencode_unified.opencode.get_opencode_state);
var inspector_state = reagent.core.track(opencode_unified.state.get_inspector_state);
return (function (){
var map__15066 = cljs.core.deref(op_state);
var map__15066__$1 = cljs.core.__destructure_map(map__15066);
var chat_pending_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15066__$1,new cljs.core.Keyword(null,"chat-pending?","chat-pending?",-8175716));
var session_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15066__$1,new cljs.core.Keyword(null,"session-id","session-id",-1147060351));
var selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(inspector_state));
var selected_session = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"session","session",1008279103).cljs$core$IFn$_invoke$arity$1(selection);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"session-id","session-id",-1147060351).cljs$core$IFn$_invoke$arity$1(selection);
}
})();
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-input-panel",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.55rem 0.7rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)"], null)], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"grid",new cljs.core.Keyword(null,"grid-template-columns","grid-template-columns",-594112133),"1fr auto auto",new cljs.core.Keyword(null,"gap","gap",80255254),"0.45rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input","input",556931961),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-session-input",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(opencode_unified.ui.chat_session_draft),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),(function (){var or__5002__auto__ = session_id;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Session ID";
}
})(),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__15063_SHARP_){
return cljs.core.reset_BANG_(opencode_unified.ui.chat_session_draft,p1__15063_SHARP_.target.value);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (event){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",event.key)){
event.preventDefault();

return opencode_unified.opencode.use_session_BANG_(((clojure.string.blank_QMARK_(clojure.string.trim(cljs.core.deref(opencode_unified.ui.chat_session_draft))))?session_id:cljs.core.deref(opencode_unified.ui.chat_session_draft))).then((function (result){
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.reset_BANG_(opencode_unified.ui.chat_session_draft,"");
} else {
return null;
}
}));
} else {
return null;
}
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),chat_pending_QMARK_,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-use-session",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.opencode.use_session_BANG_(((clojure.string.blank_QMARK_(clojure.string.trim(cljs.core.deref(opencode_unified.ui.chat_session_draft))))?session_id:cljs.core.deref(opencode_unified.ui.chat_session_draft))).then((function (result){
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.reset_BANG_(opencode_unified.ui.chat_session_draft,"");
} else {
return null;
}
}));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = chat_pending_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.blank_QMARK_(clojure.string.trim((function (){var or__5002__auto____$1 = cljs.core.deref(opencode_unified.ui.chat_session_draft);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return session_id;
}
})()));
}
})(),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.5rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Use session"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-use-selected-session",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(cljs.core.truth_(selected_session)){
return opencode_unified.opencode.use_session_BANG_(selected_session).then((function (result){
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.reset_BANG_(opencode_unified.ui.chat_session_draft,"");
} else {
return null;
}
}));
} else {
return null;
}
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = chat_pending_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.blank_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto____$1 = selected_session;
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
})()));
}
})(),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.5rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Use selected"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),"Chat Input"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"textarea","textarea",-650375824),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-input",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(opencode_unified.ui.chat_draft),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Send a message to the current OpenCode session...",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__15064_SHARP_){
return cljs.core.reset_BANG_(opencode_unified.ui.chat_draft,p1__15064_SHARP_.target.value);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (event){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",event.key)) && (cljs.core.not(event.shiftKey)))){
event.preventDefault();

return opencode_unified.ui.send_chat_draft_BANG_();
} else {
return null;
}
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),chat_pending_QMARK_,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"line-height","line-height",1870784992),new cljs.core.Keyword(null,"max-height","max-height",-612563804),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"min-height","min-height",398480837),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"background","background",-863952629),new cljs.core.Keyword(null,"resize","resize",297367086),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"border-radius","border-radius",419594011),new cljs.core.Keyword(null,"font-family","font-family",-667419874)],["1.35","120px","var(--text-primary)","58px","0.84rem","var(--bg-secondary)","vertical","0.55rem","1px solid var(--border)","6px","monospace"])], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-clear",new cljs.core.Keyword(null,"on-click","on-click",1632826543),opencode_unified.opencode.clear_chat_stream_BANG_,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),chat_pending_QMARK_,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.55rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"transparent",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Clear stream"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-chat-send",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.ui.send_chat_draft_BANG_();
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = chat_pending_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.blank_QMARK_(clojure.string.trim(cljs.core.deref(opencode_unified.ui.chat_draft)));
}
})(),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.65rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--accent)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--accent)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),(cljs.core.truth_(chat_pending_QMARK_)?"Sending...":"Send")], null)], null)], null);
});
});
opencode_unified.ui.prompts_panel = (function opencode_unified$ui$prompts_panel(){
var op_state = reagent.core.track(opencode_unified.opencode.get_opencode_state);
return (function (){
var map__15071 = cljs.core.deref(op_state);
var map__15071__$1 = cljs.core.__destructure_map(map__15071);
var pending_permissions = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15071__$1,new cljs.core.Keyword(null,"pending-permissions","pending-permissions",509587832));
var pending_prompts = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15071__$1,new cljs.core.Keyword(null,"pending-prompts","pending-prompts",15884422));
var permissions = cljs.core.vals((function (){var or__5002__auto__ = pending_permissions;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
})());
var prompts = (function (){var or__5002__auto__ = pending_prompts;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})();
if(((cljs.core.seq(permissions)) || (cljs.core.seq(prompts)))){
return cljs.core.into.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-prompts-panel",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.6rem 0.7rem",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),"Pending input requests"], null)], null),cljs.core.concat.cljs$core$IFn$_invoke$arity$2((function (){var iter__5480__auto__ = (function opencode_unified$ui$prompts_panel_$_iter__15073(s__15074){
return (new cljs.core.LazySeq(null,(function (){
var s__15074__$1 = s__15074;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15074__$1);
if(temp__5804__auto__){
var s__15074__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15074__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15074__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15076 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15075 = (0);
while(true){
if((i__15075 < size__5479__auto__)){
var map__15078 = cljs.core._nth(c__5478__auto__,i__15075);
var map__15078__$1 = cljs.core.__destructure_map(map__15078);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15078__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15078__$1,new cljs.core.Keyword(null,"title","title",636505583));
var sessionID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15078__$1,new cljs.core.Keyword(null,"sessionID","sessionID",244679263));
var metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15078__$1,new cljs.core.Keyword(null,"metadata","metadata",1799301597));
cljs.core.chunk_append(b__15076,cljs.core.with_meta(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-permission-prompt",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),(function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Permission request";
}
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),["session ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sessionID)].join('')], null),((cljs.core.seq(metadata))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"margin","margin",-995903681),"0",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px"], null)], null),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([metadata], 0))], null):null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem",new cljs.core.Keyword(null,"flex-wrap","flex-wrap",455413707),"wrap"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15075,map__15078,map__15078__$1,id,title,sessionID,metadata,c__5478__auto__,size__5479__auto__,b__15076,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
return opencode_unified.opencode.respond_to_permission_BANG_(id,new cljs.core.Keyword(null,"once","once",-262568523));
});})(i__15075,map__15078,map__15078__$1,id,title,sessionID,metadata,c__5478__auto__,size__5479__auto__,b__15076,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Allow Once"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15075,map__15078,map__15078__$1,id,title,sessionID,metadata,c__5478__auto__,size__5479__auto__,b__15076,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
return opencode_unified.opencode.respond_to_permission_BANG_(id,new cljs.core.Keyword(null,"always","always",-1772028770));
});})(i__15075,map__15078,map__15078__$1,id,title,sessionID,metadata,c__5478__auto__,size__5479__auto__,b__15076,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--success)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--success)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Always Allow"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15075,map__15078,map__15078__$1,id,title,sessionID,metadata,c__5478__auto__,size__5479__auto__,b__15076,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
return opencode_unified.opencode.respond_to_permission_BANG_(id,new cljs.core.Keyword(null,"reject","reject",1415953113));
});})(i__15075,map__15078,map__15078__$1,id,title,sessionID,metadata,c__5478__auto__,size__5479__auto__,b__15076,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--error)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--error)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Reject"], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["permission-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null)));

var G__15103 = (i__15075 + (1));
i__15075 = G__15103;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15076),opencode_unified$ui$prompts_panel_$_iter__15073(cljs.core.chunk_rest(s__15074__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15076),null);
}
} else {
var map__15080 = cljs.core.first(s__15074__$2);
var map__15080__$1 = cljs.core.__destructure_map(map__15080);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15080__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15080__$1,new cljs.core.Keyword(null,"title","title",636505583));
var sessionID = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15080__$1,new cljs.core.Keyword(null,"sessionID","sessionID",244679263));
var metadata = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15080__$1,new cljs.core.Keyword(null,"metadata","metadata",1799301597));
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-permission-prompt",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),(function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Permission request";
}
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),["session ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(sessionID)].join('')], null),((cljs.core.seq(metadata))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"margin","margin",-995903681),"0",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px"], null)], null),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([metadata], 0))], null):null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem",new cljs.core.Keyword(null,"flex-wrap","flex-wrap",455413707),"wrap"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (map__15080,map__15080__$1,id,title,sessionID,metadata,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
return opencode_unified.opencode.respond_to_permission_BANG_(id,new cljs.core.Keyword(null,"once","once",-262568523));
});})(map__15080,map__15080__$1,id,title,sessionID,metadata,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Allow Once"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (map__15080,map__15080__$1,id,title,sessionID,metadata,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
return opencode_unified.opencode.respond_to_permission_BANG_(id,new cljs.core.Keyword(null,"always","always",-1772028770));
});})(map__15080,map__15080__$1,id,title,sessionID,metadata,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--success)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--success)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Always Allow"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (map__15080,map__15080__$1,id,title,sessionID,metadata,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
return opencode_unified.opencode.respond_to_permission_BANG_(id,new cljs.core.Keyword(null,"reject","reject",1415953113));
});})(map__15080,map__15080__$1,id,title,sessionID,metadata,s__15074__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--error)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--error)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Reject"], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["permission-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null)),opencode_unified$ui$prompts_panel_$_iter__15073(cljs.core.rest(s__15074__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(permissions);
})(),(function (){var iter__5480__auto__ = (function opencode_unified$ui$prompts_panel_$_iter__15081(s__15082){
return (new cljs.core.LazySeq(null,(function (){
var s__15082__$1 = s__15082;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15082__$1);
if(temp__5804__auto__){
var s__15082__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15082__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15082__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15084 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15083 = (0);
while(true){
if((i__15083 < size__5479__auto__)){
var map__15085 = cljs.core._nth(c__5478__auto__,i__15083);
var map__15085__$1 = cljs.core.__destructure_map(map__15085);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15085__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15085__$1,new cljs.core.Keyword(null,"title","title",636505583));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15085__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
cljs.core.chunk_append(b__15084,cljs.core.with_meta(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-control-prompt",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),(function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Input requested";
}
})()], null),((((cljs.core.map_QMARK_(body)) && (cljs.core.seq(body))))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"margin","margin",-995903681),"0",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px"], null)], null),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([body], 0))], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input","input",556931961),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Type response...",new cljs.core.Keyword(null,"on-change","on-change",-732046149),((function (i__15083,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (p1__15069_SHARP_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.ui.prompt_response_drafts,cljs.core.assoc,id,p1__15069_SHARP_.target.value);
});})(i__15083,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),((function (i__15083,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (event){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",event.key)){
event.preventDefault();

var response = clojure.string.trim(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""));
if(clojure.string.blank_QMARK_(response)){
return null;
} else {
return opencode_unified.opencode.respond_to_control_prompt_BANG_(id,response).then(((function (i__15083,response,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (result){
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(opencode_unified.ui.prompt_response_drafts,cljs.core.dissoc,id);
} else {
return null;
}
});})(i__15083,response,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
);
}
} else {
return null;
}
});})(i__15083,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.3rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15083,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
var response = clojure.string.trim(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""));
if(clojure.string.blank_QMARK_(response)){
return null;
} else {
return opencode_unified.opencode.respond_to_control_prompt_BANG_(id,response).then(((function (i__15083,response,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (result){
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(opencode_unified.ui.prompt_response_drafts,cljs.core.dissoc,id);
} else {
return null;
}
});})(i__15083,response,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
);
}
});})(i__15083,map__15085,map__15085__$1,id,title,body,c__5478__auto__,size__5479__auto__,b__15084,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),clojure.string.blank_QMARK_(clojure.string.trim(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""))),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--accent)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--accent)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Submit"], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["prompt-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null)));

var G__15104 = (i__15083 + (1));
i__15083 = G__15104;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15084),opencode_unified$ui$prompts_panel_$_iter__15081(cljs.core.chunk_rest(s__15082__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15084),null);
}
} else {
var map__15089 = cljs.core.first(s__15082__$2);
var map__15089__$1 = cljs.core.__destructure_map(map__15089);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15089__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15089__$1,new cljs.core.Keyword(null,"title","title",636505583));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15089__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"opencode-control-prompt",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),(function (){var or__5002__auto__ = title;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Input requested";
}
})()], null),((((cljs.core.map_QMARK_(body)) && (cljs.core.seq(body))))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"margin","margin",-995903681),"0",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px"], null)], null),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([body], 0))], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input","input",556931961),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Type response...",new cljs.core.Keyword(null,"on-change","on-change",-732046149),((function (map__15089,map__15089__$1,id,title,body,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (p1__15069_SHARP_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.ui.prompt_response_drafts,cljs.core.assoc,id,p1__15069_SHARP_.target.value);
});})(map__15089,map__15089__$1,id,title,body,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),((function (map__15089,map__15089__$1,id,title,body,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (event){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2("Enter",event.key)){
event.preventDefault();

var response = clojure.string.trim(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""));
if(clojure.string.blank_QMARK_(response)){
return null;
} else {
return opencode_unified.opencode.respond_to_control_prompt_BANG_(id,response).then((function (result){
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(opencode_unified.ui.prompt_response_drafts,cljs.core.dissoc,id);
} else {
return null;
}
}));
}
} else {
return null;
}
});})(map__15089,map__15089__$1,id,title,body,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.3rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (map__15089,map__15089__$1,id,title,body,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state){
return (function (){
var response = clojure.string.trim(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""));
if(clojure.string.blank_QMARK_(response)){
return null;
} else {
return opencode_unified.opencode.respond_to_control_prompt_BANG_(id,response).then((function (result){
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(opencode_unified.ui.prompt_response_drafts,cljs.core.dissoc,id);
} else {
return null;
}
}));
}
});})(map__15089,map__15089__$1,id,title,body,s__15082__$2,temp__5804__auto__,map__15071,map__15071__$1,pending_permissions,pending_prompts,permissions,prompts,op_state))
,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),clojure.string.blank_QMARK_(clojure.string.trim(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(opencode_unified.ui.prompt_response_drafts),id,""))),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--accent)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--accent)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Submit"], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),["prompt-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join('')], null)),opencode_unified$ui$prompts_panel_$_iter__15081(cljs.core.rest(s__15082__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(prompts);
})()));
} else {
return null;
}
});
});
/**
 * Sync browser hash into reagent route state.
 */
opencode_unified.ui.sync_route_BANG_ = (function opencode_unified$ui$sync_route_BANG_(){
var hash_value = location.hash;
var route = ((clojure.string.blank_QMARK_(hash_value))?"#/":hash_value);
cljs.core.reset_BANG_(opencode_unified.ui.current_route,route);

return opencode_unified.persistence.save_state_BANG_(opencode_unified.ui.KEY_ROUTE,route);
});
/**
 * Feature flag gate for the React host donor seam route.
 */
opencode_unified.ui.seam_enabled_QMARK_ = (function opencode_unified$ui$seam_enabled_QMARK_(){
var flags = (function (){var G__15099 = window;
if((G__15099 == null)){
return null;
} else {
return (G__15099["__OPENCODE_FEATURE_FLAGS__"]);
}
})();
return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(false,(function (){var G__15100 = flags;
if((G__15100 == null)){
return null;
} else {
return (G__15100["reactReagentSeam"]);
}
})());
});
opencode_unified.ui.donor_fallback_route = (function opencode_unified$ui$donor_fallback_route(){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"donor-fallback-route",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"donor-fallback-banner",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem 1rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)"], null)], null),"React seam disabled by feature flag. Donor fallback route is active."], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.no-buffer","div.no-buffer",-1499360185),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden"], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.search_content], null)], null)], null);
});
opencode_unified.ui.app = (function opencode_unified$ui$app(){
var buffer_content = reagent.core.track((function (){
var temp__5804__auto__ = new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
if(cljs.core.truth_(temp__5804__auto__)){
var buffer_id = temp__5804__auto__;
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffers","buffers",471409492),buffer_id], null));
} else {
return null;
}
}));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.theme.global_styles], null),((((opencode_unified.react_reagent_seam.spike_route_QMARK_(cljs.core.deref(opencode_unified.ui.current_route))) && (opencode_unified.ui.seam_enabled_QMARK_())))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.react_reagent_seam.react_host_route], null):((opencode_unified.react_reagent_seam.spike_route_QMARK_(cljs.core.deref(opencode_unified.ui.current_route)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.shell,cljs.core.deref(opencode_unified.ui.current_route),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.ui.donor_fallback_route], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.shell,cljs.core.deref(opencode_unified.ui.current_route),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.ui.current_route),opencode_unified.layout.ROUTE_DOCS))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.docs_route], null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.ui.current_route),opencode_unified.layout.ROUTE_SETTINGS))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.settings_route], null):new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.editor-area","div.editor-area",696030270),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden"], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.tab_bar], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.editor-pane","div.editor-pane",1279213391),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"position","position",-2011731912),"relative"], null)], null),(cljs.core.truth_(cljs.core.deref(buffer_content))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.buffers.editor,cljs.core.deref(buffer_content)], null):new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.no-buffer","div.no-buffer",-1499360185),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"center",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"3rem",new cljs.core.Keyword(null,"margin-bottom","margin-bottom",388334941),"1rem",new cljs.core.Keyword(null,"opacity","opacity",397153780),0.2], null)], null),"\u2318"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"1.1rem"], null)], null),"OpenCode Unified Workbench"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.85rem",new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"opacity","opacity",397153780),0.6], null)], null),"Select a session or file to begin work."], null)], null))], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.ui.chat_stream_panel], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.ui.prompts_panel], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.ui.chat_input_panel], null),(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"minimap","minimap",-1428643929)], null)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.minimap,cljs.core.deref(buffer_content)], null):null)], null)
))], null)))], null);
});
opencode_unified.ui.init = (function opencode_unified$ui$init(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Initializing UI..."], 0));

if(clojure.string.blank_QMARK_(location.hash)){
(location.hash = cljs.core.deref(opencode_unified.ui.current_route));
} else {
}

opencode_unified.ui.sync_route_BANG_();

if(cljs.core.truth_(cljs.core.deref(opencode_unified.ui.route_listener_installed_QMARK_))){
} else {
window.addEventListener("hashchange",opencode_unified.ui.sync_route_BANG_);

cljs.core.reset_BANG_(opencode_unified.ui.route_listener_installed_QMARK_,true);
}

var handle_keydown_15105 = (function (event){
var key = clojure.string.lower_case(event.key);
var mod_QMARK_ = (function (){var or__5002__auto__ = event.ctrlKey;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return event.metaKey;
}
})();
if(cljs.core.truth_((function (){var and__5000__auto__ = mod_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"p")) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"k")));
} else {
return and__5000__auto__;
}
})())){
event.preventDefault();

event.stopPropagation();

event.stopImmediatePropagation();

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"p")){
return opencode_unified.command_palette.handle_open_key_BANG_();
} else {
return opencode_unified.state.open_search_surface_BANG_();
}
} else {
return null;
}
});
window.addEventListener("keydown",handle_keydown_15105,true);

opencode_unified.state.bootstrap_openplanner_BANG_();

opencode_unified.command_palette.register_commands_BANG_(opencode_unified.layout.layout_commands());

var temp__5804__auto___15106 = document.getElementById("app");
if(cljs.core.truth_(temp__5804__auto___15106)){
var app_element_15107 = temp__5804__auto___15106;
var root_15108 = reagent.dom.client.create_root(app_element_15107);
reagent.dom.client.render.cljs$core$IFn$_invoke$arity$2(root_15108,reagent.core.as_element.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.ui.app], null)));

cljs.core.reset_BANG_(opencode_unified.ui.ui_root,root_15108);
} else {
}

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["UI initialized with unified shell"], 0));
});
opencode_unified.ui.reload = (function opencode_unified$ui$reload(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Hot reloading UI..."], 0));

var temp__5804__auto__ = cljs.core.deref(opencode_unified.ui.ui_root);
if(cljs.core.truth_(temp__5804__auto__)){
var root = temp__5804__auto__;
return reagent.dom.client.render.cljs$core$IFn$_invoke$arity$2(root,reagent.core.as_element.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.ui.app], null)));
} else {
return null;
}
});
goog.exportSymbol('opencode_unified.ui.reload', opencode_unified.ui.reload);
opencode_unified.ui.clear = (function opencode_unified$ui$clear(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Clearing UI..."], 0));

var temp__5804__auto__ = cljs.core.deref(opencode_unified.ui.ui_root);
if(cljs.core.truth_(temp__5804__auto__)){
var root = temp__5804__auto__;
root.unmount();

return cljs.core.reset_BANG_(opencode_unified.ui.ui_root,null);
} else {
return null;
}
});
goog.exportSymbol('opencode_unified.ui.clear', opencode_unified.ui.clear);

//# sourceMappingURL=opencode_unified.ui.js.map
