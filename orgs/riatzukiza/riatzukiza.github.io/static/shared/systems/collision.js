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
var QuadTree = require("@timohausmann/quadtree-js");
import { 
  Component,
  System
 } from "../ecs.js";
import { 
  Physics
 } from "./physics.js";
import { 
  Vector
 } from "../vectors.js";
import { 
  Trie
 } from "../data-structures/trees/trie.js";
import { 
  List
 } from "../data-structures/list.js";
import { 
  DynamicPool
 } from "../pooling/dynamic-pool.js";
import { 
  PooledDataStructure
 } from "../data-structures/pooled.js";
`
null.md

# null

## arguments

Defines null

## description

`

;
var CollisionBounds = Component.define("CollisionBounds", { 
  docString:"null",
  _clear(  ){ 
    
   },
  get dimensions(  ){ 
    
      return this.area;
    
   },
  get dim(  ){ 
    
      return this.dimensions;
    
   },
  get scale(  ){ 
    
      return this.entity.physicalProperties.scale;
    
   },
  get physics(  ){ 
    
      return this.entity.physicalProperties;
    
   },
  get x(  ){ 
    
      return this.entity.positionInterface.x;
    
   },
  get y(  ){ 
    
      return this.entity.positionInterface.y;
    
   },
  get height(  ){ 
    
      return this.entity.physicalProperties.scale;
    
   },
  get width(  ){ 
    
      return this.entity.physicalProperties.scale;
    
   },
  get maxX(  ){ 
    
      return (this.entity.positionInterface.x + (this.entity.physicalProperties.scale * 0.5));
    
   },
  get maxY(  ){ 
    
      return (this.entity.positionInterface.y + (this.entity.physicalProperties.scale * 0.5));
    
   },
  get minX(  ){ 
    
      return (this.entity.positionInterface.x - (this.entity.physicalProperties.scale * 0.5));
    
   },
  get minY(  ){ 
    
      return (this.entity.positionInterface.y - (this.entity.physicalProperties.scale * 0.5));
    
   },
  get position(  ){ 
    
      return this.entity.positionInterface;
    
   },
  get pos(  ){ 
    
      return this.position;
    
   },
  get velocity(  ){ 
    
      return this.entity.velocityInterface;
    
   },
  get quadTreeRect(  ){ 
    
      var rect = this._quadTreeRect;
      if( !rect ){ 
        rect = { 
          collision:this
         };
        this._quadTreeRect = rect;
       };
      rect.x = this.minX;
      rect.y = this.minY;
      rect.width = this.width;
      rect.height = this.height;
      return rect;
    
   },
  isColliding__QUERY( c_ = this.c_,c = this ){ 
    
      `
      c* (c this.md

      # c* (c this

      ## arguments

      Defines c* (c this

      ## description

      `

      ;
      var d1x = (c_.minX - c.maxX),
          d1y = (c_.minY - c.maxY),
          d2x = (c.minX - c_.maxX),
          d2y = (c.minY - c_.maxY);
      return !((d1x >= 0 || d1y >= 0 || d2x >= 0 || d2y >= 0));
    
   }
 });
export { 
  CollisionBounds
 };
var clampQuadTreeLevels = ((requested = 10,width = 100,height = 100,hardLimit = 10) => {
	const maxDimension=Math.max(1, width, height);
	const maxUsefulLevels=Math.max(1, Math.ceil(Math.log2(maxDimension)));
	return Math.max(1, Math.min(requested, maxUsefulLevels, hardLimit));
});
var createQuadTree = ((width, height, maxObjects = 10, maxLevels = 10, hardLimit = 10) => (new QuadTree({ 
  x:0,
  y:0,
  width,
  height
 }, maxObjects, clampQuadTreeLevels(maxLevels, width, height, hardLimit))));
var Collision = System.define("Collision", { 
  docString:"null",
  Component:CollisionBounds,
  setBounds( height = 100,width = 100,docString = "(height 100",maxObjects = 10,maxLevels = 10 ){ 
    
      if( this.quads ){ 
        throw (new Error("bounds are already set"))
       };
      this.quads = createQuadTree(width, height, maxObjects, maxLevels, 10);
      return this.quads;
    
   },
  _check( c,c_ ){ 
    
      if( c.isColliding__QUERY(c_) ){ 
        c.system.game.events.emit("collision", c, c_)
       };
      return ;
    
   },
  _updateAll( t = this.t,components = this.components ){ 
    
      `
      t components.md

      # t components

      ## arguments

      Defines t components

      ## description

      `

      ;
      this.quads.clear();
      var node = this.components.values.head,
          c = null,
          rect = null,
          c_ = null;
      while( node ){ 
        c = node.item;;
        c.checked = false;;
        this.quads.insert(c.quadTreeRect);
        node = node.next;
       };
      node = this.components.values.head;
      while( node ){ 
        c = node.item;;
        const possibleCollisions=this.quads.retrieve(c.quadTreeRect);;
        for (rect of possibleCollisions)
        {
        c_ = rect.collision;;
        if( (!(c === c_) && !(c_.checked)) ){ 
          this._check(c, c_)
         };
        null
        }
        ;
        c.checked = true;;
        node = node.next;
       };
      return null;
    
   }
 });
export { 
  Collision
 };
var placeEntity = (function placeEntity$(entity = this.entity, game = this.game, config = this.config) {
  /* place-entity inc/core/function-expressions.sibilant:28:8 */

  `
  entity game config.md

  # entity game config

  ## arguments

  Defines entity game config

  ## description

  `

  ;
  const placementTree=(new QuadTree({ 
    x:0,
    y:0,
    width:config.dimensions[0],
    height:config.dimensions[1]
   }, 20, 500));
  const c=game.systems.get(Collision, entity);
  const placementVector=Vector.spawn(1, 1);
  var colliding = true,
      rect = null,
      c_ = null;
  (function() {
    var while$388 = undefined;
    while (colliding) {
      while$388 = (function() {
        var noCollisions = true;
        placementTree.clear();
        c.system.components.each(((candidate) => {
          	return (function() {
           if (!(c === candidate)) {
            return placementTree.insert(candidate.quadTreeRect);
           }
         }).call(this);
        }));
        const possibleCollisions=placementTree.retrieve(c.quadTreeRect);
        for (rect of possibleCollisions)
        {
        c_ = rect.collision;
        (function() {
          var while$389 = undefined;
          while (c.isColliding__QUERY(c_)) {
            while$389 = (function() {
              noCollisions = false;
              placementVector.setLength((1 * c_.scale));
              placementVector.setAngle(((Math.random() * ( - 360)) + 360));
              return c.pos.system.shift(c.pos, [ placementVector.x, placementVector.y ]);
            }).call(this);
          };
          return while$389;
        }).call(this)
        }
        ;
        (function() {
          if (noCollisions) {
            colliding = false;
          }
        }).call(this);
        return null;
      }).call(this);
    };
    return while$388;
  }).call(this);
  placementVector.despawn();
  return entity;
});
export { 
  placeEntity
 };
