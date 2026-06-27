goog.provide('opencode_unified.layout');
opencode_unified.layout.KEY_LEFT_PANE_WIDTH = "workbench.layout.leftPaneWidth";
opencode_unified.layout.KEY_SESSIONS_PANE_WIDTH = "workbench.layout.sessionsPaneWidth";
opencode_unified.layout.KEY_RIGHT_PANE_WIDTH = "workbench.layout.rightPaneWidth";
opencode_unified.layout.KEY_INSPECTOR_VISIBLE = "workbench.layout.inspectorVisible";
opencode_unified.layout.KEY_SESSIONS_VISIBLE = "workbench.layout.sessionsVisible";
opencode_unified.layout.KEY_COMPACT_MODE = "settings.compactMode";
opencode_unified.layout.ROUTE_HOME = "#/";
opencode_unified.layout.ROUTE_DOCS = "#/workflow/docs";
opencode_unified.layout.ROUTE_SETTINGS = "#/workflow/settings";
opencode_unified.layout.navigate_route_BANG_ = (function opencode_unified$layout$navigate_route_BANG_(route){
return (location.hash = route);
});
opencode_unified.layout.resizable_pane = (function opencode_unified$layout$resizable_pane(p__14880){
var map__14881 = p__14880;
var map__14881__$1 = cljs.core.__destructure_map(map__14881);
var min_width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14881__$1,new cljs.core.Keyword(null,"min-width","min-width",1926193728));
var max_width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14881__$1,new cljs.core.Keyword(null,"max-width","max-width",-1939924051));
var on_resize = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14881__$1,new cljs.core.Keyword(null,"on-resize","on-resize",-2005528129));
var direction = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14881__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var children = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14881__$1,new cljs.core.Keyword(null,"children","children",-940561982));
var dragging_QMARK_ = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var start_x = reagent.core.atom.cljs$core$IFn$_invoke$arity$1((0));
var start_width = reagent.core.atom.cljs$core$IFn$_invoke$arity$1((0));
return reagent.core.create_class.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"component-did-mount","component-did-mount",-1126910518),(function (){
var handle_move = (function (e){
if(cljs.core.truth_(cljs.core.deref(dragging_QMARK_))){
e.preventDefault();

var dx = (e.clientX - cljs.core.deref(start_x));
var new_width = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction,new cljs.core.Keyword(null,"left","left",-399115937)))?(cljs.core.deref(start_width) + dx):(cljs.core.deref(start_width) - dx));
var G__14894 = (function (){var x__5087__auto__ = (function (){var or__5002__auto__ = min_width;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
var y__5088__auto__ = (function (){var x__5090__auto__ = (function (){var or__5002__auto__ = max_width;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (10000);
}
})();
var y__5091__auto__ = new_width;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
return (on_resize.cljs$core$IFn$_invoke$arity$1 ? on_resize.cljs$core$IFn$_invoke$arity$1(G__14894) : on_resize.call(null,G__14894));
} else {
return null;
}
});
var handle_up = (function (){
if(cljs.core.truth_(cljs.core.deref(dragging_QMARK_))){
cljs.core.reset_BANG_(dragging_QMARK_,false);

return (document.body.style.cursor = "");
} else {
return null;
}
});
window.addEventListener("mousemove",handle_move);

return window.addEventListener("mouseup",handle_up);
}),new cljs.core.Keyword(null,"reagent-render","reagent-render",-985383853),(function (p__14904){
var map__14905 = p__14904;
var map__14905__$1 = cljs.core.__destructure_map(map__14905);
var width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14905__$1,new cljs.core.Keyword(null,"width","width",-384071477));
var direction__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14905__$1,new cljs.core.Keyword(null,"direction","direction",-633359395));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14905__$1,new cljs.core.Keyword(null,"class","class",-2030961996));
var style = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14905__$1,new cljs.core.Keyword(null,"style","style",-496642736));
var narrow_layout_QMARK_ = (window.innerWidth < (820));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.resizable-pane","div.resizable-pane",-660911542),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),class$,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"width","width",-384071477),width,new cljs.core.Keyword(null,"position","position",-2011731912),"relative",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column"], null),style], 0))], null),children,((narrow_layout_QMARK_)?null:new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.resize-handle","div.resize-handle",-1649699750),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-mouse-down","on-mouse-down",1147755470),(function (e){
e.preventDefault();

cljs.core.reset_BANG_(dragging_QMARK_,true);

cljs.core.reset_BANG_(start_x,e.clientX);

cljs.core.reset_BANG_(start_width,width);

return (document.body.style.cursor = "col-resize");
}),new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"bottom","bottom",-1550509018),new cljs.core.Keyword(null,"transition","transition",765692007),new cljs.core.Keyword(null,"top","top",-1856271961),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(direction__$1,new cljs.core.Keyword(null,"left","left",-399115937)))?new cljs.core.Keyword(null,"right","right",-452581833):new cljs.core.Keyword(null,"left","left",-399115937)),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"cursor","cursor",1011937484),new cljs.core.Keyword(null,"z-index","z-index",1892827090),new cljs.core.Keyword(null,"position","position",-2011731912)],[(0),"background-color 0.2s",(0),(-2),(cljs.core.truth_(cljs.core.deref(dragging_QMARK_))?"var(--accent)":"transparent"),"3px","col-resize",(2),"absolute"])], null)], null))], null);
})], null));
});
opencode_unified.layout.workflow_nav = (function opencode_unified$layout$workflow_nav(route){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.workflow-nav","div.workflow-nav",-1208044608),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"width","width",-384071477),"48px",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-tertiary)",new cljs.core.Keyword(null,"border-right","border-right",-668932860),"1px solid var(--border)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"padding-top","padding-top",1929675955),"10px",new cljs.core.Keyword(null,"gap","gap",80255254),"10px"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$workflow_nav_$_iter__14913(s__14914){
return (new cljs.core.LazySeq(null,(function (){
var s__14914__$1 = s__14914;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14914__$1);
if(temp__5804__auto__){
var s__14914__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14914__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14914__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14916 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14915 = (0);
while(true){
if((i__14915 < size__5479__auto__)){
var map__14917 = cljs.core._nth(c__5478__auto__,i__14915);
var map__14917__$1 = cljs.core.__destructure_map(map__14917);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14917__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14917__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14917__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var target_route = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14917__$1,new cljs.core.Keyword(null,"target-route","target-route",-200632203));
cljs.core.chunk_append(b__14916,(function (){var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route,target_route);
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-item","button.nav-item",1092018164),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),id,new cljs.core.Keyword(null,"title","title",636505583),label,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14915,active_QMARK_,map__14917,map__14917__$1,id,label,icon,target_route,c__5478__auto__,size__5479__auto__,b__14916,s__14914__$2,temp__5804__auto__){
return (function (){
return opencode_unified.layout.navigate_route_BANG_(target_route);
});})(i__14915,active_QMARK_,map__14917,map__14917__$1,id,label,icon,target_route,c__5478__auto__,size__5479__auto__,b__14916,s__14914__$2,temp__5804__auto__))
,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"cursor","cursor",1011937484),new cljs.core.Keyword(null,"border-left","border-left",-1150760178),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"height","height",1025178622)],["center",((active_QMARK_)?"var(--text-primary)":"var(--text-dim)"),"1rem",((active_QMARK_)?"var(--bg-selection)":"transparent"),"32px","pointer",((active_QMARK_)?"2px solid var(--accent)":"2px solid transparent"),(0),"center","flex","none","32px"])], null),icon], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null));
})());

var G__15054 = (i__14915 + (1));
i__14915 = G__15054;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14916),opencode_unified$layout$workflow_nav_$_iter__14913(cljs.core.chunk_rest(s__14914__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14916),null);
}
} else {
var map__14921 = cljs.core.first(s__14914__$2);
var map__14921__$1 = cljs.core.__destructure_map(map__14921);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14921__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14921__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var icon = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14921__$1,new cljs.core.Keyword(null,"icon","icon",1679606541));
var target_route = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14921__$1,new cljs.core.Keyword(null,"target-route","target-route",-200632203));
return cljs.core.cons((function (){var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route,target_route);
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-item","button.nav-item",1092018164),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),id,new cljs.core.Keyword(null,"title","title",636505583),label,new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (active_QMARK_,map__14921,map__14921__$1,id,label,icon,target_route,s__14914__$2,temp__5804__auto__){
return (function (){
return opencode_unified.layout.navigate_route_BANG_(target_route);
});})(active_QMARK_,map__14921,map__14921__$1,id,label,icon,target_route,s__14914__$2,temp__5804__auto__))
,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"cursor","cursor",1011937484),new cljs.core.Keyword(null,"border-left","border-left",-1150760178),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"height","height",1025178622)],["center",((active_QMARK_)?"var(--text-primary)":"var(--text-dim)"),"1rem",((active_QMARK_)?"var(--bg-selection)":"transparent"),"32px","pointer",((active_QMARK_)?"2px solid var(--accent)":"2px solid transparent"),(0),"center","flex","none","32px"])], null),icon], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null));
})(),opencode_unified$layout$workflow_nav_$_iter__14913(cljs.core.rest(s__14914__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),"workflow-nav-home",new cljs.core.Keyword(null,"label","label",1718410804),"Workflow",new cljs.core.Keyword(null,"icon","icon",1679606541),"\uD83D\uDCC1",new cljs.core.Keyword(null,"target-route","target-route",-200632203),opencode_unified.layout.ROUTE_HOME], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),"workflow-nav-docs",new cljs.core.Keyword(null,"label","label",1718410804),"Docs",new cljs.core.Keyword(null,"icon","icon",1679606541),"\uD83D\uDCC4",new cljs.core.Keyword(null,"target-route","target-route",-200632203),opencode_unified.layout.ROUTE_DOCS], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),"workflow-nav-settings",new cljs.core.Keyword(null,"label","label",1718410804),"Settings",new cljs.core.Keyword(null,"icon","icon",1679606541),"\u2699",new cljs.core.Keyword(null,"target-route","target-route",-200632203),opencode_unified.layout.ROUTE_SETTINGS], null)], null));
})()], null);
});
opencode_unified.layout.docs_route = (function opencode_unified$layout$docs_route(){
var activity_items = reagent.core.track(opencode_unified.state.get_activity_items);
return (function (){
var docs = cljs.core.vec(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"kind","kind",-717265803).cljs$core$IFn$_invoke$arity$1(item),"docs")) || (clojure.string.includes_QMARK_(clojure.string.lower_case((function (){var or__5002__auto____$1 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
})()),"doc")));
}),cljs.core.deref(activity_items)));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"workflow-docs-route",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto",new cljs.core.Keyword(null,"padding","padding",1660304693),"1rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.8rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin","margin",-995903681),"0 0 0.25rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"1rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),"Workflow Documents"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"margin","margin",-995903681),(0),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),"Documents inferred from current OpenPlanner activity."], null)], null),((cljs.core.seq(docs))?(function (){var iter__5480__auto__ = (function opencode_unified$layout$docs_route_$_iter__14925(s__14926){
return (new cljs.core.LazySeq(null,(function (){
var s__14926__$1 = s__14926;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14926__$1);
if(temp__5804__auto__){
var s__14926__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14926__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14926__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14928 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14927 = (0);
while(true){
if((i__14927 < size__5479__auto__)){
var map__14932 = cljs.core._nth(c__5478__auto__,i__14927);
var map__14932__$1 = cljs.core.__destructure_map(map__14932);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14932__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14932__$1,new cljs.core.Keyword(null,"title","title",636505583));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14932__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14932__$1,new cljs.core.Keyword(null,"source","source",-433931539));
cljs.core.chunk_append(b__14928,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"workflow-doc-item",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"display","display",242065432),"grid",new cljs.core.Keyword(null,"grid-template-columns","grid-template-columns",-594112133),"minmax(0, 1fr) auto",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.65rem 0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.86rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),title], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),["source ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = source;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "openplanner";
}
})())," \u2022 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = time;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "updated recently";
}
})())].join('')], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"uppercase",new cljs.core.Keyword(null,"letter-spacing","letter-spacing",-948993767),"0.04em",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.45rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px",new cljs.core.Keyword(null,"color","color",1011675173),"var(--success)",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--success)"], null)], null),"live"], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null)));

