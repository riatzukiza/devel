goog.provide('cljs.repl');
cljs.repl.print_doc = (function cljs$repl$print_doc(p__21353){
var map__21355 = p__21353;
var map__21355__$1 = cljs.core.__destructure_map(map__21355);
var m = map__21355__$1;
var n = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21355__$1,new cljs.core.Keyword(null,"ns","ns",441598760));
var nm = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21355__$1,new cljs.core.Keyword(null,"name","name",1843675177));
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["-------------------------"], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"spec","spec",347520401).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return [(function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"ns","ns",441598760).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(temp__5804__auto__)){
var ns = temp__5804__auto__;
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(ns),"/"].join('');
} else {
return null;
}
})(),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(m))].join('');
}
})()], 0));

if(cljs.core.truth_(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Protocol"], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"forms","forms",2045992350).cljs$core$IFn$_invoke$arity$1(m))){
var seq__21363_21632 = cljs.core.seq(new cljs.core.Keyword(null,"forms","forms",2045992350).cljs$core$IFn$_invoke$arity$1(m));
var chunk__21364_21633 = null;
var count__21365_21634 = (0);
var i__21366_21635 = (0);
while(true){
if((i__21366_21635 < count__21365_21634)){
var f_21638 = chunk__21364_21633.cljs$core$IIndexed$_nth$arity$2(null,i__21366_21635);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["  ",f_21638], 0));


var G__21639 = seq__21363_21632;
var G__21640 = chunk__21364_21633;
var G__21641 = count__21365_21634;
var G__21642 = (i__21366_21635 + (1));
seq__21363_21632 = G__21639;
chunk__21364_21633 = G__21640;
count__21365_21634 = G__21641;
i__21366_21635 = G__21642;
continue;
} else {
var temp__5804__auto___21643 = cljs.core.seq(seq__21363_21632);
if(temp__5804__auto___21643){
var seq__21363_21644__$1 = temp__5804__auto___21643;
if(cljs.core.chunked_seq_QMARK_(seq__21363_21644__$1)){
var c__5525__auto___21646 = cljs.core.chunk_first(seq__21363_21644__$1);
var G__21647 = cljs.core.chunk_rest(seq__21363_21644__$1);
var G__21648 = c__5525__auto___21646;
var G__21649 = cljs.core.count(c__5525__auto___21646);
var G__21650 = (0);
seq__21363_21632 = G__21647;
chunk__21364_21633 = G__21648;
count__21365_21634 = G__21649;
i__21366_21635 = G__21650;
continue;
} else {
var f_21655 = cljs.core.first(seq__21363_21644__$1);
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["  ",f_21655], 0));


var G__21656 = cljs.core.next(seq__21363_21644__$1);
var G__21657 = null;
var G__21658 = (0);
var G__21659 = (0);
seq__21363_21632 = G__21656;
chunk__21364_21633 = G__21657;
count__21365_21634 = G__21658;
i__21366_21635 = G__21659;
continue;
}
} else {
}
}
break;
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(m))){
var arglists_21664 = new cljs.core.Keyword(null,"arglists","arglists",1661989754).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"macro","macro",-867863404).cljs$core$IFn$_invoke$arity$1(m);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"repl-special-function","repl-special-function",1262603725).cljs$core$IFn$_invoke$arity$1(m);
}
})())){
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([arglists_21664], 0));
} else {
cljs.core.prn.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Symbol(null,"quote","quote",1377916282,null),cljs.core.first(arglists_21664)))?cljs.core.second(arglists_21664):arglists_21664)], 0));
}
} else {
}
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"special-form","special-form",-1326536374).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Special Form"], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(m)], 0));

if(cljs.core.contains_QMARK_(m,new cljs.core.Keyword(null,"url","url",276297046))){
if(cljs.core.truth_(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(m))){
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n  Please see http://clojure.org/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"url","url",276297046).cljs$core$IFn$_invoke$arity$1(m))].join('')], 0));
} else {
return null;
}
} else {
return cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n  Please see http://clojure.org/special_forms#",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(m))].join('')], 0));
}
} else {
if(cljs.core.truth_(new cljs.core.Keyword(null,"macro","macro",-867863404).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Macro"], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"spec","spec",347520401).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Spec"], 0));
} else {
}

