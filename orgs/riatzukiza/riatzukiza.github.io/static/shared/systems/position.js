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
  Component,
  System
 } from "../ecs.js";
var PositionInterface = Component.define("PositionInterface", { 
  docString:"null",
  _x:0,
  _y:0,
  z:0,
  get x(  ){ 
    
      return this._x;
    
   },
  get y(  ){ 
    
      return this._y;
    
   },
  get parentView(  ){ 
    
      return this.entity.propertyView.view;
    
   },
  get updateView__QUERY(  ){ 
    
      return (function() {
        if (this.entity.velocityInterface) {
          return this.entity.velocityInterface.updateView__QUERY;
        }
      }).call(this);
    
   },
  set y( y ){ 
    
      if( !(this.moved) ){ 
        this.system.queue.push(this)
       };
      this._y = y;
      return this.moved = true;
    
   },
  set x( x ){ 
    
      if( !(this.moved) ){ 
        this.system.queue.push(this)
       };
      this._x = x;
      return this.moved = true;
    
   },
  _clear(  ){ 
    
      this.x = null;
      this.y = null;
      this.z = null;
      return this.moved = false;
    
   }
 });
export { 
  PositionInterface
 };
var Position = System.define("Position", { 
  docString:"null",
  Component:PositionInterface,
  queue:[],
  shift( c,[ xshift, yshift ] ){ 
    
      c.x = (c._x + xshift);
      return c.y = (c._y + yshift);
    
   },
  move( entity,{ 
    x,
    y
   } ){ 
    
      var c = this.components.get(entity);
      c.x = x;
      return c.y = y;
    
   },
  _updateAll(  ){ 
    
      while( this.queue.length > 0 ){ 
        this._updateComponent(this.queue.pop())
       };
      return null;
    
   },
  wraps__QUERY:false,
  _updateComponent( c ){ 
    
      const home = this.process?.config?.homeLocation || [ (this.process.rendering.dimensions[0] * 0.5), (this.process.rendering.dimensions[1] * 0.5) ];
      const roam = this.process?.config?.roamRadius || [ (this.process.rendering.dimensions[0] * 1.15), (this.process.rendering.dimensions[1] * 1.15) ];
      const roamX = roam[0];
      const roamY = roam[1];
      const xMin = (home[0] - roamX);
      const xMax = (home[0] + roamX);
      const yMin = (home[1] - roamY);
      const yMax = (home[1] + roamY);
      c._x = Math.max(xMin, Math.min(c._x, xMax));
      c._y = Math.max(yMin, Math.min(c._y, yMax));
      return c.moved = false;
    
   }
  });
export { 
  Position
 };
