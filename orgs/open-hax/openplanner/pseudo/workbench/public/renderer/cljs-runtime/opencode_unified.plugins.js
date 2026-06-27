goog.provide('opencode_unified.plugins');
if((typeof opencode_unified !== 'undefined') && (typeof opencode_unified.plugins !== 'undefined') && (typeof opencode_unified.plugins.plugin_state !== 'undefined')){
} else {
opencode_unified.plugins.plugin_state = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"available-plugins","available-plugins",1884325526),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"plugin-commands","plugin-commands",1439817142),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"last-error","last-error",1848699973),null], null));
}
opencode_unified.plugins.plugin_states = new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"unloaded","unloaded",-1771652423),"Not loaded",new cljs.core.Keyword(null,"loading","loading",-737050189),"Loading...",new cljs.core.Keyword(null,"loaded","loaded",-1246482293),"Loaded but inactive",new cljs.core.Keyword(null,"activating","activating",-513392578),"Activating...",new cljs.core.Keyword(null,"active","active",1895962068),"Active",new cljs.core.Keyword(null,"deactivating","deactivating",952478781),"Deactivating...",new cljs.core.Keyword(null,"error","error",-978969032),"Error"], null);
opencode_unified.plugins.hook_types = new cljs.core.PersistentVector(null, 10, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"buffer-created","buffer-created",-997519470),new cljs.core.Keyword(null,"buffer-saved","buffer-saved",1827952050),new cljs.core.Keyword(null,"buffer-closed","buffer-closed",1174150944),new cljs.core.Keyword(null,"editor-focused","editor-focused",711867680),new cljs.core.Keyword(null,"editor-blurred","editor-blurred",-1025297712),new cljs.core.Keyword(null,"key-pressed","key-pressed",-757100364),new cljs.core.Keyword(null,"command-executed","command-executed",-621035379),new cljs.core.Keyword(null,"theme-changed","theme-changed",-1173604306),new cljs.core.Keyword(null,"workspace-loaded","workspace-loaded",100617312),new cljs.core.Keyword(null,"workspace-saved","workspace-saved",-111745363)], null);
opencode_unified.plugins.plugin_schema = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"description","description",-1428560544),new cljs.core.Keyword(null,"permissions","permissions",67803075),new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"hooks","hooks",-413590103),new cljs.core.Keyword(null,"author","author",2111686192),new cljs.core.Keyword(null,"commands","commands",161008658),new cljs.core.Keyword(null,"version","version",425292698),new cljs.core.Keyword(null,"main","main",-2117802661),new cljs.core.Keyword(null,"enabled","enabled",1195909756),new cljs.core.Keyword(null,"dependencies","dependencies",1108064605)],[new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"vector","vector",1902966158)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"map","map",1371690461)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"required","required",1807647006),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"vector","vector",1902966158)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"vector","vector",1902966158)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"required","required",1807647006),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"required","required",1807647006),new cljs.core.Keyword(null,"string","string",-1989541586)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"boolean","boolean",-1919418404),new cljs.core.Keyword(null,"default","default",-1987822328),true], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"vector","vector",1902966158)], null)]);
/**
 * Validate plugin metadata against schema
 */
opencode_unified.plugins.validate_plugin = (function opencode_unified$plugins$validate_plugin(plugin_metadata){
try{var required_fields_14571 = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"name","name",1843675177),new cljs.core.Keyword(null,"version","version",425292698),new cljs.core.Keyword(null,"main","main",-2117802661)], null);
var seq__14376_14572 = cljs.core.seq(required_fields_14571);
var chunk__14377_14573 = null;
var count__14378_14574 = (0);
var i__14379_14575 = (0);
while(true){
if((i__14379_14575 < count__14378_14574)){
var field_14576 = chunk__14377_14573.cljs$core$IIndexed$_nth$arity$2(null,i__14379_14575);
if((cljs.core.get.cljs$core$IFn$_invoke$arity$2(plugin_metadata,field_14576) == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Missing required field: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(field_14576)].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"field","field",-1302436500),field_14576,new cljs.core.Keyword(null,"plugin","plugin",-1688841923),plugin_metadata], null));
} else {
}


var G__14577 = seq__14376_14572;
var G__14578 = chunk__14377_14573;
var G__14579 = count__14378_14574;
var G__14580 = (i__14379_14575 + (1));
seq__14376_14572 = G__14577;
chunk__14377_14573 = G__14578;
count__14378_14574 = G__14579;
i__14379_14575 = G__14580;
continue;
} else {
var temp__5804__auto___14581 = cljs.core.seq(seq__14376_14572);
if(temp__5804__auto___14581){
var seq__14376_14582__$1 = temp__5804__auto___14581;
if(cljs.core.chunked_seq_QMARK_(seq__14376_14582__$1)){
var c__5525__auto___14583 = cljs.core.chunk_first(seq__14376_14582__$1);
var G__14584 = cljs.core.chunk_rest(seq__14376_14582__$1);
var G__14585 = c__5525__auto___14583;
var G__14586 = cljs.core.count(c__5525__auto___14583);
var G__14587 = (0);
seq__14376_14572 = G__14584;
chunk__14377_14573 = G__14585;
count__14378_14574 = G__14586;
i__14379_14575 = G__14587;
continue;
} else {
var field_14588 = cljs.core.first(seq__14376_14582__$1);
if((cljs.core.get.cljs$core$IFn$_invoke$arity$2(plugin_metadata,field_14588) == null)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(["Missing required field: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(field_14588)].join(''),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"field","field",-1302436500),field_14588,new cljs.core.Keyword(null,"plugin","plugin",-1688841923),plugin_metadata], null));
} else {
}


var G__14589 = cljs.core.next(seq__14376_14582__$1);
var G__14590 = null;
var G__14591 = (0);
var G__14592 = (0);
seq__14376_14572 = G__14589;
chunk__14377_14573 = G__14590;
count__14378_14574 = G__14591;
i__14379_14575 = G__14592;
continue;
}
} else {
}
}
break;
}

if(cljs.core.truth_(cljs.core.re_matches(/^\d+\.\d+\.\d+(-.*)?$/,new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(plugin_metadata)))){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Invalid version format (should be semver)",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"version","version",425292698),new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(plugin_metadata)], null));
}

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"valid","valid",155614240),true], null);
}catch (e14374){if((e14374 instanceof Error)){
var e = e14374;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"valid","valid",155614240),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14374;

}
}});
/**
 * Register plugin hooks for a specific plugin
 */