if(cljs.core.truth_(new cljs.core.Keyword(null,"repl-special-function","repl-special-function",1262603725).cljs$core$IFn$_invoke$arity$1(m))){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["REPL Special Function"], 0));
} else {
}

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",new cljs.core.Keyword(null,"doc","doc",1913296891).cljs$core$IFn$_invoke$arity$1(m)], 0));

if(cljs.core.truth_(new cljs.core.Keyword(null,"protocol","protocol",652470118).cljs$core$IFn$_invoke$arity$1(m))){
var seq__21388_21688 = cljs.core.seq(new cljs.core.Keyword(null,"methods","methods",453930866).cljs$core$IFn$_invoke$arity$1(m));
var chunk__21389_21689 = null;
var count__21390_21690 = (0);
var i__21391_21691 = (0);
while(true){
if((i__21391_21691 < count__21390_21690)){
var vec__21416_21692 = chunk__21389_21689.cljs$core$IIndexed$_nth$arity$2(null,i__21391_21691);
var name_21693 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21416_21692,(0),null);
var map__21419_21694 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21416_21692,(1),null);
var map__21419_21695__$1 = cljs.core.__destructure_map(map__21419_21694);
var doc_21696 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21419_21695__$1,new cljs.core.Keyword(null,"doc","doc",1913296891));
var arglists_21697 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21419_21695__$1,new cljs.core.Keyword(null,"arglists","arglists",1661989754));
cljs.core.println();

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",name_21693], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",arglists_21697], 0));

if(cljs.core.truth_(doc_21696)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",doc_21696], 0));
} else {
}


var G__21704 = seq__21388_21688;
var G__21705 = chunk__21389_21689;
var G__21706 = count__21390_21690;
var G__21707 = (i__21391_21691 + (1));
seq__21388_21688 = G__21704;
chunk__21389_21689 = G__21705;
count__21390_21690 = G__21706;
i__21391_21691 = G__21707;
continue;
} else {
var temp__5804__auto___21708 = cljs.core.seq(seq__21388_21688);
if(temp__5804__auto___21708){
var seq__21388_21709__$1 = temp__5804__auto___21708;
if(cljs.core.chunked_seq_QMARK_(seq__21388_21709__$1)){
var c__5525__auto___21710 = cljs.core.chunk_first(seq__21388_21709__$1);
var G__21711 = cljs.core.chunk_rest(seq__21388_21709__$1);
var G__21712 = c__5525__auto___21710;
var G__21713 = cljs.core.count(c__5525__auto___21710);
var G__21714 = (0);
seq__21388_21688 = G__21711;
chunk__21389_21689 = G__21712;
count__21390_21690 = G__21713;
i__21391_21691 = G__21714;
continue;
} else {
var vec__21422_21720 = cljs.core.first(seq__21388_21709__$1);
var name_21721 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21422_21720,(0),null);
var map__21425_21722 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21422_21720,(1),null);
var map__21425_21723__$1 = cljs.core.__destructure_map(map__21425_21722);
var doc_21724 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21425_21723__$1,new cljs.core.Keyword(null,"doc","doc",1913296891));
var arglists_21725 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21425_21723__$1,new cljs.core.Keyword(null,"arglists","arglists",1661989754));
cljs.core.println();

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",name_21721], 0));

cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",arglists_21725], 0));

if(cljs.core.truth_(doc_21724)){
cljs.core.println.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([" ",doc_21724], 0));
} else {
}


var G__21732 = cljs.core.next(seq__21388_21709__$1);
var G__21733 = null;
var G__21734 = (0);
var G__21735 = (0);
seq__21388_21688 = G__21732;
chunk__21389_21689 = G__21733;
count__21390_21690 = G__21734;
i__21391_21691 = G__21735;
continue;
}
} else {
}
}
break;
}
} else {
}

