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
  Friction as BaseFriction
 } from "/shared/systems/physics/forces/friction.js";
import { 
  SignalField as BaseSignalField
 } from "/shared/systems/physics/forces/signal-field.js";
import { 
  game
 } from "./game.js";
import { 
  config
 } from "./config.js";
import * as obstacleEntities from "./entities.js";
import { 
  createParticleUpdater,
  createVectorField
 } from "./field.js";
console.log("initializing forces", { 
  BaseFriction,
  BaseSignalField
 });
var Friction = BaseFriction.define("Friction", { 
  config:config,
  template:false,
  register(  ){ 
    
      this.config = config;
      return this.config;
    
   },
  reset(  ){ 
    
    
   }
 });
var releaseVectorField = ((field) => {
	if (!(field)) {
    return;
  }
  for (const column of field) {
    for (const cell of column) {
      if (typeof cell?.despawn === "function") {
        cell.despawn();
      } else if (typeof cell?.release === "function") {
        cell.release();
      }
    }
  }
});
var SignalField = BaseSignalField.define("SignalField", { 
  template:false,
  field:createVectorField(config.columns, config.rows),
  layer:createVectorField(config.columns, config.rows),
  register(  ){ 
    
      this.config = config;
      this.field = createVectorField(config.columns, config.rows);
      this.layer = createVectorField(config.columns, config.rows);
      return console.log("registering", this);
    
   },
  reset(  ){ 
    
      this.clear();
      return this.init();
    
   },
  clear(  ){ 
    
      releaseVectorField(this.field);
      releaseVectorField(this.layer);
      this.field = null;
      this.layer = null;
      return this.layer;
    
   },
  config:config,
  game:game,
  get entities(  ){ 
    
      return obstacleEntities;
    
   },
  updateParticle:createParticleUpdater(config, game)
 });
export { 
  Friction
 };
export { 
  SignalField
 };