opencode_unified.plugins.register_plugin_hooks = (function opencode_unified$plugins$register_plugin_hooks(plugin_id,hooks){
var seq__14385 = cljs.core.seq(hooks);
var chunk__14386 = null;
var count__14387 = (0);
var i__14388 = (0);
while(true){
if((i__14388 < count__14387)){
var hook_type = chunk__14386.cljs$core$IIndexed$_nth$arity$2(null,i__14388);
if(cljs.core.contains_QMARK_(cljs.core.set(opencode_unified.plugins.hook_types),hook_type)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.plugins.plugin_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263),hook_type], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([plugin_id], 0));
} else {
}


var G__14593 = seq__14385;
var G__14594 = chunk__14386;
var G__14595 = count__14387;
var G__14596 = (i__14388 + (1));
seq__14385 = G__14593;
chunk__14386 = G__14594;
count__14387 = G__14595;
i__14388 = G__14596;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__14385);
if(temp__5804__auto__){
var seq__14385__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__14385__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__14385__$1);
var G__14597 = cljs.core.chunk_rest(seq__14385__$1);
var G__14598 = c__5525__auto__;
var G__14599 = cljs.core.count(c__5525__auto__);
var G__14600 = (0);
seq__14385 = G__14597;
chunk__14386 = G__14598;
count__14387 = G__14599;
i__14388 = G__14600;
continue;
} else {
var hook_type = cljs.core.first(seq__14385__$1);
if(cljs.core.contains_QMARK_(cljs.core.set(opencode_unified.plugins.hook_types),hook_type)){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.plugins.plugin_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263),hook_type], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([plugin_id], 0));
} else {
}


var G__14601 = cljs.core.next(seq__14385__$1);
var G__14602 = null;
var G__14603 = (0);
var G__14604 = (0);
seq__14385 = G__14601;
chunk__14386 = G__14602;
count__14387 = G__14603;
i__14388 = G__14604;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Unregister plugin hooks for a specific plugin
 */
opencode_unified.plugins.unregister_plugin_hooks = (function opencode_unified$plugins$unregister_plugin_hooks(plugin_id){
var seq__14401 = cljs.core.seq(opencode_unified.plugins.hook_types);
var chunk__14402 = null;
var count__14403 = (0);
var i__14404 = (0);
while(true){
if((i__14404 < count__14403)){
var hook_type = chunk__14402.cljs$core$IIndexed$_nth$arity$2(null,i__14404);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263),hook_type], null),((function (seq__14401,chunk__14402,count__14403,i__14404,hook_type){
return (function (hooks){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (seq__14401,chunk__14402,count__14403,i__14404,hook_type){
return (function (p1__14399_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__14399_SHARP_,plugin_id);
});})(seq__14401,chunk__14402,count__14403,i__14404,hook_type))
,hooks);
});})(seq__14401,chunk__14402,count__14403,i__14404,hook_type))
);


var G__14605 = seq__14401;
var G__14606 = chunk__14402;
var G__14607 = count__14403;
var G__14608 = (i__14404 + (1));
seq__14401 = G__14605;
chunk__14402 = G__14606;
count__14403 = G__14607;
i__14404 = G__14608;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__14401);
if(temp__5804__auto__){
var seq__14401__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__14401__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__14401__$1);
var G__14609 = cljs.core.chunk_rest(seq__14401__$1);
var G__14610 = c__5525__auto__;
var G__14611 = cljs.core.count(c__5525__auto__);
var G__14612 = (0);
seq__14401 = G__14609;
chunk__14402 = G__14610;
count__14403 = G__14611;
i__14404 = G__14612;
continue;
} else {
var hook_type = cljs.core.first(seq__14401__$1);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263),hook_type], null),((function (seq__14401,chunk__14402,count__14403,i__14404,hook_type,seq__14401__$1,temp__5804__auto__){
return (function (hooks){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2(((function (seq__14401,chunk__14402,count__14403,i__14404,hook_type,seq__14401__$1,temp__5804__auto__){
return (function (p1__14399_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__14399_SHARP_,plugin_id);
});})(seq__14401,chunk__14402,count__14403,i__14404,hook_type,seq__14401__$1,temp__5804__auto__))
,hooks);
});})(seq__14401,chunk__14402,count__14403,i__14404,hook_type,seq__14401__$1,temp__5804__auto__))
);