var G__15065 = (i__14927 + (1));
i__14927 = G__15065;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14928),opencode_unified$layout$docs_route_$_iter__14925(cljs.core.chunk_rest(s__14926__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14928),null);
}
} else {
var map__14947 = cljs.core.first(s__14926__$2);
var map__14947__$1 = cljs.core.__destructure_map(map__14947);
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14947__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14947__$1,new cljs.core.Keyword(null,"title","title",636505583));
var time = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14947__$1,new cljs.core.Keyword(null,"time","time",1385887882));
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14947__$1,new cljs.core.Keyword(null,"source","source",-433931539));
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"workflow-doc-item",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"display","display",242065432),"grid",new cljs.core.Keyword(null,"grid-template-columns","grid-template-columns",-594112133),"minmax(0, 1fr) auto",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.65rem 0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.86rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),title], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),["source ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = source;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "openplanner";
}
})())," \u2022 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = time;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "updated recently";
}
})())].join('')], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"uppercase",new cljs.core.Keyword(null,"letter-spacing","letter-spacing",-948993767),"0.04em",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.45rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px",new cljs.core.Keyword(null,"color","color",1011675173),"var(--success)",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--success)"], null)], null),"live"], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),id], null)),opencode_unified$layout$docs_route_$_iter__14925(cljs.core.rest(s__14926__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(docs);
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"workflow-doc-empty",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.8rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px dashed var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem"], null)], null),"No document events available yet."], null))], null);
});
});
opencode_unified.layout.settings_route = (function opencode_unified$layout$settings_route(){
var compact_mode_QMARK_ = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(opencode_unified.persistence.load_state(opencode_unified.layout.KEY_COMPACT_MODE,false));
return (function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"workflow-settings-route",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto",new cljs.core.Keyword(null,"padding","padding",1660304693),"1rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.8rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin","margin",-995903681),"0 0 0.25rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"1rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),"Workflow Settings"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"margin","margin",-995903681),(0),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),"Shell preferences persist locally for operator continuity."], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.65rem 0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.86rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),"Compact operator density"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),"Tightens spacing for high-throughput workflow sessions."], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label","label",1718410804),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input","input",556931961),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"checkbox",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"settings-compact-mode-toggle",new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core.deref(compact_mode_QMARK_),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (event){
var checked_QMARK_ = event.target.checked;
cljs.core.reset_BANG_(compact_mode_QMARK_,checked_QMARK_);

return opencode_unified.persistence.save_state_BANG_(opencode_unified.layout.KEY_COMPACT_MODE,checked_QMARK_);
})], null)], null),"Enabled"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"settings-compact-mode-value",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),["compact-mode=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(compact_mode_QMARK_))].join('')], null)], null);
});
});
opencode_unified.layout.header = (function opencode_unified$layout$header(){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.header","div.header",1964513620),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-secondary)",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0 1rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"height","height",1025178622),"35px"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.header-left","div.header-left",137243899),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"1rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1.app-title","h1.app-title",-1252602906),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin","margin",-995903681),(0),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.9rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),"Opencode"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"nav.menu-bar","nav.menu-bar",-918902899),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.25rem"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$header_$_iter__14949(s__14950){
return (new cljs.core.LazySeq(null,(function (){
var s__14950__$1 = s__14950;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14950__$1);
if(temp__5804__auto__){
var s__14950__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14950__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14950__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14952 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14951 = (0);
while(true){
if((i__14951 < size__5479__auto__)){
var map__14953 = cljs.core._nth(c__5478__auto__,i__14951);
var map__14953__$1 = cljs.core.__destructure_map(map__14953);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14953__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14953__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
cljs.core.chunk_append(b__14952,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.menu-item","button.menu-item",1605918848),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click,new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["menu-",clojure.string.lower_case(label)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"background","background",-863952629),"none",new cljs.core.Keyword(null,"border","border",1444987323),"none",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.15rem 0.5rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"3px"], null)], null),label], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),label], null)));

var G__15067 = (i__14951 + (1));
i__14951 = G__15067;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14952),opencode_unified$layout$header_$_iter__14949(cljs.core.chunk_rest(s__14950__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14952),null);
}
} else {
var map__14954 = cljs.core.first(s__14950__$2);
var map__14954__$1 = cljs.core.__destructure_map(map__14954);
var label = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14954__$1,new cljs.core.Keyword(null,"label","label",1718410804));
var on_click = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14954__$1,new cljs.core.Keyword(null,"on-click","on-click",1632826543));
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.menu-item","button.menu-item",1605918848),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),on_click,new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["menu-",clojure.string.lower_case(label)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"background","background",-863952629),"none",new cljs.core.Keyword(null,"border","border",1444987323),"none",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.15rem 0.5rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"3px"], null)], null),label], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),label], null)),opencode_unified$layout$header_$_iter__14949(cljs.core.rest(s__14950__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"File",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.buffers.save_current_buffer();
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Edit",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","","Edit actions available via command palette");
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"View",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","","View actions available via command palette");
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Go",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","","Go actions available via command palette");
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Run",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","","Run actions available via command palette");
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Terminal",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","","Terminal actions available via command palette");
})], null),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"label","label",1718410804),"Help",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.update_statusbar_BANG_("NORMAL","","Help available in docs route and command palette");
})], null)], null));
})()], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.header-right","div.header-right",1949423476),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.window-control","button.window-control",-372787733),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return window.close();
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"background","background",-863952629),"none",new cljs.core.Keyword(null,"border","border",1444987323),"none",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"\u00D7"], null)], null)], null);
});
opencode_unified.layout.left_sidebar = (function opencode_unified$layout$left_sidebar(){
var tree_data = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var loading_paths = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentHashSet.EMPTY);
var error_by_path = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var expanded_paths = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [".",null], null), null));
var workspace_root = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(".");
var load_directory_BANG_ = (function opencode_unified$layout$left_sidebar_$_load_directory_BANG_(directory_path,force_QMARK_){
if(cljs.core.truth_((function (){var or__5002__auto__ = force_QMARK_;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(tree_data),directory_path) == null);
}
})())){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(loading_paths,cljs.core.conj,directory_path);

return opencode_unified.workspace.list_directory.cljs$core$IFn$_invoke$arity$1(directory_path).then((function (result){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(tree_data,cljs.core.assoc,directory_path,cljs.core.vec(new cljs.core.Keyword(null,"entries","entries",-86943161).cljs$core$IFn$_invoke$arity$1(result)));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(error_by_path,cljs.core.dissoc,directory_path);

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(directory_path,".")){
return cljs.core.reset_BANG_(workspace_root,(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"root","root",-448657453).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ".";
}
})());
} else {
return null;
}
})).catch((function (error){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(error_by_path,cljs.core.assoc,directory_path,(function (){var or__5002__auto__ = error.message;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(error);
}
})());
})).then((function (_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(loading_paths,cljs.core.disj,directory_path);
}));
} else {
return null;
}
});
var toggle_directory_BANG_ = (function opencode_unified$layout$left_sidebar_$_toggle_directory_BANG_(directory_path){
if(cljs.core.contains_QMARK_(cljs.core.deref(expanded_paths),directory_path)){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(expanded_paths,cljs.core.disj,directory_path);
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(expanded_paths,cljs.core.conj,directory_path);

return load_directory_BANG_(directory_path,false);
}
});
var render_directory = (function opencode_unified$layout$left_sidebar_$_render_directory(directory_path,depth){
var entries = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(tree_data),directory_path,cljs.core.PersistentVector.EMPTY);
var directory_loading_QMARK_ = cljs.core.contains_QMARK_(cljs.core.deref(loading_paths),directory_path);
var directory_error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(error_by_path),directory_path);
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),((directory_loading_QMARK_)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"padding","padding",1660304693),["0.1rem 0 0.1rem ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((0.35 + (depth * 0.9))),"rem"].join(''),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"Loading..."], null):null),(cljs.core.truth_(directory_error)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"padding","padding",1660304693),["0.1rem 0 0.1rem ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((0.35 + (depth * 0.9))),"rem"].join(''),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--danger)"], null)], null),directory_error], null):null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$left_sidebar_$_render_directory_$_iter__14970(s__14971){
return (new cljs.core.LazySeq(null,(function (){
var s__14971__$1 = s__14971;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14971__$1);
if(temp__5804__auto__){
var s__14971__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14971__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14971__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14973 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14972 = (0);
while(true){
if((i__14972 < size__5479__auto__)){
var entry = cljs.core._nth(c__5478__auto__,i__14972);
cljs.core.chunk_append(b__14973,((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(entry),"directory"))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item","div.file-item",992852419),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["workspace-dir-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__14975 = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry);
return (opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1 ? opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1(G__14975) : opencode_unified.layout.testid_safe.call(null,G__14975));
})())].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14972,entry,c__5478__auto__,size__5479__auto__,b__14973,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root){
return (function (){
return toggle_directory_BANG_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry));
});})(i__14972,entry,c__5478__auto__,size__5479__auto__,b__14973,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),["0.15rem 0 0.15rem ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((0.35 + (depth * 0.9))),"rem"].join(''),new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),((cljs.core.contains_QMARK_(cljs.core.deref(expanded_paths),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry)))?"v":">")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(entry)], null)], null),((cljs.core.contains_QMARK_(cljs.core.deref(expanded_paths),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry)))?opencode_unified$layout$left_sidebar_$_render_directory(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry),(depth + (1))):null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item","div.file-item",992852419),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["workspace-file-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__14977 = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry);
return (opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1 ? opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1(G__14977) : opencode_unified.layout.testid_safe.call(null,G__14977));
})())].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14972,entry,c__5478__auto__,size__5479__auto__,b__14973,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root){
return (function (){
return opencode_unified.buffers.open_file(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry));
});})(i__14972,entry,c__5478__auto__,size__5479__auto__,b__14973,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),["0.15rem 0 0.15rem ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((1.4 + (depth * 0.9))),"rem"].join(''),new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(entry)], null)));

var G__15068 = (i__14972 + (1));
i__14972 = G__15068;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14973),opencode_unified$layout$left_sidebar_$_render_directory_$_iter__14970(cljs.core.chunk_rest(s__14971__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14973),null);
}
} else {
var entry = cljs.core.first(s__14971__$2);
return cljs.core.cons(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(entry),"directory"))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item","div.file-item",992852419),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["workspace-dir-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__14979 = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry);
return (opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1 ? opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1(G__14979) : opencode_unified.layout.testid_safe.call(null,G__14979));
})())].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (entry,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root){
return (function (){
return toggle_directory_BANG_(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry));
});})(entry,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),["0.15rem 0 0.15rem ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((0.35 + (depth * 0.9))),"rem"].join(''),new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),((cljs.core.contains_QMARK_(cljs.core.deref(expanded_paths),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry)))?"v":">")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(entry)], null)], null),((cljs.core.contains_QMARK_(cljs.core.deref(expanded_paths),new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry)))?opencode_unified$layout$left_sidebar_$_render_directory(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry),(depth + (1))):null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-item","div.file-item",992852419),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["workspace-file-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__14981 = new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry);
return (opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1 ? opencode_unified.layout.testid_safe.cljs$core$IFn$_invoke$arity$1(G__14981) : opencode_unified.layout.testid_safe.call(null,G__14981));
})())].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (entry,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root){
return (function (){
return opencode_unified.buffers.open_file(new cljs.core.Keyword(null,"path","path",-188191168).cljs$core$IFn$_invoke$arity$1(entry));
});})(entry,s__14971__$2,temp__5804__auto__,entries,directory_loading_QMARK_,directory_error,tree_data,loading_paths,error_by_path,expanded_paths,workspace_root))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),["0.15rem 0 0.15rem ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((1.4 + (depth * 0.9))),"rem"].join(''),new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.82rem",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(entry)], null)),opencode_unified$layout$left_sidebar_$_render_directory_$_iter__14970(cljs.core.rest(s__14971__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(entries);
})()], null);
});
return reagent.core.create_class.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"component-did-mount","component-did-mount",-1126910518),(function (){
return load_directory_BANG_(".",true);
}),new cljs.core.Keyword(null,"reagent-render","reagent-render",-985383853),(function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.left-sidebar","div.left-sidebar",-1399682750),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"display","display",242065432),(((window.innerWidth < (820)))?"none":"block"),new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sidebar-section","div.sidebar-section",379919391),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem",new cljs.core.Keyword(null,"margin-bottom","margin-bottom",388334941),"0.45rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.sidebar-title","h3.sidebar-title",-458421777),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"margin","margin",-995903681),(0),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"uppercase",new cljs.core.Keyword(null,"letter-spacing","letter-spacing",-948993767),"0.5px",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"Explorer"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"workspace-refresh",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return load_directory_BANG_(".",true);
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"background","background",-863952629),"none",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.1rem 0.35rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Refresh"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"workspace-root",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"margin-bottom","margin-bottom",388334941),"0.35rem",new cljs.core.Keyword(null,"word-break","word-break",-407281356),"break-all"], null)], null),["root: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(workspace_root))].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.file-tree","div.file-tree",379593959),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.85rem"], null)], null),render_directory(".",(0))], null)], null)], null);
})], null));
});
opencode_unified.layout.tab_bar = (function opencode_unified$layout$tab_bar(){
var buffers = new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
var current_buffer_id = new cljs.core.Keyword(null,"current-buffer","current-buffer",486078614).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tab-bar","div.tab-bar",-900690019),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-primary)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"overflow-x","overflow-x",-26547754),"auto",new cljs.core.Keyword(null,"height","height",1025178622),"32px"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$tab_bar_$_iter__14986(s__14987){
return (new cljs.core.LazySeq(null,(function (){
var s__14987__$1 = s__14987;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14987__$1);
if(temp__5804__auto__){
var s__14987__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14987__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14987__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14989 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14988 = (0);
while(true){
if((i__14988 < size__5479__auto__)){
var vec__14990 = cljs.core._nth(c__5478__auto__,i__14988);
var buffer_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14990,(0),null);
var buffer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14990,(1),null);
cljs.core.chunk_append(b__14989,cljs.core.with_meta(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tab","div.tab",40356964),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"active":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14988,vec__14990,buffer_id,buffer,c__5478__auto__,size__5479__auto__,b__14989,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id){
return (function (){
return opencode_unified.state.set_current_buffer_BANG_(buffer_id);
});})(i__14988,vec__14990,buffer_id,buffer,c__5478__auto__,size__5479__auto__,b__14989,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id))
,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"min-width","min-width",1926193728),new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"border-right","border-right",-668932860),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"cursor","cursor",1011937484),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"border-top","border-top",-158897573)],["120px","center","1px solid var(--border)",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"var(--text-primary)":"var(--text-secondary)"),"0.85rem",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"var(--bg-primary)":"var(--bg-secondary)"),"pointer","0 1rem","flex",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"2px solid var(--accent)":"2px solid transparent")])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.tab-name","span.tab-name",-664063103),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),"0.5rem",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(buffer)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"modified?","modified?",-2109276969).cljs$core$IFn$_invoke$arity$1(buffer))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.modified-indicator","span.modified-indicator",1787784702),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--accent)"], null)], null),"\u25CF"], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.tab-close","button.tab-close",1194078919),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14988,vec__14990,buffer_id,buffer,c__5478__auto__,size__5479__auto__,b__14989,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id){
return (function (e){
e.stopPropagation();

return opencode_unified.buffers.close_buffer(buffer_id);
});})(i__14988,vec__14990,buffer_id,buffer,c__5478__auto__,size__5479__auto__,b__14989,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"background","background",-863952629),"none",new cljs.core.Keyword(null,"border","border",1444987323),"none",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"2px",new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),"0.5rem"], null)], null),"\u00D7"], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),buffer_id], null)));

