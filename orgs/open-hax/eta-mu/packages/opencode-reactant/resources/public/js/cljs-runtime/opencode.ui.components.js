goog.provide('opencode.ui.components');
opencode.ui.components.issue_item = (function opencode$ui$components$issue_item(issue){
var number = ((cljs.core.map_QMARK_(issue))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"number","number",1570378438).cljs$core$IFn$_invoke$arity$1(issue);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(issue,"number");
}
})():issue.number);
var title = ((cljs.core.map_QMARK_(issue))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(issue);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(issue,"title");
}
})():issue.title);
var state = ((cljs.core.map_QMARK_(issue))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(issue);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(issue,"state");
}
})():issue.state);
var id = ((cljs.core.map_QMARK_(issue))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(issue);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(issue,"id");
}
})():issue.id);
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all.cursor-pointer","div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all.cursor-pointer",464734224),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),["issue-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode.ui.router.navigate_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("opencode.ui.router","issue","opencode.ui.router/issue",1018127921),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(number)], 0));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-2","div.flex.items-center.justify-between.mb-2",1514079906),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.text-gray-500","span.text-sm.font-medium.text-gray-500",1794883090),["#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(number)].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.px-2.py-1.text-xs.font-semibold.rounded-full","span.px-2.py-1.text-xs.font-semibold.rounded-full",914258172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"open"))?"bg-green-100.text-green-800":"bg-gray-100.text-gray-800")], null),state], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-lg.font-semibold.text-gray-900.mb-3.hover:text-blue-600.transition-colors","div.text-lg.font-semibold.text-gray-900.mb-3.hover:text-blue-600.transition-colors",-1641589733),title], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.gap-2","div.flex.gap-2",-268700868),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-blue-500.hover:bg-blue-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-blue-500.focus:ring-offset-2","button.bg-blue-500.hover:bg-blue-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-blue-500.focus:ring-offset-2",199957908),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
e.stopPropagation();

return opencode.ui.github.create_worktree_BANG_(number);
})], null),"Create worktree"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-gray-500.hover:bg-gray-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-gray-500.focus:ring-offset-2","button.bg-gray-500.hover:bg-gray-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-gray-500.focus:ring-offset-2",-1522222905),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (e){
e.stopPropagation();