var G__14613 = cljs.core.next(seq__14401__$1);
var G__14614 = null;
var G__14615 = (0);
var G__14616 = (0);
seq__14401 = G__14613;
chunk__14402 = G__14614;
count__14403 = G__14615;
i__14404 = G__14616;
continue;
}
} else {
return null;
}
}
break;
}
});
/**
 * Execute all plugins registered for a specific hook
 */
opencode_unified.plugins.execute_hook = (function opencode_unified$plugins$execute_hook(var_args){
var args__5732__auto__ = [];
var len__5726__auto___14617 = arguments.length;
var i__5727__auto___14618 = (0);
while(true){
if((i__5727__auto___14618 < len__5726__auto___14617)){
args__5732__auto__.push((arguments[i__5727__auto___14618]));

var G__14619 = (i__5727__auto___14618 + (1));
i__5727__auto___14618 = G__14619;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic = (function (hook_type,args){
var plugin_ids = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263),hook_type], null));
var seq__14411 = cljs.core.seq(plugin_ids);
var chunk__14412 = null;
var count__14413 = (0);
var i__14414 = (0);
while(true){
if((i__14414 < count__14413)){
var plugin_id = chunk__14412.cljs$core$IIndexed$_nth$arity$2(null,i__14414);
var temp__5804__auto___14620 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),plugin_id], null));
if(cljs.core.truth_(temp__5804__auto___14620)){
var plugin_14621 = temp__5804__auto___14620;
var temp__5804__auto___14622__$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(plugin_14621,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"instance","instance",-2121349050),new cljs.core.Keyword(null,"hooks","hooks",-413590103),hook_type], null));
if(cljs.core.truth_(temp__5804__auto___14622__$1)){
var hook_fn_14623 = temp__5804__auto___14622__$1;
try{cljs.core.apply.cljs$core$IFn$_invoke$arity$2(hook_fn_14623,args);
}catch (e14466){if((e14466 instanceof Error)){
var e_14624 = e14466;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error executing hook",hook_type,"for plugin",plugin_id,":",e_14624.message], 0));
} else {
throw e14466;

}
}} else {
}
} else {
}


var G__14625 = seq__14411;
var G__14626 = chunk__14412;
var G__14627 = count__14413;
var G__14628 = (i__14414 + (1));
seq__14411 = G__14625;
chunk__14412 = G__14626;
count__14413 = G__14627;
i__14414 = G__14628;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__14411);
if(temp__5804__auto__){
var seq__14411__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__14411__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__14411__$1);
var G__14629 = cljs.core.chunk_rest(seq__14411__$1);
var G__14630 = c__5525__auto__;
var G__14631 = cljs.core.count(c__5525__auto__);
var G__14632 = (0);
seq__14411 = G__14629;
chunk__14412 = G__14630;
count__14413 = G__14631;
i__14414 = G__14632;
continue;
} else {
var plugin_id = cljs.core.first(seq__14411__$1);
var temp__5804__auto___14633__$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),plugin_id], null));
if(cljs.core.truth_(temp__5804__auto___14633__$1)){
var plugin_14634 = temp__5804__auto___14633__$1;
var temp__5804__auto___14635__$2 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(plugin_14634,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"instance","instance",-2121349050),new cljs.core.Keyword(null,"hooks","hooks",-413590103),hook_type], null));
if(cljs.core.truth_(temp__5804__auto___14635__$2)){
var hook_fn_14636 = temp__5804__auto___14635__$2;
try{cljs.core.apply.cljs$core$IFn$_invoke$arity$2(hook_fn_14636,args);
}catch (e14467){if((e14467 instanceof Error)){
var e_14637 = e14467;
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error executing hook",hook_type,"for plugin",plugin_id,":",e_14637.message], 0));
} else {
throw e14467;

}
}} else {
}
} else {
}


var G__14638 = cljs.core.next(seq__14411__$1);
var G__14639 = null;
var G__14640 = (0);
var G__14641 = (0);
seq__14411 = G__14638;
chunk__14412 = G__14639;
count__14413 = G__14640;
i__14414 = G__14641;
continue;
}
} else {
return null;
}
}
break;
}
}));

(opencode_unified.plugins.execute_hook.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(opencode_unified.plugins.execute_hook.cljs$lang$applyTo = (function (seq14408){
var G__14409 = cljs.core.first(seq14408);
var seq14408__$1 = cljs.core.next(seq14408);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14409,seq14408__$1);
}));

/**
 * Load a plugin from its metadata
 */
opencode_unified.plugins.load_plugin = (function opencode_unified$plugins$load_plugin(plugin_metadata){
var plugin_id = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin_metadata);
try{cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id], null),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"metadata","metadata",1799301597),plugin_metadata,new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"loading","loading",-737050189),new cljs.core.Keyword(null,"loaded-at","loaded-at",1251850584),(new Date())], null));

var validation_14642 = opencode_unified.plugins.validate_plugin(plugin_metadata);
if(cljs.core.truth_(new cljs.core.Keyword(null,"valid","valid",155614240).cljs$core$IFn$_invoke$arity$1(validation_14642))){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(validation_14642),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"plugin","plugin",-1688841923),plugin_metadata], null));
}