var G__15070 = (i__14988 + (1));
i__14988 = G__15070;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14989),opencode_unified$layout$tab_bar_$_iter__14986(cljs.core.chunk_rest(s__14987__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14989),null);
}
} else {
var vec__14993 = cljs.core.first(s__14987__$2);
var buffer_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14993,(0),null);
var buffer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14993,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tab","div.tab",40356964),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"active":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (vec__14993,buffer_id,buffer,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id){
return (function (){
return opencode_unified.state.set_current_buffer_BANG_(buffer_id);
});})(vec__14993,buffer_id,buffer,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id))
,new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"min-width","min-width",1926193728),new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"border-right","border-right",-668932860),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"cursor","cursor",1011937484),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"border-top","border-top",-158897573)],["120px","center","1px solid var(--border)",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"var(--text-primary)":"var(--text-secondary)"),"0.85rem",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"var(--bg-primary)":"var(--bg-secondary)"),"pointer","0 1rem","flex",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(buffer_id,current_buffer_id))?"2px solid var(--accent)":"2px solid transparent")])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.tab-name","span.tab-name",-664063103),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin-right","margin-right",809689658),"0.5rem",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(buffer)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"modified?","modified?",-2109276969).cljs$core$IFn$_invoke$arity$1(buffer))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.modified-indicator","span.modified-indicator",1787784702),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--accent)"], null)], null),"\u25CF"], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.tab-close","button.tab-close",1194078919),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (vec__14993,buffer_id,buffer,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id){
return (function (e){
e.stopPropagation();

return opencode_unified.buffers.close_buffer(buffer_id);
});})(vec__14993,buffer_id,buffer,s__14987__$2,temp__5804__auto__,buffers,current_buffer_id))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"background","background",-863952629),"none",new cljs.core.Keyword(null,"border","border",1444987323),"none",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"2px",new cljs.core.Keyword(null,"margin-left","margin-left",2015598377),"0.5rem"], null)], null),"\u00D7"], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),buffer_id], null)),opencode_unified$layout$tab_bar_$_iter__14986(cljs.core.rest(s__14987__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(buffers);
})()], null);
});
opencode_unified.layout.testid_safe = (function opencode_unified$layout$testid_safe(value){
return clojure.string.replace(clojure.string.replace(clojure.string.replace(clojure.string.lower_case((((value instanceof cljs.core.Keyword))?[cljs.core.namespace(value),"-",cljs.core.name(value)].join(''):cljs.core.str.cljs$core$IFn$_invoke$arity$1(value))),/[^a-z0-9]+/,"-"),/(^-+|-+$)/,""),/^-/,"");
});
opencode_unified.layout.selection_result_testid = (function opencode_unified$layout$selection_result_testid(item){
return ["result-select-",opencode_unified.layout.testid_safe((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "item";
}
})()),"-",opencode_unified.layout.testid_safe((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "unknown";
}
}
})())].join('');
});
opencode_unified.layout.session_id_of = (function opencode_unified$layout$session_id_of(item){
var or__5002__auto__ = new cljs.core.Keyword(null,"session-id","session-id",-1147060351).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"session","session",1008279103).cljs$core$IFn$_invoke$arity$1(item);
}
});
opencode_unified.layout.session_item_QMARK_ = (function opencode_unified$layout$session_item_QMARK_(item){
return cljs.core.boolean$(opencode_unified.layout.session_id_of(item));
});
opencode_unified.layout.session_title_of = (function opencode_unified$layout$session_title_of(item){
var or__5002__auto__ = new cljs.core.Keyword(null,"session-title","session-title",-1519746063).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "OpenCode Session";
}
}
});
opencode_unified.layout.open_session_in_chat_BANG_ = (function opencode_unified$layout$open_session_in_chat_BANG_(item){
var temp__5802__auto__ = opencode_unified.layout.session_id_of(item);
if(cljs.core.truth_(temp__5802__auto__)){
var session_id = temp__5802__auto__;
return opencode_unified.opencode.use_session_BANG_(session_id).then((function (result){
var temp__5802__auto____$1 = new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(result);
if(cljs.core.truth_(temp__5802__auto____$1)){
var error = temp__5802__auto____$1;
return opencode_unified.state.update_statusbar_BANG_("NORMAL","",["Failed to open session in chat: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)].join(''));
} else {
return opencode_unified.state.update_statusbar_BANG_("NORMAL","",["Opened session ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(session_id)," in chat"].join(''));
}
}));
} else {
return opencode_unified.state.update_statusbar_BANG_("NORMAL","","Selected item has no session ID");
}
});
opencode_unified.layout.open_session_in_inspector_BANG_ = (function opencode_unified$layout$open_session_in_inspector_BANG_(item,sorted_items){
return opencode_unified.state.set_inspector_selection_BANG_(item,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (candidate){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(candidate),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
}),sorted_items));
});
opencode_unified.layout.pinned_tab_testid = (function opencode_unified$layout$pinned_tab_testid(entity_key){
return ["inspector-compare-tab-",opencode_unified.layout.testid_safe(entity_key)].join('');
});
opencode_unified.layout.pinned_card_testid = (function opencode_unified$layout$pinned_card_testid(entity_key){
return ["inspector-compare-card-",opencode_unified.layout.testid_safe(entity_key)].join('');
});
opencode_unified.layout.inspector_pane = (function opencode_unified$layout$inspector_pane(){
var inspector_state = reagent.core.track(opencode_unified.state.get_inspector_state);
return (function (){
var map__14997 = cljs.core.deref(inspector_state);
var map__14997__$1 = cljs.core.__destructure_map(map__14997);
var selection = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14997__$1,new cljs.core.Keyword(null,"selection","selection",975998651));
var context = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14997__$1,new cljs.core.Keyword(null,"context","context",-830191113));
var pane_error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14997__$1,new cljs.core.Keyword(null,"pane-error","pane-error",-1201212610));
var pinned = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14997__$1,new cljs.core.Keyword(null,"pinned","pinned",-1216085339));
var active_pinned_key = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__14997__$1,new cljs.core.Keyword(null,"active-pinned-key","active-pinned-key",971801250));
var pinned_entities = (function (){var or__5002__auto__ = pinned;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})();
var active_pinned = (cljs.core.truth_(active_pinned_key)?cljs.core.some((function (p1__14996_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(p1__14996_SHARP_),active_pinned_key)){
return p1__14996_SHARP_;
} else {
return null;
}
}),pinned_entities):null);
var active_selection = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(active_pinned);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return selection;
}
})();
var active_context = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"context","context",-830191113).cljs$core$IFn$_invoke$arity$1(active_pinned);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return context;
}
})();
var details = (function (){var or__5002__auto__ = active_selection;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"title","title",636505583),"No selection",new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"info","info",-317069002),new cljs.core.Keyword(null,"time","time",1385887882),"",new cljs.core.Keyword(null,"timestamp","timestamp",579478971),null], null);
}
})();
var current_key = (cljs.core.truth_(active_selection)?opencode_unified.state.inspector_entity_key(active_selection):null);
var pinned_current_QMARK_ = (function (){var and__5000__auto__ = current_key;
if(cljs.core.truth_(and__5000__auto__)){
return opencode_unified.state.inspector_entity_pinned_QMARK_(current_key);
} else {
return and__5000__auto__;
}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inspector-pane","div.inspector-pane",-1335527699),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-pane",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-secondary)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.sidebar-section","div.sidebar-section",379919391),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"height","height",1025178622),"100%"], null)], null),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inspector-sticky-header","div.inspector-sticky-header",1997348884),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-sticky-header",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"position","position",-2011731912),"sticky",new cljs.core.Keyword(null,"top","top",-1856271961),(0),new cljs.core.Keyword(null,"z-index","z-index",1892827090),(1),new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.sidebar-title","h3.sidebar-title",-458421777),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"margin","margin",-995903681),(0),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"uppercase",new cljs.core.Keyword(null,"letter-spacing","letter-spacing",-948993767),"0.5px",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"Inspector"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.6rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem",new cljs.core.Keyword(null,"flex-wrap","flex-wrap",455413707),"wrap"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-pin-action",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.pin_selected_inspector_entity_BANG_();
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(selection == null),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.22rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"background","background",-863952629),(cljs.core.truth_(pinned_current_QMARK_)?"var(--bg-selection)":"var(--bg-primary)"),new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),(cljs.core.truth_(selection)?"pointer":"not-allowed"),new cljs.core.Keyword(null,"opacity","opacity",397153780),(cljs.core.truth_(selection)?(1):0.7)], null)], null),(cljs.core.truth_(pinned_current_QMARK_)?"Pinned":"Pin current")], null),(cljs.core.truth_(active_pinned)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-unpin-active",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.unpin_inspector_entity_BANG_(new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(active_pinned));
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.22rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Unpin active"], null):null)], null),((cljs.core.seq(pinned_entities))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-compare-tabs",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.6rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem",new cljs.core.Keyword(null,"overflow-x","overflow-x",-26547754),"auto",new cljs.core.Keyword(null,"padding-bottom","padding-bottom",-1899795591),"0.15rem"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$inspector_pane_$_iter__14998(s__14999){
return (new cljs.core.LazySeq(null,(function (){
var s__14999__$1 = s__14999;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14999__$1);
if(temp__5804__auto__){
var s__14999__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14999__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14999__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15001 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15000 = (0);
while(true){
if((i__15000 < size__5479__auto__)){
var entry = cljs.core._nth(c__5478__auto__,i__15000);
cljs.core.chunk_append(b__15001,(function (){var entry_selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(entry);
var entry_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(entry);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(entry_key,active_pinned_key);
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),opencode_unified.layout.pinned_tab_testid(entry_key),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15000,entry_selection,entry_key,active_QMARK_,entry,c__5478__auto__,size__5479__auto__,b__15001,s__14999__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state){
return (function (){
return opencode_unified.state.set_active_inspector_pinned_BANG_(entry_key);
});})(i__15000,entry_selection,entry_key,active_QMARK_,entry,c__5478__auto__,size__5479__auto__,b__15001,s__14999__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.24rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px",new cljs.core.Keyword(null,"background","background",-863952629),((active_QMARK_)?"var(--bg-selection)":"var(--bg-primary)"),new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap"], null)], null),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(entry_selection);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Untitled";
}
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),entry_key], null));
})());

