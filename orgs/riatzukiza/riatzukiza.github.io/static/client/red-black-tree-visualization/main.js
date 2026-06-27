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
var R = require("ramda");
var { 
  create,
  extend,
  mixin,
  conditional,
  cond,
  partiallyApplyAfter
 } = require("@kit-js/core/js/util");
var { 
  Interface
 } = require("@kit-js/interface");
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
global.mixin = mixin;
global.create = create;
var { 
  BinarySearchTree
 } = require("@shared/data-structures/trees/binary-search-tree.js"),
    { 
  RedBlackTree
 } = require("@shared/data-structures/trees/red-black-tree.js"),
    { 
  Ticker
 } = require("@shared/ticker.js");
const { 
  
 }=require(createDocumentNode);
const rbTree=RedBlackTree.spawn();
const low=Math.floor((Math.random() * 9000));
const high=(low + Math.floor((Math.random() * 10000)));
var renderNode = (function renderNode$(node) {
  /* render-node eval.sibilant:29:0 */

  const foregroundColor=(function() {
    if (node.inRange__QUERY) {
      return "yellow";
    } else if (node.color === "black") {
      return "white";
    } else {
      return "black";
    }
  }).call(this);
  return createDocumentNode("div", { 'style': { 
    "background-color":node.color,
    "color":foregroundColor,
    "float":"left",
    "width":(function() {
      if (node.sibling) {
        return "calc(50% - 4px)";
      } else {
        return "calc(100% - 4px)";
      }
    }).call(this),
    "border-color":foregroundColor,
    "border-width":"2px",
    "border-style":"solid"
   } }, [ createDocumentNode("div", {  }, [ (node.key || "nil") ]), (function() {
    if (node.left) {
      return renderNode(node.left);
    } else {
      return "";
    }
  }).call(this), (function() {
    if (node.right) {
      return renderNode(node.right);
    } else {
      return "";
    }
  }).call(this) ]);
});
const ticker=create(Ticker)(1);
ticker.start();
const container=createDocumentNode("div", {
  'id': "container",
  'style': { 
    "width":(window.innerWidth + "px")
   }
}, [ createDocumentNode("h1", {  }, [ "find nodes between", low, "and", high ]), (() => {
	
  return renderNode(rbTree.root);

}) ]);
const frame=createDocumentNode("div", { 'id': "frame" }, [ container ]).render(DocumentBody);
ticker.events.on("tick", (() => {
	
  rbTree.root.insert(Math.floor((Math.random() * (low + high))));
  const nodesInRange=rbTree.root.findRange(low, high);
  for (var _node of nodesInRange)
  {
  _node.inRange__QUERY = true;
  }
  ;
  return container.render();

})).once("error", ((err) => {
	
  console.log("error on", "tick", "of", "ticker.events", "given", "null");
  return console.log(err);

}));