var plugin_namespace = cljs.core.symbol.cljs$core$IFn$_invoke$arity$1(["opencode-unified.plugins.",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin_metadata))].join(''));
var plugin_instance = new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),plugin_id,new cljs.core.Keyword(null,"namespace","namespace",-377510372),plugin_namespace,new cljs.core.Keyword(null,"hooks","hooks",-413590103),cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"commands","commands",161008658),new cljs.core.Keyword(null,"commands","commands",161008658).cljs$core$IFn$_invoke$arity$2(plugin_metadata,cljs.core.PersistentVector.EMPTY),new cljs.core.Keyword(null,"config","config",994861415),new cljs.core.Keyword(null,"config","config",994861415).cljs$core$IFn$_invoke$arity$2(plugin_metadata,cljs.core.PersistentArrayMap.EMPTY),new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"loaded","loaded",-1246482293)], null);
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id], null),cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id], null)),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"instance","instance",-2121349050),plugin_instance,new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"loaded","loaded",-1246482293)], null)], 0)));

if(cljs.core.truth_(new cljs.core.Keyword(null,"hooks","hooks",-413590103).cljs$core$IFn$_invoke$arity$1(plugin_metadata))){
opencode_unified.plugins.register_plugin_hooks(plugin_id,new cljs.core.Keyword(null,"hooks","hooks",-413590103).cljs$core$IFn$_invoke$arity$1(plugin_metadata));
} else {
}

var temp__5804__auto___14643 = new cljs.core.Keyword(null,"commands","commands",161008658).cljs$core$IFn$_invoke$arity$1(plugin_metadata);
if(cljs.core.truth_(temp__5804__auto___14643)){
var commands_14644 = temp__5804__auto___14643;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.plugins.plugin_state,cljs.core.update,new cljs.core.Keyword(null,"plugin-commands","plugin-commands",1439817142),cljs.core.concat,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__14469_SHARP_){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(p1__14469_SHARP_,new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id);
}),commands_14644)], 0));
} else {
}

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Plugin loaded:",plugin_id], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id], null);
}catch (e14471){if((e14471 instanceof Error)){
var e = e14471;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id,new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"error","error",-978969032));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc,new cljs.core.Keyword(null,"last-error","last-error",1848699973),e.message);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error loading plugin",plugin_id,":",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14471;

}
}});
/**
 * Activate a loaded plugin
 */
opencode_unified.plugins.activate_plugin = (function opencode_unified$plugins$activate_plugin(plugin_id){
try{var plugin = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id], null));
if(cljs.core.truth_(plugin)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Plugin not found",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id], null));
}

if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(plugin),new cljs.core.Keyword(null,"loaded","loaded",-1246482293))){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Plugin not in loaded state",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id,new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(plugin)], null));
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id,new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"activating","activating",-513392578));

var temp__5804__auto___14645 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(plugin,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"instance","instance",-2121349050),new cljs.core.Keyword(null,"activate","activate",441219614)], null));
if(cljs.core.truth_(temp__5804__auto___14645)){
var activate_fn_14646 = temp__5804__auto___14645;
var G__14480_14647 = new cljs.core.Keyword(null,"config","config",994861415).cljs$core$IFn$_invoke$arity$1(plugin);
(activate_fn_14646.cljs$core$IFn$_invoke$arity$1 ? activate_fn_14646.cljs$core$IFn$_invoke$arity$1(G__14480_14647) : activate_fn_14646.call(null,G__14480_14647));
} else {
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),plugin_id], null),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id], null)));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id,new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"active","active",1895962068));

opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"plugin-activated","plugin-activated",470917953),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([plugin_id], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Plugin activated:",plugin_id], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id], null);
}catch (e14476){if((e14476 instanceof Error)){
var e = e14476;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id,new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"error","error",-978969032));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc,new cljs.core.Keyword(null,"last-error","last-error",1848699973),e.message);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error activating plugin",plugin_id,":",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14476;

}
}});
/**
 * Deactivate an active plugin
 */
opencode_unified.plugins.deactivate_plugin = (function opencode_unified$plugins$deactivate_plugin(plugin_id){
try{var plugin = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),plugin_id], null));
if(cljs.core.truth_(plugin)){
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Plugin not active",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id], null));
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),plugin_id,new cljs.core.Keyword(null,"state","state",-1988618099)], null),new cljs.core.Keyword(null,"deactivating","deactivating",952478781));

var temp__5804__auto___14648 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(plugin,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"instance","instance",-2121349050),new cljs.core.Keyword(null,"deactivate","deactivate",-1313810707)], null));
if(cljs.core.truth_(temp__5804__auto___14648)){
var deactivate_fn_14649 = temp__5804__auto___14648;
(deactivate_fn_14649.cljs$core$IFn$_invoke$arity$0 ? deactivate_fn_14649.cljs$core$IFn$_invoke$arity$0() : deactivate_fn_14649.call(null));
} else {
}

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc_in,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),plugin_id], null),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(plugin,new cljs.core.Keyword(null,"state","state",-1988618099),new cljs.core.Keyword(null,"loaded","loaded",-1246482293)));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.plugins.plugin_state,cljs.core.update,new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([plugin_id], 0));

opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"plugin-deactivated","plugin-deactivated",1256879714),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([plugin_id], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Plugin deactivated:",plugin_id], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id], null);
}catch (e14484){if((e14484 instanceof Error)){
var e = e14484;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc,new cljs.core.Keyword(null,"last-error","last-error",1848699973),e.message);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error deactivating plugin",plugin_id,":",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14484;

}
}});
/**
 * Unload a plugin completely
 */