var G__15072 = (i__15000 + (1));
i__15000 = G__15072;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15001),opencode_unified$layout$inspector_pane_$_iter__14998(cljs.core.chunk_rest(s__14999__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15001),null);
}
} else {
var entry = cljs.core.first(s__14999__$2);
return cljs.core.cons((function (){var entry_selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(entry);
var entry_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(entry);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(entry_key,active_pinned_key);
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),opencode_unified.layout.pinned_tab_testid(entry_key),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (entry_selection,entry_key,active_QMARK_,entry,s__14999__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state){
return (function (){
return opencode_unified.state.set_active_inspector_pinned_BANG_(entry_key);
});})(entry_selection,entry_key,active_QMARK_,entry,s__14999__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.24rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px",new cljs.core.Keyword(null,"background","background",-863952629),((active_QMARK_)?"var(--bg-selection)":"var(--bg-primary)"),new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap"], null)], null),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(entry_selection);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Untitled";
}
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),entry_key], null));
})(),opencode_unified$layout$inspector_pane_$_iter__14998(cljs.core.rest(s__14999__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(pinned_entities);
})()], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-selection-title",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.85rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(details)], null),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(details);
if(cljs.core.truth_(temp__5804__auto__)){
var item_type = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.25rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"capitalize"], null)], null),cljs.core.name(item_type)], null);
} else {
return null;
}
})()], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.inspector-content","div.inspector-content",-1839007505),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.85rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem"], null)], null),(cljs.core.truth_(pane_error)?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-pane-error",new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"background","background",-863952629),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),new cljs.core.Keyword(null,"gap","gap",80255254),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"border-radius","border-radius",419594011)],["center","var(--text-primary)","rgba(90, 0, 0, 0.22)","0.55rem 0.6rem","space-between","0.6rem","flex","1px solid rgba(255, 0, 0, 0.28)","6px"])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-pane-error-message",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.76rem"], null)], null),new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(pane_error)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-pane-error-retry",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.retry_inspector_context_BANG_();
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Retry"], null)], null):null),(cljs.core.truth_(active_selection)?new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem"], null)], null),((cljs.core.seq(pinned_entities))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-compare-cards",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"grid",new cljs.core.Keyword(null,"gap","gap",80255254),"0.45rem",new cljs.core.Keyword(null,"grid-template-columns","grid-template-columns",-594112133),"1fr"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$inspector_pane_$_iter__15002(s__15003){
return (new cljs.core.LazySeq(null,(function (){
var s__15003__$1 = s__15003;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15003__$1);
if(temp__5804__auto__){
var s__15003__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15003__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15003__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15005 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15004 = (0);
while(true){
if((i__15004 < size__5479__auto__)){
var entry = cljs.core._nth(c__5478__auto__,i__15004);
cljs.core.chunk_append(b__15005,(function (){var entry_selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(entry);
var entry_context = new cljs.core.Keyword(null,"context","context",-830191113).cljs$core$IFn$_invoke$arity$1(entry);
var entry_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(entry);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(entry_key,active_pinned_key);
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),opencode_unified.layout.pinned_card_testid(entry_key),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.55rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),((active_QMARK_)?"var(--bg-selection)":"var(--bg-tertiary)"),new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.76rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600"], null)], null),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(entry_selection);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Untitled";
}
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.68rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),["Context ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count((function (){var or__5002__auto__ = entry_context;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})()))].join('')], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),[opencode_unified.layout.pinned_card_testid(entry_key),"-open"].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15004,entry_selection,entry_context,entry_key,active_QMARK_,entry,c__5478__auto__,size__5479__auto__,b__15005,s__15003__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state){
return (function (){
return opencode_unified.state.set_active_inspector_pinned_BANG_(entry_key);
});})(i__15004,entry_selection,entry_context,entry_key,active_QMARK_,entry,c__5478__auto__,size__5479__auto__,b__15005,s__15003__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.45rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),((active_QMARK_)?"Viewing":"View")], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),entry_key], null));
})());

