goog.provide('opencode_unified.evil');
opencode_unified.evil.set_mode_BANG_ = (function opencode_unified$evil$set_mode_BANG_(mode){
opencode_unified.state.set_evil_mode_BANG_(mode);

return (opencode_unified.evil.update_statusbar.cljs$core$IFn$_invoke$arity$0 ? opencode_unified.evil.update_statusbar.cljs$core$IFn$_invoke$arity$0() : opencode_unified.evil.update_statusbar.call(null));
});
opencode_unified.evil.get_mode = (function opencode_unified$evil$get_mode(){
return opencode_unified.state.get_evil_mode();
});
opencode_unified.evil.update_statusbar = (function opencode_unified$evil$update_statusbar(){
var mode = opencode_unified.evil.get_mode();
var mode_name = (function (){var G__14756 = mode;
var G__14756__$1 = (((G__14756 instanceof cljs.core.Keyword))?G__14756.fqn:null);
switch (G__14756__$1) {
case "normal":
return "NORMAL";

break;
case "insert":
return "INSERT";

break;
case "visual":
return "VISUAL";

break;
case "visual-line":
return "VISUAL LINE";

break;
default:
return "";

}
})();
var current_buffer = opencode_unified.state.get_current_buffer();
var buffer_info = (cljs.core.truth_(current_buffer)?(function (){var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(current_buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(current_buffer);
var vec__14757 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14757,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14757,(1),null);
var lines = clojure.string.split_lines(content);
return ["Line ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((line + (1))),", Col ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((col + (1)))," of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(lines)),(cljs.core.truth_(new cljs.core.Keyword(null,"modified?","modified?",-2109276969).cljs$core$IFn$_invoke$arity$1(current_buffer))?" [+]":null)].join('');
})():null);
return opencode_unified.state.update_statusbar_BANG_(mode_name,(function (){var or__5002__auto__ = buffer_info;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),["Evil Mode - ",cljs.core.name(mode)].join(''));
});
opencode_unified.evil.enter_normal_mode = (function opencode_unified$evil$enter_normal_mode(){
opencode_unified.state.update_current_buffer_BANG_((function (buffer){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"selection","selection",975998651),null);
}));

opencode_unified.evil.set_mode_BANG_(new cljs.core.Keyword(null,"normal","normal",-1519123858));

return opencode_unified.evil.update_statusbar();
});
opencode_unified.evil.enter_insert_mode = (function opencode_unified$evil$enter_insert_mode(){
opencode_unified.evil.set_mode_BANG_(new cljs.core.Keyword(null,"insert","insert",1286475395));

return opencode_unified.evil.update_statusbar();
});
opencode_unified.evil.enter_visual_mode = (function opencode_unified$evil$enter_visual_mode(){
var current_buffer_14883 = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(current_buffer_14883)){
opencode_unified.state.update_current_buffer_BANG_((function (buffer){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer),new cljs.core.Keyword(null,"end","end",-268185958),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer)], null));
}));
} else {
}

opencode_unified.evil.set_mode_BANG_(new cljs.core.Keyword(null,"visual","visual",942787224));

return opencode_unified.evil.update_statusbar();
});
opencode_unified.evil.enter_visual_line_mode = (function opencode_unified$evil$enter_visual_line_mode(){
var current_buffer_14884 = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(current_buffer_14884)){
var content_14885 = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(current_buffer_14884);
var cursor_pos_14886 = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(current_buffer_14884);
var vec__14763_14887 = opencode_unified.buffers.pos_to_line_col(content_14885,cursor_pos_14886);
var line_14888 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14763_14887,(0),null);
var __14889 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14763_14887,(1),null);
var line_range_14890 = opencode_unified.buffers.get_line_range(content_14885,line_14888);
opencode_unified.state.update_current_buffer_BANG_((function (buffer){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),cljs.core.first(line_range_14890),new cljs.core.Keyword(null,"end","end",-268185958),cljs.core.second(line_range_14890)], null));
}));
} else {
}

opencode_unified.evil.set_mode_BANG_(new cljs.core.Keyword(null,"visual-line","visual-line",-1293084027));

return opencode_unified.evil.update_statusbar();
});
opencode_unified.evil.exit_visual_mode = (function opencode_unified$evil$exit_visual_mode(){
opencode_unified.state.update_current_buffer_BANG_((function (buffer){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"selection","selection",975998651),null);
}));