return opencode.ui.github.open_pr_BANG_(number);
})], null),"Open PR"], null)], null)], null);
});
opencode.ui.components.pr_item = (function opencode$ui$components$pr_item(pr){
var number = ((cljs.core.map_QMARK_(pr))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"number","number",1570378438).cljs$core$IFn$_invoke$arity$1(pr);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(pr,"number");
}
})():pr.number);
var title = ((cljs.core.map_QMARK_(pr))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(pr);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(pr,"title");
}
})():pr.title);
var state = ((cljs.core.map_QMARK_(pr))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(pr);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(pr,"state");
}
})():pr.state);
var id = ((cljs.core.map_QMARK_(pr))?(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(pr);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(pr,"id");
}
})():pr.id);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all.cursor-pointer","div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all.cursor-pointer",464734224),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"key","key",-1516042587),["pr-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(id)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode.ui.router.navigate_BANG_.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("opencode.ui.router","pr","opencode.ui.router/pr",1581778800),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.str.cljs$core$IFn$_invoke$arity$1(number)], 0));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-2","div.flex.items-center.justify-between.mb-2",1514079906),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.text-gray-500","span.text-sm.font-medium.text-gray-500",1794883090),["PR #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(number)].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.px-2.py-1.text-xs.font-semibold.rounded-full","span.px-2.py-1.text-xs.font-semibold.rounded-full",914258172),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"open"))?"bg-green-100.text-green-800":((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(state,"merged"))?"bg-purple-100.text-purple-800":"bg-gray-100.text-gray-800"
))], null),state], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-lg.font-semibold.text-gray-900.hover:text-blue-600.transition-colors","div.text-lg.font-semibold.text-gray-900.hover:text-blue-600.transition-colors",1217877967),title], null)], null);
});
opencode.ui.components.worktree_item = (function opencode$ui$components$worktree_item(worktree){
var issue = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"issue","issue",1725456421).cljs$core$IFn$_invoke$arity$1(worktree);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(worktree,"issue");
}
})();
var branch = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"branch","branch",-74633925).cljs$core$IFn$_invoke$arity$1(worktree);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(worktree,"branch");
}
})();
var path = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(worktree);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.get.cljs$core$IFn$_invoke$arity$2(worktree,"path");
}
})();
var id = ["worktree-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(issue)].join('');
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all","div.bg-white.border.border-gray-200.p-4.rounded-lg.mb-3.shadow-sm.hover:shadow-md.hover:bg-gray-50.transition-all",509967696),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-2","div.flex.items-center.justify-between.mb-2",1514079906),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.text-gray-500","span.text-sm.font-medium.text-gray-500",1794883090),["Issue #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(issue)].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.px-2.py-1.text-xs.font-semibold.rounded-full.bg-blue-100.text-blue-800","span.px-2.py-1.text-xs.font-semibold.rounded-full.bg-blue-100.text-blue-800",-1195009378),"Worktree"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-lg.font-semibold.text-gray-900.mb-1","div.text-lg.font-semibold.text-gray-900.mb-1",1808851347),branch], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600.mb-3","div.text-sm.text-gray-600.mb-3",-569394073),path], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.gap-2","div.flex.gap-2",-268700868),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-green-500.hover:bg-green-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-green-500.focus:ring-offset-2","button.bg-green-500.hover:bg-green-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-green-500.focus:ring-offset-2",-1377800042),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return alert(["Open worktree: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(path)].join(''));
})], null),"Open"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-red-500.hover:bg-red-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-red-500.focus:ring-offset-2","button.bg-red-500.hover:bg-red-600.text-white.px-3.py-1.5.rounded-md.text-sm.font-medium.transition-colors.focus:outline-none.focus:ring-2.focus:ring-red-500.focus:ring-offset-2",-345857422),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return alert(["Remove worktree for issue #",cljs.core.str.cljs$core$IFn$_invoke$arity$1(issue)].join(''));
})], null),"Remove"], null)], null)], null);
});
opencode.ui.components.scrolling_container = (function opencode$ui$components$scrolling_container(var_args){
var args__5732__auto__ = [];
var len__5726__auto___14109 = arguments.length;
var i__5727__auto___14110 = (0);
while(true){
if((i__5727__auto___14110 < len__5726__auto___14109)){
args__5732__auto__.push((arguments[i__5727__auto___14110]));

var G__14111 = (i__5727__auto___14110 + (1));
i__5727__auto___14110 = G__14111;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return opencode.ui.components.scrolling_container.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(opencode.ui.components.scrolling_container.cljs$core$IFn$_invoke$arity$variadic = (function (title,content,p__14071){
var map__14072 = p__14071;
var map__14072__$1 = cljs.core.__destructure_map(map__14072);
var max_height = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14072__$1,new cljs.core.Keyword(null,"max-height","max-height",-612563804));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14072__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var extra_header_content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14072__$1,new cljs.core.Keyword(null,"extra-header-content","extra-header-content",114215579));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.h-full.min-h-0","div.flex.flex-col.h-full.min-h-0",-602248938),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-4.flex-shrink-0","div.flex.items-center.justify-between.mb-4.flex-shrink-0",-814825091),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-xl.font-bold.text-gray-900","h2.text-xl.font-bold.text-gray-900",-882313496),title], null),(cljs.core.truth_(extra_header_content)?extra_header_content:null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.overflow-y-auto.px-1.min-h-0","div.flex-1.overflow-y-auto.px-1.min-h-0",2098333082),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),(function (){var or__5002__auto__ = class$;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword(null,"style","style",-496642736),(cljs.core.truth_(max_height)?new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"max-height","max-height",-612563804),max_height], null):null)], null),content], null)], null);
}));