var G__15077 = (i__15004 + (1));
i__15004 = G__15077;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15005),opencode_unified$layout$inspector_pane_$_iter__15002(cljs.core.chunk_rest(s__15003__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15005),null);
}
} else {
var entry = cljs.core.first(s__15003__$2);
return cljs.core.cons((function (){var entry_selection = new cljs.core.Keyword(null,"selection","selection",975998651).cljs$core$IFn$_invoke$arity$1(entry);
var entry_context = new cljs.core.Keyword(null,"context","context",-830191113).cljs$core$IFn$_invoke$arity$1(entry);
var entry_key = new cljs.core.Keyword(null,"key","key",-1516042587).cljs$core$IFn$_invoke$arity$1(entry);
var active_QMARK_ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(entry_key,active_pinned_key);
return cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),opencode_unified.layout.pinned_card_testid(entry_key),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.55rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),((active_QMARK_)?"var(--bg-selection)":"var(--bg-tertiary)"),new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.4rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.76rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600"], null)], null),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(entry_selection);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Untitled";
}
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.68rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),["Context ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count((function (){var or__5002__auto__ = entry_context;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.PersistentVector.EMPTY;
}
})()))].join('')], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),[opencode_unified.layout.pinned_card_testid(entry_key),"-open"].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (entry_selection,entry_context,entry_key,active_QMARK_,entry,s__15003__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state){
return (function (){
return opencode_unified.state.set_active_inspector_pinned_BANG_(entry_key);
});})(entry_selection,entry_context,entry_key,active_QMARK_,entry,s__15003__$2,temp__5804__auto__,map__14997,map__14997__$1,selection,context,pane_error,pinned,active_pinned_key,pinned_entities,active_pinned,active_selection,active_context,details,current_key,pinned_current_QMARK_,inspector_state))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.45rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),((active_QMARK_)?"Viewing":"View")], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),entry_key], null));
})(),opencode_unified$layout$inspector_pane_$_iter__15002(cljs.core.rest(s__15003__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(pinned_entities);
})()], null):null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-detail",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"Detail"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600"], null)], null),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(active_selection);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()], null),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(active_selection);
if(cljs.core.truth_(temp__5804__auto__)){
var text = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"max-height","max-height",-612563804),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"white-space","white-space",-707351930),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"margin-top","margin-top",392161226),new cljs.core.Keyword(null,"background","background",-863952629),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),new cljs.core.Keyword(null,"border-radius","border-radius",419594011),new cljs.core.Keyword(null,"font-family","font-family",-667419874)],["300px","var(--text-secondary)","pre-wrap","0.8rem","0.75rem","var(--bg-primary)","0.5rem","1px solid var(--border)","auto","4px","monospace"])], null),text], null);
} else {
return null;
}
})(),(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"time","time",1385887882).cljs$core$IFn$_invoke$arity$1(active_selection);
if(cljs.core.truth_(temp__5804__auto__)){
var time_value = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem"], null)], null),["Observed ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(time_value)].join('')], null);
} else {
return null;
}
})()], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-context",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"Context"], null),((cljs.core.seq(active_context))?(function (){var iter__5480__auto__ = (function opencode_unified$layout$inspector_pane_$_iter__15006(s__15007){
return (new cljs.core.LazySeq(null,(function (){
var s__15007__$1 = s__15007;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15007__$1);
if(temp__5804__auto__){
var s__15007__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15007__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15007__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15009 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15008 = (0);
while(true){
if((i__15008 < size__5479__auto__)){
var ctx_item = cljs.core._nth(c__5478__auto__,i__15008);
cljs.core.chunk_append(b__15009,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(ctx_item)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(ctx_item)], null)));

var G__15079 = (i__15008 + (1));
i__15008 = G__15079;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15009),opencode_unified$layout$inspector_pane_$_iter__15006(cljs.core.chunk_rest(s__15007__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15009),null);
}
} else {
var ctx_item = cljs.core.first(s__15007__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(ctx_item)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(ctx_item)], null)),opencode_unified$layout$inspector_pane_$_iter__15006(cljs.core.rest(s__15007__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(active_context);
})():new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem"], null)], null),"No related context"], null))], null)], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"inspector-empty"], null),"Select an item to inspect details and context."], null))], null)], null)], null);
});
});
opencode_unified.layout.status_bar = (function opencode_unified$layout$status_bar(){
var left_text = reagent.core.track((function (){
return clojure.string.upper_case(cljs.core.name(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"mode","mode",654403691)], null))));
}));
var center_text = reagent.core.track((function (){
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"statusbar","statusbar",-680036405),new cljs.core.Keyword(null,"center","center",-748944368)], null));
}));
var right_text = reagent.core.track((function (){
return ["Evil Mode - ",cljs.core.name(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"evil-state","evil-state",-1055958091),new cljs.core.Keyword(null,"mode","mode",654403691)], null)))].join('');
}));
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.status-bar","div.status-bar",1890137111),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"align-items","align-items",-267946462),new cljs.core.Keyword(null,"color","color",1011675173),new cljs.core.Keyword(null,"font-size","font-size",-1847940346),new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"height","height",1025178622)],["center","var(--bg-primary)","0.75rem","600","var(--accent)","0 0.5rem","space-between","flex","22px"])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.status-left","div.status-left",-442219845),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"mode-indicator"], null),cljs.core.deref(left_text)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.status-center","div.status-center",1470192261),cljs.core.deref(center_text)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.status-right","div.status-right",2048064945),cljs.core.deref(right_text)], null)], null);
});
opencode_unified.layout.which_key_popup = (function opencode_unified$layout$which_key_popup(){
var which_key_state = new cljs.core.Keyword(null,"which-key","which-key",-1207966487).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.state.app_state));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.which-key-popup","div.which-key-popup",-1609983832),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(new cljs.core.Keyword(null,"active","active",1895962068).cljs$core$IFn$_invoke$arity$1(which_key_state))?"visible":null),new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"min-width","min-width",1926193728),new cljs.core.Keyword(null,"box-shadow","box-shadow",1600206755),new cljs.core.Keyword(null,"transform","transform",1381301764),new cljs.core.Keyword(null,"bottom","bottom",-1550509018),new cljs.core.Keyword(null,"transition","transition",765692007),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"z-index","z-index",1892827090),new cljs.core.Keyword(null,"opacity","opacity",397153780),new cljs.core.Keyword(null,"padding","padding",1660304693),new cljs.core.Keyword(null,"position","position",-2011731912),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"border-radius","border-radius",419594011),new cljs.core.Keyword(null,"visibility","visibility",1338380893),new cljs.core.Keyword(null,"left","left",-399115937)],["300px","0 4px 12px rgba(0, 0, 0, 0.3)","translateX(-50%)","30px","all 0.1s ease-in-out","var(--bg-tertiary)",(1000),(cljs.core.truth_(new cljs.core.Keyword(null,"active","active",1895962068).cljs$core$IFn$_invoke$arity$1(which_key_state))?(1):(0)),"0.5rem","fixed","1px solid var(--border)","4px",(cljs.core.truth_(new cljs.core.Keyword(null,"active","active",1895962068).cljs$core$IFn$_invoke$arity$1(which_key_state))?"visible":"hidden"),"50%"])], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.which-key-title","div.which-key-title",-2012193238),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"margin","margin",-995903681),"0 0 0.5rem 0",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600"], null)], null),["Prefix: ",clojure.string.join.cljs$core$IFn$_invoke$arity$2(" ",new cljs.core.Keyword(null,"prefix","prefix",-265908465).cljs$core$IFn$_invoke$arity$1(which_key_state))].join('')], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.which-key-bindings","div.which-key-bindings",621352892),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.binding-row","div.binding-row",231944112),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.15rem 0"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.key","span.key",270355866),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--accent)"], null)], null),"f"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.desc","span.desc",-719181907),"File"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.binding-row","div.binding-row",231944112),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.15rem 0"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.key","span.key",270355866),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--accent)"], null)], null),"b"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.desc","span.desc",-719181907),"Buffer"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.binding-row","div.binding-row",231944112),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.15rem 0"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.key","span.key",270355866),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"color","color",1011675173),"var(--accent)"], null)], null),"w"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.desc","span.desc",-719181907),"Window"], null)], null)], null)], null);
});
opencode_unified.layout.command_palette = (function opencode_unified$layout$command_palette(){
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.command_palette.command_palette], null);
});
opencode_unified.layout.minimap = (function opencode_unified$layout$minimap(buffer){
if(cljs.core.truth_(buffer)){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.minimap","div.minimap",904470420),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"width","width",-384071477),"100px",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-primary)",new cljs.core.Keyword(null,"border-left","border-left",-1150760178),"1px solid var(--border)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.5rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"line-height","line-height",1870784992),"1.2"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$minimap_$_iter__15010(s__15011){
return (new cljs.core.LazySeq(null,(function (){
var s__15011__$1 = s__15011;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15011__$1);
if(temp__5804__auto__){
var s__15011__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15011__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15011__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15013 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15012 = (0);
while(true){
if((i__15012 < size__5479__auto__)){
var line = cljs.core._nth(c__5478__auto__,i__15012);
cljs.core.chunk_append(b__15013,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.minimap-line","div.minimap-line",-1135309926),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),(function (){var or__5002__auto__ = line;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),line], null)));

var G__15086 = (i__15012 + (1));
i__15012 = G__15086;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15013),opencode_unified$layout$minimap_$_iter__15010(cljs.core.chunk_rest(s__15011__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15013),null);
}
} else {
var line = cljs.core.first(s__15011__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.minimap-line","div.minimap-line",-1135309926),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),(function (){var or__5002__auto__ = line;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),line], null)),opencode_unified$layout$minimap_$_iter__15010(cljs.core.rest(s__15011__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.take.cljs$core$IFn$_invoke$arity$2((50),clojure.string.split_lines(new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(buffer))));
})()], null);
} else {
return null;
}
});
opencode_unified.layout.paginate_items = (function opencode_unified$layout$paginate_items(items,page,page_size){
var safe_page = (function (){var x__5087__auto__ = (1);
var y__5088__auto__ = page;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var safe_size = (function (){var x__5087__auto__ = (1);
var y__5088__auto__ = page_size;
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var offset = ((safe_page - (1)) * safe_size);
return cljs.core.take.cljs$core$IFn$_invoke$arity$2(safe_size,cljs.core.drop.cljs$core$IFn$_invoke$arity$2(offset,items));
});
opencode_unified.layout.pagination_controls = (function opencode_unified$layout$pagination_controls(page,total_pages){
if((total_pages > (1))){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"pagination-controls",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"center",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"border-top","border-top",-158897573),"1px solid var(--border)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"pagination-prev",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.set_search_page_BANG_((page - (1)));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(page <= (1)),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.6rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),(((page <= (1)))?"not-allowed":"pointer"),new cljs.core.Keyword(null,"color","color",1011675173),(((page <= (1)))?"var(--text-dim)":"var(--text-primary)"),new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)"], null)], null),"Previous"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"pagination-status",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),["Page ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(page)," of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total_pages)].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"pagination-next",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.set_search_page_BANG_((page + (1)));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(page >= total_pages),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.6rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),(((page >= total_pages))?"not-allowed":"pointer"),new cljs.core.Keyword(null,"color","color",1011675173),(((page >= total_pages))?"var(--text-dim)":"var(--text-primary)"),new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)"], null)], null),"Next"], null)], null);
} else {
return null;
}
});
opencode_unified.layout.chatgpt_import_panel = (function opencode_unified$layout$chatgpt_import_panel(){
var import_state = reagent.core.track(opencode_unified.state.get_chatgpt_import_state);
return (function (){
var map__15015 = cljs.core.deref(import_state);
var map__15015__$1 = cljs.core.__destructure_map(map__15015);
var file_path = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15015__$1,new cljs.core.Keyword(null,"file-path","file-path",-2005501162));
var status = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15015__$1,new cljs.core.Keyword(null,"status","status",-1997798413));
var error = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15015__$1,new cljs.core.Keyword(null,"error","error",-978969032));
var job = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15015__$1,new cljs.core.Keyword(null,"job","job",850873087));
var processed = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(job,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"output","output",-1105869043),new cljs.core.Keyword(null,"processed","processed",800622264)], null));
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"chatgpt-import-panel",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"margin-bottom","margin-bottom",388334941),"0.75rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.65rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"6px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.45rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.78rem",new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),"ChatGPT Import (OpenPlanner)"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.45rem",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input","input",556931961),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"chatgpt-import-file-path",new cljs.core.Keyword(null,"value","value",305978217),(function (){var or__5002__auto__ = file_path;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})(),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__15014_SHARP_){
return opencode_unified.state.set_chatgpt_import_file_path_BANG_(p1__15014_SHARP_.target.value);
}),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"/absolute/path/to/chatgpt-export.zip",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.35rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"chatgpt-import-start",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return opencode_unified.state.start_chatgpt_import_BANG_.cljs$core$IFn$_invoke$arity$1(file_path);
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.36rem 0.55rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.74rem"], null)], null),"Start import"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"chatgpt-import-status",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),["status=",cljs.core.name((function (){var or__5002__auto__ = status;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"idle","idle",-2007156861);
}
})()),(cljs.core.truth_(processed)?[" \u2022 processed=",cljs.core.str.cljs$core$IFn$_invoke$arity$1(processed)].join(''):null)].join('')], null),(cljs.core.truth_(error)?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"chatgpt-import-error",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--danger)"], null)], null),error], null):null)], null);
});
});
opencode_unified.layout.activity_list = (function opencode_unified$layout$activity_list(items,query,filter_type,view_mode,page,page_size){
var normalized_query = clojure.string.lower_case((function (){var or__5002__auto__ = query;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
var filtered_items = cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
var matches_filter_QMARK_ = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_type,new cljs.core.Keyword(null,"all","all",892129742))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),filter_type)));
var title = clojure.string.lower_case((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
var matches_query_QMARK_ = ((clojure.string.blank_QMARK_(normalized_query)) || (clojure.string.includes_QMARK_(title,normalized_query)));
return ((matches_filter_QMARK_) && (matches_query_QMARK_));
}),items);
var sorted_items = cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.juxt.cljs$core$IFn$_invoke$arity$2((function (item){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"error","error",-978969032))){
return (0);
} else {
return (1);
}
}),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(cljs.core._,new cljs.core.Keyword(null,"timestamp","timestamp",579478971))),filtered_items);
var total_items = cljs.core.count(sorted_items);
var total_pages = (function (){var x__5087__auto__ = (1);
var y__5088__auto__ = Math.ceil((total_items / (function (){var x__5087__auto____$1 = (1);
var y__5088__auto__ = page_size;
return ((x__5087__auto____$1 > y__5088__auto__) ? x__5087__auto____$1 : y__5088__auto__);
})()));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var visible_page = (function (){var x__5090__auto__ = page;
var y__5091__auto__ = total_pages;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var page_items = opencode_unified.layout.paginate_items(sorted_items,visible_page,page_size);
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.activity-list","div.activity-list",124080807),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem",new cljs.core.Keyword(null,"height","height",1025178622),"100%"], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"justify-content","justify-content",-1990475787),"space-between",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem",new cljs.core.Keyword(null,"margin-bottom","margin-bottom",388334941),"0.5rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.activity-filters","div.activity-filters",-885576542),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.5rem"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$activity_list_$_iter__15016(s__15017){
return (new cljs.core.LazySeq(null,(function (){
var s__15017__$1 = s__15017;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15017__$1);
if(temp__5804__auto__){
var s__15017__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15017__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15017__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15019 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15018 = (0);
while(true){
if((i__15018 < size__5479__auto__)){
var f = cljs.core._nth(c__5478__auto__,i__15018);
cljs.core.chunk_append(b__15019,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.filter-btn","button.filter-btn",-1754922079),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15018,f,c__5478__auto__,size__5479__auto__,b__15019,s__15017__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
return opencode_unified.state.set_search_filter_BANG_(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.Keyword(null,"all","all",892129742)))?new cljs.core.Keyword(null,"all","all",892129742):f));
});})(i__15018,f,c__5478__auto__,size__5479__auto__,b__15019,s__15017__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["filter-",cljs.core.name(f)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"background","background",-863952629),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_type,f)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_type,new cljs.core.Keyword(null,"all","all",892129742))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.Keyword(null,"all","all",892129742)))))))?"var(--bg-selection)":"transparent"),new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.5rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"capitalize"], null)], null),cljs.core.name(f)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),f], null)));

var G__15087 = (i__15018 + (1));
i__15018 = G__15087;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15019),opencode_unified$layout$activity_list_$_iter__15016(cljs.core.chunk_rest(s__15017__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15019),null);
}
} else {
var f = cljs.core.first(s__15017__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.filter-btn","button.filter-btn",-1754922079),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (f,s__15017__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
return opencode_unified.state.set_search_filter_BANG_(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.Keyword(null,"all","all",892129742)))?new cljs.core.Keyword(null,"all","all",892129742):f));
});})(f,s__15017__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["filter-",cljs.core.name(f)].join(''),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"background","background",-863952629),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_type,f)) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(filter_type,new cljs.core.Keyword(null,"all","all",892129742))) && (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(f,new cljs.core.Keyword(null,"all","all",892129742)))))))?"var(--bg-selection)":"transparent"),new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.5rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"capitalize"], null)], null),cljs.core.name(f)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),f], null)),opencode_unified$layout$activity_list_$_iter__15016(cljs.core.rest(s__15017__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"all","all",892129742),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"info","info",-317069002)], null));
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.view-toggle","div.view-toggle",3377360),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"view-toggle",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$activity_list_$_iter__15020(s__15021){
return (new cljs.core.LazySeq(null,(function (){
var s__15021__$1 = s__15021;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15021__$1);
if(temp__5804__auto__){
var s__15021__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15021__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15021__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15023 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15022 = (0);
while(true){
if((i__15022 < size__5479__auto__)){
var vec__15024 = cljs.core._nth(c__5478__auto__,i__15022);
var view_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__15024,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__15024,(1),null);
cljs.core.chunk_append(b__15023,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["view-toggle-",cljs.core.name(view_key)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15022,vec__15024,view_key,label,c__5478__auto__,size__5479__auto__,b__15023,s__15021__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
return opencode_unified.state.set_search_view_BANG_(view_key);
});})(i__15022,vec__15024,view_key,label,c__5478__auto__,size__5479__auto__,b__15023,s__15021__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"background","background",-863952629),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_mode,view_key))?"var(--bg-selection)":"var(--bg-primary)"),new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),label], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.name(view_key)], null)));