return opencode_unified.evil.enter_normal_mode();
});
opencode_unified.evil.clamp = (function opencode_unified$evil$clamp(x,lo,hi){
var x__5087__auto__ = lo;
var y__5088__auto__ = (function (){var x__5090__auto__ = hi;
var y__5091__auto__ = x;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
});
opencode_unified.evil.line_start = (function opencode_unified$evil$line_start(s,pos){
return (s.lastIndexOf("\n",(function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (pos - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})()) + (1));
});
opencode_unified.evil.line_end = (function opencode_unified$evil$line_end(s,pos){
var i = s.indexOf("\n",pos);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((-1),i)){
return s.length;
} else {
return i;
}
});
opencode_unified.evil.column = (function opencode_unified$evil$column(s,pos){
return (pos - opencode_unified.evil.line_start(s,pos));
});
opencode_unified.evil.goto_col = (function opencode_unified$evil$goto_col(s,ls,col){
return (ls + opencode_unified.evil.clamp(col,(0),(opencode_unified.evil.line_end(s,ls) - ls)));
});
opencode_unified.evil.setpos_BANG_ = (function opencode_unified$evil$setpos_BANG_(el,p){
(el.selectionStart = p);

return (el.selectionEnd = p);
});
opencode_unified.evil.setrange_BANG_ = (function opencode_unified$evil$setrange_BANG_(el,a,b){
(el.selectionStart = (function (){var x__5090__auto__ = a;
var y__5091__auto__ = b;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());

return (el.selectionEnd = (function (){var x__5087__auto__ = a;
var y__5088__auto__ = b;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
});
opencode_unified.evil.wordch_QMARK_ = (function opencode_unified$evil$wordch_QMARK_(ch){
return cljs.core.boolean$(cljs.core.re_matches(/[A-Za-z0-9_]/,cljs.core.str.cljs$core$IFn$_invoke$arity$1(ch)));
});
opencode_unified.evil.next_word = (function opencode_unified$evil$next_word(s,pos){
var n = s.length;
var i = (function (){var x__5090__auto__ = n;
var y__5091__auto__ = (function (){var x__5087__auto__ = (0);
var y__5088__auto__ = pos;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var seen_QMARK_ = false;
while(true){
if((i >= n)){
return n;
} else {
if(((seen_QMARK_) && ((!(opencode_unified.evil.wordch_QMARK_(s.charAt(i))))))){
return i;
} else {
var G__14895 = (i + (1));
var G__14896 = ((seen_QMARK_) || (opencode_unified.evil.wordch_QMARK_(s.charAt(i))));
i = G__14895;
seen_QMARK_ = G__14896;
continue;

}
}
break;
}
});
opencode_unified.evil.prev_word = (function opencode_unified$evil$prev_word(s,pos){
var i = (function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (pos - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var seen_QMARK_ = false;
while(true){
if((i <= (0))){
return (0);
} else {
if(((seen_QMARK_) && ((!(opencode_unified.evil.wordch_QMARK_(s.charAt(i))))))){
return (i + (1));
} else {
var G__14897 = (i - (1));
var G__14898 = ((seen_QMARK_) || (opencode_unified.evil.wordch_QMARK_(s.charAt(i))));
i = G__14897;
seen_QMARK_ = G__14898;
continue;

}
}
break;
}
});
opencode_unified.evil.end_word = (function opencode_unified$evil$end_word(s,pos){
var n = s.length;
var i = (function (){var x__5090__auto__ = n;
var y__5091__auto__ = (function (){var x__5087__auto__ = (0);
var y__5088__auto__ = pos;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var in_QMARK_ = false;
while(true){
if((i >= n)){
return (n - (1));
} else {
if(((in_QMARK_) && ((!(opencode_unified.evil.wordch_QMARK_(s.charAt(i))))))){
return (i - (1));
} else {
var G__14902 = (i + (1));
var G__14903 = ((in_QMARK_) || (opencode_unified.evil.wordch_QMARK_(s.charAt(i))));
i = G__14902;
in_QMARK_ = G__14903;
continue;

}
}
break;
}
});
opencode_unified.evil.move_left_BANG_ = (function opencode_unified$evil$move_left_BANG_(el){
return opencode_unified.evil.setpos_BANG_(el,(function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (el.selectionStart - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
});
opencode_unified.evil.move_right_BANG_ = (function opencode_unified$evil$move_right_BANG_(el){
var s = el.value;
return opencode_unified.evil.setpos_BANG_(el,(function (){var x__5090__auto__ = s.length;
var y__5091__auto__ = (el.selectionStart + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
});
opencode_unified.evil.move_up_BANG_ = (function opencode_unified$evil$move_up_BANG_(el){
var s = el.value;
var p = el.selectionStart;
var col = opencode_unified.evil.column(s,p);
var prev_start = opencode_unified.evil.line_start(s,(function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (opencode_unified.evil.line_start(s,p) - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
return opencode_unified.evil.setpos_BANG_(el,opencode_unified.evil.goto_col(s,prev_start,col));
});
opencode_unified.evil.move_down_BANG_ = (function opencode_unified$evil$move_down_BANG_(el){
var s = el.value;
var p = el.selectionStart;
var col = opencode_unified.evil.column(s,p);
var next_start = (function (){var x__5090__auto__ = s.length;
var y__5091__auto__ = (opencode_unified.evil.line_end(s,p) + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return opencode_unified.evil.setpos_BANG_(el,opencode_unified.evil.goto_col(s,next_start,col));
});
opencode_unified.evil.move_bol_BANG_ = (function opencode_unified$evil$move_bol_BANG_(el){
var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.setpos_BANG_(el,opencode_unified.evil.line_start(s,p));
});
opencode_unified.evil.move_eol_BANG_ = (function opencode_unified$evil$move_eol_BANG_(el){
var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.setpos_BANG_(el,opencode_unified.evil.line_end(s,p));
});
opencode_unified.evil.move_w_BANG_ = (function opencode_unified$evil$move_w_BANG_(el){
var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.setpos_BANG_(el,opencode_unified.evil.next_word(s,(p + (1))));
});
opencode_unified.evil.move_b_BANG_ = (function opencode_unified$evil$move_b_BANG_(el){
var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.setpos_BANG_(el,opencode_unified.evil.prev_word(s,p));
});
opencode_unified.evil.move_e_BANG_ = (function opencode_unified$evil$move_e_BANG_(el){
var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.setpos_BANG_(el,(opencode_unified.evil.end_word(s,p) + (1)));
});
opencode_unified.evil.goto_start_BANG_ = (function opencode_unified$evil$goto_start_BANG_(el){
return opencode_unified.evil.setpos_BANG_(el,(0));
});
opencode_unified.evil.goto_end_BANG_ = (function opencode_unified$evil$goto_end_BANG_(el){
return opencode_unified.evil.setpos_BANG_(el,el.value.length);
});
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.evil !== 'undefined') && (typeof opencode_unified.evil.reg_STAR_ !== 'undefined')){
} else {
opencode_unified.evil.reg_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),"",new cljs.core.Keyword(null,"linewise?","linewise?",973313865),false], null));
}
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.evil !== 'undefined') && (typeof opencode_unified.evil.g_prev_STAR_ !== 'undefined')){
} else {
opencode_unified.evil.g_prev_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
opencode_unified.evil.clip_write_BANG_ = (function opencode_unified$evil$clip_write_BANG_(s){
try{return window.navigator.clipboard.writeText(s);
}catch (e14800){var _ = e14800;
return null;
}});
opencode_unified.evil.yank_BANG_ = (function opencode_unified$evil$yank_BANG_(txt,line_QMARK_){
cljs.core.reset_BANG_(opencode_unified.evil.reg_STAR_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"text","text",-1790561697),txt,new cljs.core.Keyword(null,"linewise?","linewise?",973313865),line_QMARK_], null));

return opencode_unified.evil.clip_write_BANG_(txt);
});
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.evil !== 'undefined') && (typeof opencode_unified.evil.op_STAR_ !== 'undefined')){
} else {
opencode_unified.evil.op_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
opencode_unified.evil.yank_range_BANG_ = (function opencode_unified$evil$yank_range_BANG_(el,a,b,line_QMARK_){
var s = el.value;
var lo = (function (){var x__5090__auto__ = a;
var y__5091__auto__ = b;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var hi = (function (){var x__5087__auto__ = a;
var y__5088__auto__ = b;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var txt = s.substring(lo,hi);
var txt_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = line_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(txt.endsWith("\n"));
} else {
return and__5000__auto__;
}
})())?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(txt),"\n"].join(''):txt);
opencode_unified.evil.yank_BANG_(txt_SINGLEQUOTE_,line_QMARK_);

return opencode_unified.evil.setpos_BANG_(el,a);
});
opencode_unified.evil.delete_range_BANG_ = (function opencode_unified$evil$delete_range_BANG_(el,a,b,line_QMARK_){
if(cljs.core.truth_(el.readOnly)){
return null;
} else {
var s = el.value;
var lo = (function (){var x__5090__auto__ = a;
var y__5091__auto__ = b;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var hi = (function (){var x__5087__auto__ = a;
var y__5088__auto__ = b;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var txt = s.substring(lo,hi);
var txt_SINGLEQUOTE_ = (cljs.core.truth_((function (){var and__5000__auto__ = line_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.not(txt.endsWith("\n"));
} else {
return and__5000__auto__;
}
})())?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(txt),"\n"].join(''):txt);
var out = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(s.substring((0),lo)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(s.substring(hi,s.length))].join('');
opencode_unified.evil.yank_BANG_(txt_SINGLEQUOTE_,line_QMARK_);

(el.value = out);

return opencode_unified.evil.setpos_BANG_(el,lo);
}
});
opencode_unified.evil.change_range_BANG_ = (function opencode_unified$evil$change_range_BANG_(el,a,b,line_QMARK_){
opencode_unified.evil.delete_range_BANG_(el,a,b,line_QMARK_);

return opencode_unified.evil.enter_insert_mode();
});
opencode_unified.evil.delete_line_BANG_ = (function opencode_unified$evil$delete_line_BANG_(el){
var s = el.value;
var p = el.selectionStart;
var ls = opencode_unified.evil.line_start(s,p);
var le = opencode_unified.evil.line_end(s,p);
var hi = (function (){var x__5090__auto__ = s.length;
var y__5091__auto__ = (le + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return opencode_unified.evil.delete_range_BANG_(el,ls,hi,true);
});
opencode_unified.evil.change_line_BANG_ = (function opencode_unified$evil$change_line_BANG_(el){
var s = el.value;
var p = el.selectionStart;
var ls = opencode_unified.evil.line_start(s,p);
var le = opencode_unified.evil.line_end(s,p);
var hi = (function (){var x__5090__auto__ = s.length;
var y__5091__auto__ = (le + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return opencode_unified.evil.change_range_BANG_(el,ls,hi,true);
});
opencode_unified.evil.paste_BANG_ = (function opencode_unified$evil$paste_BANG_(el,before_QMARK_){
if(cljs.core.truth_(el.readOnly)){
return null;
} else {
var map__14811 = cljs.core.deref(opencode_unified.evil.reg_STAR_);
var map__14811__$1 = cljs.core.__destructure_map(map__14811);
var text = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14811__$1,new cljs.core.Keyword(null,"text","text",-1790561697));
var linewise_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14811__$1,new cljs.core.Keyword(null,"linewise?","linewise?",973313865));
var text__$1 = (function (){var or__5002__auto__ = text;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var p = el.selectionStart;
var s = el.value;
if(cljs.core.truth_(linewise_QMARK_)){
var target = (cljs.core.truth_(before_QMARK_)?opencode_unified.evil.line_start(s,p):(function (){var x__5090__auto__ = s.length;
var y__5091__auto__ = (opencode_unified.evil.line_end(s,p) + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
var v = el.value;
var out = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(v.substring((0),target)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(text__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(v.substring(target,v.length))].join('');
(el.value = out);

return opencode_unified.evil.setpos_BANG_(el,(target + text__$1.length));
} else {
var idx = (cljs.core.truth_(before_QMARK_)?p:(p + (1)));
var v = el.value;
var out = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(v.substring((0),idx)),cljs.core.str.cljs$core$IFn$_invoke$arity$1(text__$1),cljs.core.str.cljs$core$IFn$_invoke$arity$1(v.substring(idx,v.length))].join('');
(el.value = out);

return opencode_unified.evil.setpos_BANG_(el,(idx + text__$1.length));
}
}
});
opencode_unified.evil.apply_op_motion_BANG_ = (function opencode_unified$evil$apply_op_motion_BANG_(el,p__14816,k){
var map__14817 = p__14816;
var map__14817__$1 = cljs.core.__destructure_map(map__14817);
var op = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14817__$1,new cljs.core.Keyword(null,"op","op",-1882987955));
var anchor = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14817__$1,new cljs.core.Keyword(null,"anchor","anchor",1549638489));
var s = el.value;
var tgt = (function (){var G__14818 = k;
switch (G__14818) {
case "y":
case "d":
case "c":
return new cljs.core.Keyword(null,"line","line",212345235);

break;
case "w":
return opencode_unified.evil.next_word(s,(anchor + (1)));

break;
case "b":
return opencode_unified.evil.prev_word(s,anchor);

break;
case "e":
return (opencode_unified.evil.end_word(s,anchor) + (1));

break;
case "0":
return opencode_unified.evil.line_start(s,anchor);

break;
case "$":
return opencode_unified.evil.line_end(s,anchor);

break;
case "G":
return s.length;

break;
default:
return null;

}
})();
if(cljs.core.truth_(tgt)){
var G__14819 = op;
var G__14819__$1 = (((G__14819 instanceof cljs.core.Keyword))?G__14819.fqn:null);
switch (G__14819__$1) {
case "y":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tgt,new cljs.core.Keyword(null,"line","line",212345235))){
return opencode_unified.evil.yank_range_BANG_(el,opencode_unified.evil.line_start(s,anchor),(opencode_unified.evil.line_end(s,anchor) + (1)),true);
} else {
return opencode_unified.evil.yank_range_BANG_(el,anchor,tgt,false);
}

break;
case "d":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tgt,new cljs.core.Keyword(null,"line","line",212345235))){
return opencode_unified.evil.delete_line_BANG_(el);
} else {
return opencode_unified.evil.delete_range_BANG_(el,anchor,tgt,false);
}

break;
case "c":
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(tgt,new cljs.core.Keyword(null,"line","line",212345235))){
return opencode_unified.evil.change_line_BANG_(el);
} else {
return opencode_unified.evil.change_range_BANG_(el,anchor,tgt,false);
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__14819__$1)].join('')));

}
} else {
return null;
}
});
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.evil !== 'undefined') && (typeof opencode_unified.evil.v_anchor_STAR_ !== 'undefined')){
} else {
opencode_unified.evil.v_anchor_STAR_ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
opencode_unified.evil.visual_start_BANG_ = (function opencode_unified$evil$visual_start_BANG_(el,line_QMARK_){
cljs.core.reset_BANG_(opencode_unified.evil.v_anchor_STAR_,el.selectionStart);

opencode_unified.evil.set_mode_BANG_((cljs.core.truth_(line_QMARK_)?new cljs.core.Keyword(null,"visual-line","visual-line",-1293084027):new cljs.core.Keyword(null,"visual","visual",942787224)));

if(cljs.core.truth_(line_QMARK_)){
var s_14929 = el.value;
var a_14930 = cljs.core.deref(opencode_unified.evil.v_anchor_STAR_);
opencode_unified.evil.setrange_BANG_(el,opencode_unified.evil.line_start(s_14929,a_14930),(opencode_unified.evil.line_end(s_14929,a_14930) + (1)));
} else {
opencode_unified.evil.setrange_BANG_(el,cljs.core.deref(opencode_unified.evil.v_anchor_STAR_),el.selectionStart);
}

return opencode_unified.evil.update_statusbar();
});
opencode_unified.evil.visual_update_BANG_ = (function opencode_unified$evil$visual_update_BANG_(el){
var mode = opencode_unified.evil.get_mode();
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"visual","visual",942787224))){
var a = cljs.core.deref(opencode_unified.evil.v_anchor_STAR_);
var p = el.selectionStart;
return opencode_unified.evil.setrange_BANG_(el,a,p);
} else {
return null;
}
});
opencode_unified.evil.visual_exit_BANG_ = (function opencode_unified$evil$visual_exit_BANG_(){
cljs.core.reset_BANG_(opencode_unified.evil.v_anchor_STAR_,null);

return opencode_unified.evil.exit_visual_mode();
});
opencode_unified.evil.handle_gg_BANG_ = (function opencode_unified$evil$handle_gg_BANG_(e,el){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(e.key,"g")){
var now = Date.now();
if(((now - cljs.core.deref(opencode_unified.evil.g_prev_STAR_)) < (350))){
e.preventDefault();

opencode_unified.evil.goto_start_BANG_(el);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(opencode_unified.evil.get_mode(),new cljs.core.Keyword(null,"visual","visual",942787224))){
opencode_unified.evil.visual_update_BANG_(el);
} else {
}

return cljs.core.reset_BANG_(opencode_unified.evil.g_prev_STAR_,(0));
} else {
return cljs.core.reset_BANG_(opencode_unified.evil.g_prev_STAR_,now);
}
} else {
return null;
}
});
opencode_unified.evil.handle_key_BANG_ = (function opencode_unified$evil$handle_key_BANG_(e,el){
var mode = opencode_unified.evil.get_mode();
var k = e.key;
var op = cljs.core.deref(opencode_unified.evil.op_STAR_);
var ro_QMARK_ = el.readOnly;
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,"Escape")){
e.preventDefault();

cljs.core.reset_BANG_(opencode_unified.evil.op_STAR_,null);

return opencode_unified.evil.visual_exit_BANG_();
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"normal","normal",-1519123858))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,"i")))){
e.preventDefault();

cljs.core.reset_BANG_(opencode_unified.evil.op_STAR_,null);

return opencode_unified.evil.enter_insert_mode();
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"normal","normal",-1519123858))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,"v")))){
e.preventDefault();

return opencode_unified.evil.visual_start_BANG_(el,false);
} else {
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"normal","normal",-1519123858))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k,"V")))){
e.preventDefault();

return opencode_unified.evil.visual_start_BANG_(el,true);
} else {
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"normal","normal",-1519123858));
if(and__5000__auto__){
return op;
} else {
return and__5000__auto__;
}
})())){
e.preventDefault();

opencode_unified.evil.apply_op_motion_BANG_(el,op,k);

return cljs.core.reset_BANG_(opencode_unified.evil.op_STAR_,null);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"visual","visual",942787224))){
var G__14820 = k;
switch (G__14820) {
case "h":
e.preventDefault();

opencode_unified.evil.move_left_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "l":
e.preventDefault();

opencode_unified.evil.move_right_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "j":
e.preventDefault();

opencode_unified.evil.move_down_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "k":
e.preventDefault();

opencode_unified.evil.move_up_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "0":
e.preventDefault();

opencode_unified.evil.move_bol_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "$":
e.preventDefault();

opencode_unified.evil.move_eol_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "w":
e.preventDefault();

opencode_unified.evil.move_w_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "b":
e.preventDefault();

opencode_unified.evil.move_b_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "e":
e.preventDefault();

opencode_unified.evil.move_e_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "G":
e.preventDefault();

opencode_unified.evil.goto_end_BANG_(el);

return opencode_unified.evil.visual_update_BANG_(el);

break;
case "y":
e.preventDefault();

var start_pos = el.selectionStart;
var end_pos = el.selectionEnd;
var txt = el.value.substring((function (){var x__5090__auto__ = start_pos;
var y__5091__auto__ = end_pos;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),(function (){var x__5087__auto__ = start_pos;
var y__5088__auto__ = end_pos;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());
var txt_SINGLEQUOTE_ = ((cljs.core.not(txt.endsWith("\n")))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(txt),"\n"].join(''):txt);
opencode_unified.evil.yank_BANG_(txt_SINGLEQUOTE_,false);

return opencode_unified.evil.visual_exit_BANG_();

break;
case "d":
e.preventDefault();

if(cljs.core.truth_(ro_QMARK_)){
} else {
opencode_unified.evil.delete_range_BANG_(el,el.selectionStart,el.selectionEnd,false);
}

return opencode_unified.evil.visual_exit_BANG_();

break;
case "c":
e.preventDefault();

if(cljs.core.truth_(ro_QMARK_)){
} else {
opencode_unified.evil.change_range_BANG_(el,el.selectionStart,el.selectionEnd,false);
}

return opencode_unified.evil.visual_exit_BANG_();

break;
default:
return null;

}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,new cljs.core.Keyword(null,"normal","normal",-1519123858))){
var G__14821 = k;
switch (G__14821) {
case "y":
e.preventDefault();

return cljs.core.reset_BANG_(opencode_unified.evil.op_STAR_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"y","y",-1757859776),new cljs.core.Keyword(null,"anchor","anchor",1549638489),el.selectionStart], null));