if(cljs.core.truth_(n)){
var temp__5804__auto__ = cljs.spec.alpha.get_spec(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.ns_name(n)),cljs.core.name(nm)));
if(cljs.core.truth_(temp__5804__auto__)){
var fnspec = temp__5804__auto__;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Spec"], 0));

var seq__21430 = cljs.core.seq(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"args","args",1315556576),new cljs.core.Keyword(null,"ret","ret",-468222814),new cljs.core.Keyword(null,"fn","fn",-1175266204)], null));
var chunk__21431 = null;
var count__21432 = (0);
var i__21433 = (0);
while(true){
if((i__21433 < count__21432)){
var role = chunk__21431.cljs$core$IIndexed$_nth$arity$2(null,i__21433);
var temp__5804__auto___21736__$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(fnspec,role);
if(cljs.core.truth_(temp__5804__auto___21736__$1)){
var spec_21737 = temp__5804__auto___21736__$1;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n ",cljs.core.name(role),":"].join(''),cljs.spec.alpha.describe(spec_21737)], 0));
} else {
}


var G__21738 = seq__21430;
var G__21739 = chunk__21431;
var G__21740 = count__21432;
var G__21741 = (i__21433 + (1));
seq__21430 = G__21738;
chunk__21431 = G__21739;
count__21432 = G__21740;
i__21433 = G__21741;
continue;
} else {
var temp__5804__auto____$1 = cljs.core.seq(seq__21430);
if(temp__5804__auto____$1){
var seq__21430__$1 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(seq__21430__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__21430__$1);
var G__21743 = cljs.core.chunk_rest(seq__21430__$1);
var G__21744 = c__5525__auto__;
var G__21745 = cljs.core.count(c__5525__auto__);
var G__21746 = (0);
seq__21430 = G__21743;
chunk__21431 = G__21744;
count__21432 = G__21745;
i__21433 = G__21746;
continue;
} else {
var role = cljs.core.first(seq__21430__$1);
var temp__5804__auto___21752__$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(fnspec,role);
if(cljs.core.truth_(temp__5804__auto___21752__$2)){
var spec_21753 = temp__5804__auto___21752__$2;
cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([["\n ",cljs.core.name(role),":"].join(''),cljs.spec.alpha.describe(spec_21753)], 0));
} else {
}


var G__21756 = cljs.core.next(seq__21430__$1);
var G__21757 = null;
var G__21758 = (0);
var G__21759 = (0);
seq__21430 = G__21756;
chunk__21431 = G__21757;
count__21432 = G__21758;
i__21433 = G__21759;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return null;
}
} else {
return null;
}
}
});
/**
 * Constructs a data representation for a Error with keys:
 *  :cause - root cause message
 *  :phase - error phase
 *  :via - cause chain, with cause keys:
 *           :type - exception class symbol
 *           :message - exception message
 *           :data - ex-data
 *           :at - top stack element
 *  :trace - root cause stack elements
 */
cljs.repl.Error__GT_map = (function cljs$repl$Error__GT_map(o){
return cljs.core.Throwable__GT_map(o);
});
/**
 * Returns an analysis of the phase, error, cause, and location of an error that occurred
 *   based on Throwable data, as returned by Throwable->map. All attributes other than phase
 *   are optional:
 *  :clojure.error/phase - keyword phase indicator, one of:
 *    :read-source :compile-syntax-check :compilation :macro-syntax-check :macroexpansion
 *    :execution :read-eval-result :print-eval-result
 *  :clojure.error/source - file name (no path)
 *  :clojure.error/line - integer line number
 *  :clojure.error/column - integer column number
 *  :clojure.error/symbol - symbol being expanded/compiled/invoked
 *  :clojure.error/class - cause exception class symbol
 *  :clojure.error/cause - cause exception message
 *  :clojure.error/spec - explain-data for spec error
 */
