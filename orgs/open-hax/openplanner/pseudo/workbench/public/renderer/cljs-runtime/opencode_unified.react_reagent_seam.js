goog.provide('opencode_unified.react_reagent_seam');
opencode_unified.react_reagent_seam.spike_route = "#/react-reagent-spike";
/**
 * Returns true when the route targets the seam spike host view.
 */
opencode_unified.react_reagent_seam.spike_route_QMARK_ = (function opencode_unified$react_reagent_seam$spike_route_QMARK_(route){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(route,opencode_unified.react_reagent_seam.spike_route);
});
/**
 * Adapter seam contract for donor integration.
 * 
 *   Contract:
 *   - host publishes ready/host state via tracks
 *   - donor triggers host events via explicit callbacks
 *   - CSS stays scoped to `.react-host-seam-scope`
 */
opencode_unified.react_reagent_seam.create_adapter = (function opencode_unified$react_reagent_seam$create_adapter(host_state){
return new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"ready-state","ready-state",59557571),reagent.core.track((function (){
if(cljs.core.truth_(new cljs.core.Keyword(null,"mounted?","mounted?",712114760).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(host_state)))){
return "ready";
} else {
return "booting";
}
})),new cljs.core.Keyword(null,"host-count","host-count",-2127414246),reagent.core.track((function (){
return new cljs.core.Keyword(null,"host-count","host-count",-2127414246).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(host_state));
})),new cljs.core.Keyword(null,"event-count","event-count",1113474312),reagent.core.track((function (){
return new cljs.core.Keyword(null,"event-count","event-count",1113474312).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(host_state));
})),new cljs.core.Keyword(null,"increment-host-count!","increment-host-count!",738677024),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(host_state,cljs.core.update,new cljs.core.Keyword(null,"host-count","host-count",-2127414246),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.inc,(0)));
}),new cljs.core.Keyword(null,"emit-donor-event!","emit-donor-event!",998673037),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(host_state,cljs.core.update,new cljs.core.Keyword(null,"event-count","event-count",1113474312),cljs.core.fnil.cljs$core$IFn$_invoke$arity$2(cljs.core.inc,(0)));
})], null);
});
opencode_unified.react_reagent_seam.donor_panel = (function opencode_unified$react_reagent_seam$donor_panel(adapter){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"aside","aside",1414397537),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"reagent-donor-panel",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"reagent-donor-panel"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),"Reagent Donor Panel"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Host count handoff: "], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"donor-host-count"], null),cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(adapter,new cljs.core.Keyword(null,"host-count","host-count",-2127414246)))], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"donor-event-trigger",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var emit_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(adapter,new cljs.core.Keyword(null,"emit-donor-event!","emit-donor-event!",998673037));
return (emit_BANG_.cljs$core$IFn$_invoke$arity$0 ? emit_BANG_.cljs$core$IFn$_invoke$arity$0() : emit_BANG_.call(null));
})], null),"Emit donor event"], null)], null);
});
opencode_unified.react_reagent_seam.react_host_route = (function opencode_unified$react_reagent_seam$react_host_route(){
var host_state = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"mounted?","mounted?",712114760),false,new cljs.core.Keyword(null,"host-count","host-count",-2127414246),(0),new cljs.core.Keyword(null,"event-count","event-count",1113474312),(0)], null));
var adapter = opencode_unified.react_reagent_seam.create_adapter(host_state);
return reagent.core.create_class.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"component-did-mount","component-did-mount",-1126910518),(function (){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(host_state,cljs.core.assoc,new cljs.core.Keyword(null,"mounted?","mounted?",712114760),true);
}),new cljs.core.Keyword(null,"reagent-render","reagent-render",-985383853),(function (){
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"section","section",-300141526),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"react-host-seam-scope",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"react-host-route"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"style","style",-496642736),[".react-host-seam-scope {","display:grid;grid-template-columns:minmax(260px,1fr) minmax(260px,1fr);","gap:1rem;padding:1.25rem;background:#12171b;min-height:100vh;color:#e6edf3;","font-family:'SF Mono','Monaco','Inconsolata','Fira Code',monospace;}",".react-host-seam-scope *{box-sizing:border-box;}",".react-host-seam-scope .host-panel,.react-host-seam-scope .reagent-donor-panel{","border:1px solid #2d3743;border-radius:10px;padding:1rem;background:#19212a;}",".react-host-seam-scope h2,.react-host-seam-scope h3{margin:0 0 0.75rem 0;}",".react-host-seam-scope p{margin:0.35rem 0;color:#9fb0c2;}",".react-host-seam-scope button{margin-top:0.5rem;background:#2a6f97;color:#f5fbff;","border:0;border-radius:6px;padding:0.45rem 0.7rem;cursor:pointer;}",".react-host-seam-scope button:hover{background:#3b85b0;}",".react-host-seam-scope .status{display:inline-block;padding:0.15rem 0.45rem;","border-radius:4px;background:#1f5132;color:#d9ffe8;font-size:0.85rem;}",".react-host-seam-scope strong{color:#ffffff;}"].join('')], null),new cljs.core.PersistentVector(null, 7, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"article","article",-21685045),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"host-panel"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"React Host Route (Seam Spike)"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Adapter ready state: "], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"status",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"adapter-ready-state"], null),cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(adapter,new cljs.core.Keyword(null,"ready-state","ready-state",59557571)))], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Host event count: "], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"host-event-count"], null),cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(adapter,new cljs.core.Keyword(null,"event-count","event-count",1113474312)))], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Host state count: "], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"host-count-value"], null),cljs.core.deref(cljs.core.get.cljs$core$IFn$_invoke$arity$2(adapter,new cljs.core.Keyword(null,"host-count","host-count",-2127414246)))], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"type","type",1174270348),"button",new cljs.core.Keyword(null,"data-testid","data-testid",102116723),"host-count-increment",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var increment_BANG_ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(adapter,new cljs.core.Keyword(null,"increment-host-count!","increment-host-count!",738677024));
return (increment_BANG_.cljs$core$IFn$_invoke$arity$0 ? increment_BANG_.cljs$core$IFn$_invoke$arity$0() : increment_BANG_.call(null));
})], null),"Increment host count"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [opencode_unified.react_reagent_seam.donor_panel,adapter], null)], null);
})], null));
});

//# sourceMappingURL=opencode_unified.react_reagent_seam.js.map