break;
case "d":
e.preventDefault();

return cljs.core.reset_BANG_(opencode_unified.evil.op_STAR_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"d","d",1972142424),new cljs.core.Keyword(null,"anchor","anchor",1549638489),el.selectionStart], null));

break;
case "c":
e.preventDefault();

return cljs.core.reset_BANG_(opencode_unified.evil.op_STAR_,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"op","op",-1882987955),new cljs.core.Keyword(null,"c","c",-1763192079),new cljs.core.Keyword(null,"anchor","anchor",1549638489),el.selectionStart], null));

break;
case "Y":
e.preventDefault();

var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.yank_range_BANG_(el,opencode_unified.evil.line_start(s,p),(opencode_unified.evil.line_end(s,p) + (1)),true);

break;
case "D":
e.preventDefault();

if(cljs.core.truth_(ro_QMARK_)){
return null;
} else {
var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.delete_range_BANG_(el,p,opencode_unified.evil.line_end(s,p),false);
}

break;
case "C":
e.preventDefault();

if(cljs.core.truth_(ro_QMARK_)){
return null;
} else {
var s = el.value;
var p = el.selectionStart;
return opencode_unified.evil.change_range_BANG_(el,p,opencode_unified.evil.line_end(s,p),false);
}

break;
case "p":
e.preventDefault();

