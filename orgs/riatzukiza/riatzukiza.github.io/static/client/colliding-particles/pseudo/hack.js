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
defWorker(SystemWorker, data(), const components=data.components.map(((component) => {
	return Component.get(component);
})););
defWorker(ComponentBroker, data());
defWorker(GameLoop, data());
defWorker(DBWorker, data());
var Model = Interface.define("Model", { 
  docString:"Model",
  init( modelName = this.modelName,_data = this._data ){ 
    
      this.modelName = modelName;this._data = _data;
      return this;
    
   },
  get data(  ){ 
    
      return this._data;
    
   },
  save( databaseName ){ 
    
   }
 });
var Component = Interface.define("Component", { 
  docString:"Component",
  connect( entity ){ 
    
   },
  save(  ){ 
    
   }
 });
var DataComponent = Component.define("DataComponent", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var ViewComponent = Component.define("ViewComponent", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var VectorComponent = DataComponent.define("VectorComponent", { 
  docString:"null",
  struct:x(Int)
 });
var Position = VectorComponent.define("Position", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var Velocity = VectorComponent.define("Velocity", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var Acceleration = VectorComponent.define("Acceleration", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var Resistance = VectorComponent.define("Resistance", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var Needs = DataComponent.define("Needs", { 
  docString:"null",
  struct:hunger(Int)
 });
var OrderQueue = DataComponent.define("OrderQueue", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var Order = DataComponent.define("Order", { 
  docString:"null",
  struct:target()
 });
var Navigation = Order.define("Navigation", { 
  docString:"null",
  struct:start(Position)
 });
var Character = Entity.define("Character", { 
  docString:"null",
  views:[ SpriteAtlas.spawn("character.png"), Gauge.spawn("health"), Gauge.spawn("hunger"), Gauge.spawn("stamina"), Gauge.spawn("restedness"), Gauge.spawn("thirst"), SpeachBubble.spawn("mindState") ],
  systems:[ Movement, Navigation, Memory, Sight, Sleep, Hunger, Priorities, Combat ],
  components:[ Position, Velocity, Acceleration, Needs, TaskQueue, Stats, Experience, Personality ]
 });
var Tile = Entity.define("Tile", { 
  docString:"null",
  views:[ SpriteAtlas.spawn("tiles.png") ],
  components:[ Position, TileContainer, GroundType ]
 });
var Food = Entity.define("Food", { 
  docString:"null",
  views:[ SpriteAtlas.spawn("items.png") ]
 });
var Plant = Entity.define("Plant", { 
  docString:"null",
  views:[ SpriteAtlas.spawn("plants.png") ],
  components:[ Position, Harvestable ]
 });
var Entity = Interface.define("Entity", { 
  docString:"Entity",
  init( id = this.id,components = this.components ){ 
    
      this.id = id;this.components = components;
      return this;
    
   }
 });
var EntityAssembler = Assembler.define("EntityAssembler", { 
  docString:"null"
 });
var TileGenerator = EntityAssembler.define("TileGenerator", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var FoodPlanter = EntityAssembler.define("FoodPlanter", { 
  
 });
`
null.md

# null

## arguments

Defines null

## description

`

;
var Game = Interface.define("Game", { 
  docString:"null",
  init( components = this.components,systems = this.systems,entities = this.entities,database = this.database ){ 
    
      this.components = components;this.systems = systems;this.entities = entities;this.database = database;
      return this;
    
   },
  start(  ){ 
    
   },
  save( saveName = this.saveName,entities = this.entities ){ 
    
      return `
      save-name entities.md

      # save-name entities

      ## arguments

      Defines save-name entities

      ## description

      `

      ;
    
   }
 });
const game=Game.create();