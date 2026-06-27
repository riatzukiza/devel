/**
 * @fileoverview Common type definitions for the game engine
 */

/**
 * @typedef {Object} Entity
 * @property {number} id
 * @property {Record<string, any>} components
 */

/**
 * @typedef {Object} System
 * @property {string} name
 * @property {Set<number>} entities
 * @property {(entity: Entity) => void} update
 * @property {(entity: Entity) => void} [addEntity]
 * @property {(entity: Entity) => void} [removeEntity]
 */

/**
 * @typedef {Object} Component
 * @property {string} type
 * @property {any} data
 */

/**
 * @typedef {Object} PositionComponent
 * @property {'position'} type
 * @property {{x: number, y: number, z?: number}} data
 */

/**
 * @typedef {Object} VelocityComponent
 * @property {'velocity'} type
 * @property {{x: number, y: number, z?: number}} data
 */

/**
 * @typedef {Object} CollisionComponent
 * @property {'collision'} type
 * @property {{width: number, height: number, depth?: number}} data
 */

/**
 * @typedef {Object} RenderingComponent
 * @property {'rendering'} type
 * @property {{color: string, visible: boolean, layer?: number}} data
 */

/**
 * @typedef {Object} Ticker
 * @property {number} fps
 * @property {boolean} running
 * @property {import('events').EventEmitter} events
 * @property {() => void} start
 * @property {() => void} stop
 * @property {(delta: number) => void} tick
 */

/**
 * @typedef {Object} Pool
 * @property {any[]} items
 * @property {() => any} get
 * @property {(item: any) => void} release
 * @property {number} size
 */

/**
 * @typedef {Object} Game
 * @property {Map<number, Entity>} entities
 * @property {System[]} systems
 * @property {Ticker} ticker
 * @property {(name: string) => System | undefined} getSystem
 * @property {(entity: Entity) => void} addEntity
 * @property {(entityId: number) => void} removeEntity
 * @property {(entity: Entity, component: Component) => void} addComponent
 * @property {(entity: Entity, componentType: string) => void} removeComponent
 */

/**
 * @typedef {'tick' | 'start' | 'stop' | 'error'} TickerEvent
 */

/**
 * @typedef {Object} Vector2
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Vector3
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Vector2 | Vector3} Vector
 */

/**
 * @typedef {Object} Rect
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} AABB
 * @property {Vector2} min
 * @property {Vector2} max
 */

/**
 * @typedef {'client' | 'server' | 'shared'} ModuleType
 */