opencode_unified.plugins.unload_plugin = (function opencode_unified$plugins$unload_plugin(plugin_id){
try{if(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836),plugin_id], null)))){
opencode_unified.plugins.deactivate_plugin(plugin_id);
} else {
}

opencode_unified.plugins.unregister_plugin_hooks(plugin_id);

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.update,new cljs.core.Keyword(null,"plugin-commands","plugin-commands",1439817142),(function (commands){
return cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__14485_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395).cljs$core$IFn$_invoke$arity$1(p1__14485_SHARP_),plugin_id);
}),commands);
}));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(opencode_unified.plugins.plugin_state,cljs.core.update,new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),cljs.core.dissoc,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([plugin_id], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Plugin unloaded:",plugin_id], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),true,new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395),plugin_id], null);
}catch (e14486){if((e14486 instanceof Error)){
var e = e14486;
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc,new cljs.core.Keyword(null,"last-error","last-error",1848699973),e.message);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error unloading plugin",plugin_id,":",e.message], 0));

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14486;

}
}});
/**
 * Discover available plugins in the plugins directory
 */
opencode_unified.plugins.discover_plugins = (function opencode_unified$plugins$discover_plugins(){
var configured = (function (){var G__14502 = window;
var G__14502__$1 = (((G__14502 == null))?null:(G__14502["__OPENCODE_PLUGINS__"]));
if((G__14502__$1 == null)){
return null;
} else {
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(G__14502__$1,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
}
})();
if(cljs.core.vector_QMARK_(configured)){
return configured;
} else {
return cljs.core.PersistentVector.EMPTY;
}
});
/**
 * Initialize the plugin system
 */
opencode_unified.plugins.initialize_plugin_system = (function opencode_unified$plugins$initialize_plugin_system(){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Initializing plugin system..."], 0));

var plugins_14650 = opencode_unified.plugins.discover_plugins();
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(opencode_unified.plugins.plugin_state,cljs.core.assoc,new cljs.core.Keyword(null,"available-plugins","available-plugins",1884325526),plugins_14650);

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Discovered",cljs.core.count(plugins_14650),"plugins"], 0));

var seq__14503_14651 = cljs.core.seq(new cljs.core.Keyword(null,"available-plugins","available-plugins",1884325526).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.plugins.plugin_state)));
var chunk__14504_14652 = null;
var count__14505_14653 = (0);
var i__14506_14654 = (0);
while(true){
if((i__14506_14654 < count__14505_14653)){
var plugin_14655 = chunk__14504_14652.cljs$core$IIndexed$_nth$arity$2(null,i__14506_14654);
if(cljs.core.truth_(new cljs.core.Keyword(null,"enabled","enabled",1195909756).cljs$core$IFn$_invoke$arity$1(plugin_14655))){
var result_14656 = opencode_unified.plugins.load_plugin(plugin_14655);
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result_14656))){
opencode_unified.plugins.activate_plugin(new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395).cljs$core$IFn$_invoke$arity$1(result_14656));
} else {
}
} else {
}


var G__14657 = seq__14503_14651;
var G__14658 = chunk__14504_14652;
var G__14659 = count__14505_14653;
var G__14660 = (i__14506_14654 + (1));
seq__14503_14651 = G__14657;
chunk__14504_14652 = G__14658;
count__14505_14653 = G__14659;
i__14506_14654 = G__14660;
continue;
} else {
var temp__5804__auto___14661 = cljs.core.seq(seq__14503_14651);
if(temp__5804__auto___14661){
var seq__14503_14662__$1 = temp__5804__auto___14661;
if(cljs.core.chunked_seq_QMARK_(seq__14503_14662__$1)){
var c__5525__auto___14663 = cljs.core.chunk_first(seq__14503_14662__$1);
var G__14664 = cljs.core.chunk_rest(seq__14503_14662__$1);
var G__14665 = c__5525__auto___14663;
var G__14666 = cljs.core.count(c__5525__auto___14663);
var G__14667 = (0);
seq__14503_14651 = G__14664;
chunk__14504_14652 = G__14665;
count__14505_14653 = G__14666;
i__14506_14654 = G__14667;
continue;
} else {
var plugin_14668 = cljs.core.first(seq__14503_14662__$1);
if(cljs.core.truth_(new cljs.core.Keyword(null,"enabled","enabled",1195909756).cljs$core$IFn$_invoke$arity$1(plugin_14668))){
var result_14669 = opencode_unified.plugins.load_plugin(plugin_14668);
if(cljs.core.truth_(new cljs.core.Keyword(null,"success","success",1890645906).cljs$core$IFn$_invoke$arity$1(result_14669))){
opencode_unified.plugins.activate_plugin(new cljs.core.Keyword(null,"plugin-id","plugin-id",-1788213395).cljs$core$IFn$_invoke$arity$1(result_14669));
} else {
}
} else {
}


var G__14670 = cljs.core.next(seq__14503_14662__$1);
var G__14671 = null;
var G__14672 = (0);
var G__14673 = (0);
seq__14503_14651 = G__14670;
chunk__14504_14652 = G__14671;
count__14505_14653 = G__14672;
i__14506_14654 = G__14673;
continue;
}
} else {
}
}
break;
}