cljs.repl.ex_triage = (function cljs$repl$ex_triage(datafied_throwable){
var map__21453 = datafied_throwable;
var map__21453__$1 = cljs.core.__destructure_map(map__21453);
var via = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21453__$1,new cljs.core.Keyword(null,"via","via",-1904457336));
var trace = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21453__$1,new cljs.core.Keyword(null,"trace","trace",-1082747415));
var phase = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__21453__$1,new cljs.core.Keyword(null,"phase","phase",575722892),new cljs.core.Keyword(null,"execution","execution",253283524));
var map__21454 = cljs.core.last(via);
var map__21454__$1 = cljs.core.__destructure_map(map__21454);
var type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21454__$1,new cljs.core.Keyword(null,"type","type",1174270348));
var message = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21454__$1,new cljs.core.Keyword(null,"message","message",-406056002));
var data = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21454__$1,new cljs.core.Keyword(null,"data","data",-232669377));
var map__21455 = data;
var map__21455__$1 = cljs.core.__destructure_map(map__21455);
var problems = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21455__$1,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814));
var fn = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21455__$1,new cljs.core.Keyword("cljs.spec.alpha","fn","cljs.spec.alpha/fn",408600443));
var caller = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21455__$1,new cljs.core.Keyword("cljs.spec.test.alpha","caller","cljs.spec.test.alpha/caller",-398302390));
var map__21457 = new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(cljs.core.first(via));
var map__21457__$1 = cljs.core.__destructure_map(map__21457);
var top_data = map__21457__$1;
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21457__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((function (){var G__21462 = phase;
var G__21462__$1 = (((G__21462 instanceof cljs.core.Keyword))?G__21462.fqn:null);
switch (G__21462__$1) {
case "read-source":
var map__21467 = data;
var map__21467__$1 = cljs.core.__destructure_map(map__21467);
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21467__$1,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21467__$1,new cljs.core.Keyword("clojure.error","column","clojure.error/column",304721553));
var G__21469 = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(cljs.core.second(via)),top_data], 0));
var G__21469__$1 = (cljs.core.truth_(source)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21469,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),source):G__21469);
var G__21469__$2 = (cljs.core.truth_((function (){var fexpr__21470 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__21470.cljs$core$IFn$_invoke$arity$1 ? fexpr__21470.cljs$core$IFn$_invoke$arity$1(source) : fexpr__21470.call(null,source));
})())?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__21469__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397)):G__21469__$1);
if(cljs.core.truth_(message)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21469__$2,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message);
} else {
return G__21469__$2;
}

break;
case "compile-syntax-check":
case "compilation":
case "macro-syntax-check":
case "macroexpansion":
var G__21472 = top_data;
var G__21472__$1 = (cljs.core.truth_(source)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21472,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),source):G__21472);
var G__21472__$2 = (cljs.core.truth_((function (){var fexpr__21474 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__21474.cljs$core$IFn$_invoke$arity$1 ? fexpr__21474.cljs$core$IFn$_invoke$arity$1(source) : fexpr__21474.call(null,source));
})())?cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(G__21472__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397)):G__21472__$1);
var G__21472__$3 = (cljs.core.truth_(type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21472__$2,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type):G__21472__$2);
var G__21472__$4 = (cljs.core.truth_(message)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21472__$3,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message):G__21472__$3);
if(cljs.core.truth_(problems)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21472__$4,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595),data);
} else {
return G__21472__$4;
}

break;
case "read-eval-result":
case "print-eval-result":
var vec__21478 = cljs.core.first(trace);
var source__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21478,(0),null);
var method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21478,(1),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21478,(2),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21478,(3),null);
var G__21482 = top_data;
var G__21482__$1 = (cljs.core.truth_(line)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21482,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471),line):G__21482);
var G__21482__$2 = (cljs.core.truth_(file)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21482__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),file):G__21482__$1);
var G__21482__$3 = (cljs.core.truth_((function (){var and__5000__auto__ = source__$1;
if(cljs.core.truth_(and__5000__auto__)){
return method;
} else {
return and__5000__auto__;
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21482__$2,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994),(new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[source__$1,method],null))):G__21482__$2);
var G__21482__$4 = (cljs.core.truth_(type)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21482__$3,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type):G__21482__$3);
if(cljs.core.truth_(message)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21482__$4,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message);
} else {
return G__21482__$4;
}

