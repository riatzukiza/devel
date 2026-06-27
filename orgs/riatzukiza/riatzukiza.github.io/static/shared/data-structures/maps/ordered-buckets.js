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
var { 
  OrderedMap
 } = require("./ordered.js");
var OrderedBucketMap = Interface.define("OrderedBucketMap", { 
  init( _buckets = create(OrderedMap)() ){ 
    
      this._buckets = _buckets;
      return this;
    
   },
  set( k = this.k,v = this.v,_buckets = this._buckets ){ 
    
      `
      k v *buckets .md

      # k v *buckets 

      ## arguments

      Defines k v *buckets 

      ## description

      `

      ;
      return (function() {
        if (_buckets.has(k)) {
          return _buckets.get(k).push(v);
        } else {
          return _buckets.push([ k, [ v ] ]);
        }
      }).call(this);
    
   },
  get( k = this.k,value = this.value,_buckets = this._buckets ){ 
    
      `
      k value *buckets.md

      # k value *buckets

      ## arguments

      Defines k value *buckets

      ## description

      `

      ;
      return _buckets.get(k);
    
   },
  each( f = this.f,_buckets = this._buckets ){ 
    
      `
      f *buckets.md

      # f *buckets

      ## arguments

      Defines f *buckets

      ## description

      `

      ;
      return _buckets.each(f);
    
   },
  map( f = this.f,_buckets = this._buckets ){ 
    
      `
      f *buckets.md

      # f *buckets

      ## arguments

      Defines f *buckets

      ## description

      `

      ;
      return _buckets.map(f);
    
   },
  delete( [ k, value ] = [ this.k, this.value ] ){ 
    
   },
  docString:"[k value]"
 });
export { 
  OrderedBucketMap
 };