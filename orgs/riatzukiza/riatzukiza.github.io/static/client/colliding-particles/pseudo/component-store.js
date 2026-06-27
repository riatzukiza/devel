Array.prototype.each = (function Array$prototype$each$(f) {
  /* Array.prototype.each inc/misc.sibilant:1:1831 */

  this.forEach(f);
  return this;
});
Object.prototype.each = (function Object$prototype$each$(f) {
  /* Object.prototype.each inc/misc.sibilant:1:1893 */

  return Object.keys(this).forEach(((k) => {
  	return f(this[k], k);
  }));
});
import '/bundles/external.js';
import { 
  mixin,
  create,
  extend
 } from "/shared/kit/core/util.js";
var Component = Interface.define("Component", { 
  docString:"null",
  init( store = this.store,id = this.id ){ 
    
      this.store = store;this.id = id;
      return this;
    
   }
 });
var ComponentStore = Interface.define("ComponentStore", { 
  docString:"null",
  Component:null,
  worker:null,
  current:[],
  updated:[],
  entities:[],
  pool:[],
  get(  ){ 
    
   },
  sync(  ){ 
    
      const updated=this.updated;
      const current=this.current;
      this.current = updated;
      return this.updated = current;
    
   },
  save(  ){ 
    
   },
  spawn(  ){ 
    
   }
 });
var ComponentStoreThread = InlineWorker.define("ComponentStoreThread", { 
  docString:"null",
  defThreaded:main
 });