break;
case "execution":
var vec__21487 = cljs.core.first(trace);
var source__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21487,(0),null);
var method = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21487,(1),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21487,(2),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__21487,(3),null);
var file__$1 = cljs.core.first(cljs.core.remove.cljs$core$IFn$_invoke$arity$2((function (p1__21452_SHARP_){
var or__5002__auto__ = (p1__21452_SHARP_ == null);
if(or__5002__auto__){
return or__5002__auto__;
} else {
var fexpr__21494 = new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["NO_SOURCE_PATH",null,"NO_SOURCE_FILE",null], null), null);
return (fexpr__21494.cljs$core$IFn$_invoke$arity$1 ? fexpr__21494.cljs$core$IFn$_invoke$arity$1(p1__21452_SHARP_) : fexpr__21494.call(null,p1__21452_SHARP_));
}
}),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"file","file",-1269645878).cljs$core$IFn$_invoke$arity$1(caller),file], null)));
var err_line = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"line","line",212345235).cljs$core$IFn$_invoke$arity$1(caller);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return line;
}
})();
var G__21496 = new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890),type], null);
var G__21496__$1 = (cljs.core.truth_(err_line)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21496,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471),err_line):G__21496);
var G__21496__$2 = (cljs.core.truth_(message)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21496__$1,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742),message):G__21496__$1);
var G__21496__$3 = (cljs.core.truth_((function (){var or__5002__auto__ = fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var and__5000__auto__ = source__$1;
if(cljs.core.truth_(and__5000__auto__)){
return method;
} else {
return and__5000__auto__;
}
}
})())?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21496__$2,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994),(function (){var or__5002__auto__ = fn;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new cljs.core.PersistentVector(null,2,(5),cljs.core.PersistentVector.EMPTY_NODE,[source__$1,method],null));
}
})()):G__21496__$2);
var G__21496__$4 = (cljs.core.truth_(file__$1)?cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21496__$3,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397),file__$1):G__21496__$3);
if(cljs.core.truth_(problems)){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(G__21496__$4,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595),data);
} else {
return G__21496__$4;
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__21462__$1)].join('')));

}
})(),new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358),phase);
});
/**
 * Returns a string from exception data, as produced by ex-triage.
 *   The first line summarizes the exception phase and location.
 *   The subsequent lines describe the cause.
 */
cljs.repl.ex_str = (function cljs$repl$ex_str(p__21514){
var map__21519 = p__21514;
var map__21519__$1 = cljs.core.__destructure_map(map__21519);
var triage_data = map__21519__$1;
var phase = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","phase","clojure.error/phase",275140358));
var source = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","source","clojure.error/source",-2011936397));
var line = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","line","clojure.error/line",-1816287471));
var column = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","column","clojure.error/column",304721553));
var symbol = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","symbol","clojure.error/symbol",1544821994));
var class$ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","class","clojure.error/class",278435890));
var cause = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","cause","clojure.error/cause",-1879175742));
var spec = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__21519__$1,new cljs.core.Keyword("clojure.error","spec","clojure.error/spec",2055032595));
var loc = [cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = source;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "<cljs repl>";
}
})()),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = line;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (1);
}
})()),(cljs.core.truth_(column)?[":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(column)].join(''):"")].join('');
var class_name = cljs.core.name((function (){var or__5002__auto__ = class$;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());
var simple_class = class_name;
var cause_type = ((cljs.core.contains_QMARK_(new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 2, ["RuntimeException",null,"Exception",null], null), null),simple_class))?"":[" (",simple_class,")"].join(''));
var format = goog.string.format;
var G__21528 = phase;
var G__21528__$1 = (((G__21528 instanceof cljs.core.Keyword))?G__21528.fqn:null);
switch (G__21528__$1) {
case "read-source":
return (format.cljs$core$IFn$_invoke$arity$3 ? format.cljs$core$IFn$_invoke$arity$3("Syntax error reading source at (%s).\n%s\n",loc,cause) : format.call(null,"Syntax error reading source at (%s).\n%s\n",loc,cause));

break;
case "macro-syntax-check":
var G__21530 = "Syntax error macroexpanding %sat (%s).\n%s";
var G__21531 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__21532 = loc;
var G__21533 = (cljs.core.truth_(spec)?(function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__21537_21804 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__21538_21805 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__21539_21806 = true;
var _STAR_print_fn_STAR__temp_val__21540_21807 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__21539_21806);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__21540_21807);

try{cljs.spec.alpha.explain_out(cljs.core.update.cljs$core$IFn$_invoke$arity$3(spec,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814),(function (probs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__21508_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__21508_SHARP_,new cljs.core.Keyword(null,"in","in",-1531184865));
}),probs);
}))
);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__21538_21805);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__21537_21804);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})():(format.cljs$core$IFn$_invoke$arity$2 ? format.cljs$core$IFn$_invoke$arity$2("%s\n",cause) : format.call(null,"%s\n",cause)));
return (format.cljs$core$IFn$_invoke$arity$4 ? format.cljs$core$IFn$_invoke$arity$4(G__21530,G__21531,G__21532,G__21533) : format.call(null,G__21530,G__21531,G__21532,G__21533));

