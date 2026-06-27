goog.provide('opencode_unified.keymap');
opencode_unified.keymap.modifier_keys = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 5, ["Alt",null,"Control",null,"Meta",null,"Command",null,"Shift",null], null), null);
opencode_unified.keymap.special_keys = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 14, ["PageDown",null,"Backspace",null,"Space",null,"ArrowUp",null,"ArrowDown",null,"End",null,"Tab",null,"ArrowRight",null,"Delete",null,"ArrowLeft",null,"Escape",null,"PageUp",null,"Enter",null,"Home",null], null), null);
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.keymap !== 'undefined') && (typeof opencode_unified.keymap.key_sequence !== 'undefined')){
} else {
opencode_unified.keymap.key_sequence = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.keymap !== 'undefined') && (typeof opencode_unified.keymap.key_timeout !== 'undefined')){
} else {
opencode_unified.keymap.key_timeout = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.keymap !== 'undefined') && (typeof opencode_unified.keymap.spacemacs_keybindings !== 'undefined')){
} else {
opencode_unified.keymap.spacemacs_keybindings = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"leader","leader",1888892947),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 1, ["SPC",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Leader",new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 6, ["f",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"File",new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 5, ["f",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Find file",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.find_file();
})], null),"s",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Save file",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.save_current_buffer();
})], null),"w",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Save as",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.save_current_buffer_as();
})], null),"b",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Switch buffer",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.switch_buffer();
})], null),"k",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Kill buffer",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.kill_current_buffer();
})], null)], null)], null),"b",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Buffer",new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 4, ["b",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Switch buffer",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.switch_buffer();
})], null),"n",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Next buffer",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.next_buffer();
})], null),"p",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Previous buffer",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.previous_buffer();
})], null),"l",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"List buffers",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.list_buffers();
})], null)], null)], null),"w",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Window",new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 4, ["w",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Other window",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.other_window();
})], null),"s",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Split window",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.split_window();
})], null),"v",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Vertical split",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.vsplit_window();
})], null),"c",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Close window",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.close_window();
})], null)], null)], null),"e",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Editor",new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 1, ["e",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Eval expression",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.eval_expression();
})], null)], null)], null),"p",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Project",new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 2, ["p",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Switch project",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.switch_project();
})], null),"f",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Find file in project",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.find_file_in_project();
})], null)], null)], null),"h",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Help",new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 1, ["b",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"name","name",1843675177),"Describe bindings",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return (function (){
return opencode_unified.state.show_which_key_BANG_();
});
})], null)], null)], null)], null)], null)], null)], null)], null));
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.keymap !== 'undefined') && (typeof opencode_unified.keymap.evil_keybindings !== 'undefined')){
} else {
opencode_unified.keymap.evil_keybindings = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"normal","normal",-1519123858),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),cljs.core.PersistentHashMap.fromArrays(["n","w","Ctrl-r","gg","ESC","p","/","j","G","v","?","dd","a","P","V","O","i","k","b","0","l","N","u","h","yy","$","o"],[new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.next_search_result();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.word_forward();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.redo();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.beginning_of_buffer();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.exit_visual_mode();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.paste_after();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.search_forward();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.move_cursor(new cljs.core.Keyword(null,"down","down",1565245570));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.end_of_buffer();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.enter_visual_mode();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.search_backward();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.delete_current_line();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.append_after_cursor();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.paste_before();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.enter_visual_line_mode();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.open_line_above();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.enter_insert_mode();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.move_cursor(new cljs.core.Keyword(null,"up","up",-269712113));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.word_backward();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.beginning_of_line();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.move_cursor(new cljs.core.Keyword(null,"right","right",-452581833));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.previous_search_result();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.undo();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.move_cursor(new cljs.core.Keyword(null,"left","left",-399115937));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.yank_line();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.end_of_line();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.open_line_below();
})], null)])], null),new cljs.core.Keyword(null,"insert","insert",1286475395),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),new cljs.core.PersistentArrayMap(null, 2, ["ESC",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.enter_normal_mode();
})], null),"Ctrl-[",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.enter_normal_mode();
})], null)], null)], null),new cljs.core.Keyword(null,"visual","visual",942787224),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),cljs.core.PersistentHashMap.fromArrays(["d","w","ESC","j","k","b","y","l","h","c"],[new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.delete_selection();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.extend_selection(new cljs.core.Keyword(null,"word-forward","word-forward",-1531151078));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.exit_visual_mode();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.extend_selection(new cljs.core.Keyword(null,"down","down",1565245570));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.extend_selection(new cljs.core.Keyword(null,"up","up",-269712113));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.extend_selection(new cljs.core.Keyword(null,"word-backward","word-backward",1236318451));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.yank_selection();
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.extend_selection(new cljs.core.Keyword(null,"right","right",-452581833));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.extend_selection(new cljs.core.Keyword(null,"left","left",-399115937));
})], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.evil.change_selection();
})], null)])], null)], null));
}
opencode_unified.keymap.normalize_key = (function opencode_unified$keymap$normalize_key(event){
var key = (function (){var or__5002__auto__ = event.key;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var ctrl_QMARK_ = event.ctrlKey;
var alt_QMARK_ = event.altKey;
var shift_QMARK_ = event.shiftKey;
var meta_QMARK_ = event.metaKey;
var base_key = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key," "))?"SPC":((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"Spacebar"))?"SPC":((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key,"Escape"))?"ESC":((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((1),cljs.core.count(key))) && (cljs.core.not(shift_QMARK_))))?clojure.string.lower_case(key):key)
)));
var modifiers = (function (){var G__14922 = cljs.core.PersistentVector.EMPTY;
var G__14922__$1 = (cljs.core.truth_(ctrl_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__14922,"Ctrl"):G__14922);
var G__14922__$2 = (cljs.core.truth_(alt_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__14922__$1,"Alt"):G__14922__$1);
var G__14922__$3 = (cljs.core.truth_(shift_QMARK_)?cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__14922__$2,"Shift"):G__14922__$2);
if(cljs.core.truth_(meta_QMARK_)){
return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(G__14922__$3,"Meta");
} else {
return G__14922__$3;
}
})();
if(cljs.core.seq(modifiers)){
return [clojure.string.join.cljs$core$IFn$_invoke$arity$2("-",modifiers),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(base_key)].join('');
} else {
return base_key;
}
});
opencode_unified.keymap.clear_key_sequence = (function opencode_unified$keymap$clear_key_sequence(){
cljs.core.reset_BANG_(opencode_unified.keymap.key_sequence,cljs.core.PersistentVector.EMPTY);

if(cljs.core.truth_(cljs.core.deref(opencode_unified.keymap.key_timeout))){
clearTimeout(cljs.core.deref(opencode_unified.keymap.key_timeout));

return cljs.core.reset_BANG_(opencode_unified.keymap.key_timeout,null);
} else {
return null;
}
});
opencode_unified.keymap.set_key_timeout = (function opencode_unified$keymap$set_key_timeout(){
if(cljs.core.truth_(cljs.core.deref(opencode_unified.keymap.key_timeout))){
clearTimeout(cljs.core.deref(opencode_unified.keymap.key_timeout));
} else {
}

return cljs.core.reset_BANG_(opencode_unified.keymap.key_timeout,setTimeout((function (){
opencode_unified.keymap.clear_key_sequence();

return opencode_unified.state.hide_which_key_BANG_();
}),(3000)));
});
opencode_unified.keymap.find_binding = (function opencode_unified$keymap$find_binding(key_sequence,mode){
var current_bindings = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.keymap.spacemacs_keybindings),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"leader","leader",1888892947),new cljs.core.Keyword(null,"bindings","bindings",1271397192)], null));
var evil_bindings = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.keymap.evil_keybindings),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [mode,new cljs.core.Keyword(null,"bindings","bindings",1271397192)], null));
if((((cljs.core.count(key_sequence) >= (1))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(key_sequence),"SPC")))){
var path = cljs.core.rest(key_sequence);
var bindings = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),current_bindings], null);
var remaining = path;
while(true){
if(cljs.core.empty_QMARK_(remaining)){
return bindings;
} else {
var key = cljs.core.first(remaining);
var next_binding = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(bindings,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"bindings","bindings",1271397192),key], null));
if(cljs.core.truth_(next_binding)){
var G__14982 = next_binding;
var G__14983 = cljs.core.rest(remaining);
bindings = G__14982;
remaining = G__14983;
continue;
} else {
return null;
}
}
break;
}
} else {
var key_str = clojure.string.join.cljs$core$IFn$_invoke$arity$2("-",key_sequence);
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(evil_bindings,key_str);
}
});
opencode_unified.keymap.execute_binding = (function opencode_unified$keymap$execute_binding(binding){
var temp__5804__auto___14984 = new cljs.core.Keyword(null,"handler","handler",-195596612).cljs$core$IFn$_invoke$arity$1(binding);
if(cljs.core.truth_(temp__5804__auto___14984)){
var handler_14985 = temp__5804__auto___14984;
(handler_14985.cljs$core$IFn$_invoke$arity$0 ? handler_14985.cljs$core$IFn$_invoke$arity$0() : handler_14985.call(null));
} else {
}

opencode_unified.keymap.clear_key_sequence();

return opencode_unified.state.hide_which_key_BANG_();
});
opencode_unified.keymap.show_which_key = (function opencode_unified$keymap$show_which_key(_prefix){
opencode_unified.state.show_which_key_BANG_();

return opencode_unified.keymap.set_key_timeout();
});
opencode_unified.keymap.handle_key_down = (function opencode_unified$keymap$handle_key_down(event){
var key = opencode_unified.keymap.normalize_key(event);
var evil_mode = opencode_unified.state.get_evil_mode();
var target = event.target;
var target_tag = (function (){var G__14956 = target;
if((G__14956 == null)){
return null;
} else {
return G__14956.tagName;
}
})();
var editable_target_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(target_tag,"TEXTAREA")) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(target_tag,"INPUT")) || (cljs.core.boolean$((function (){var G__14957 = target;
if((G__14957 == null)){
return null;
} else {
return G__14957.isContentEditable;
}
})())))));
var current_sequence = cljs.core.deref(opencode_unified.keymap.key_sequence);
var new_sequence = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(current_sequence,key);
var should_skip_modal_handling_QMARK_ = editable_target_QMARK_;
if(should_skip_modal_handling_QMARK_){
return null;
} else {
if(cljs.core.truth_((function (){var or__5002__auto__ = ((editable_target_QMARK_) && (cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(evil_mode,new cljs.core.Keyword(null,"insert","insert",1286475395))));
if(or__5002__auto__){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.contains_QMARK_(opencode_unified.keymap.special_keys,key);
if(or__5002__auto____$1){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = cljs.core.contains_QMARK_(opencode_unified.keymap.modifier_keys,key);
if(or__5002__auto____$2){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = event.ctrlKey;
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = event.altKey;
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
return event.metaKey;
}
}
}
}
}
})())){
event.preventDefault();
} else {
}