(opencode.ui.components.scrolling_container.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(opencode.ui.components.scrolling_container.cljs$lang$applyTo = (function (seq14065){
var G__14066 = cljs.core.first(seq14065);
var seq14065__$1 = cljs.core.next(seq14065);
var G__14067 = cljs.core.first(seq14065__$1);
var seq14065__$2 = cljs.core.next(seq14065__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14066,G__14067,seq14065__$2);
}));

opencode.ui.components.events_log = (function opencode$ui$components$events_log(){
var evts = cljs.core.reverse(new cljs.core.Keyword(null,"events","events",1792552201).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state)));
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.scrolling_container,"Events",new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.rounded-lg.shadow-sm.overflow-hidden","div.bg-white.border.border-gray-200.rounded-lg.shadow-sm.overflow-hidden",804012424),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-gray-50.px-4.py-3.border-b.border-gray-200","div.bg-gray-50.px-4.py-3.border-b.border-gray-200",2102211201),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between","div.flex.items-center.justify-between",-1166700937),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium.text-gray-700","span.text-sm.font-medium.text-gray-700",1249355018),"Event Log"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-xs.text-gray-500","span.text-xs.text-gray-500",509898811),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(evts))," events"].join('')], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),((cljs.core.seq(evts))?(function (){var iter__5480__auto__ = (function opencode$ui$components$events_log_$_iter__14073(s__14074){
return (new cljs.core.LazySeq(null,(function (){
var s__14074__$1 = s__14074;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14074__$1);
if(temp__5804__auto__){
var s__14074__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14074__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14074__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14076 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14075 = (0);
while(true){
if((i__14075 < size__5479__auto__)){
var vec__14077 = cljs.core._nth(c__5478__auto__,i__14075);
var i = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14077,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14077,(1),null);
cljs.core.chunk_append(b__14076,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50","div.px-4.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50",-218676711),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.text-xs.font-mono.text-gray-700","pre.text-xs.font-mono.text-gray-700",1413154758),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e], 0))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),i], null)));

