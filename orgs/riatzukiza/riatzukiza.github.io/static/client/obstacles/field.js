Array.prototype.each = (function Array$prototype$each$(f) {
  this.forEach(f);
  return this;
});
Object.prototype.each = (function Object$prototype$each$(f) {
  Object.keys(this).forEach((k) => {
    f(this[k], k);
  });
  return undefined;
});

import "/bundles/external.js";
import { Vector, TrailVector } from "/shared/vectors.js";
import { simplex3 } from "/shared/noise.js";

const waitingDecay = new Set();

const signedOffset = (spread) => ((Math.random() * spread) * (Math.random() < 0.5 ? -1 : 1));

const clampGridIndex = (value, limit) => (Math.min(Math.max(Math.round(value), 0), (limit - 1)) || 1);

const clearTrail = (trail = []) => {
  for (const segment of trail) {
    segment.despawn();
  }
};

const respawnAtHome = (position, homePos, spread) => {
  position.x = homePos.x + signedOffset(spread);
  position.y = homePos.y + signedOffset(spread);
};

const applyTrailInfluence = (trail, weight, influence, method) => {
  for (const segment of trail) {
    segment.pheremones[method]({
      x: segment.x * weight * influence,
      y: segment.y * weight * influence,
    });
  }
};

const handleTrailOutcome = (vel, position, homePos, config, key) => {
  const trail = vel.trail || [];
  clearTrail(trail);
  vel.trail = [];
  respawnAtHome(position, homePos, config.spawnStatic);
  vel[key] += 1;
};

const maybeDecayWaitingCells = (tick, config) => {
  if (!(config.limitDecay && waitingDecay.size > config.maxInDecay)) {
    return;
  }

  for (const cell of waitingDecay) {
    cell.divTo((config.decay * (1 + (tick - cell.lastCheck))), 2);
    cell.lastCheck = tick;
    waitingDecay.delete(cell);
  }
};

const getTrailWeight = (vel) => (vel.looseCount / (vel.winCount + 1));

const createParticleUpdater = (config, game) => {
  return (vel, position, field, pheremones, tick, decay = false, win = false, homePos, loose = ((vel?.trail?.length || 0) >= config.maxTrail)) => {
    const pos = Vector.spawn(
      clampGridIndex((position.x / config.size), config.columns),
      clampGridIndex((position.y / config.size), config.rows),
    );
    const angle = simplex3((pos.x / config.angleZoom / 5), (pos.y / config.angleZoom / 5), (tick * (config.noiseZ / 10000))) * Math.PI * 2;
    const length = (simplex3(((pos.x / 50) + 40000), ((pos.x / 50) + 40000), (tick * (config.noiseZ / 10000))) * config.fieldForce) / 20;
    const signalCell = pheremones[pos.x][pos.y];

    field[pos.x][pos.y].setLength(length);
    field[pos.x][pos.y].setAngle(angle);

    if (!(signalCell.lastCheck)) {
      signalCell.lastCheck = tick;
      waitingDecay.add(signalCell);
    }

    if ((decay && signalCell.lastCheck < tick)) {
      signalCell.divTo((config.decay * (1 + (tick - signalCell.lastCheck))), 2);
      signalCell.lastCheck = tick;
    }

    maybeDecayWaitingCells(tick, config);

    if (config.stepWiseUpdate) {
      signalCell.addTo(field[pos.x][pos.y]);
    }

    if (config.trackTrail) {
      if (!(vel.trail)) {
        vel.winCount = 0;
        vel.looseCount = 0;
        vel.trail = [ TrailVector.spawn(vel.xd, vel.yd, signalCell) ];
      } else {
        vel.trail.push(TrailVector.spawn(vel.xd, vel.yd, signalCell));
      }
    }

    if (loose && config.punishLoosers) {
      applyTrailInfluence(vel.trail || [], getTrailWeight(vel), config.antInfluence, "subFrom");
    }

    if (loose) {
      handleTrailOutcome(vel, position, homePos, config, "looseCount");
    }

    if (win && config.rewardWinners) {
      applyTrailInfluence(vel.trail || [], getTrailWeight(vel), config.antInfluence, "addTo");
    }

    if (win) {
      handleTrailOutcome(vel, position, homePos, config, "winCount");
    }

    if (signalCell.getLength() > config.maxLength) {
      signalCell.setLength(config.maxLength);
    }

    vel.accelerate([ signalCell.x, signalCell.y ]);
    signalCell.addTo({
      x: vel.xd * config.antInfluence,
      y: vel.yd * config.antInfluence,
    });

    pos.despawn();
  };
};

const createVectorField = (columns, rows) => {
  const field = new Array(columns);

  for (let x = 0; x < columns; x += 1) {
    field[x] = new Array(rows);
    for (let y = 0; y < rows; y += 1) {
      field[x][y] = Vector.spawn(0, 0);
    }
  }

  return field;
};

export {
  createParticleUpdater,
  createVectorField,
};