cljs.core.add_watch(opencode_unified.state.app_state,new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263),(function (_,___$1,old_state,new_state){
var old_buffers = new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(old_state);
var new_buffers = new cljs.core.Keyword(null,"buffers","buffers",471409492).cljs$core$IFn$_invoke$arity$1(new_state);
var seq__14508_14674 = cljs.core.seq(new_buffers);
var chunk__14509_14675 = null;
var count__14510_14676 = (0);
var i__14511_14677 = (0);
while(true){
if((i__14511_14677 < count__14510_14676)){
var vec__14522_14678 = chunk__14509_14675.cljs$core$IIndexed$_nth$arity$2(null,i__14511_14677);
var buffer_id_14679 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14522_14678,(0),null);
var buffer_14680 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14522_14678,(1),null);
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(old_buffers,buffer_id_14679))){
} else {
opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"buffer-created","buffer-created",-997519470),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer_14680], 0));
}


var G__14681 = seq__14508_14674;
var G__14682 = chunk__14509_14675;
var G__14683 = count__14510_14676;
var G__14684 = (i__14511_14677 + (1));
seq__14508_14674 = G__14681;
chunk__14509_14675 = G__14682;
count__14510_14676 = G__14683;
i__14511_14677 = G__14684;
continue;
} else {
var temp__5804__auto___14685 = cljs.core.seq(seq__14508_14674);
if(temp__5804__auto___14685){
var seq__14508_14686__$1 = temp__5804__auto___14685;
if(cljs.core.chunked_seq_QMARK_(seq__14508_14686__$1)){
var c__5525__auto___14687 = cljs.core.chunk_first(seq__14508_14686__$1);
var G__14688 = cljs.core.chunk_rest(seq__14508_14686__$1);
var G__14689 = c__5525__auto___14687;
var G__14690 = cljs.core.count(c__5525__auto___14687);
var G__14691 = (0);
seq__14508_14674 = G__14688;
chunk__14509_14675 = G__14689;
count__14510_14676 = G__14690;
i__14511_14677 = G__14691;
continue;
} else {
var vec__14525_14692 = cljs.core.first(seq__14508_14686__$1);
var buffer_id_14693 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14525_14692,(0),null);
var buffer_14694 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14525_14692,(1),null);
if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(old_buffers,buffer_id_14693))){
} else {
opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"buffer-created","buffer-created",-997519470),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer_14694], 0));
}


var G__14695 = cljs.core.next(seq__14508_14686__$1);
var G__14696 = null;
var G__14697 = (0);
var G__14698 = (0);
seq__14508_14674 = G__14695;
chunk__14509_14675 = G__14696;
count__14510_14676 = G__14697;
i__14511_14677 = G__14698;
continue;
}
} else {
}
}
break;
}

var seq__14528 = cljs.core.seq(new_buffers);
var chunk__14529 = null;
var count__14530 = (0);
var i__14531 = (0);
while(true){
if((i__14531 < count__14530)){
var vec__14539 = chunk__14529.cljs$core$IIndexed$_nth$arity$2(null,i__14531);
var buffer_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14539,(0),null);
var buffer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14539,(1),null);
var old_buffer_14699 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(old_buffers,buffer_id);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_buffer_14699;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = buffer;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = cljs.core.not(new cljs.core.Keyword(null,"saved?","saved?",-2027163192).cljs$core$IFn$_invoke$arity$1(old_buffer_14699));
if(and__5000__auto____$2){
return new cljs.core.Keyword(null,"saved?","saved?",-2027163192).cljs$core$IFn$_invoke$arity$1(buffer);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"buffer-saved","buffer-saved",1827952050),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer], 0));
} else {
}


var G__14700 = seq__14528;
var G__14701 = chunk__14529;
var G__14702 = count__14530;
var G__14703 = (i__14531 + (1));
seq__14528 = G__14700;
chunk__14529 = G__14701;
count__14530 = G__14702;
i__14531 = G__14703;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__14528);
if(temp__5804__auto__){
var seq__14528__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__14528__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__14528__$1);
var G__14704 = cljs.core.chunk_rest(seq__14528__$1);
var G__14705 = c__5525__auto__;
var G__14706 = cljs.core.count(c__5525__auto__);
var G__14707 = (0);
seq__14528 = G__14704;
chunk__14529 = G__14705;
count__14530 = G__14706;
i__14531 = G__14707;
continue;
} else {
var vec__14546 = cljs.core.first(seq__14528__$1);
var buffer_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14546,(0),null);
var buffer = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__14546,(1),null);
var old_buffer_14708 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(old_buffers,buffer_id);
if(cljs.core.truth_((function (){var and__5000__auto__ = old_buffer_14708;
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = buffer;
if(cljs.core.truth_(and__5000__auto____$1)){
var and__5000__auto____$2 = cljs.core.not(new cljs.core.Keyword(null,"saved?","saved?",-2027163192).cljs$core$IFn$_invoke$arity$1(old_buffer_14708));
if(and__5000__auto____$2){
return new cljs.core.Keyword(null,"saved?","saved?",-2027163192).cljs$core$IFn$_invoke$arity$1(buffer);
} else {
return and__5000__auto____$2;
}
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
opencode_unified.plugins.execute_hook.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"buffer-saved","buffer-saved",1827952050),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([buffer], 0));
} else {
}


var G__14709 = cljs.core.next(seq__14528__$1);
var G__14710 = null;
var G__14711 = (0);
var G__14712 = (0);
seq__14528 = G__14709;
chunk__14529 = G__14710;
count__14530 = G__14711;
i__14531 = G__14712;
continue;
}
} else {
return null;
}
}
break;
}
}));

