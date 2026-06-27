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
var ComponentStore = Interface.define("ComponentStore", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var GameComponent = DataType.define("GameComponent", { 
  docString:"null",
  get keys(  ){ 
    
      return (function() {
        if (this._keys) {
          return this._keys;
        } else {
          return this._keys = (function() {
            /* inc/misc.sibilant:1:4125 */
          
            return [ "entityId", this.dataType ];
          }).call(this);
        }
      }).call(this);
    
   }
 });
var GameEntity = DataType.define("GameEntity", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var GameSystem = Spawnable.define("GameSystem", { 
  docString:"null",
  init( components = this.components ){ 
    
      this.components = components;
      return this;
    
   }
 });