return opencode_unified.evil.paste_BANG_(el,false);

break;
case "P":
e.preventDefault();

return opencode_unified.evil.paste_BANG_(el,true);

break;
case "h":
e.preventDefault();

return opencode_unified.evil.move_left_BANG_(el);

break;
case "l":
e.preventDefault();

return opencode_unified.evil.move_right_BANG_(el);

break;
case "j":
e.preventDefault();

return opencode_unified.evil.move_down_BANG_(el);

break;
case "k":
e.preventDefault();

return opencode_unified.evil.move_up_BANG_(el);

break;
case "0":
e.preventDefault();

return opencode_unified.evil.move_bol_BANG_(el);

break;
case "$":
e.preventDefault();

return opencode_unified.evil.move_eol_BANG_(el);

break;
case "w":
e.preventDefault();

return opencode_unified.evil.move_w_BANG_(el);

break;
case "b":
e.preventDefault();

return opencode_unified.evil.move_b_BANG_(el);

break;
case "e":
e.preventDefault();

return opencode_unified.evil.move_e_BANG_(el);

break;
case "G":
e.preventDefault();

return opencode_unified.evil.goto_end_BANG_(el);

break;
default:
return null;

}
} else {
return null;

}
}
}
}
}
}
}
});
opencode_unified.evil.init = (function opencode_unified$evil$init(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Initializing Evil mode..."], 0));

opencode_unified.evil.enter_normal_mode();

opencode_unified.evil.update_statusbar();

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Evil mode initialized"], 0));
});
opencode_unified.evil.move_cursor = (function opencode_unified$evil$move_cursor(direction){
return opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14828 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14828,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14828,(1),null);
var line_count = (function (){var x__5087__auto__ = (1);
var y__5088__auto__ = opencode_unified.buffers.get_line_count(content);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var G__14831 = direction;
var G__14831__$1 = (((G__14831 instanceof cljs.core.Keyword))?G__14831.fqn:null);
switch (G__14831__$1) {
case "left":
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (cursor_pos - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})());

break;
case "right":
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(function (){var x__5090__auto__ = cljs.core.count(content);
var y__5091__auto__ = (cursor_pos + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());

break;
case "up":
var new_line = (function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (line - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var new_pos = opencode_unified.buffers.line_col_to_pos(content,new_line,col);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new_pos);

break;
case "down":
var new_line = (function (){var x__5090__auto__ = (line_count - (1));
var y__5091__auto__ = (line + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var new_pos = opencode_unified.buffers.line_col_to_pos(content,new_line,col);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),new_pos);

break;
default:
return buffer;

}
}));
});
opencode_unified.evil.word_forward = (function opencode_unified$evil$word_forward(){
return opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),opencode_unified.buffers.find_next_word_boundary(content,cursor_pos));
}));
});
opencode_unified.evil.word_backward = (function opencode_unified$evil$word_backward(){
return opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),opencode_unified.buffers.find_prev_word_boundary(content,cursor_pos));
}));
});
opencode_unified.evil.beginning_of_line = (function opencode_unified$evil$beginning_of_line(){
return opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14833 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14833,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14833,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),opencode_unified.buffers.line_col_to_pos(content,line,(0)));
}));
});
opencode_unified.evil.end_of_line = (function opencode_unified$evil$end_of_line(){
return opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14836 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14836,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14836,(1),null);
var line_content = (function (){var or__5002__auto__ = opencode_unified.buffers.get_line_content(content,line);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),opencode_unified.buffers.line_col_to_pos(content,line,cljs.core.count(line_content)));
}));
});
opencode_unified.evil.beginning_of_buffer = (function opencode_unified$evil$beginning_of_buffer(){
return opencode_unified.state.update_current_buffer_BANG_((function (p1__14839_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__14839_SHARP_,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(0));
}));
});
opencode_unified.evil.end_of_buffer = (function opencode_unified$evil$end_of_buffer(){
return opencode_unified.state.update_current_buffer_BANG_((function (buffer){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),cljs.core.count(new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer)));
}));
});
opencode_unified.evil.append_after_cursor = (function opencode_unified$evil$append_after_cursor(){
opencode_unified.evil.move_cursor(new cljs.core.Keyword(null,"right","right",-452581833));

return opencode_unified.evil.enter_insert_mode();
});
opencode_unified.evil.open_line_below = (function opencode_unified$evil$open_line_below(){
opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14840 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14840,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14840,(1),null);
var line_content = (function (){var or__5002__auto__ = opencode_unified.buffers.get_line_content(content,line);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var line_end = opencode_unified.buffers.line_col_to_pos(content,line,cljs.core.count(line_content));
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),line_end),"\n",cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,line_end)].join('');
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(line_end + (1))),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));

