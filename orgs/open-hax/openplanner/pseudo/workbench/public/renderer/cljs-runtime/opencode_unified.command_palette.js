goog.provide('opencode_unified.command_palette');
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.command_palette !== 'undefined') && (typeof opencode_unified.command_palette.command_registry !== 'undefined')){
} else {
opencode_unified.command_palette.command_registry = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
opencode_unified.command_palette.default_palette_state = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"visible?","visible?",2129863715),false,new cljs.core.Keyword(null,"query","query",-1288509510),"",new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),(0),new cljs.core.Keyword(null,"feedback","feedback",1624587107),null,new cljs.core.Keyword(null,"last-event","last-event",2067154394),null,new cljs.core.Keyword(null,"events","events",1792552201),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897),null], null);
opencode_unified.command_palette.coerce_palette_state = (function opencode_unified$command_palette$coerce_palette_state(value){
if(cljs.core.map_QMARK_(value)){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([opencode_unified.command_palette.default_palette_state,value], 0));
} else {
return opencode_unified.command_palette.default_palette_state;
}
});
opencode_unified.command_palette.ensure_palette_state_BANG_ = (function opencode_unified$command_palette$ensure_palette_state_BANG_(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.update,new cljs.core.Keyword(null,"ui","ui",-469653645),(function (p1__14375_SHARP_){
return cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"command-palette","command-palette",153522288),opencode_unified.command_palette.default_palette_state], null),p1__14375_SHARP_], 0));
}));
});
opencode_unified.command_palette.palette_state = (function opencode_unified$command_palette$palette_state(){
return opencode_unified.command_palette.coerce_palette_state(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"command-palette","command-palette",153522288)], null)));
});
opencode_unified.command_palette.update_palette_BANG_ = (function opencode_unified$command_palette$update_palette_BANG_(var_args){
var args__5732__auto__ = [];
var len__5726__auto___14487 = arguments.length;
var i__5727__auto___14488 = (0);
while(true){
if((i__5727__auto___14488 < len__5726__auto___14487)){
args__5732__auto__.push((arguments[i__5727__auto___14488]));

var G__14489 = (i__5727__auto___14488 + (1));
i__5727__auto___14488 = G__14489;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic = (function (f,args){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"command-palette","command-palette",153522288)], null),(function (current){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f,opencode_unified.command_palette.coerce_palette_state(current),args);
}));
}));

(opencode_unified.command_palette.update_palette_BANG_.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(opencode_unified.command_palette.update_palette_BANG_.cljs$lang$applyTo = (function (seq14380){
var G__14381 = cljs.core.first(seq14380);
var seq14380__$1 = cljs.core.next(seq14380);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14381,seq14380__$1);
}));

