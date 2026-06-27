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
import { 
  PooledDataStructure
 } from "./pooled.js";
var Table = PooledDataStructure.define("Table", { 
  docString:"null",
  init( iterable = null,_map = this._map ){ 
    
      this.iterable = iterable;this._map = _map;
      (function() {
        if (!(_map)) {
          return this._map = (new Map());
        }
      }).call(this);
      return this;
    
   },
  clear(  ){ 
    
      this._map.clear();
      return this;
    
   },
  get( key = null,_map = this._map ){ 
    
      return _map.get(key);
    
   },
  docString:"(key null",
  set( key = null,value = null,_map = this._map ){ 
    
      return _map.set(key, value);
    
   },
  docString:"(key null",
  has( key = null,_map = this._map ){ 
    
      return _map.has(key);
    
   },
  docString:"(key null",
  delete( key = null,_map = this._map ){ 
    
      return _map.delete(key);
    
   },
  docString:"(key null",
  each( f = null,_map = this._map ){ 
    
      return _map.each(f);
    
   }
 });
`
(f null.md

# (f null

## arguments

Defines (f null

## description

`

;
export { 
  Table
 };