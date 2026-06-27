export const DEFAULT_EVENT_MODULES = Object.freeze([
  "./events/ant-collision.js",
  "./events/ant-found-plant.js",
  "./events/collision.js",
  "./events/plant-colliding-with-spawn.js",
  "./events/static-object-collision.js",
  "./events/tick.js",
  "./events/simple-collision.js",
]);

export const loadDefaultEventModules = async () => {
  await Promise.all(DEFAULT_EVENT_MODULES.map((path) => import(path)));
};

export const initializeObstacles = async ({
  Collision,
  config,
  game,
  startInterface,
  loadEventModules = loadDefaultEventModules,
}) => {
  Collision.setBounds(config.dimensions[0], config.dimensions[1], 500, 10);
  await loadEventModules();
  startInterface();
  game.start();
  return game;
};