break;
case "macroexpansion":
var G__21557 = "Unexpected error%s macroexpanding %sat (%s).\n%s\n";
var G__21558 = cause_type;
var G__21559 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__21560 = loc;
var G__21561 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__21557,G__21558,G__21559,G__21560,G__21561) : format.call(null,G__21557,G__21558,G__21559,G__21560,G__21561));

break;
case "compile-syntax-check":
var G__21564 = "Syntax error%s compiling %sat (%s).\n%s\n";
var G__21565 = cause_type;
var G__21566 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__21567 = loc;
var G__21568 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__21564,G__21565,G__21566,G__21567,G__21568) : format.call(null,G__21564,G__21565,G__21566,G__21567,G__21568));

break;
case "compilation":
var G__21573 = "Unexpected error%s compiling %sat (%s).\n%s\n";
var G__21574 = cause_type;
var G__21575 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__21576 = loc;
var G__21577 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__21573,G__21574,G__21575,G__21576,G__21577) : format.call(null,G__21573,G__21574,G__21575,G__21576,G__21577));

break;
case "read-eval-result":
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5("Error reading eval result%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause) : format.call(null,"Error reading eval result%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause));

break;
case "print-eval-result":
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5("Error printing return value%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause) : format.call(null,"Error printing return value%s at %s (%s).\n%s\n",cause_type,symbol,loc,cause));

break;
case "execution":
if(cljs.core.truth_(spec)){
var G__21588 = "Execution error - invalid arguments to %s at (%s).\n%s";
var G__21589 = symbol;
var G__21590 = loc;
var G__21591 = (function (){var sb__5647__auto__ = (new goog.string.StringBuffer());
var _STAR_print_newline_STAR__orig_val__21593_21815 = cljs.core._STAR_print_newline_STAR_;
var _STAR_print_fn_STAR__orig_val__21594_21816 = cljs.core._STAR_print_fn_STAR_;
var _STAR_print_newline_STAR__temp_val__21595_21817 = true;
var _STAR_print_fn_STAR__temp_val__21596_21818 = (function (x__5648__auto__){
return sb__5647__auto__.append(x__5648__auto__);
});
(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__temp_val__21595_21817);

(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__temp_val__21596_21818);

try{cljs.spec.alpha.explain_out(cljs.core.update.cljs$core$IFn$_invoke$arity$3(spec,new cljs.core.Keyword("cljs.spec.alpha","problems","cljs.spec.alpha/problems",447400814),(function (probs){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2((function (p1__21511_SHARP_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(p1__21511_SHARP_,new cljs.core.Keyword(null,"in","in",-1531184865));
}),probs);
}))
);
}finally {(cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR__orig_val__21594_21816);

(cljs.core._STAR_print_newline_STAR_ = _STAR_print_newline_STAR__orig_val__21593_21815);
}
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(sb__5647__auto__);
})();
return (format.cljs$core$IFn$_invoke$arity$4 ? format.cljs$core$IFn$_invoke$arity$4(G__21588,G__21589,G__21590,G__21591) : format.call(null,G__21588,G__21589,G__21590,G__21591));
} else {
var G__21603 = "Execution error%s at %s(%s).\n%s\n";
var G__21604 = cause_type;
var G__21605 = (cljs.core.truth_(symbol)?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(symbol)," "].join(''):"");
var G__21606 = loc;
var G__21607 = cause;
return (format.cljs$core$IFn$_invoke$arity$5 ? format.cljs$core$IFn$_invoke$arity$5(G__21603,G__21604,G__21605,G__21606,G__21607) : format.call(null,G__21603,G__21604,G__21605,G__21606,G__21607));
}

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__21528__$1)].join('')));

}
});
cljs.repl.error__GT_str = (function cljs$repl$error__GT_str(error){
return cljs.repl.ex_str(cljs.repl.ex_triage(cljs.repl.Error__GT_map(error)));
});

//# sourceMappingURL=cljs.repl.js.map