opencode_unified.command_palette.emit_feedback_BANG_ = (function opencode_unified$command_palette$emit_feedback_BANG_(event){
var stamp = (new Date()).toISOString();
var normalized = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(event,new cljs.core.Keyword(null,"timestamp","timestamp",579478971),stamp);
return opencode_unified.command_palette.update_palette_BANG_((function (palette){
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(palette,new cljs.core.Keyword(null,"feedback","feedback",1624587107),normalized,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"last-event","last-event",2067154394),normalized], 0)),new cljs.core.Keyword(null,"events","events",1792552201),(function (events){
return cljs.core.vec(cljs.core.take_last((25),cljs.core.conj.cljs$core$IFn$_invoke$arity$2((function (){var or__5002__auto__ = events;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})(),normalized)));
}));
}));
});
opencode_unified.command_palette.close_BANG_ = (function opencode_unified$command_palette$close_BANG_(){
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"visible?","visible?",2129863715),false,new cljs.core.Keyword(null,"query","query",-1288509510),"",new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),(0),new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897),null], null)], 0));
});
opencode_unified.command_palette.focus_input_BANG_ = (function opencode_unified$command_palette$focus_input_BANG_(){
var focus_with_retry_BANG_ = (function opencode_unified$command_palette$focus_input_BANG__$_focus_with_retry_BANG_(remaining){
var temp__5804__auto__ = document.querySelector("[data-testid='command-palette-input']");
if(cljs.core.truth_(temp__5804__auto__)){
var input = temp__5804__auto__;
input.focus();

if((((remaining > (0))) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(input,document.activeElement)))){
return setTimeout((function (){
return opencode_unified$command_palette$focus_input_BANG__$_focus_with_retry_BANG_((remaining - (1)));
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
opencode_unified.command_palette.open_BANG_ = (function opencode_unified$command_palette$open_BANG_(){
opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"visible?","visible?",2129863715),true,new cljs.core.Keyword(null,"query","query",-1288509510),"",new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),(0),new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897),null], null)], 0));

return opencode_unified.command_palette.focus_input_BANG_();
});
opencode_unified.command_palette.visible_QMARK_ = (function opencode_unified$command_palette$visible_QMARK_(){
return new cljs.core.Keyword(null,"visible?","visible?",2129863715).cljs$core$IFn$_invoke$arity$1(opencode_unified.command_palette.palette_state());
});
opencode_unified.command_palette.normalize_command = (function opencode_unified$command_palette$normalize_command(p__14383){
var map__14384 = p__14383;
var map__14384__$1 = cljs.core.__destructure_map(map__14384);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14384__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14384__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14384__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var handler = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14384__$1,new cljs.core.Keyword(null,"handler","handler",-195596612));
var destructive_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14384__$1,new cljs.core.Keyword(null,"destructive?","destructive?",1136140718));
var confirm_message = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14384__$1,new cljs.core.Keyword(null,"confirm-message","confirm-message",1667051556));
var keywords = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14384__$1,new cljs.core.Keyword(null,"keywords","keywords",1526959054));
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"id","id",-1388402092),id,new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"description","description",-1428560544),(function (){var or__5002__auto__ = description;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword(null,"handler","handler",-195596612),handler,new cljs.core.Keyword(null,"destructive?","destructive?",1136140718),cljs.core.boolean$(destructive_QMARK_),new cljs.core.Keyword(null,"confirm-message","confirm-message",1667051556),(function (){var or__5002__auto__ = confirm_message;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "This action cannot be undone. Continue?";
}
})(),new cljs.core.Keyword(null,"keywords","keywords",1526959054),cljs.core.vec(keywords)], null);
});
opencode_unified.command_palette.register_command_BANG_ = (function opencode_unified$command_palette$register_command_BANG_(command){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.command_palette.command_registry,cljs.core.assoc,new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command),opencode_unified.command_palette.normalize_command(command));
});
opencode_unified.command_palette.register_commands_BANG_ = (function opencode_unified$command_palette$register_commands_BANG_(commands){
var seq__14389 = cljs.core.seq(commands);
var chunk__14390 = null;
var count__14391 = (0);
var i__14392 = (0);
while(true){
if((i__14392 < count__14391)){
var command = chunk__14390.cljs$core$IIndexed$_nth$arity$2(null,i__14392);
opencode_unified.command_palette.register_command_BANG_(command);


var G__14490 = seq__14389;
var G__14491 = chunk__14390;
var G__14492 = count__14391;
var G__14493 = (i__14392 + (1));
seq__14389 = G__14490;
chunk__14390 = G__14491;
count__14391 = G__14492;
i__14392 = G__14493;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__14389);
if(temp__5804__auto__){
var seq__14389__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__14389__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__14389__$1);
var G__14494 = cljs.core.chunk_rest(seq__14389__$1);
var G__14495 = c__5525__auto__;
var G__14496 = cljs.core.count(c__5525__auto__);
var G__14497 = (0);
seq__14389 = G__14494;
chunk__14390 = G__14495;
count__14391 = G__14496;
i__14392 = G__14497;
continue;
} else {
var command = cljs.core.first(seq__14389__$1);
opencode_unified.command_palette.register_command_BANG_(command);


var G__14498 = cljs.core.next(seq__14389__$1);
var G__14499 = null;
var G__14500 = (0);
var G__14501 = (0);
seq__14389 = G__14498;
chunk__14390 = G__14499;
count__14391 = G__14500;
i__14392 = G__14501;
continue;
}
} else {
return null;
}
}
break;
}
});
opencode_unified.command_palette.all_commands = (function opencode_unified$command_palette$all_commands(){
return cljs.core.vec(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"title","title",636505583),cljs.core.vals(cljs.core.deref(opencode_unified.command_palette.command_registry))));
});
opencode_unified.command_palette.command_haystack = (function opencode_unified$command_palette$command_haystack(p__14394){
var map__14395 = p__14394;
var map__14395__$1 = cljs.core.__destructure_map(map__14395);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14395__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14395__$1,new cljs.core.Keyword(null,"title","title",636505583));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14395__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var keywords = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14395__$1,new cljs.core.Keyword(null,"keywords","keywords",1526959054));
return clojure.string.lower_case(clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",cljs.core.concat.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [id,title,description], null),keywords)));
});
opencode_unified.command_palette.filtered_commands = (function opencode_unified$command_palette$filtered_commands(){
var map__14405 = opencode_unified.command_palette.palette_state();
var map__14405__$1 = cljs.core.__destructure_map(map__14405);
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14405__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var needle = clojure.string.lower_case(clojure.string.trim((function (){var or__5002__auto__ = query;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()));
var commands = opencode_unified.command_palette.all_commands();
if(clojure.string.blank_QMARK_(needle)){
return commands;
} else {
return cljs.core.vec(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__14400_SHARP_){
return clojure.string.includes_QMARK_(opencode_unified.command_palette.command_haystack(p1__14400_SHARP_),needle);
}),commands));
}
});
opencode_unified.command_palette.promise_like_QMARK_ = (function opencode_unified$command_palette$promise_like_QMARK_(value){
var and__5000__auto__ = value;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.fn_QMARK_(value.then);
} else {
return and__5000__auto__;
}
});
opencode_unified.command_palette.error_message = (function opencode_unified$command_palette$error_message(error){
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
opencode_unified.command_palette.execute_sync_BANG_ = (function opencode_unified$command_palette$execute_sync_BANG_(command,result){
var failed_QMARK_ = ((cljs.core.map_QMARK_(result)) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(false,new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result))));
var message = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
if(failed_QMARK_){
return ["Failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(command))].join('');
} else {
return ["Executed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(command))].join('');
}
}
})();
return opencode_unified.command_palette.emit_feedback_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command-id","command-id",-1261579493),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command),new cljs.core.Keyword(null,"status","status",-1997798413),((failed_QMARK_)?new cljs.core.Keyword(null,"error","error",-978969032):new cljs.core.Keyword(null,"success","success",1890645906)),new cljs.core.Keyword(null,"message","message",-406056002),message], null));
});
opencode_unified.command_palette.execute_unsafe_BANG_ = (function opencode_unified$command_palette$execute_unsafe_BANG_(command){
try{var result = (function (){var fexpr__14407 = new cljs.core.Keyword(null,"handler","handler",-195596612).cljs$core$IFn$_invoke$arity$1(command);
return (fexpr__14407.cljs$core$IFn$_invoke$arity$0 ? fexpr__14407.cljs$core$IFn$_invoke$arity$0() : fexpr__14407.call(null));
})();
if(cljs.core.truth_(opencode_unified.command_palette.promise_like_QMARK_(result))){
return result.then((function (resolved){
return opencode_unified.command_palette.execute_sync_BANG_(command,resolved);
})).catch((function (error){
return opencode_unified.command_palette.emit_feedback_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command-id","command-id",-1261579493),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"message","message",-406056002),["Failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.command_palette.error_message(error))].join('')], null));
}));
} else {
return opencode_unified.command_palette.execute_sync_BANG_(command,result);
}
}catch (e14406){if((e14406 instanceof Error)){
var error = e14406;
return opencode_unified.command_palette.emit_feedback_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command-id","command-id",-1261579493),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command),new cljs.core.Keyword(null,"status","status",-1997798413),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"message","message",-406056002),["Failed: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(opencode_unified.command_palette.error_message(error))].join('')], null));
} else {
throw e14406;

}
}});
opencode_unified.command_palette.execute_BANG_ = (function opencode_unified$command_palette$execute_BANG_(command){
if(cljs.core.truth_(new cljs.core.Keyword(null,"destructive?","destructive?",1136140718).cljs$core$IFn$_invoke$arity$1(command))){
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897),command], 0));
} else {
return opencode_unified.command_palette.execute_unsafe_BANG_(command);
}
});
opencode_unified.command_palette.execute_selected_BANG_ = (function opencode_unified$command_palette$execute_selected_BANG_(){
var map__14410 = opencode_unified.command_palette.palette_state();
var map__14410__$1 = cljs.core.__destructure_map(map__14410);
var selected_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14410__$1,new cljs.core.Keyword(null,"selected-index","selected-index",1735686526));
var commands = opencode_unified.command_palette.filtered_commands();
var command = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(commands,selected_index,null);
if(cljs.core.truth_(command)){
return opencode_unified.command_palette.execute_BANG_(command);
} else {
return null;
}
});
opencode_unified.command_palette.clear_confirmation_BANG_ = (function opencode_unified$command_palette$clear_confirmation_BANG_(){
opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897),null], 0));