return opencode_unified.evil.enter_insert_mode();
});
opencode_unified.evil.open_line_above = (function opencode_unified$evil$open_line_above(){
opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14844 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14844,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14844,(1),null);
var line_start = opencode_unified.buffers.line_col_to_pos(content,line,(0));
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),line_start),"\n",cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,line_start)].join('');
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),line_start),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));

return opencode_unified.evil.enter_insert_mode();
});
opencode_unified.evil.delete_current_line = (function opencode_unified$evil$delete_current_line(){
var buffer = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(buffer)){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14847 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14847,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14847,(1),null);
var vec__14850 = (function (){var or__5002__auto__ = opencode_unified.buffers.get_line_range(content,line);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),cljs.core.count(content)], null);
}
})();
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14850,(0),null);
var end_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14850,(1),null);
var newline_pos = (((((end_pos < cljs.core.count(content))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(content,end_pos),"\n"))))?(end_pos + (1)):end_pos);
var deleted = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,start_pos,newline_pos);
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),start_pos),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,newline_pos)].join('');
opencode_unified.state.set_evil_register_BANG_(deleted);

return opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(function (){var x__5090__auto__ = start_pos;
var y__5091__auto__ = ((new_content).length);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})()),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));
} else {
return null;
}
});
opencode_unified.evil.yank_line = (function opencode_unified$evil$yank_line(){
var buffer = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(buffer)){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14861 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14861,(0),null);
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14861,(1),null);
var vec__14864 = (function (){var or__5002__auto__ = opencode_unified.buffers.get_line_range(content,line);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(0),cljs.core.count(content)], null);
}
})();
var start_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14864,(0),null);
var end_pos = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14864,(1),null);
var newline_pos = (((((end_pos < cljs.core.count(content))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(content,end_pos),"\n"))))?(end_pos + (1)):end_pos);
var yanked = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,start_pos,newline_pos);
return opencode_unified.state.set_evil_register_BANG_(yanked);
} else {
return null;
}
});
opencode_unified.evil.paste_register = (function opencode_unified$evil$paste_register(before_QMARK_){
return opencode_unified.state.update_current_buffer_BANG_((function (buffer){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var register_text = (function (){var or__5002__auto__ = opencode_unified.state.get_evil_register();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})();
var insert_pos = (cljs.core.truth_(before_QMARK_)?cursor_pos:(function (){var x__5090__auto__ = cljs.core.count(content);
var y__5091__auto__ = (cursor_pos + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})());
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),insert_pos),cljs.core.str.cljs$core$IFn$_invoke$arity$1(register_text),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,insert_pos)].join('');
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(buffer,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),(insert_pos + cljs.core.count(register_text))),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));
});
opencode_unified.evil.paste_after = (function opencode_unified$evil$paste_after(){
return opencode_unified.evil.paste_register(false);
});
opencode_unified.evil.paste_before = (function opencode_unified$evil$paste_before(){
return opencode_unified.evil.paste_register(true);
});
opencode_unified.evil.undo = (function opencode_unified$evil$undo(){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","Undo not implemented","Evil Mode - normal");
});
opencode_unified.evil.redo = (function opencode_unified$evil$redo(){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","Redo not implemented","Evil Mode - normal");
});
opencode_unified.evil.search_forward = (function opencode_unified$evil$search_forward(){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","Search forward not implemented","Evil Mode - normal");
});
opencode_unified.evil.search_backward = (function opencode_unified$evil$search_backward(){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","Search backward not implemented","Evil Mode - normal");
});
opencode_unified.evil.next_search_result = (function opencode_unified$evil$next_search_result(){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","Next search result not implemented","Evil Mode - normal");
});
opencode_unified.evil.previous_search_result = (function opencode_unified$evil$previous_search_result(){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","Previous search result not implemented","Evil Mode - normal");
});
opencode_unified.evil.extend_selection = (function opencode_unified$evil$extend_selection(direction){
var buffer = opencode_unified.state.get_current_buffer();
if(cljs.core.truth_(buffer)){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var cursor_pos = new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440).cljs$core$IFn$_invoke$arity$1(buffer);
var vec__14876 = opencode_unified.buffers.pos_to_line_col(content,cursor_pos);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14876,(0),null);
var col = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14876,(1),null);
var line_count = (function (){var x__5087__auto__ = (1);
var y__5088__auto__ = opencode_unified.buffers.get_line_count(content);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var next_pos = (function (){var G__14879 = direction;
var G__14879__$1 = (((G__14879 instanceof cljs.core.Keyword))?G__14879.fqn:null);
switch (G__14879__$1) {
case "left":
var x__5087__auto__ = (0);
var y__5088__auto__ = (cursor_pos - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);

break;
case "right":
var x__5090__auto__ = cljs.core.count(content);
var y__5091__auto__ = (cursor_pos + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);

break;
case "up":
return opencode_unified.buffers.line_col_to_pos(content,(function (){var x__5087__auto__ = (0);
var y__5088__auto__ = (line - (1));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})(),col);

break;
case "down":
return opencode_unified.buffers.line_col_to_pos(content,(function (){var x__5090__auto__ = (line_count - (1));
var y__5091__auto__ = (line + (1));
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})(),col);

break;
case "word-forward":
return opencode_unified.buffers.find_next_word_boundary(content,cursor_pos);

break;
case "word-backward":
return opencode_unified.buffers.find_prev_word_boundary(content,cursor_pos);

break;
default:
return cursor_pos;

}
})();
return opencode_unified.state.update_current_buffer_BANG_((function (b){
var selection = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(b);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),cursor_pos,new cljs.core.Keyword(null,"end","end",-268185958),cursor_pos], null);
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),next_pos),new cljs.core.Keyword(null,"selection","selection",975998651),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",-355208981),new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(selection),new cljs.core.Keyword(null,"end","end",-268185958),next_pos], null));
}));
} else {
return null;
}
});
opencode_unified.evil.delete_selection = (function opencode_unified$evil$delete_selection(){
var buffer = opencode_unified.state.get_current_buffer();
var selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(buffer);
if(cljs.core.truth_((function (){var and__5000__auto__ = buffer;
if(cljs.core.truth_(and__5000__auto__)){
return selection;
} else {
return and__5000__auto__;
}
})())){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var start_pos = (function (){var x__5090__auto__ = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(selection);
var y__5091__auto__ = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(selection);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var end_pos = (function (){var x__5087__auto__ = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(selection);
var y__5088__auto__ = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(selection);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var deleted = cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,start_pos,end_pos);
var new_content = [cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,(0),start_pos),cljs.core.subs.cljs$core$IFn$_invoke$arity$2(content,end_pos)].join('');
opencode_unified.state.set_evil_register_BANG_(deleted);

opencode_unified.state.update_current_buffer_BANG_((function (b){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(b,new cljs.core.Keyword(null,"content","content",15833224),new_content),new cljs.core.Keyword(null,"cursor-pos","cursor-pos",-1464230440),start_pos),new cljs.core.Keyword(null,"selection","selection",975998651),null),new cljs.core.Keyword(null,"modified?","modified?",-2109276969),true);
}));

return opencode_unified.evil.enter_normal_mode();
} else {
return null;
}
});
opencode_unified.evil.yank_selection = (function opencode_unified$evil$yank_selection(){
var buffer = opencode_unified.state.get_current_buffer();
var selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(buffer);
if(cljs.core.truth_((function (){var and__5000__auto__ = buffer;
if(cljs.core.truth_(and__5000__auto__)){
return selection;
} else {
return and__5000__auto__;
}
})())){
var content = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer);
var start_pos = (function (){var x__5090__auto__ = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(selection);
var y__5091__auto__ = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(selection);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var end_pos = (function (){var x__5087__auto__ = new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(selection);
var y__5088__auto__ = new cljs.core.Keyword(null,"end","end",-268185958).cljs$core$IFn$_invoke$arity$1(selection);
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
opencode_unified.state.set_evil_register_BANG_(cljs.core.subs.cljs$core$IFn$_invoke$arity$3(content,start_pos,end_pos));

return opencode_unified.evil.enter_normal_mode();
} else {
return null;
}
});
opencode_unified.evil.change_selection = (function opencode_unified$evil$change_selection(){
opencode_unified.evil.delete_selection();

return opencode_unified.evil.enter_insert_mode();
});

//# sourceMappingURL=opencode_unified.evil.js.map
