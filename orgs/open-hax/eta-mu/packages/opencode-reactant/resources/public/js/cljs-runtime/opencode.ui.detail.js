goog.provide('opencode.ui.detail');
opencode.ui.detail.loading_spinner = (function opencode$ui$detail$loading_spinner(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-center.h-64","div.flex.items-center.justify-center.h-64",-113763501),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.animate-spin.rounded-full.h-12.w-12.border-4.border-gray-300.border-t-blue-600","div.animate-spin.rounded-full.h-12.w-12.border-4.border-gray-300.border-t-blue-600",-1630290759)], null)], null);
});
opencode.ui.detail.error_message = (function opencode$ui$detail$error_message(error){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-red-50.border.border-red-200.text-red-700.px-4.py-3.rounded-md.m-4","div.bg-red-50.border.border-red-200.text-red-700.px-4.py-3.rounded-md.m-4",-1887687766),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex","div.flex",-396986231),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-shrink-0","div.flex-shrink-0",114780493),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"svg.h-5.w-5.text-red-400","svg.h-5.w-5.text-red-400",-637877123),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"viewBox","viewBox",-469489477),"0 0 20 20",new cljs.core.Keyword(null,"fill","fill",883462889),"currentColor"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill-rule","fill-rule",-1824841598),"evenodd",new cljs.core.Keyword(null,"d","d",1972142424),"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",new cljs.core.Keyword(null,"clip-rule","clip-rule",335492201),"evenodd"], null)], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.ml-3","div.ml-3",-430290733),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-sm.font-medium","h3.text-sm.font-medium",-199077668),"Error"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm","div.text-sm",1753784969),error], null)], null)], null)], null);
});
opencode.ui.detail.back_button = (function opencode$ui$detail$back_button(target){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.flex.items-center.text-blue-600.hover:text-blue-800.mb-4.transition-colors","button.flex.items-center.text-blue-600.hover:text-blue-800.mb-4.transition-colors",665918736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode.ui.router.navigate_BANG_(target);
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"svg.w-4.h-4.mr-2","svg.w-4.h-4.mr-2",2110360059),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"viewBox","viewBox",-469489477),"0 0 20 20",new cljs.core.Keyword(null,"fill","fill",883462889),"currentColor"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"path","path",-188191168),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"fill-rule","fill-rule",-1824841598),"evenodd",new cljs.core.Keyword(null,"d","d",1972142424),"M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z",new cljs.core.Keyword(null,"clip-rule","clip-rule",335492201),"evenodd"], null)], null)], null),"Back"], null);
});
opencode.ui.detail.issue_content = (function opencode$ui$detail$issue_content(data){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.overflow-y-auto.p-6","div.flex-1.overflow-y-auto.p-6",1750004506),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.max-w-4xl.mx-auto","div.max-w-4xl.mx-auto",-632513328),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.rounded-lg.shadow-sm.p-6.mb-6","div.bg-white.rounded-lg.shadow-sm.p-6.mb-6",1339672405),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-4","div.flex.items-center.justify-between.mb-4",-2021621261),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-2xl.font-bold.text-gray-900","h1.text-2xl.font-bold.text-gray-900",1174671046),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(data)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.px-3.py-1.text-sm.font-semibold.rounded-full","span.px-3.py-1.text-sm.font-semibold.rounded-full",-363041714),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(data),"open"))?"bg-green-100.text-green-800":"bg-gray-100.text-gray-800")], null),new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(data)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-500.mb-4","div.text-sm.text-gray-500.mb-4",-2012877734),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Issue #",new cljs.core.Keyword(null,"number","number",1570378438).cljs$core$IFn$_invoke$arity$1(data)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mx-2","span.mx-2",1754833005),"\u2022"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),["Created by ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(data))].join('')], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.whitespace-pre-wrap","div.text-gray-700.whitespace-pre-wrap",1708482264),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(data)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-4","div.space-y-4",-437067713),cljs.core.doall.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function opencode$ui$detail$issue_content_$_iter__14053(s__14054){
return (new cljs.core.LazySeq(null,(function (){
var s__14054__$1 = s__14054;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14054__$1);
if(temp__5804__auto__){
var s__14054__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14054__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14054__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14056 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14055 = (0);
while(true){
if((i__14055 < size__5479__auto__)){
var comment = cljs.core._nth(c__5478__auto__,i__14055);
cljs.core.chunk_append(b__14056,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.rounded-lg.shadow-sm.p-4","div.bg-white.rounded-lg.shadow-sm.p-4",735069009),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.mb-3","div.flex.items-center.mb-3",-1999123666),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-8.h-8.bg-gray-300.rounded-full.mr-3","div.w-8.h-8.bg-gray-300.rounded-full.mr-3",2075341613)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium.text-gray-900","div.text-sm.font-medium.text-gray-900",2072410994),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(comment)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(comment)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.whitespace-pre-wrap","div.text-gray-700.whitespace-pre-wrap",1708482264),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(comment)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(comment)], null)));

var G__14068 = (i__14055 + (1));
i__14055 = G__14068;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14056),opencode$ui$detail$issue_content_$_iter__14053(cljs.core.chunk_rest(s__14054__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14056),null);
}
} else {
var comment = cljs.core.first(s__14054__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.rounded-lg.shadow-sm.p-4","div.bg-white.rounded-lg.shadow-sm.p-4",735069009),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.mb-3","div.flex.items-center.mb-3",-1999123666),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-8.h-8.bg-gray-300.rounded-full.mr-3","div.w-8.h-8.bg-gray-300.rounded-full.mr-3",2075341613)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium.text-gray-900","div.text-sm.font-medium.text-gray-900",2072410994),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(comment)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(comment)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.whitespace-pre-wrap","div.text-gray-700.whitespace-pre-wrap",1708482264),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(comment)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(comment)], null)),opencode$ui$detail$issue_content_$_iter__14053(cljs.core.rest(s__14054__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"comments","comments",-293346423).cljs$core$IFn$_invoke$arity$1(data));
})())], null)], null)], null);
});
opencode.ui.detail.pr_content = (function opencode$ui$detail$pr_content(data){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.overflow-y-auto.p-6","div.flex-1.overflow-y-auto.p-6",1750004506),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.max-w-4xl.mx-auto","div.max-w-4xl.mx-auto",-632513328),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.rounded-lg.shadow-sm.p-6.mb-6","div.bg-white.rounded-lg.shadow-sm.p-6.mb-6",1339672405),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-4","div.flex.items-center.justify-between.mb-4",-2021621261),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-2xl.font-bold.text-gray-900","h1.text-2xl.font-bold.text-gray-900",1174671046),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(data)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.px-3.py-1.text-sm.font-semibold.rounded-full","span.px-3.py-1.text-sm.font-semibold.rounded-full",-363041714),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(data),"open"))?"bg-green-100.text-green-800":"bg-red-100.text-red-800")], null),new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(data)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-500.mb-4","div.text-sm.text-gray-500.mb-4",-2012877734),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"PR #",new cljs.core.Keyword(null,"number","number",1570378438).cljs$core$IFn$_invoke$arity$1(data)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.mx-2","span.mx-2",1754833005),"\u2022"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),["Created by ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(data))].join('')], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.whitespace-pre-wrap","div.text-gray-700.whitespace-pre-wrap",1708482264),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(data)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.rounded-lg.shadow-sm.p-6.mb-6","div.bg-white.rounded-lg.shadow-sm.p-6.mb-6",1339672405),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-lg.font-semibold.text-gray-900.mb-4","h2.text-lg.font-semibold.text-gray-900.mb-4",338664554),"Files Changed"], null),(function (){var iter__5480__auto__ = (function opencode$ui$detail$pr_content_$_iter__14057(s__14058){
return (new cljs.core.LazySeq(null,(function (){
var s__14058__$1 = s__14058;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14058__$1);
if(temp__5804__auto__){
var s__14058__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14058__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14058__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14060 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14059 = (0);
while(true){
if((i__14059 < size__5479__auto__)){
var file = cljs.core._nth(c__5478__auto__,i__14059);
cljs.core.chunk_append(b__14060,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.border-b.border-gray-200.py-3.last:border-b-0","div.border-b.border-gray-200.py-3.last:border-b-0",-883853231),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between","div.flex.items-center.justify-between",-1166700937),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium.text-gray-900","div.text-sm.font-medium.text-gray-900",2072410994),new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(file)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),["+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"additions","additions",-1894561789).cljs$core$IFn$_invoke$arity$1(file))," -",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"deletions","deletions",733146228).cljs$core$IFn$_invoke$arity$1(file))].join('')], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.text-blue-600.hover:text-blue-800.text-sm","button.text-blue-600.hover:text-blue-800.text-sm",-2057622005),"View"], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(file)], null)));