return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Plugin system initialized"], 0));
});
/**
 * Get current plugin system state
 */
opencode_unified.plugins.get_plugin_state = (function opencode_unified$plugins$get_plugin_state(){
return cljs.core.deref(opencode_unified.plugins.plugin_state);
});
/**
 * Get list of loaded plugins
 */
opencode_unified.plugins.get_loaded_plugins = (function opencode_unified$plugins$get_loaded_plugins(){
return cljs.core.vals(new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.plugins.plugin_state)));
});
/**
 * Get list of active plugins
 */
opencode_unified.plugins.get_active_plugins = (function opencode_unified$plugins$get_active_plugins(){
return cljs.core.vals(new cljs.core.Keyword(null,"active-plugins","active-plugins",-713061836).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.plugins.plugin_state)));
});
/**
 * Get all commands from active plugins
 */
opencode_unified.plugins.get_plugin_commands = (function opencode_unified$plugins$get_plugin_commands(){
return new cljs.core.Keyword(null,"plugin-commands","plugin-commands",1439817142).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.plugins.plugin_state));
});
/**
 * Execute a command from a plugin
 */
opencode_unified.plugins.execute_plugin_command = (function opencode_unified$plugins$execute_plugin_command(var_args){
var args__5732__auto__ = [];
var len__5726__auto___14713 = arguments.length;
var i__5727__auto___14714 = (0);
while(true){
if((i__5727__auto___14714 < len__5726__auto___14713)){
args__5732__auto__.push((arguments[i__5727__auto___14714]));

var G__14715 = (i__5727__auto___14714 + (1));
i__5727__auto___14714 = G__14715;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return opencode_unified.plugins.execute_plugin_command.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(opencode_unified.plugins.execute_plugin_command.cljs$core$IFn$_invoke$arity$variadic = (function (command_name,args){
var temp__5804__auto__ = cljs.core.some((function (p1__14549_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(p1__14549_SHARP_),command_name)){
return p1__14549_SHARP_;
} else {
return null;
}
}),opencode_unified.plugins.get_plugin_commands());
if(cljs.core.truth_(temp__5804__auto__)){
var command = temp__5804__auto__;
try{cljs.core.apply.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"handler","handler",-195596612).cljs$core$IFn$_invoke$arity$1(command),args);

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"success","success",1890645906),true], null);
}catch (e14552){if((e14552 instanceof Error)){
var e = e14552;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"success","success",1890645906),false,new cljs.core.Keyword(null,"error","error",-978969032),e.message], null);
} else {
throw e14552;

}
}} else {
return null;
}
}));

(opencode_unified.plugins.execute_plugin_command.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(opencode_unified.plugins.execute_plugin_command.cljs$lang$applyTo = (function (seq14550){
var G__14551 = cljs.core.first(seq14550);
var seq14550__$1 = cljs.core.next(seq14550);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__14551,seq14550__$1);
}));

/**
 * UI component for managing plugins
 */
opencode_unified.plugins.plugin_manager_ui = (function opencode_unified$plugins$plugin_manager_ui(){
var active_tab = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"loaded","loaded",-1246482293));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-manager","div.plugin-manager",1276272025),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-tabs","div.plugin-tabs",-1195563401),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(active_tab),new cljs.core.Keyword(null,"loaded","loaded",-1246482293)))?"active":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(active_tab,new cljs.core.Keyword(null,"loaded","loaded",-1246482293));
})], null),"Loaded Plugins"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(active_tab),new cljs.core.Keyword(null,"available","available",-1470697127)))?"active":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return cljs.core.reset_BANG_(active_tab,new cljs.core.Keyword(null,"available","available",-1470697127));
})], null),"Available Plugins"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-content","div.plugin-content",1944130618),(function (){var G__14556 = cljs.core.deref(active_tab);
var G__14556__$1 = (((G__14556 instanceof cljs.core.Keyword))?G__14556.fqn:null);
switch (G__14556__$1) {
case "loaded":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.loaded-plugins","div.loaded-plugins",302517401),(function (){var iter__5480__auto__ = (function opencode_unified$plugins$plugin_manager_ui_$_iter__14557(s__14558){
return (new cljs.core.LazySeq(null,(function (){
var s__14558__$1 = s__14558;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14558__$1);
if(temp__5804__auto__){
var s__14558__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14558__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14558__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14560 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14559 = (0);
while(true){
if((i__14559 < size__5479__auto__)){
var plugin = cljs.core._nth(c__5478__auto__,i__14559);
cljs.core.chunk_append(b__14560,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-item","div.plugin-item",325113644),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-info","div.plugin-info",-549357861),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4","h4",2004862993),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.plugin-state","span.plugin-state",1301424781),cljs.core.get.cljs$core$IFn$_invoke$arity$2(opencode_unified.plugins.plugin_states,new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(plugin))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-actions","div.plugin-actions",-1982375481),(function (){var G__14565 = new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(plugin);
var G__14565__$1 = (((G__14565 instanceof cljs.core.Keyword))?G__14565.fqn:null);
switch (G__14565__$1) {
case "active":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14559,G__14565,G__14565__$1,plugin,c__5478__auto__,size__5479__auto__,b__14560,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.deactivate_plugin(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin));
});})(i__14559,G__14565,G__14565__$1,plugin,c__5478__auto__,size__5479__auto__,b__14560,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Deactivate"], null);

break;
case "loaded":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14559,G__14565,G__14565__$1,plugin,c__5478__auto__,size__5479__auto__,b__14560,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.activate_plugin(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin));
});})(i__14559,G__14565,G__14565__$1,plugin,c__5478__auto__,size__5479__auto__,b__14560,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Activate"], null);

break;
default:
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14559,G__14565,G__14565__$1,plugin,c__5478__auto__,size__5479__auto__,b__14560,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.unload_plugin(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin));
});})(i__14559,G__14565,G__14565__$1,plugin,c__5478__auto__,size__5479__auto__,b__14560,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Unload"], null);

}
})()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin)], null)));