return opencode_unified.command_palette.focus_input_BANG_();
});
opencode_unified.command_palette.confirm_destructive_BANG_ = (function opencode_unified$command_palette$confirm_destructive_BANG_(){
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(opencode_unified.command_palette.palette_state(),new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897));
if(cljs.core.truth_(temp__5804__auto__)){
var command = temp__5804__auto__;
opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897),null], 0));

return opencode_unified.command_palette.execute_unsafe_BANG_(command);
} else {
return null;
}
});
opencode_unified.command_palette.select_next_BANG_ = (function opencode_unified$command_palette$select_next_BANG_(){
var command_count = cljs.core.count(opencode_unified.command_palette.filtered_commands());
if((command_count > (0))){
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.update,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),(function (index){
return cljs.core.mod((index + (1)),command_count);
})], 0));
} else {
return null;
}
});
opencode_unified.command_palette.select_prev_BANG_ = (function opencode_unified$command_palette$select_prev_BANG_(){
var command_count = cljs.core.count(opencode_unified.command_palette.filtered_commands());
if((command_count > (0))){
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.update,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),(function (index){
return cljs.core.mod((index - (1)),command_count);
})], 0));
} else {
return null;
}
});
opencode_unified.command_palette.update_query_BANG_ = (function opencode_unified$command_palette$update_query_BANG_(query){
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.merge,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"query","query",-1288509510),query,new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),(0)], null)], 0));
});
opencode_unified.command_palette.handle_open_key_BANG_ = (function opencode_unified$command_palette$handle_open_key_BANG_(){
if(cljs.core.truth_(opencode_unified.command_palette.visible_QMARK_())){
return opencode_unified.command_palette.close_BANG_();
} else {
return opencode_unified.command_palette.open_BANG_();
}
});
opencode_unified.command_palette.handle_palette_keydown_BANG_ = (function opencode_unified$command_palette$handle_palette_keydown_BANG_(event){
var key = event.key;
var G__14438 = key;
switch (G__14438) {
case "ArrowDown":
event.preventDefault();

return opencode_unified.command_palette.select_next_BANG_();

break;
case "ArrowUp":
event.preventDefault();

return opencode_unified.command_palette.select_prev_BANG_();

break;
case "Enter":
event.preventDefault();

return opencode_unified.command_palette.execute_selected_BANG_();

break;
case "Escape":
event.preventDefault();

return opencode_unified.command_palette.close_BANG_();

break;
default:
return null;

}
});
opencode_unified.command_palette.init_BANG_ = (function opencode_unified$command_palette$init_BANG_(){
opencode_unified.command_palette.ensure_palette_state_BANG_();

return opencode_unified.command_palette.register_commands_BANG_(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"palette.open",new cljs.core.Keyword(null,"title","title",636505583),"Open Action Palette",new cljs.core.Keyword(null,"description","description",-1428560544),"Open action-centric command palette",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
opencode_unified.command_palette.open_BANG_();

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"message","message",-406056002),"Action palette opened"], null);
}),new cljs.core.Keyword(null,"keywords","keywords",1526959054),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["actions","palette"], null)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"workspace.save",new cljs.core.Keyword(null,"title","title",636505583),"Save Workspace Snapshot",new cljs.core.Keyword(null,"description","description",-1428560544),"Save a lightweight workspace snapshot",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
var temp__5804__auto___14517 = (function (){var G__14463 = window;
if((G__14463 == null)){
return null;
} else {
return (G__14463["localStorage"]);
}
})();
if(cljs.core.truth_(temp__5804__auto___14517)){
var storage_14521 = temp__5804__auto___14517;
storage_14521.setItem("opencode.workbench.last-save",(new Date()).toISOString());
} else {
}

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"message","message",-406056002),"Workspace snapshot saved"], null);
}),new cljs.core.Keyword(null,"keywords","keywords",1526959054),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["save","workspace"], null)], null),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"id","id",-1388402092),"theme.toggle",new cljs.core.Keyword(null,"title","title",636505583),"Toggle Theme",new cljs.core.Keyword(null,"description","description",-1428560544),"Switch between dark and light themes",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
var next_theme = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"dark","dark",1818973999),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"theme","theme",-1247880880)], null))))?new cljs.core.Keyword(null,"light","light",1918998747):new cljs.core.Keyword(null,"dark","dark",1818973999));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.state.app_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"theme","theme",-1247880880)], null),next_theme);

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"message","message",-406056002),["Theme set to ",cljs.core.name(next_theme)].join('')], null);
}),new cljs.core.Keyword(null,"keywords","keywords",1526959054),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, ["appearance","colors"], null)], null),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"id","id",-1388402092),"workspace.reset",new cljs.core.Keyword(null,"title","title",636505583),"Reset Workspace",new cljs.core.Keyword(null,"description","description",-1428560544),"Clear all buffers and restore defaults",new cljs.core.Keyword(null,"destructive?","destructive?",1136140718),true,new cljs.core.Keyword(null,"confirm-message","confirm-message",1667051556),"Reset workspace and discard unsaved buffers?",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(opencode_unified.state.app_state,(function (current){
return cljs.core.assoc_in(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(current,new cljs.core.Keyword(null,"buffers","buffers",471409492),cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614),null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"mode","mode",654403691)], null),new cljs.core.Keyword(null,"normal","normal",-1519123858));
}));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"message","message",-406056002),"Workspace reset"], null);
}),new cljs.core.Keyword(null,"keywords","keywords",1526959054),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["danger","clear","destructive"], null)], null)], null));
});
opencode_unified.command_palette.command_palette = (function opencode_unified$command_palette$command_palette(){
var map__14470 = opencode_unified.command_palette.palette_state();
var map__14470__$1 = cljs.core.__destructure_map(map__14470);
var visible_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14470__$1,new cljs.core.Keyword(null,"visible?","visible?",2129863715));
var query = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14470__$1,new cljs.core.Keyword(null,"query","query",-1288509510));
var selected_index = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14470__$1,new cljs.core.Keyword(null,"selected-index","selected-index",1735686526));
var feedback = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14470__$1,new cljs.core.Keyword(null,"feedback","feedback",1624587107));
var pending_confirmation = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14470__$1,new cljs.core.Keyword(null,"pending-confirmation","pending-confirmation",-1672481897));
var commands = opencode_unified.command_palette.filtered_commands();
return new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.command-palette","div.command-palette",1774965822),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"command-palette",new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"box-shadow","box-shadow",1600206755),new cljs.core.Keyword(null,"max-height","max-height",-612563804),new cljs.core.Keyword(null,"transform","transform",1381301764),new cljs.core.Keyword(null,"top","top",-1856271961),new cljs.core.Keyword(null,"overflow","overflow",2058931880),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"z-index","z-index",1892827090),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"position","position",-2011731912),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"border-radius","border-radius",419594011),new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),new cljs.core.Keyword(null,"left","left",-399115937)],["0 14px 42px rgba(0,0,0,0.45)","420px","translateX(-50%)","12%","hidden","var(--bg-tertiary)","560px",(2200),(cljs.core.truth_(visible_QMARK_)?"flex":"none"),"fixed","1px solid var(--border)","6px","column","50%"])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.55rem 0.7rem",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"uppercase",new cljs.core.Keyword(null,"letter-spacing","letter-spacing",-948993767),"0.08em",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"Actions"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.command-input","input.command-input",813075063),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"command-palette-input",new cljs.core.Keyword(null,"value","value",305978217),query,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__14468_SHARP_){
return opencode_unified.command_palette.update_query_BANG_(p1__14468_SHARP_.target.value);
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),opencode_unified.command_palette.handle_palette_keydown_BANG_,new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"> Run action",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"width","width",-384071477),"100%",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.6rem 0.7rem",new cljs.core.Keyword(null,"border","border",1444987323),"none",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"transparent",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.9rem",new cljs.core.Keyword(null,"outline","outline",793464534),"none"], null)], null)], null),(cljs.core.truth_(feedback)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"command-feedback",new cljs.core.Keyword(null,"data-command-id","data-command-id",-2000217182),new cljs.core.Keyword(null,"command-id","command-id",-1261579493).cljs$core$IFn$_invoke$arity$1(feedback),new cljs.core.Keyword(null,"data-status","data-status",216057179),cljs.core.name(new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(feedback)),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.45rem 0.7rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"color","color",1011675173),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(feedback)))?"var(--error)":"var(--success)")], null)], null),new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(feedback)], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.command-list","div.command-list",-948006251),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"max-height","max-height",-612563804),"250px",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto"], null)], null),((cljs.core.empty_QMARK_(commands))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.7rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem"], null)], null),"No actions found"], null):(function (){var iter__5480__auto__ = (function opencode_unified$command_palette$command_palette_$_iter__14472(s__14473){
return (new cljs.core.LazySeq(null,(function (){
var s__14473__$1 = s__14473;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14473__$1);
if(temp__5804__auto__){
var s__14473__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14473__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14473__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14475 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14474 = (0);
while(true){
if((i__14474 < size__5479__auto__)){
var vec__14477 = cljs.core._nth(c__5478__auto__,i__14474);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14477,(0),null);
var command = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14477,(1),null);
cljs.core.chunk_append(b__14475,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.command-item","button.command-item",-1911176088),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"command-palette-item",new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected_index,index))?"selected":null),new cljs.core.Keyword(null,"on-mouse-enter","on-mouse-enter",-1664921661),((function (i__14474,vec__14477,index,command,c__5478__auto__,size__5479__auto__,b__14475,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands){
return (function (){
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),index], 0));
});})(i__14474,vec__14477,index,command,c__5478__auto__,size__5479__auto__,b__14475,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands))
,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14474,vec__14477,index,command,c__5478__auto__,size__5479__auto__,b__14475,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands){
return (function (){
return opencode_unified.command_palette.execute_BANG_(command);
});})(i__14474,vec__14477,index,command,c__5478__auto__,size__5479__auto__,b__14475,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands))
,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"text-align","text-align",1786091845),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"background","background",-863952629),new cljs.core.Keyword(null,"cursor","cursor",1011937484),new cljs.core.Keyword(null,"border-left","border-left",-1150760178),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),new cljs.core.Keyword(null,"gap","gap",80255254),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"border","border",1444987323)],["center","left","100%",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected_index,index))?"var(--bg-selection)":"transparent"),"pointer",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected_index,index))?"2px solid var(--accent)":"2px solid transparent"),"0.58rem 0.65rem","space-between","0.5rem","flex","none"])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.83rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(command)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.76rem"], null)], null),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(command)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),(cljs.core.truth_(new cljs.core.Keyword(null,"destructive?","destructive?",1136140718).cljs$core$IFn$_invoke$arity$1(command))?"var(--error)":"var(--text-dim)")], null)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"destructive?","destructive?",1136140718).cljs$core$IFn$_invoke$arity$1(command))?"Destructive":new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command)], null)));

