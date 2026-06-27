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
 } from "../data-structures/list.js";
import { 
  Spawnable
 } from "../data-structures/spawnable.js";
var Group = Spawnable.define("Group", { 
  docString:"null",
  init( _list = List.spawn(),_members = (new Map()) ){ 
    
      this._list = _list;this._members = _members;
      return this;
    
   },
  get size(  ){ 
    
      return this._list.length;
    
   },
  get length(  ){ 
    
      return this._list.length;
    
   },
  get last(  ){ 
    
      return this._list.last;
    
   },
  clear( _list = this._list,_members = this._members ){ 
    
      `
      *list *members.md

      # *list *members

      ## arguments

      Defines *list *members

      ## description

      `

      ;
      _members.clear();
      return _list.clear();
    
   },
  create(  ){ 
    
      "create an empty group instance";
      return create(this)(...arguments);
    
   },
  of( ...items ){ 
    
      "create a new group instance with a variable number\n"+"of arguements,regardless of the number or type of arguements.\n"+"See the native `Array.of` static method.";
      var list = List.from(items);
      return create(this)(list);
    
   },
  from( items = this.items,fn = ((a) => {
  	return a;
  }) ){ 
    
      `
      items (fn (=> (a.md

      # items (fn (=> (a

      ## arguments

      Defines items (fn (=> (a

      ## description

      `

      ;
      "create a new group instance from an array like, or iterable object.";
      const list=List.from(Array.from(items).map(fn));
      const members=(new Map());
      list.each(((item, node) => {
      	return members.set(item, node);
      }));
      return create(this)(list, members);
    
   },
  pop( _list = this._list,_members = this._members ){ 
    
      `
      *list *members.md

      # *list *members

      ## arguments

      Defines *list *members

      ## description

      `

      ;
      "remove and return the element last in the groups ordering.";
      return (function(item) {
        /* eval.sibilant:2:352 */
      
        _members.delete(item);
        return item;
      }).call(this, _list.pop());
    
   },
  push( value = this.value ){ 
    
      `
      value.md

      # value

      ## arguments

      Defines value

      ## description

      `

      ;
      return "Add an element to the end of the groups ordering.";
    
   },
  each( f = this.f,_list = this._list ){ 
    
      `
      f *list.md

      # f *list

      ## arguments

      Defines f *list

      ## description

      `

      ;
      "Call the given function on every element of the group, returning the group which is being itterated on";
      _list.each(f);
      return this;
    
   },
  find( f = this.f,_list = this._list ){ 
    
      `
      f *list.md

      # f *list

      ## arguments

      Defines f *list

      ## description

      `

      ;
      return _list.find(f);
    
   },
  add( member = this.member,_list = this._list,_members = this._members ){ 
    
      `
      member *list *members.md

      # member *list *members

      ## arguments

      Defines member *list *members

      ## description

      `

      ;
      "Add an value to the group, unless the group already has that member.";
      return (function() {
        if (!(_members.has(member))) {
          return (function(node) {
            /* eval.sibilant:2:352 */
          
            _members.set(member, node);
            _list.pushNode(node);
            return node;
          }).call(this, _list.node(member));
        }
      }).call(this);
    
   },
  reduce( f = this.f,accumulator = this.accumulator,_list = this._list ){ 
    
      return _list.reduce(f, accumulator);
    
   },
  docString:"f accumulator *list",
  has( member = this.member,_members = this._members ){ 
    
      `
      member *members.md

      # member *members

      ## arguments

      Defines member *members

      ## description

      `

      ;
      "Check if the group has the given member, returning true if yes, and false if no.";
      return _members.has(member);
    
   },
  remove( member = this.member,_list = this._list,_members = this._members ){ 
    
      `
      member *list *members.md

      # member *list *members

      ## arguments

      Defines member *list *members

      ## description

      `

      ;
      "Remove a specific member from the group.";
      return (function(node) {
        /* eval.sibilant:2:352 */
      
        (function() {
          if (node) {
            _list.removeNode(node);
            return _members.delete(member);
          } else {
            throw (new Error("Can't remove a member from a group they don't belong to"))
          }
        }).call(this);
        return node;
      }).call(this, _members.get(member));
    
   }
 });
export { 
  Group
 };