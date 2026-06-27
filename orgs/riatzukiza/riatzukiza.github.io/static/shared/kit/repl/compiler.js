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
  Interface
 } from "../interface/index.js";
import { 
  Actor
 } from "../actor/index.js";
import { 
  emit
 } from "../events/index.js";
var sibilant = require("sibilant");
var Compiler = Actor.define("Compiler", { 
  docString:"repl).null",
  init(  ){ 
    
      
      Actor.init.call(this);
      return this;
    
   },
  _send( data = (typeof data !== "undefined") ? data : this.data; ){ 
    
      `
      repl)/data.md

      # repl).data

      ## arguments

      Defines data

      ## description

      `

      ;
      return Promise.resolve(data).then((function() {
        /* eval.sibilant:30:17 */
      
        return sibilant(arguments[0].toString()).js;
      })).then(R.tap(emit("message", this))).catch(((e) => {
      	this.emit("error", e);
      throw e
      }));
    
   },
  spawn(  ){ 
    
      `
      repl)/null.md

      # repl).null

      ## arguments

      Defines null

      ## description

      `

      ;
      return create(this)();
    
   }
 });
exports.Compiler = Compiler;