var G__14538 = (i__14474 + (1));
i__14474 = G__14538;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14475),opencode_unified$command_palette$command_palette_$_iter__14472(cljs.core.chunk_rest(s__14473__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14475),null);
}
} else {
var vec__14481 = cljs.core.first(s__14473__$2);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14481,(0),null);
var command = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14481,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.command-item","button.command-item",-1911176088),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"command-palette-item",new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected_index,index))?"selected":null),new cljs.core.Keyword(null,"on-mouse-enter","on-mouse-enter",-1664921661),((function (vec__14481,index,command,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands){
return (function (){
return opencode_unified.command_palette.update_palette_BANG_.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"selected-index","selected-index",1735686526),index], 0));
});})(vec__14481,index,command,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands))
,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (vec__14481,index,command,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands){
return (function (){
return opencode_unified.command_palette.execute_BANG_(command);
});})(vec__14481,index,command,s__14473__$2,temp__5804__auto__,map__14470,map__14470__$1,visible_QMARK_,query,selected_index,feedback,pending_confirmation,commands))
,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"text-align","text-align",1786091845),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"background","background",-863952629),new cljs.core.Keyword(null,"cursor","cursor",1011937484),new cljs.core.Keyword(null,"border-left","border-left",-1150760178),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),new cljs.core.Keyword(null,"gap","gap",80255254),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"border","border",1444987323)],["center","left","100%",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected_index,index))?"var(--bg-selection)":"transparent"),"pointer",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(selected_index,index))?"2px solid var(--accent)":"2px solid transparent"),"0.58rem 0.65rem","space-between","0.5rem","flex","none"])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.83rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(command)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.76rem"], null)], null),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(command)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),(cljs.core.truth_(new cljs.core.Keyword(null,"destructive?","destructive?",1136140718).cljs$core$IFn$_invoke$arity$1(command))?"var(--error)":"var(--text-dim)")], null)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"destructive?","destructive?",1136140718).cljs$core$IFn$_invoke$arity$1(command))?"Destructive":new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(command)], null)),opencode_unified$command_palette$command_palette_$_iter__14472(cljs.core.rest(s__14473__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,commands));
})())], null),(cljs.core.truth_(pending_confirmation)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"destructive-confirmation",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.65rem 0.7rem",new cljs.core.Keyword(null,"border-top","border-top",-158897573),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"rgba(249,38,114,0.12)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"gap","gap",80255254),"0.6rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),new cljs.core.Keyword(null,"confirm-message","confirm-message",1667051556).cljs$core$IFn$_invoke$arity$1(pending_confirmation)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"destructive-cancel",new cljs.core.Keyword(null,"on-click","on-click",1632826543),opencode_unified.command_palette.clear_confirmation_BANG_,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Cancel"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"destructive-confirm",new cljs.core.Keyword(null,"on-click","on-click",1632826543),opencode_unified.command_palette.confirm_destructive_BANG_,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"background","background",-863952629),"var(--error)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--bg-primary)",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--error)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.45rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"700",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Confirm"], null)], null)], null):null)], null);
});

//# sourceMappingURL=opencode_unified.command_palette.js.map