var G__15088 = (i__15022 + (1));
i__15022 = G__15088;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15023),opencode_unified$layout$activity_list_$_iter__15020(cljs.core.chunk_rest(s__15021__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15023),null);
}
} else {
var vec__15027 = cljs.core.first(s__15021__$2);
var view_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__15027,(0),null);
var label = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__15027,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["view-toggle-",cljs.core.name(view_key)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (vec__15027,view_key,label,s__15021__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
return opencode_unified.state.set_search_view_BANG_(view_key);
});})(vec__15027,view_key,label,s__15021__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.25rem 0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"background","background",-863952629),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_mode,view_key))?"var(--bg-selection)":"var(--bg-primary)"),new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),label], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),cljs.core.name(view_key)], null)),opencode_unified$layout$activity_list_$_iter__15020(cljs.core.rest(s__15021__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"list","list",765357683),"List"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"table","table",-564943036),"Table"], null)], null));
})()], null)], null),((cljs.core.empty_QMARK_(page_items))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.no-results","div.no-results",-1075863318),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"padding","padding",1660304693),"1rem",new cljs.core.Keyword(null,"text-align","text-align",1786091845),"center",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"No activity found"], null):((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(view_mode,new cljs.core.Keyword(null,"table","table",-564943036)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"grid",new cljs.core.Keyword(null,"grid-template-columns","grid-template-columns",-594112133),"minmax(0, 1fr) auto",new cljs.core.Keyword(null,"gap","gap",80255254),"0.25rem",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$activity_list_$_iter__15030(s__15031){
return (new cljs.core.LazySeq(null,(function (){
var s__15031__$1 = s__15031;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15031__$1);
if(temp__5804__auto__){
var s__15031__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15031__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15031__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15033 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15032 = (0);
while(true){
if((i__15032 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__15032);
cljs.core.chunk_append(b__15033,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-item",new cljs.core.Keyword(null,"data-select-testid","data-select-testid",477714531),opencode_unified.layout.selection_result_testid(item),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15032,item,c__5478__auto__,size__5479__auto__,b__15033,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
if(opencode_unified.layout.session_item_QMARK_(item)){
return opencode_unified.layout.open_session_in_chat_BANG_(item);
} else {
return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
}
});})(i__15032,item,c__5478__auto__,size__5479__auto__,b__15033,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"text-align","text-align",1786091845),"left",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.6rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.25rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),opencode_unified.layout.session_title_of(item)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.1rem 0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px",new cljs.core.Keyword(null,"display","display",242065432),"inline-flex",new cljs.core.Keyword(null,"width","width",-384071477),"fit-content"], null)], null),opencode_unified.layout.session_id_of(item)], null)], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.25rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item)], null):null)], null))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"align-self","align-self",1475936794),"center",new cljs.core.Keyword(null,"padding-right","padding-right",-1250249681),"0.25rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem"], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-open-inspector",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15032,item,c__5478__auto__,size__5479__auto__,b__15033,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (e){
e.preventDefault();

e.stopPropagation();

return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
});})(i__15032,item,c__5478__auto__,size__5479__auto__,b__15033,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.35rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.68rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Inspector"], null):null),new cljs.core.Keyword(null,"time","time",1385887882).cljs$core$IFn$_invoke$arity$1(item)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)], null)));

var G__15090 = (i__15032 + (1));
i__15032 = G__15090;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15033),opencode_unified$layout$activity_list_$_iter__15030(cljs.core.chunk_rest(s__15031__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15033),null);
}
} else {
var item = cljs.core.first(s__15031__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"<>","<>",1280186386),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-item",new cljs.core.Keyword(null,"data-select-testid","data-select-testid",477714531),opencode_unified.layout.selection_result_testid(item),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (item,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
if(opencode_unified.layout.session_item_QMARK_(item)){
return opencode_unified.layout.open_session_in_chat_BANG_(item);
} else {
return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
}
});})(item,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"text-align","text-align",1786091845),"left",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.6rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.25rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"600",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),opencode_unified.layout.session_title_of(item)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.1rem 0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px",new cljs.core.Keyword(null,"display","display",242065432),"inline-flex",new cljs.core.Keyword(null,"width","width",-384071477),"fit-content"], null)], null),opencode_unified.layout.session_id_of(item)], null)], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"gap","gap",80255254),"0.25rem"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"nowrap",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden",new cljs.core.Keyword(null,"text-overflow","text-overflow",-1022366814),"ellipsis"], null)], null),new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item)], null):null)], null))], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.75rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"align-self","align-self",1475936794),"center",new cljs.core.Keyword(null,"padding-right","padding-right",-1250249681),"0.25rem",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.35rem"], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-open-inspector",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (item,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (e){
e.preventDefault();

e.stopPropagation();

return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
});})(item,s__15031__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.35rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.68rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Inspector"], null):null),new cljs.core.Keyword(null,"time","time",1385887882).cljs$core$IFn$_invoke$arity$1(item)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)], null)),opencode_unified$layout$activity_list_$_iter__15030(cljs.core.rest(s__15031__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(page_items);
})()], null):(function (){var iter__5480__auto__ = (function opencode_unified$layout$activity_list_$_iter__15034(s__15035){
return (new cljs.core.LazySeq(null,(function (){
var s__15035__$1 = s__15035;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15035__$1);
if(temp__5804__auto__){
var s__15035__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15035__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15035__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15037 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15036 = (0);
while(true){
if((i__15036 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__15036);
cljs.core.chunk_append(b__15037,cljs.core.with_meta(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-item","div.result-item",1914467279),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"error","error",-978969032)))?"result-error":"result-item"),new cljs.core.Keyword(null,"data-select-testid","data-select-testid",477714531),opencode_unified.layout.selection_result_testid(item),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15036,item,c__5478__auto__,size__5479__auto__,b__15037,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
if(opencode_unified.layout.session_item_QMARK_(item)){
return opencode_unified.layout.open_session_in_chat_BANG_(item);
} else {
return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
}
});})(i__15036,item,c__5478__auto__,size__5479__auto__,b__15037,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem",new cljs.core.Keyword(null,"background-color","background-color",570434026),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"error","error",-978969032)))?"rgba(255, 0, 0, 0.1)":"transparent"),new cljs.core.Keyword(null,"border","border",1444987323),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"error","error",-978969032)))?"1px solid rgba(255, 0, 0, 0.2)":"1px solid transparent")], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-icon","div.result-icon",2081511304),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"1.2rem"], null)], null),(function (){var G__15038 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item);
var G__15038__$1 = (((G__15038 instanceof cljs.core.Keyword))?G__15038.fqn:null);
switch (G__15038__$1) {
case "error":
return "\uD83D\uDD34";

break;
case "info":
return "\uD83D\uDD35";

break;
default:
return "\u2022";

}
})()], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-content","div.result-content",-785570417),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-title","div.result-title",-1006724007),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?opencode_unified.layout.session_title_of(item):new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item))], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.25rem",new cljs.core.Keyword(null,"display","display",242065432),"inline-flex",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.08rem 0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px"], null)], null),opencode_unified.layout.session_id_of(item)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(and__5000__auto__)){
return (!(opencode_unified.layout.session_item_QMARK_(item)));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-snippet","div.result-snippet",24272731),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.35rem",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"display","display",242065432),"-webkit-box",new cljs.core.Keyword(null,"-webkit-line-clamp","-webkit-line-clamp",438845631),"3",new cljs.core.Keyword(null,"-webkit-box-orient","-webkit-box-orient",-2043252050),"vertical",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden"], null)], null),new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item)], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-time","div.result-time",938025604),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.25rem"], null)], null),new cljs.core.Keyword(null,"time","time",1385887882).cljs$core$IFn$_invoke$arity$1(item)], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-open-inspector",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15036,item,c__5478__auto__,size__5479__auto__,b__15037,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (e){
e.preventDefault();

e.stopPropagation();

return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
});})(i__15036,item,c__5478__auto__,size__5479__auto__,b__15037,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.4rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.68rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Inspector"], null):null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)], null)));

var G__15092 = (i__15036 + (1));
i__15036 = G__15092;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15037),opencode_unified$layout$activity_list_$_iter__15034(cljs.core.chunk_rest(s__15035__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15037),null);
}
} else {
var item = cljs.core.first(s__15035__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-item","div.result-item",1914467279),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"error","error",-978969032)))?"result-error":"result-item"),new cljs.core.Keyword(null,"data-select-testid","data-select-testid",477714531),opencode_unified.layout.selection_result_testid(item),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (item,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (){
if(opencode_unified.layout.session_item_QMARK_(item)){
return opencode_unified.layout.open_session_in_chat_BANG_(item);
} else {
return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
}
});})(item,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem",new cljs.core.Keyword(null,"background-color","background-color",570434026),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"error","error",-978969032)))?"rgba(255, 0, 0, 0.1)":"transparent"),new cljs.core.Keyword(null,"border","border",1444987323),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"error","error",-978969032)))?"1px solid rgba(255, 0, 0, 0.2)":"1px solid transparent")], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-icon","div.result-icon",2081511304),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"1.2rem"], null)], null),(function (){var G__15039 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item);
var G__15039__$1 = (((G__15039 instanceof cljs.core.Keyword))?G__15039.fqn:null);
switch (G__15039__$1) {
case "error":
return "\uD83D\uDD34";

break;
case "info":
return "\uD83D\uDD35";

break;
default:
return "\u2022";

}
})()], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-content","div.result-content",-785570417),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-title","div.result-title",-1006724007),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?opencode_unified.layout.session_title_of(item):new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item))], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.7rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.25rem",new cljs.core.Keyword(null,"display","display",242065432),"inline-flex",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-tertiary)",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.08rem 0.35rem",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"999px"], null)], null),opencode_unified.layout.session_id_of(item)], null):null),(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(and__5000__auto__)){
return (!(opencode_unified.layout.session_item_QMARK_(item)));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-snippet","div.result-snippet",24272731),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.35rem",new cljs.core.Keyword(null,"white-space","white-space",-707351930),"pre-wrap",new cljs.core.Keyword(null,"display","display",242065432),"-webkit-box",new cljs.core.Keyword(null,"-webkit-line-clamp","-webkit-line-clamp",438845631),"3",new cljs.core.Keyword(null,"-webkit-box-orient","-webkit-box-orient",-2043252050),"vertical",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden"], null)], null),new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item)], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-time","div.result-time",938025604),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)",new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.25rem"], null)], null),new cljs.core.Keyword(null,"time","time",1385887882).cljs$core$IFn$_invoke$arity$1(item)], null)], null),((opencode_unified.layout.session_item_QMARK_(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-open-inspector",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (item,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items){
return (function (e){
e.preventDefault();

e.stopPropagation();

return opencode_unified.layout.open_session_in_inspector_BANG_(item,sorted_items);
});})(item,s__15035__$2,temp__5804__auto__,normalized_query,filtered_items,sorted_items,total_items,total_pages,visible_page,page_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.2rem 0.4rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.68rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background","background",-863952629),"var(--bg-secondary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null)], null),"Inspector"], null):null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)], null)),opencode_unified$layout$activity_list_$_iter__15034(cljs.core.rest(s__15035__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(page_items);
})())),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.pagination_controls,visible_page,total_pages], null)], null);
});
opencode_unified.layout.search_content = (function opencode_unified$layout$search_content(){
var search_state = reagent.core.track(opencode_unified.state.get_search_state);
var activity_items = reagent.core.track(opencode_unified.state.get_activity_items);
return (function (){
var query = new cljs.core.Keyword(null,"query","query",-1288509510).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(search_state));
var active_tab = new cljs.core.Keyword(null,"active-tab","active-tab",1102432568).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(search_state));
var filter_type = new cljs.core.Keyword(null,"filter","filter",-948537934).cljs$core$IFn$_invoke$arity$2(cljs.core.deref(search_state),new cljs.core.Keyword(null,"all","all",892129742));
var view_mode = new cljs.core.Keyword(null,"view","view",1247994814).cljs$core$IFn$_invoke$arity$2(cljs.core.deref(search_state),new cljs.core.Keyword(null,"list","list",765357683));
var page = new cljs.core.Keyword(null,"page","page",849072397).cljs$core$IFn$_invoke$arity$2(cljs.core.deref(search_state),(1));
var page_size = new cljs.core.Keyword(null,"page-size","page-size",223836073).cljs$core$IFn$_invoke$arity$2(cljs.core.deref(search_state),(10));
var other_results = (function (){var items = cljs.core.deref(activity_items);
var G__15042 = active_tab;
var G__15042__$1 = (((G__15042 instanceof cljs.core.Keyword))?G__15042.fqn:null);
switch (G__15042__$1) {
case "docs":
return cljs.core.vec(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,item){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ["doc-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('');
}
})(),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"doc","doc",1913296891),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"desc","desc",2093485764),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(item);
}
})()], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"kind","kind",-717265803).cljs$core$IFn$_invoke$arity$1(item),"docs")) || (clojure.string.includes_QMARK_(clojure.string.lower_case((function (){var or__5002__auto____$1 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
})()),"doc")));
}),items)));