var G__14069 = (i__14059 + (1));
i__14059 = G__14069;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14060),opencode$ui$detail$pr_content_$_iter__14057(cljs.core.chunk_rest(s__14058__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14060),null);
}
} else {
var file = cljs.core.first(s__14058__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.border-b.border-gray-200.py-3.last:border-b-0","div.border-b.border-gray-200.py-3.last:border-b-0",-883853231),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between","div.flex.items-center.justify-between",-1166700937),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium.text-gray-900","div.text-sm.font-medium.text-gray-900",2072410994),new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(file)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),["+",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"additions","additions",-1894561789).cljs$core$IFn$_invoke$arity$1(file))," -",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"deletions","deletions",733146228).cljs$core$IFn$_invoke$arity$1(file))].join('')], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.text-blue-600.hover:text-blue-800.text-sm","button.text-blue-600.hover:text-blue-800.text-sm",-2057622005),"View"], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(file)], null)),opencode$ui$detail$pr_content_$_iter__14057(cljs.core.rest(s__14058__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"files","files",-472457450).cljs$core$IFn$_invoke$arity$1(data));
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-4","div.space-y-4",-437067713),cljs.core.doall.cljs$core$IFn$_invoke$arity$1((function (){var iter__5480__auto__ = (function opencode$ui$detail$pr_content_$_iter__14061(s__14062){
return (new cljs.core.LazySeq(null,(function (){
var s__14062__$1 = s__14062;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14062__$1);
if(temp__5804__auto__){
var s__14062__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14062__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14062__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14064 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14063 = (0);
while(true){
if((i__14063 < size__5479__auto__)){
var comment = cljs.core._nth(c__5478__auto__,i__14063);
cljs.core.chunk_append(b__14064,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.rounded-lg.shadow-sm.p-4","div.bg-white.rounded-lg.shadow-sm.p-4",735069009),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.mb-3","div.flex.items-center.mb-3",-1999123666),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-8.h-8.bg-gray-300.rounded-full.mr-3","div.w-8.h-8.bg-gray-300.rounded-full.mr-3",2075341613)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium.text-gray-900","div.text-sm.font-medium.text-gray-900",2072410994),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(comment)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(comment)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.whitespace-pre-wrap","div.text-gray-700.whitespace-pre-wrap",1708482264),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(comment)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(comment)], null)));

var G__14070 = (i__14063 + (1));
i__14063 = G__14070;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14064),opencode$ui$detail$pr_content_$_iter__14061(cljs.core.chunk_rest(s__14062__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14064),null);
}
} else {
var comment = cljs.core.first(s__14062__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.rounded-lg.shadow-sm.p-4","div.bg-white.rounded-lg.shadow-sm.p-4",735069009),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.mb-3","div.flex.items-center.mb-3",-1999123666),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-8.h-8.bg-gray-300.rounded-full.mr-3","div.w-8.h-8.bg-gray-300.rounded-full.mr-3",2075341613)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.font-medium.text-gray-900","div.text-sm.font-medium.text-gray-900",2072410994),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(comment)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(comment)], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.whitespace-pre-wrap","div.text-gray-700.whitespace-pre-wrap",1708482264),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(comment)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(comment)], null)),opencode$ui$detail$pr_content_$_iter__14061(cljs.core.rest(s__14062__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"comments","comments",-293346423).cljs$core$IFn$_invoke$arity$1(data));
})())], null)], null)], null);
});
opencode.ui.detail.issue_detail = (function opencode$ui$detail$issue_detail(){
var issue_id = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode.ui.router.current_page),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.Keyword(null,"id","id",-1388402092)], null));
var data = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var loading_QMARK_ = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(true);
var error = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var stop_watch = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
return reagent.core.create_class.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"component-did-mount","component-did-mount",-1126910518),(function (){
cljs.core.reset_BANG_(loading_QMARK_,true);

cljs.core.reset_BANG_(error,null);

cljs.core.reset_BANG_(data,null);

var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var cache_key = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(issue_id)].join('');
var cached_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode.ui.github.issue_detail_cache),cache_key);
if(cljs.core.truth_(cached_data)){
if(cljs.core.truth_(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached_data))){
cljs.core.reset_BANG_(error,new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached_data));
} else {
}