var G__14112 = (i__14075 + (1));
i__14075 = G__14112;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14076),opencode$ui$components$events_log_$_iter__14073(cljs.core.chunk_rest(s__14074__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14076),null);
}
} else {
var vec__14080 = cljs.core.first(s__14074__$2);
var i = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14080,(0),null);
var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14080,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.px-4.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50","div.px-4.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50",-218676711),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.text-xs.font-mono.text-gray-700","pre.text-xs.font-mono.text-gray-700",1413154758),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([e], 0))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),i], null)),opencode$ui$components$events_log_$_iter__14073(cljs.core.rest(s__14074__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,evts));
})():new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-8.text-center","div.p-8.text-center",880434577),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-3xl.mb-3","div.text-3xl.mb-3",-329888023),"\uD83D\uDCDD"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-600.font-medium","p.text-gray-600.font-medium",-866406294),"No events yet."], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-400.mt-2","p.text-sm.text-gray-400.mt-2",-1496931710),"Events will appear here as you interact with the application."], null)], null))], null)], null),new cljs.core.Keyword(null,"max-height","max-height",-612563804),"300px"], null);
});
opencode.ui.components.issues_section = (function opencode$ui$components$issues_section(issues){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.h-full.min-h-0","div.flex.flex-col.h-full.min-h-0",-602248938),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.scrolling_container,"Issues",((cljs.core.seq(issues))?(function (){var iter__5480__auto__ = (function opencode$ui$components$issues_section_$_iter__14083(s__14084){
return (new cljs.core.LazySeq(null,(function (){
var s__14084__$1 = s__14084;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14084__$1);
if(temp__5804__auto__){
var s__14084__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14084__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14084__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14086 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14085 = (0);
while(true){
if((i__14085 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__14085);
cljs.core.chunk_append(b__14086,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.issue_item,i], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(i)], null)));

var G__14113 = (i__14085 + (1));
i__14085 = G__14113;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14086),opencode$ui$components$issues_section_$_iter__14083(cljs.core.chunk_rest(s__14084__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14086),null);
}
} else {
var i = cljs.core.first(s__14084__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.issue_item,i], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(i)], null)),opencode$ui$components$issues_section_$_iter__14083(cljs.core.rest(s__14084__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(issues);
})():new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm","div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm",942177175),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-4xl.mb-3","div.text-4xl.mb-3",-320479355),"\uD83D\uDCCB"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-600.font-medium","p.text-gray-600.font-medium",-866406294),"No issues loaded."], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-400.mt-2","p.text-sm.text-gray-400.mt-2",-1496931710),"Issues will appear here once connected to GitHub."], null)], null))], null)], null);
});
opencode.ui.components.prs_section = (function opencode$ui$components$prs_section(prs){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.flex-col.h-full.min-h-0","div.flex.flex-col.h-full.min-h-0",-602248938),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.scrolling_container,"Pull Requests",(cljs.core.truth_((function (){var and__5000__auto__ = prs;
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.count(prs) > (0));
} else {
return and__5000__auto__;
}
})())?(function (){var iter__5480__auto__ = (function opencode$ui$components$prs_section_$_iter__14087(s__14088){
return (new cljs.core.LazySeq(null,(function (){
var s__14088__$1 = s__14088;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14088__$1);
if(temp__5804__auto__){
var s__14088__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14088__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14088__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14090 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14089 = (0);
while(true){
if((i__14089 < size__5479__auto__)){
var p = cljs.core._nth(c__5478__auto__,i__14089);
cljs.core.chunk_append(b__14090,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.pr_item,p], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p)], null)));

var G__14114 = (i__14089 + (1));
i__14089 = G__14114;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14090),opencode$ui$components$prs_section_$_iter__14087(cljs.core.chunk_rest(s__14088__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14090),null);
}
} else {
var p = cljs.core.first(s__14088__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.pr_item,p], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(p)], null)),opencode$ui$components$prs_section_$_iter__14087(cljs.core.rest(s__14088__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(prs);
})():new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm","div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm",942177175),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-4xl.mb-3","div.text-4xl.mb-3",-320479355),"\uD83D\uDD04"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-600.font-medium","p.text-gray-600.font-medium",-866406294),"No PRs loaded."], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-400.mt-2","p.text-sm.text-gray-400.mt-2",-1496931710),"Pull requests will appear here once connected to GitHub."], null)], null))], null)], null);
});
opencode.ui.components.worktrees_section = (function opencode$ui$components$worktrees_section(worktrees,worktree_config){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-8.flex.flex-col.min-h-0","div.mt-8.flex.flex-col.min-h-0",-1827237975),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.scrolling_container,"Worktrees",(cljs.core.truth_((function (){var and__5000__auto__ = worktrees;
if(cljs.core.truth_(and__5000__auto__)){
return (cljs.core.count(worktrees) > (0));
} else {
return and__5000__auto__;
}
})())?(function (){var iter__5480__auto__ = (function opencode$ui$components$worktrees_section_$_iter__14091(s__14092){
return (new cljs.core.LazySeq(null,(function (){
var s__14092__$1 = s__14092;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14092__$1);
if(temp__5804__auto__){
var s__14092__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14092__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14092__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14094 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14093 = (0);
while(true){
if((i__14093 < size__5479__auto__)){
var w = cljs.core._nth(c__5478__auto__,i__14093);
cljs.core.chunk_append(b__14094,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.worktree_item,w], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"issue","issue",1725456421).cljs$core$IFn$_invoke$arity$1(w)], null)));

var G__14115 = (i__14093 + (1));
i__14093 = G__14115;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14094),opencode$ui$components$worktrees_section_$_iter__14091(cljs.core.chunk_rest(s__14092__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14094),null);
}
} else {
var w = cljs.core.first(s__14092__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.worktree_item,w], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"issue","issue",1725456421).cljs$core$IFn$_invoke$arity$1(w)], null)),opencode$ui$components$worktrees_section_$_iter__14091(cljs.core.rest(s__14092__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(worktrees);
})():new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm","div.bg-white.border.border-gray-200.rounded-lg.p-8.text-center.shadow-sm",942177175),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-4xl.mb-3","div.text-4xl.mb-3",-320479355),"\uD83C\uDF33"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-600.font-medium","p.text-gray-600.font-medium",-866406294),"No worktrees created."], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-400.mt-2","p.text-sm.text-gray-400.mt-2",-1496931710),"Worktrees will appear here when you create them for them."], null)], null)),new cljs.core.Keyword(null,"extra-header-content","extra-header-content",114215579),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.gap-2","div.flex.items-center.gap-2",-1286016734),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.text-gray-600","span.text-sm.text-gray-600",-806917613),"Base folder:"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.px-2.py-1.bg-blue-100.text-blue-800.text-xs.font-medium.rounded-full","span.px-2.py-1.bg-blue-100.text-blue-800.text-xs.font-medium.rounded-full",614645923),new cljs.core.Keyword(null,"baseDir","baseDir",-1857916623).cljs$core$IFn$_invoke$arity$1(worktree_config)], null)], null),new cljs.core.Keyword(null,"max-height","max-height",-612563804),"12rem"], null)], null);
});
opencode.ui.components.repo_controls = (function opencode$ui$components$repo_controls(repo){
var repo_input = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(repo);
var show_QMARK_ = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(false);
return (function (){
var history__$1 = new cljs.core.Keyword(null,"repo-history","repo-history",-523409253).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var slug = clojure.string.trim(cljs.core.deref(repo_input));
var suggestions = cljs.core.take.cljs$core$IFn$_invoke$arity$2((6),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (r){
return clojure.string.starts_with_QMARK_(clojure.string.lower_case(r),clojure.string.lower_case(slug));
}),history__$1));
var submit_BANG_ = (function (slug__$1){
if(cljs.core.seq(slug__$1)){
opencode.ui.state.set_repo_BANG_(slug__$1);

opencode.ui.github.clear_detail_caches_BANG_();

opencode.ui.github.fetch_issues_BANG_();

opencode.ui.github.fetch_prs_BANG_();

opencode.ui.github.fetch_worktrees_BANG_();

opencode.ui.github.fetch_worktree_config_BANG_();

opencode.ui.files.fetch_files_BANG_(".");

return opencode.ui.state.push_event_BANG_(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword("ui","repo-change","ui/repo-change",-1870620150),new cljs.core.Keyword(null,"repo","repo",-1999060679),slug__$1,new cljs.core.Keyword(null,"ts","ts",1617209904),Date.now()], null));
} else {
return null;
}
});
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"form.flex.items-center.gap-3.relative","form.flex.items-center.gap-3.relative",-1534691823),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-submit","on-submit",1227871159),(function (e){
e.preventDefault();