break;
case "memories":
return cljs.core.vec(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,item){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ["memory-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('');
}
})(),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"memory","memory",-1449401430),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"desc","desc",2093485764),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(item);
}
})()], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"kind","kind",-717265803).cljs$core$IFn$_invoke$arity$1(item),"memory")) || (((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"kind","kind",-717265803).cljs$core$IFn$_invoke$arity$1(item),"vector.result")) || (clojure.string.includes_QMARK_(clojure.string.lower_case((function (){var or__5002__auto____$2 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
return "";
}
})()),"memory")))));
}),items)));

break;
case "tools":
return cljs.core.vec(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2((function (idx,item){
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return ["tool-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(idx)].join('');
}
})(),new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"tool","tool",-1298696470),new cljs.core.Keyword(null,"title","title",636505583),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item),new cljs.core.Keyword(null,"desc","desc",2093485764),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"snippet","snippet",953581994).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"source","source",-433931539).cljs$core$IFn$_invoke$arity$1(item);
}
})()], null);
}),cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (item){
return ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"kind","kind",-717265803).cljs$core$IFn$_invoke$arity$1(item),"tool")) || (clojure.string.includes_QMARK_(clojure.string.lower_case((function (){var or__5002__auto____$1 = new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "";
}
})()),"tool")));
}),items)));

break;
default:
return cljs.core.PersistentVector.EMPTY;

}
})();
var semantic_results = ((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,new cljs.core.Keyword(null,"semantic","semantic",-1174869020)))?cljs.core.deref(activity_items):cljs.core.PersistentVector.EMPTY);
var searched_other_results = ((clojure.string.blank_QMARK_(query))?other_results:cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__15040_SHARP_){
return clojure.string.includes_QMARK_(clojure.string.lower_case(new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(p1__15040_SHARP_)),clojure.string.lower_case(query));
}),other_results));
var total_other_pages = (function (){var x__5087__auto__ = (1);
var y__5088__auto__ = Math.ceil((cljs.core.count(searched_other_results) / (function (){var x__5087__auto____$1 = (1);
var y__5088__auto__ = page_size;
return ((x__5087__auto____$1 > y__5088__auto__) ? x__5087__auto____$1 : y__5088__auto__);
})()));
return ((x__5087__auto__ > y__5088__auto__) ? x__5087__auto__ : y__5088__auto__);
})();
var visible_other_page = (function (){var x__5090__auto__ = page;
var y__5091__auto__ = total_other_pages;
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})();
var paged_other_results = opencode_unified.layout.paginate_items(searched_other_results,visible_other_page,page_size);
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.search-content","div.search-content",259735400),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"activity-view",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"height","height",1025178622),"100%",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-tertiary)"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.search-header","div.search-header",-634193318),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.search-input","input.search-input",-470560783),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"value","value",305978217),query,new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"search-input",new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__15041_SHARP_){
return opencode_unified.state.set_search_query_BANG_(p1__15041_SHARP_.target.value);
}),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Search...",new cljs.core.Keyword(null,"auto-focus","auto-focus",1250006231),true,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"width","width",-384071477),"100%",new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid var(--border)",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.9rem",new cljs.core.Keyword(null,"outline","outline",793464534),"none"], null)], null)], null)], null),(function (){var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.state.app_state),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ui","ui",-469653645),new cljs.core.Keyword(null,"backend","backend",-847489124),new cljs.core.Keyword(null,"openplanner","openplanner",-175854128)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var backend_state = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"openplanner-backend-status",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"margin-top","margin-top",392161226),"0.5rem",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.72rem",new cljs.core.Keyword(null,"color","color",1011675173),(cljs.core.truth_(new cljs.core.Keyword(null,"connected?","connected?",-1197551387).cljs$core$IFn$_invoke$arity$1(backend_state))?"var(--success)":"var(--warning)")], null)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"connected?","connected?",-1197551387).cljs$core$IFn$_invoke$arity$1(backend_state))?["OpenPlanner: connected",(function (){var temp__5804__auto____$1 = new cljs.core.Keyword(null,"endpoint","endpoint",447890044).cljs$core$IFn$_invoke$arity$1(backend_state);
if(cljs.core.truth_(temp__5804__auto____$1)){
var endpoint = temp__5804__auto____$1;
return [" (",cljs.core.str.cljs$core$IFn$_invoke$arity$1(endpoint),")"].join('');
} else {
return null;
}
})()].join(''):["OpenPlanner: disconnected",(function (){var temp__5804__auto____$1 = new cljs.core.Keyword(null,"last-error","last-error",1848699973).cljs$core$IFn$_invoke$arity$1(backend_state);
if(cljs.core.truth_(temp__5804__auto____$1)){
var backend_error = temp__5804__auto____$1;
return [" \u2022 ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(backend_error)].join('');
} else {
return null;
}
})()].join(''))], null);
} else {
return null;
}
})(),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.search-tabs","div.search-tabs",1487094818),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"search-tabs",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"padding","padding",1660304693),"0 1rem",new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),"1px solid var(--border)",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-secondary)"], null)], null),(function (){var iter__5480__auto__ = (function opencode_unified$layout$search_content_$_iter__15043(s__15044){
return (new cljs.core.LazySeq(null,(function (){
var s__15044__$1 = s__15044;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15044__$1);
if(temp__5804__auto__){
var s__15044__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15044__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15044__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15046 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15045 = (0);
while(true){
if((i__15045 < size__5479__auto__)){
var tab = cljs.core._nth(c__5478__auto__,i__15045);
cljs.core.chunk_append(b__15046,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.search-tab","div.search-tab",-530652421),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["tab-",cljs.core.name(tab)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15045,tab,c__5478__auto__,size__5479__auto__,b__15046,s__15044__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items){
return (function (){
return opencode_unified.state.set_search_tab_BANG_(tab);
});})(i__15045,tab,c__5478__auto__,size__5479__auto__,b__15046,s__15044__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem 0.75rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,tab))?"var(--accent)":"var(--text-secondary)"),new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,tab))?"2px solid var(--accent)":"2px solid transparent"),new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,tab))?"600":"400"),new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"capitalize"], null)], null),cljs.core.name(tab)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),tab], null)));

var G__15095 = (i__15045 + (1));
i__15045 = G__15095;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15046),opencode_unified$layout$search_content_$_iter__15043(cljs.core.chunk_rest(s__15044__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15046),null);
}
} else {
var tab = cljs.core.first(s__15044__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.search-tab","div.search-tab",-530652421),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),["tab-",cljs.core.name(tab)].join(''),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (tab,s__15044__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items){
return (function (){
return opencode_unified.state.set_search_tab_BANG_(tab);
});})(tab,s__15044__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem 0.75rem",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.8rem",new cljs.core.Keyword(null,"color","color",1011675173),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,tab))?"var(--accent)":"var(--text-secondary)"),new cljs.core.Keyword(null,"border-bottom","border-bottom",2110948415),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,tab))?"2px solid var(--accent)":"2px solid transparent"),new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,tab))?"600":"400"),new cljs.core.Keyword(null,"text-transform","text-transform",1685000676),"capitalize"], null)], null),cljs.core.name(tab)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),tab], null)),opencode_unified$layout$search_content_$_iter__15043(cljs.core.rest(s__15044__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"sessions","sessions",-699316392),new cljs.core.Keyword(null,"semantic","semantic",-1174869020),new cljs.core.Keyword(null,"docs","docs",-1974280502),new cljs.core.Keyword(null,"memories","memories",1864747025),new cljs.core.Keyword(null,"tools","tools",-1241731990)], null));
})()], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.search-results","div.search-results",1319364942),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"search-results",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.5rem",new cljs.core.Keyword(null,"overflow-y","overflow-y",-1436589285),"auto",new cljs.core.Keyword(null,"flex","flex",-1425124628),"1"], null)], null),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,new cljs.core.Keyword(null,"tools","tools",-1241731990)))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.chatgpt_import_panel], null):null),((((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,new cljs.core.Keyword(null,"sessions","sessions",-699316392))) || (cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,new cljs.core.Keyword(null,"semantic","semantic",-1174869020)))))?new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.activity_list,cljs.core.deref(activity_items),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(active_tab,new cljs.core.Keyword(null,"semantic","semantic",-1174869020)))?"":query),filter_type,view_mode,page,page_size], null):((cljs.core.empty_QMARK_(paged_other_results))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.no-results","div.no-results",-1075863318),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"padding","padding",1660304693),"2rem",new cljs.core.Keyword(null,"text-align","text-align",1786091845),"center",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-dim)"], null)], null),"No results found"], null):(function (){var iter__5480__auto__ = (function opencode_unified$layout$search_content_$_iter__15047(s__15048){
return (new cljs.core.LazySeq(null,(function (){
var s__15048__$1 = s__15048;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__15048__$1);
if(temp__5804__auto__){
var s__15048__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__15048__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__15048__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__15050 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__15049 = (0);
while(true){
if((i__15049 < size__5479__auto__)){
var item = cljs.core._nth(c__5478__auto__,i__15049);
cljs.core.chunk_append(b__15050,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-item","div.result-item",1914467279),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-item",new cljs.core.Keyword(null,"data-select-testid","data-select-testid",477714531),opencode_unified.layout.selection_result_testid(item),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__15049,item,c__5478__auto__,size__5479__auto__,b__15050,s__15048__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items){
return (function (){
return opencode_unified.state.set_inspector_selection_BANG_(item,cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (i__15049,item,c__5478__auto__,size__5479__auto__,b__15050,s__15048__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items){
return (function (candidate){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(candidate),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
});})(i__15049,item,c__5478__auto__,size__5479__auto__,b__15050,s__15048__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items))
,searched_other_results));
});})(i__15049,item,c__5478__auto__,size__5479__auto__,b__15050,s__15048__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"margin","margin",-995903681),"0.25rem 0",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid transparent"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-icon","div.result-icon",2081511304),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"1.2rem"], null)], null),(function (){var G__15051 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item);
var G__15051__$1 = (((G__15051 instanceof cljs.core.Keyword))?G__15051.fqn:null);
switch (G__15051__$1) {
case "doc":
return "\uD83D\uDCC4";

break;
case "memory":
return "\uD83E\uDDE0";

break;
case "tool":
return "\uD83D\uDD27";

break;
default:
return "\u2022";

}
})()], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-content","div.result-content",-785570417),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-title","div.result-title",-1006724007),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"desc","desc",2093485764).cljs$core$IFn$_invoke$arity$1(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-desc","div.result-desc",1494456518),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.85rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),new cljs.core.Keyword(null,"desc","desc",2093485764).cljs$core$IFn$_invoke$arity$1(item)], null):null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)], null)));

var G__15097 = (i__15049 + (1));
i__15049 = G__15097;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__15050),opencode_unified$layout$search_content_$_iter__15047(cljs.core.chunk_rest(s__15048__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__15050),null);
}
} else {
var item = cljs.core.first(s__15048__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-item","div.result-item",1914467279),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"result-item",new cljs.core.Keyword(null,"data-select-testid","data-select-testid",477714531),opencode_unified.layout.selection_result_testid(item),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (item,s__15048__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items){
return (function (){
return opencode_unified.state.set_inspector_selection_BANG_(item,cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (candidate){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(candidate),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item));
}),searched_other_results));
});})(item,s__15048__$2,temp__5804__auto__,query,active_tab,filter_type,view_mode,page,page_size,other_results,semantic_results,searched_other_results,total_other_pages,visible_other_page,paged_other_results,search_state,activity_items))
,new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"padding","padding",1660304693),"0.75rem",new cljs.core.Keyword(null,"margin","margin",-995903681),"0.25rem 0",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"4px",new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"align-items","align-items",-267946462),"center",new cljs.core.Keyword(null,"gap","gap",80255254),"0.75rem",new cljs.core.Keyword(null,"border","border",1444987323),"1px solid transparent"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-icon","div.result-icon",2081511304),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"1.2rem"], null)], null),(function (){var G__15052 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(item);
var G__15052__$1 = (((G__15052 instanceof cljs.core.Keyword))?G__15052.fqn:null);
switch (G__15052__$1) {
case "doc":
return "\uD83D\uDCC4";

break;
case "memory":
return "\uD83E\uDDE0";

break;
case "tool":
return "\uD83D\uDD27";

break;
default:
return "\u2022";

}
})()], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-content","div.result-content",-785570417),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-title","div.result-title",-1006724007),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-weight","font-weight",2085804583),"500",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(item)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"desc","desc",2093485764).cljs$core$IFn$_invoke$arity$1(item))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.result-desc","div.result-desc",1494456518),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"font-size","font-size",-1847940346),"0.85rem",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-secondary)"], null)], null),new cljs.core.Keyword(null,"desc","desc",2093485764).cljs$core$IFn$_invoke$arity$1(item)], null):null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(item)], null)),opencode_unified$layout$search_content_$_iter__15047(cljs.core.rest(s__15048__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(paged_other_results);
})())),(((!(cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"semantic","semantic",-1174869020),null,new cljs.core.Keyword(null,"sessions","sessions",-699316392),null], null), null),active_tab))))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.pagination_controls,visible_other_page,total_other_pages], null):null)], null)], null);
});
});
opencode_unified.layout.search_surface = (function opencode_unified$layout$search_surface(){
var search_state = reagent.core.track(opencode_unified.state.get_search_state);
return (function (){
var visible_QMARK_ = new cljs.core.Keyword(null,"visible?","visible?",2129863715).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(search_state));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.search-surface-modal","div.search-surface-modal",-914295398),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(visible_QMARK_)?"visible":null),new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"search-surface",new cljs.core.Keyword(null,"style","style",-496642736),cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"box-shadow","box-shadow",1600206755),new cljs.core.Keyword(null,"max-height","max-height",-612563804),new cljs.core.Keyword(null,"transform","transform",1381301764),new cljs.core.Keyword(null,"transition","transition",765692007),new cljs.core.Keyword(null,"top","top",-1856271961),new cljs.core.Keyword(null,"background-color","background-color",570434026),new cljs.core.Keyword(null,"width","width",-384071477),new cljs.core.Keyword(null,"z-index","z-index",1892827090),new cljs.core.Keyword(null,"opacity","opacity",397153780),new cljs.core.Keyword(null,"display","display",242065432),new cljs.core.Keyword(null,"position","position",-2011731912),new cljs.core.Keyword(null,"border","border",1444987323),new cljs.core.Keyword(null,"border-radius","border-radius",419594011),new cljs.core.Keyword(null,"visibility","visibility",1338380893),new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),new cljs.core.Keyword(null,"left","left",-399115937)],["0 12px 32px rgba(0, 0, 0, 0.5)","500px","translateX(-50%)","all 0.1s ease-in-out","15%","var(--bg-tertiary)","600px",(2000),(cljs.core.truth_(visible_QMARK_)?(1):(0)),"flex","fixed","1px solid var(--border)","6px",(cljs.core.truth_(visible_QMARK_)?"visible":"hidden"),"column","50%"])], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.search_content], null)], null);
});
});
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.layout !== 'undefined') && (typeof opencode_unified.layout.layout_state !== 'undefined')){
} else {
opencode_unified.layout.layout_state = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"left-pane-width","left-pane-width",-669325932),opencode_unified.persistence.load_state(opencode_unified.layout.KEY_LEFT_PANE_WIDTH,(220)),new cljs.core.Keyword(null,"sessions-pane-width","sessions-pane-width",-804512787),opencode_unified.persistence.load_state(opencode_unified.layout.KEY_SESSIONS_PANE_WIDTH,(350)),new cljs.core.Keyword(null,"right-pane-width","right-pane-width",1527727612),opencode_unified.persistence.load_state(opencode_unified.layout.KEY_RIGHT_PANE_WIDTH,(300)),new cljs.core.Keyword(null,"sessions-visible?","sessions-visible?",735790417),opencode_unified.persistence.load_state(opencode_unified.layout.KEY_SESSIONS_VISIBLE,true),new cljs.core.Keyword(null,"inspector-visible?","inspector-visible?",1162567491),opencode_unified.persistence.load_state(opencode_unified.layout.KEY_INSPECTOR_VISIBLE,true)], null));
}
opencode_unified.layout.toggle_sessions_pane_BANG_ = (function opencode_unified$layout$toggle_sessions_pane_BANG_(){
var new_val = cljs.core.not(new cljs.core.Keyword(null,"sessions-visible?","sessions-visible?",735790417).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.layout.layout_state)));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.layout.layout_state,cljs.core.assoc,new cljs.core.Keyword(null,"sessions-visible?","sessions-visible?",735790417),new_val);