cljs.core.reset_BANG_(data,(cljs.core.truth_(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached_data))?null:cached_data));

return cljs.core.reset_BANG_(loading_QMARK_,false);
} else {
cljs.core.reset_BANG_(stop_watch,opencode.ui.github.watch_cache_once_BANG_(opencode.ui.github.issue_detail_cache,cache_key,(function (cached){
if(cljs.core.truth_(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached))){
cljs.core.reset_BANG_(error,new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached));
} else {
cljs.core.reset_BANG_(data,cached);
}

return cljs.core.reset_BANG_(loading_QMARK_,false);
})));

return opencode.ui.github.fetch_issue_detail_BANG_(issue_id);
}
}),new cljs.core.Keyword(null,"component-will-unmount","component-will-unmount",-2058314698),(function (){
var temp__5804__auto__ = cljs.core.deref(stop_watch);
if(cljs.core.truth_(temp__5804__auto__)){
var stop = temp__5804__auto__;
return (stop.cljs$core$IFn$_invoke$arity$0 ? stop.cljs$core$IFn$_invoke$arity$0() : stop.call(null));
} else {
return null;
}
}),new cljs.core.Keyword(null,"reagent-render","reagent-render",-985383853),(function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.h-screen.bg-gray-50.flex.flex-col","div.h-screen.bg-gray-50.flex.flex-col",-1330691461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.back_button,new cljs.core.Keyword("opencode.ui.router","issues","opencode.ui.router/issues",-2012217839)], null),(cljs.core.truth_(cljs.core.deref(loading_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.loading_spinner], null):(cljs.core.truth_(cljs.core.deref(error))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.error_message,cljs.core.deref(error)], null):(cljs.core.truth_(cljs.core.deref(data))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.issue_content,cljs.core.deref(data)], null):null
)))], null);
})], null));
});
opencode.ui.detail.pr_detail = (function opencode$ui$detail$pr_detail(){
var pr_id = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode.ui.router.current_page),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.Keyword(null,"id","id",-1388402092)], null));
var data = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var loading_QMARK_ = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(true);
var error = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(null);
var stop_watch = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
return reagent.core.create_class.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"component-did-mount","component-did-mount",-1126910518),(function (){
cljs.core.reset_BANG_(loading_QMARK_,true);

cljs.core.reset_BANG_(error,null);

cljs.core.reset_BANG_(data,null);

var repo = new cljs.core.Keyword(null,"repo","repo",-1999060679).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var cache_key = [cljs.core.str.cljs$core$IFn$_invoke$arity$1(repo),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(pr_id)].join('');
var cached_data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode.ui.github.pr_detail_cache),cache_key);
if(cljs.core.truth_(cached_data)){
if(cljs.core.truth_(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached_data))){
cljs.core.reset_BANG_(error,new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached_data));
} else {
}