var G__14718 = (i__14559 + (1));
i__14559 = G__14718;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14560),opencode_unified$plugins$plugin_manager_ui_$_iter__14557(cljs.core.chunk_rest(s__14558__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14560),null);
}
} else {
var plugin = cljs.core.first(s__14558__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-item","div.plugin-item",325113644),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-info","div.plugin-info",-549357861),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4","h4",2004862993),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.plugin-state","span.plugin-state",1301424781),cljs.core.get.cljs$core$IFn$_invoke$arity$2(opencode_unified.plugins.plugin_states,new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(plugin))], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-actions","div.plugin-actions",-1982375481),(function (){var G__14566 = new cljs.core.Keyword(null,"state","state",-1988618099).cljs$core$IFn$_invoke$arity$1(plugin);
var G__14566__$1 = (((G__14566 instanceof cljs.core.Keyword))?G__14566.fqn:null);
switch (G__14566__$1) {
case "active":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (G__14566,G__14566__$1,plugin,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.deactivate_plugin(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin));
});})(G__14566,G__14566__$1,plugin,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Deactivate"], null);

break;
case "loaded":
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (G__14566,G__14566__$1,plugin,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.activate_plugin(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin));
});})(G__14566,G__14566__$1,plugin,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Activate"], null);

break;
default:
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (G__14566,G__14566__$1,plugin,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.unload_plugin(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin));
});})(G__14566,G__14566__$1,plugin,s__14558__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Unload"], null);

}
})()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(plugin)], null)),opencode_unified$plugins$plugin_manager_ui_$_iter__14557(cljs.core.rest(s__14558__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(opencode_unified.plugins.get_loaded_plugins());
})()], null);

break;
case "available":
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.available-plugins","div.available-plugins",-2033418264),(function (){var iter__5480__auto__ = (function opencode_unified$plugins$plugin_manager_ui_$_iter__14567(s__14568){
return (new cljs.core.LazySeq(null,(function (){
var s__14568__$1 = s__14568;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__14568__$1);
if(temp__5804__auto__){
var s__14568__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__14568__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__14568__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__14570 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__14569 = (0);
while(true){
if((i__14569 < size__5479__auto__)){
var plugin = cljs.core._nth(c__5478__auto__,i__14569);
cljs.core.chunk_append(b__14570,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-item","div.plugin-item",325113644),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-info","div.plugin-info",-549357861),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4","h4",2004862993),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"v",new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(plugin)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-actions","div.plugin-actions",-1982375481),(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Already loaded"], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__14569,plugin,c__5478__auto__,size__5479__auto__,b__14570,s__14568__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.load_plugin(plugin);
});})(i__14569,plugin,c__5478__auto__,size__5479__auto__,b__14570,s__14568__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Load"], null))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null)));

var G__14720 = (i__14569 + (1));
i__14569 = G__14720;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__14570),opencode_unified$plugins$plugin_manager_ui_$_iter__14567(cljs.core.chunk_rest(s__14568__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__14570),null);
}
} else {
var plugin = cljs.core.first(s__14568__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-item","div.plugin-item",325113644),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-info","div.plugin-info",-549357861),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4","h4",2004862993),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.Keyword(null,"description","description",-1428560544).cljs$core$IFn$_invoke$arity$1(plugin)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"v",new cljs.core.Keyword(null,"version","version",425292698).cljs$core$IFn$_invoke$arity$1(plugin)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.plugin-actions","div.plugin-actions",-1982375481),(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(opencode_unified.plugins.plugin_state),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loaded-plugins","loaded-plugins",1501837193),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),"Already loaded"], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (plugin,s__14568__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab){
return (function (){
return opencode_unified.plugins.load_plugin(plugin);
});})(plugin,s__14568__$2,temp__5804__auto__,G__14556,G__14556__$1,active_tab))
], null),"Load"], null))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(plugin)], null)),opencode_unified$plugins$plugin_manager_ui_$_iter__14567(cljs.core.rest(s__14568__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"available-plugins","available-plugins",1884325526).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.plugins.plugin_state)));
})()], null);

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__14556__$1)].join('')));

}
})()], null)], null);
});
});
/**
 * Get all registered hooks
 */
opencode_unified.plugins.get_plugin_hooks = (function opencode_unified$plugins$get_plugin_hooks(){
return new cljs.core.Keyword(null,"plugin-hooks","plugin-hooks",-1938326263).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(opencode_unified.plugins.plugin_state));
});

//# sourceMappingURL=opencode_unified.plugins.js.map