return submit_BANG_(slug);
})], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.text-sm.text-gray-600","label.text-sm.text-gray-600",561057352),"Repo:"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.relative","div.relative",430334058),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.border.border-gray-300.rounded-md.px-3.py-2.text-sm.focus:outline-none.focus:ring-2.focus:ring-blue-500.w-56","input.border.border-gray-300.rounded-md.px-3.py-2.text-sm.focus:outline-none.focus:ring-2.focus:ring-blue-500.w-56",-382051676),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(repo_input),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"owner/repo",new cljs.core.Keyword(null,"on-focus","on-focus",-13737624),(function (){
return cljs.core.reset_BANG_(show_QMARK_,true);
}),new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (){
return setTimeout((function (){
return cljs.core.reset_BANG_(show_QMARK_,false);
}),(100));
}),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__14095_SHARP_){
cljs.core.reset_BANG_(repo_input,p1__14095_SHARP_.target.value);

return cljs.core.reset_BANG_(show_QMARK_,true);
})], null)], null),(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(show_QMARK_);
if(cljs.core.truth_(and__5000__auto__)){
return ((cljs.core.seq(suggestions)) && (cljs.core.seq(slug)));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.absolute.z-10.mt-1.w-56.bg-white.border.border-gray-200.rounded-md.shadow-lg.max-h-56.overflow-y-auto","div.absolute.z-10.mt-1.w-56.bg-white.border.border-gray-200.rounded-md.shadow-lg.max-h-56.overflow-y-auto",-678944952),(function (){var iter__5480__auto__ = (function opencode$ui$components$repo_controls_$_iter__14097(s__14098){
return (new cljs.core.LazySeq(null,(function (){
var s__14098__$1 = s__14098;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14098__$1);
if(temp__5804__auto__){
var s__14098__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14098__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14098__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14100 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14099 = (0);
while(true){
if((i__14099 < size__5479__auto__)){
var s = cljs.core._nth(c__5478__auto__,i__14099);
cljs.core.chunk_append(b__14100,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.w-full.text-left.px-3.py-2.text-sm.hover:bg-gray-100","button.w-full.text-left.px-3.py-2.text-sm.hover:bg-gray-100",481843934),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),((function (i__14099,s,c__5478__auto__,size__5479__auto__,b__14100,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_){
return (function (p1__14096_SHARP_){
return p1__14096_SHARP_.preventDefault();
});})(i__14099,s,c__5478__auto__,size__5479__auto__,b__14100,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_))
,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14099,s,c__5478__auto__,size__5479__auto__,b__14100,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_){
return (function (e){
e.preventDefault();

cljs.core.reset_BANG_(repo_input,s);

submit_BANG_(s);

return cljs.core.reset_BANG_(show_QMARK_,false);
});})(i__14099,s,c__5478__auto__,size__5479__auto__,b__14100,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_))
], null),s], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),s], null)));