cljs.core.reset_BANG_(data,(cljs.core.truth_(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached_data))?null:cached_data));

return cljs.core.reset_BANG_(loading_QMARK_,false);
} else {
cljs.core.reset_BANG_(stop_watch,opencode.ui.github.watch_cache_once_BANG_(opencode.ui.github.pr_detail_cache,cache_key,(function (cached){
if(cljs.core.truth_(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached))){
cljs.core.reset_BANG_(error,new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(cached));
} else {
cljs.core.reset_BANG_(data,cached);
}

return cljs.core.reset_BANG_(loading_QMARK_,false);
})));

return opencode.ui.github.fetch_pr_detail_BANG_(pr_id);
}
}),new cljs.core.Keyword(null,"component-will-unmount","component-will-unmount",-2058314698),(function (){
var temp__5804__auto__ = cljs.core.deref(stop_watch);
if(cljs.core.truth_(temp__5804__auto__)){
var stop = temp__5804__auto__;
return (stop.cljs$core$IFn$_invoke$arity$0 ? stop.cljs$core$IFn$_invoke$arity$0() : stop.call(null));
} else {
return null;
}
}),new cljs.core.Keyword(null,"reagent-render","reagent-render",-985383853),(function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.h-screen.bg-gray-50.flex.flex-col","div.h-screen.bg-gray-50.flex.flex-col",-1330691461),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.back_button,new cljs.core.Keyword("opencode.ui.router","prs","opencode.ui.router/prs",50239957)], null),(cljs.core.truth_(cljs.core.deref(loading_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.loading_spinner], null):(cljs.core.truth_(cljs.core.deref(error))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.error_message,cljs.core.deref(error)], null):(cljs.core.truth_(cljs.core.deref(data))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.detail.pr_content,cljs.core.deref(data)], null):null
)))], null);
})], null));
});

//# sourceMappingURL=opencode.ui.detail.js.map
