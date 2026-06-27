await import('../reagent/dist/index.js');
const cljs = globalThis.cljs.core;
console.log('js->clj', typeof cljs.js__GT_clj);
console.log('PersistentVector.fromArray', typeof cljs.PersistentVector?.fromArray);
console.log('PersistentArrayMap.fromArray', typeof cljs.PersistentArrayMap?.fromArray);
console.log('Keyword', typeof cljs.Keyword);