return opencode_unified.persistence.save_state_BANG_(opencode_unified.layout.KEY_SESSIONS_VISIBLE,new_val);
});
opencode_unified.layout.toggle_inspector_pane_BANG_ = (function opencode_unified$layout$toggle_inspector_pane_BANG_(){
var new_val = cljs.core.not(new cljs.core.Keyword(null,"inspector-visible?","inspector-visible?",1162567491).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.layout.layout_state)));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.layout.layout_state,cljs.core.assoc,new cljs.core.Keyword(null,"inspector-visible?","inspector-visible?",1162567491),new_val);

return opencode_unified.persistence.save_state_BANG_(opencode_unified.layout.KEY_INSPECTOR_VISIBLE,new_val);
});
opencode_unified.layout.shell = (function opencode_unified$layout$shell(_route,_children){
return (function (route,children){
var map__15053 = cljs.core.deref(opencode_unified.layout.layout_state);
var map__15053__$1 = cljs.core.__destructure_map(map__15053);
var left_pane_width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15053__$1,new cljs.core.Keyword(null,"left-pane-width","left-pane-width",-669325932));
var sessions_pane_width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15053__$1,new cljs.core.Keyword(null,"sessions-pane-width","sessions-pane-width",-804512787));
var right_pane_width = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15053__$1,new cljs.core.Keyword(null,"right-pane-width","right-pane-width",1527727612));
var sessions_visible_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15053__$1,new cljs.core.Keyword(null,"sessions-visible?","sessions-visible?",735790417));
var inspector_visible_QMARK_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__15053__$1,new cljs.core.Keyword(null,"inspector-visible?","inspector-visible?",1162567491));
var viewport_width = window.innerWidth;
var compact_layout_QMARK_ = (viewport_width < (1100));
var narrow_layout_QMARK_ = (viewport_width < (820));
var show_left_pane_QMARK_ = (!(narrow_layout_QMARK_));
var show_sessions_pane_QMARK_ = (function (){var and__5000__auto__ = sessions_visible_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(narrow_layout_QMARK_));
} else {
return and__5000__auto__;
}
})();
var show_right_pane_QMARK_ = (function (){var and__5000__auto__ = inspector_visible_QMARK_;
if(cljs.core.truth_(and__5000__auto__)){
return (!(compact_layout_QMARK_));
} else {
return and__5000__auto__;
}
})();
return new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.shell","div.shell",885819017),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"role","role",-736691072),"application",new cljs.core.Keyword(null,"tabIndex","tabIndex",-169286716),"0",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"height","height",1025178622),"100vh",new cljs.core.Keyword(null,"width","width",-384071477),"100vw",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-primary)",new cljs.core.Keyword(null,"color","color",1011675173),"var(--text-primary)"], null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.header], null),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.workspace","div.workspace",521801153),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"overflow","overflow",2058931880),"hidden"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.workflow_nav,route], null),((show_left_pane_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.resizable_pane,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"width","width",-384071477),((compact_layout_QMARK_)?(function (){var x__5090__auto__ = left_pane_width;
var y__5091__auto__ = (200);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})():left_pane_width),new cljs.core.Keyword(null,"min-width","min-width",1926193728),(150),new cljs.core.Keyword(null,"max-width","max-width",-1939924051),((compact_layout_QMARK_)?(250):(400)),new cljs.core.Keyword(null,"direction","direction",-633359395),new cljs.core.Keyword(null,"left","left",-399115937),new cljs.core.Keyword(null,"on-resize","on-resize",-2005528129),(function (w){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.layout.layout_state,cljs.core.assoc,new cljs.core.Keyword(null,"left-pane-width","left-pane-width",-669325932),w);

return opencode_unified.persistence.save_state_BANG_(opencode_unified.layout.KEY_LEFT_PANE_WIDTH,w);
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"border-right","border-right",-668932860),"1px solid var(--border)"], null),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.left_sidebar], null)], null)], null):null),(cljs.core.truth_(show_sessions_pane_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.resizable_pane,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"width","width",-384071477),((compact_layout_QMARK_)?(function (){var x__5090__auto__ = sessions_pane_width;
var y__5091__auto__ = (300);
return ((x__5090__auto__ < y__5091__auto__) ? x__5090__auto__ : y__5091__auto__);
})():sessions_pane_width),new cljs.core.Keyword(null,"min-width","min-width",1926193728),(250),new cljs.core.Keyword(null,"max-width","max-width",-1939924051),((compact_layout_QMARK_)?(400):(600)),new cljs.core.Keyword(null,"direction","direction",-633359395),new cljs.core.Keyword(null,"left","left",-399115937),new cljs.core.Keyword(null,"on-resize","on-resize",-2005528129),(function (w){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.layout.layout_state,cljs.core.assoc,new cljs.core.Keyword(null,"sessions-pane-width","sessions-pane-width",-804512787),w);

return opencode_unified.persistence.save_state_BANG_(opencode_unified.layout.KEY_SESSIONS_PANE_WIDTH,w);
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"border-right","border-right",-668932860),"1px solid var(--border)"], null),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.search_content], null)], null)], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.main-area","div.main-area",1569343689),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"flex","flex",-1425124628),"1",new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"flex-direction","flex-direction",364609438),"column",new cljs.core.Keyword(null,"min-width","min-width",1926193728),"0",new cljs.core.Keyword(null,"background-color","background-color",570434026),"var(--bg-primary)"], null)], null),children], null),(cljs.core.truth_(show_right_pane_QMARK_)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.resizable_pane,new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"width","width",-384071477),right_pane_width,new cljs.core.Keyword(null,"min-width","min-width",1926193728),(200),new cljs.core.Keyword(null,"max-width","max-width",-1939924051),(600),new cljs.core.Keyword(null,"direction","direction",-633359395),new cljs.core.Keyword(null,"right","right",-452581833),new cljs.core.Keyword(null,"on-resize","on-resize",-2005528129),(function (w){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.layout.layout_state,cljs.core.assoc,new cljs.core.Keyword(null,"right-pane-width","right-pane-width",1527727612),w);

return opencode_unified.persistence.save_state_BANG_(opencode_unified.layout.KEY_RIGHT_PANE_WIDTH,w);
}),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"border-left","border-left",-1150760178),"1px solid var(--border)"], null),new cljs.core.Keyword(null,"children","children",-940561982),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.inspector_pane], null)], null)], null):null)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.status_bar], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.which_key_popup], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.command_palette], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.layout.search_surface], null)], null);
});
});
opencode_unified.layout.layout_commands = (function opencode_unified$layout$layout_commands(){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),"layout.toggle-sessions",new cljs.core.Keyword(null,"title","title",636505583),"Toggle Sessions Pane",new cljs.core.Keyword(null,"description","description",-1428560544),"Show/hide the sessions and activity side pane",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
opencode_unified.layout.toggle_sessions_pane_BANG_();

opencode_unified.command_palette.close_BANG_();

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"success","success",1890645906),true], null);
})], null),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"id","id",-1388402092),"layout.toggle-inspector",new cljs.core.Keyword(null,"title","title",636505583),"Toggle Inspector Pane",new cljs.core.Keyword(null,"description","description",-1428560544),"Show/hide the right inspector side pane",new cljs.core.Keyword(null,"handler","handler",-195596612),(function (){
opencode_unified.layout.toggle_inspector_pane_BANG_();

opencode_unified.command_palette.close_BANG_();

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"success","success",1890645906),true], null);
})], null)], null);
});

//# sourceMappingURL=opencode_unified.layout.js.map