var G__14118 = (i__14099 + (1));
i__14099 = G__14118;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14100),opencode$ui$components$repo_controls_$_iter__14097(cljs.core.chunk_rest(s__14098__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14100),null);
}
} else {
var s = cljs.core.first(s__14098__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.w-full.text-left.px-3.py-2.text-sm.hover:bg-gray-100","button.w-full.text-left.px-3.py-2.text-sm.hover:bg-gray-100",481843934),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),((function (s,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_){
return (function (p1__14096_SHARP_){
return p1__14096_SHARP_.preventDefault();
});})(s,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_))
,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (s,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_){
return (function (e){
e.preventDefault();

cljs.core.reset_BANG_(repo_input,s);

submit_BANG_(s);

return cljs.core.reset_BANG_(show_QMARK_,false);
});})(s,s__14098__$2,temp__5804__auto__,history__$1,slug,suggestions,submit_BANG_,repo_input,show_QMARK_))
], null),s], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),s], null)),opencode$ui$components$repo_controls_$_iter__14097(cljs.core.rest(s__14098__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(suggestions);
})()], null):null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-blue-600.hover:bg-blue-700.text-white.text-sm.font-medium.px-4.py-2.rounded-md.transition-colors","button.bg-blue-600.hover:bg-blue-700.text-white.text-sm.font-medium.px-4.py-2.rounded-md.transition-colors",1279239279),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"type","type",1174270348),"submit"], null),"Update"], null)], null);
});
});
opencode.ui.components.file_entry = (function opencode$ui$components$file_entry(p__14101,navigate){
var map__14102 = p__14101;
var map__14102__$1 = cljs.core.__destructure_map(map__14102);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14102__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var name = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14102__$1,new cljs.core.Keyword(null,"name","name",1843675177));
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14102__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var isSubmodule = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14102__$1,new cljs.core.Keyword(null,"isSubmodule","isSubmodule",-1424416487));
var size = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14102__$1,new cljs.core.Keyword(null,"size","size",1098693007));
var mtime = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14102__$1,new cljs.core.Keyword(null,"mtime","mtime",963165087));
var is_dir = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(type,"dir");
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.w-full.text-left.flex.items-center.justify-between.px-3.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50.transition-colors","button.w-full.text-left.flex.items-center.justify-between.px-3.py-2.border-b.border-gray-100.last:border-b-0.hover:bg-gray-50.transition-colors",1473071958),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
if(is_dir){
return (navigate.cljs$core$IFn$_invoke$arity$1 ? navigate.cljs$core$IFn$_invoke$arity$1(path) : navigate.call(null,path));
} else {
return null;
}
})], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.gap-2","div.flex.items-center.gap-2",-1286016734),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-mono.text-gray-700","span.text-sm.font-mono.text-gray-700",424631059),((is_dir)?"[dir]":"[file]")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.text-gray-900","span.text-sm.text-gray-900",-694984943),name], null),(cljs.core.truth_(isSubmodule)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-[11px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full"], null),"submodule"], null):null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.gap-3.text-xs.text-gray-500","div.flex.items-center.gap-3.text-xs.text-gray-500",1896544999),(cljs.core.truth_(size)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(size)," bytes"].join('')], null):null),(cljs.core.truth_(mtime)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(new Date(mtime))], null):null)], null)], null);
});
opencode.ui.components.file_explorer = (function opencode$ui$components$file_explorer(){
var map__14104 = new cljs.core.Keyword(null,"fs","fs",-2122926244).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.state._BANG_state));
var map__14104__$1 = cljs.core.__destructure_map(map__14104);
var path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14104__$1,new cljs.core.Keyword(null,"path","path",-188191168));
var entries = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14104__$1,new cljs.core.Keyword(null,"entries","entries",-86943161));
var loading_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14104__$1,new cljs.core.Keyword(null,"loading?","loading?",1905707049));
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14104__$1,new cljs.core.Keyword(null,"error","error",-978969032));
var path_input = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(path);
return (function (){
var navigate = (function (p){
cljs.core.reset_BANG_(path_input,p);

return opencode.ui.files.fetch_files_BANG_(p);
});
var up_path = (((((path == null)) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(path,"."))))?".":clojure.string.join.cljs$core$IFn$_invoke$arity$2("/",cljs.core.butlast(clojure.string.split.cljs$core$IFn$_invoke$arity$2(path,/\//))));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-white.border.border-gray-200.rounded-lg.shadow-sm.flex.flex-col.min-h-0","div.bg-white.border.border-gray-200.rounded-lg.shadow-sm.flex.flex-col.min-h-0",1383280734),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.flex.items-center.justify-between.border-b.border-gray-100","div.p-4.flex.items-center.justify-between.border-b.border-gray-100",1265368914),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-lg.font-semibold.text-gray-900","h2.text-lg.font-semibold.text-gray-900",-147653649),"Files"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-xs.text-gray-500","p.text-xs.text-gray-500",-1778185622),"Git-aware explorer (submodules marked)"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.gap-2","div.flex.items-center.gap-2",-1286016734),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.border.border-gray-300.rounded-md.px-3.py-2.text-sm.focus:outline-none.focus:ring-2.focus:ring-blue-500.w-48","input.border.border-gray-300.rounded-md.px-3.py-2.text-sm.focus:outline-none.focus:ring-2.focus:ring-blue-500.w-48",1476415005),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(path_input),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__14103_SHARP_){
return cljs.core.reset_BANG_(path_input,p1__14103_SHARP_.target.value);
}),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"path"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-gray-100.text-gray-700.hover:bg-gray-200.px-3.py-2.text-sm.rounded-md","button.bg-gray-100.text-gray-700.hover:bg-gray-200.px-3.py-2.text-sm.rounded-md",1720483795),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return navigate(up_path);
})], null),"Up"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.bg-blue-600.hover:bg-blue-700.text-white.text-sm.font-medium.px-4.py-2.rounded-md.transition-colors","button.bg-blue-600.hover:bg-blue-700.text-white.text-sm.font-medium.px-4.py-2.rounded-md.transition-colors",1279239279),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return navigate(cljs.core.deref(path_input));
})], null),"Go"], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.overflow-y-auto","div.flex-1.overflow-y-auto",-417546528),(cljs.core.truth_(loading_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.text-sm.text-gray-500","div.p-4.text-sm.text-gray-500",-1618523257),"Loading..."], null):(cljs.core.truth_(error)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.text-sm.text-red-600","div.p-4.text-sm.text-red-600",28124699),error], null):((cljs.core.empty_QMARK_(entries))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-6.text-sm.text-gray-500","div.p-6.text-sm.text-gray-500",1182315980),"No entries"], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.divide-y.divide-gray-100","div.divide-y.divide-gray-100",644382775),((cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(path,"."))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.file_entry,new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"type","type",1174270348),"dir",new cljs.core.Keyword(null,"name","name",1843675177),"..",new cljs.core.Keyword(null,"path","path",-188191168),up_path,new cljs.core.Keyword(null,"isSubmodule","isSubmodule",-1424416487),false,new cljs.core.Keyword(null,"size","size",1098693007),null,new cljs.core.Keyword(null,"mtime","mtime",963165087),null], null),navigate], null):null),(function (){var iter__5480__auto__ = (function opencode$ui$components$file_explorer_$_iter__14105(s__14106){
return (new cljs.core.LazySeq(null,(function (){
var s__14106__$1 = s__14106;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14106__$1);
if(temp__5804__auto__){
var s__14106__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14106__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14106__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14108 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14107 = (0);
while(true){
if((i__14107 < size__5479__auto__)){
var e = cljs.core._nth(c__5478__auto__,i__14107);
cljs.core.chunk_append(b__14108,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.file_entry,e,navigate], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(e)], null)));

var G__14122 = (i__14107 + (1));
i__14107 = G__14122;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14108),opencode$ui$components$file_explorer_$_iter__14105(cljs.core.chunk_rest(s__14106__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14108),null);
}
} else {
var e = cljs.core.first(s__14106__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.file_entry,e,navigate], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(e)], null)),opencode$ui$components$file_explorer_$_iter__14105(cljs.core.rest(s__14106__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(entries);
})()], null)
)))], null)], null);
});
});
opencode.ui.components.nav_link = (function opencode$ui$components$nav_link(label,target,current){
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(target,current);
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.text-sm.font-medium.px-3.py-2.rounded-md.transition-colors","button.text-sm.font-medium.px-3.py-2.rounded-md.transition-colors",693871920),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"class","class",-2030961996),((active_QMARK_)?"bg-blue-100 text-blue-800":"text-gray-700 hover:bg-gray-100"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode.ui.router.navigate_BANG_(target);
})], null),label], null);
});
opencode.ui.components.main_layout = (function opencode$ui$components$main_layout(issues,prs,worktrees,worktree_config,connected_QMARK_,repo){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.h-screen.bg-gray-50.flex.flex-col.overflow-hidden","div.h-screen.bg-gray-50.flex.flex-col.overflow-hidden",1418100898),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"header.bg-white.shadow-sm.border-b.border-gray-200.flex-shrink-0","header.bg-white.shadow-sm.border-b.border-gray-200.flex-shrink-0",1468613209),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.max-w-7xl.mx-auto.px-4.py-4","div.max-w-7xl.mx-auto.px-4.py-4",728323713),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between","div.flex.items-center.justify-between",-1166700937),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.text-3xl.font-bold.text-gray-900","h1.text-3xl.font-bold.text-gray-900",443477210),"Opencode Reactant"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-1.flex.items-center.gap-4","div.mt-1.flex.items-center.gap-4",-541420128),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.repo_controls,repo], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.gap-2","div.flex.items-center.gap-2",-1286016734),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-2.h-2.rounded-full","div.w-2.h-2.rounded-full",1279926285),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(connected_QMARK_)?"bg-green-500":"bg-red-500")], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.font-medium","span.text-sm.font-medium",-2002622722),(cljs.core.truth_(connected_QMARK_)?"text-green-600":"text-red-600")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(cljs.core.truth_(connected_QMARK_)?"Connected":"Disconnected")], null)], null)], null)], null),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.gap-2","div.flex.items-center.gap-2",-1286016734),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.nav_link,"Dashboard",new cljs.core.Keyword("opencode.ui.router","home","opencode.ui.router/home",760828399),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.router.current_page))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.nav_link,"Issues",new cljs.core.Keyword("opencode.ui.router","issues","opencode.ui.router/issues",-2012217839),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.router.current_page))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.nav_link,"PRs",new cljs.core.Keyword("opencode.ui.router","prs","opencode.ui.router/prs",50239957),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.router.current_page))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.nav_link,"Worktrees",new cljs.core.Keyword("opencode.ui.router","worktrees","opencode.ui.router/worktrees",-516373487),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.router.current_page))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.nav_link,"Files",new cljs.core.Keyword("opencode.ui.router","files","opencode.ui.router/files",-1239549702),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.router.current_page))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.nav_link,"Events",new cljs.core.Keyword("opencode.ui.router","events","opencode.ui.router/events",1353659165),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode.ui.router.current_page))], null)], null)], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"main.max-w-7xl.mx-auto.px-4.py-6.flex-1.overflow-hidden.flex.flex-col","main.max-w-7xl.mx-auto.px-4.py-6.flex-1.overflow-hidden.flex.flex-col",2040608750),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.grid.grid-cols-1.lg:grid-cols-2.gap-6.min-h-0.overflow-hidden","div.flex-1.grid.grid-cols-1.lg:grid-cols-2.gap-6.min-h-0.overflow-hidden",1152313501),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.issues_section,issues], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.prs_section,prs], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.grid.grid-cols-1.md:grid-cols-2.xl:grid-cols-3.gap-6.mt-6.flex-1.min-h-0","div.grid.grid-cols-1.md:grid-cols-2.xl:grid-cols-3.gap-6.mt-6.flex-1.min-h-0",1429463582),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.file_explorer], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.worktrees_section,worktrees,worktree_config], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode.ui.components.events_log], null)], null)], null)], null);
});

//# sourceMappingURL=opencode.ui.components.js.map