cljs.core.reset_BANG_(opencode_unified.keymap.key_sequence,new_sequence);

var temp__5802__auto__ = opencode_unified.keymap.find_binding(new_sequence,evil_mode);
if(cljs.core.truth_(temp__5802__auto__)){
var binding = temp__5802__auto__;
if(cljs.core.truth_(new cljs.core.Keyword(null,"handler","handler",-195596612).cljs$core$IFn$_invoke$arity$1(binding))){
return opencode_unified.keymap.execute_binding(binding);
} else {
opencode_unified.keymap.show_which_key(new_sequence);

return opencode_unified.keymap.set_key_timeout();
}
} else {
opencode_unified.keymap.clear_key_sequence();

return opencode_unified.state.hide_which_key_BANG_();
}
}
});
opencode_unified.keymap.handle_key_up = (function opencode_unified$keymap$handle_key_up(_event){
return null;
});
opencode_unified.keymap.global_keybindings = new cljs.core.PersistentArrayMap(null, 7, ["Ctrl-p",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.command_palette();
})], null),"Ctrl-s",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.save_current_buffer();
})], null),"Ctrl-Shift-p",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.show_command_palette();
})], null),"Ctrl-`",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.toggle_terminal();
})], null),"F11",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.toggle_fullscreen();
})], null),"Ctrl-,",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.buffers.open_settings();
})], null),"Ctrl-Shift-?",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
return opencode_unified.keymap.show_which_key(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, ["SPC","h","b"], null));
})], null)], null);
opencode_unified.keymap.handle_global_key = (function opencode_unified$keymap$handle_global_key(event){
var key = opencode_unified.keymap.normalize_key(event);
var temp__5804__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(opencode_unified.keymap.global_keybindings,key);
if(cljs.core.truth_(temp__5804__auto__)){
var binding = temp__5804__auto__;
event.preventDefault();

return opencode_unified.keymap.execute_binding(binding);
} else {
return null;
}
});
opencode_unified.keymap.register_keybinding = (function opencode_unified$keymap$register_keybinding(mode,key_sequence,handler){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.keymap.evil_keybindings,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [mode,new cljs.core.Keyword(null,"bindings","bindings",1271397192)], null),cljs.core.assoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$2("-",key_sequence),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),handler], null)], 0));
});
opencode_unified.keymap.unregister_keybinding = (function opencode_unified$keymap$unregister_keybinding(mode,key_sequence){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.keymap.evil_keybindings,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [mode,new cljs.core.Keyword(null,"bindings","bindings",1271397192)], null),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([clojure.string.join.cljs$core$IFn$_invoke$arity$2("-",key_sequence)], 0));
});
opencode_unified.keymap.register_spacemacs_binding = (function opencode_unified$keymap$register_spacemacs_binding(path,handler){
var path_keys = cljs.core.butlast(path);
var final_key = cljs.core.last(path);
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.keymap.spacemacs_keybindings,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"leader","leader",1888892947),new cljs.core.Keyword(null,"bindings","bindings",1271397192)], null),(function (bindings){
return cljs.core.assoc_in(bindings,cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.mapv.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"bindings","bindings",1271397192),path_keys),final_key),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"handler","handler",-195596612),handler], null));
}));
});
opencode_unified.keymap.init = (function opencode_unified$keymap$init(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Initializing keymap..."], 0));

window.addEventListener("keydown",(function (e){
opencode_unified.keymap.handle_global_key(e);

return opencode_unified.keymap.handle_key_down(e);
}));

window.addEventListener("keyup",opencode_unified.keymap.handle_key_up);

opencode_unified.keymap.set_key_timeout();

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Keymap initialized"], 0));
});
opencode_unified.keymap.get_current_key_sequence = (function opencode_unified$keymap$get_current_key_sequence(){
return cljs.core.deref(opencode_unified.keymap.key_sequence);
});
opencode_unified.keymap.is_key_sequence_active_QMARK_ = (function opencode_unified$keymap$is_key_sequence_active_QMARK_(){
return cljs.core.seq(cljs.core.deref(opencode_unified.keymap.key_sequence));
});

//# sourceMappingURL=opencode_unified.keymap.js.map
