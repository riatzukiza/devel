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
  List
 } from "../list.js";
import { 
  Interface
 } from "../../kit/interface/index.js";
var OrderedMap = Interface.define("OrderedMap", { 
  docString:"null",
  init( _members = (new Map()),_values = create(List)() ){ 
    
      this._members = _members;this._values = _values;
      return this;
    
   },
  get values(  ){ 
    
      return this._values;
    
   },
  get members(  ){ 
    
      return this._members;
    
   },
  get size(  ){ 
    
      return this._values.length;
    
   },
  get length(  ){ 
    
      return this._values.length;
    
   },
  clear( _members = this._members,_values = this._values ){ 
    
      `
       *members *values .md

      #  *members *values 

      ## arguments

      Defines  *members *values 

      ## description

      `

      ;
      members.clear();
      return _values.clear();
    
   },
  has( key = this.key,_members = this._members ){ 
    
      `
      key *members.md

      # key *members

      ## arguments

      Defines key *members

      ## description

      `

      ;
      return _members.has(key);
    
   },
  get( key = this.key,_members = this._members,_keys = this._keys ){ 
    
      `
      key *members *keys.md

      # key *members *keys

      ## arguments

      Defines key *members *keys

      ## description

      `

      ;
      return _members.get(key).item;
    
   },
  each( callback = this.callback,_members = this._members ){ 
    
      `
      callback *members.md

      # callback *members

      ## arguments

      Defines callback *members

      ## description

      `

      ;
      var node = this._values.head;
      while( node ){ 
        callback(node.item, node.key);
        node = node.next;
       };
      return this;
    
   },
  map( callback = this.callback,_members = this._members,_values = this._values ){ 
    
      `
      callback *members *values .md

      # callback *members *values 

      ## arguments

      Defines callback *members *values 

      ## description

      `

      ;
      return (function(r) {
        /* eval.sibilant:2:352 */
      
        _values.each(((item, node) => {
        	return r.set(node.key, callback(item, node.key, r));
        }));
        return r;
      }).call(this, create(OrderedMap)());
    
   },
  _delete( key = this.key,_members = this._members,_values = this._values ){ 
    
      `
      key *members *values .md

      # key *members *values 

      ## arguments

      Defines key *members *values 

      ## description

      `

      ;
      const node=_members.get(key);
      _values.removeNode(node);
      return _members.delete(key);
    
   },
  delete( key = this.key,_members = this._members ){ 
    
      `
      key *members .md

      # key *members 

      ## arguments

      Defines key *members 

      ## description

      `

      ;
      return this._delete(key);
    
   },
  push( [ key, value ] = [ this.key, this.value ],_members = this._members,_values = this._values ){ 
    
      `
      [key value] *members *values .md

      # [key value] *members *values 

      ## arguments

      Defines [key value] *members *values 

      ## description

      `

      ;
      return (function() {
        if (!(_members.has(key))) {
          _values.push(value);
          _values.tail.key = key;
          _members.set(key, _values.tail);
          return _values.length;
        }
      }).call(this);
    
   },
  unshift( [ key, value ] = [ this.key, this.value ],_members = this._members,_values = this._values ){ 
    
      `
      [ key value] *members *values .md

      # [ key value] *members *values 

      ## arguments

      Defines [ key value] *members *values 

      ## description

      `

      ;
      return (function() {
        if (!(_members.has(key))) {
          _values.unshift(key);
          _values.head.key = key;
          _members.set(key, _values.head);
          return _values.length;
        }
      }).call(this);
    
   },
  pop( _members = this._members,_values = this._values ){ 
    
      `
      *members *values.md

      # *members *values

      ## arguments

      Defines *members *values

      ## description

      `

      ;
      _members.delete(_values.tail.key);
      return _values.pop();
    
   },
  shift( _members = this._members,_values = this._values ){ 
    
      `
      *members *values .md

      # *members *values 

      ## arguments

      Defines *members *values 

      ## description

      `

      ;
      _members.delete(_values.head.key);
      return _values.shift();
    
   },
  set( key = this.key,value = this.value,_members = this._members,_values = this._values ){ 
    
      `
      key value *members *values.md

      # key value *members *values

      ## arguments

      Defines key value *members *values

      ## description

      `

      ;
      return (function() {
        if (!(_members.has(key))) {
          _values.push(value);
          _values.tail.key = key;
          return _members.set(key, _values.tail);
        }
      }).call(this);
    
   }
 });
export { 
  OrderedMap
 };