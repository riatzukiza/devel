const defaultTurn = () => ({ id: 0 });
const defaultVadState = () => ({
    active: false,
    lastTrueAt: 0,
    lastFalseAt: 0,
    attackMs: 120,
    releaseMs: 250,
    hangMs: 800,
    threshold: 0.5,
    _prevActive: false,
});
const incrementTurn = (turn) => ({ ...turn, id: turn.id + 1 });
export const TurnDetectionSystem = (world, components) => {
    const { Turn, VAD, TranscriptFinal } = components;
    const vadQuery = world.makeQuery({ all: [Turn, VAD] });
    const transcriptQuery = world.makeQuery({ changed: [TranscriptFinal], all: [Turn, TranscriptFinal] });
    return (_dt) => {
        for (const [entity] of world.iter(vadQuery)) {
            const turn = world.get(entity, Turn) ?? defaultTurn();
            const vad = world.get(entity, VAD) ?? defaultVadState();
            if (!vad._prevActive && vad.active)
                world.set(entity, Turn, incrementTurn(turn));
        }
        for (const [entity] of world.iter(transcriptQuery)) {
            const turn = world.get(entity, Turn) ?? defaultTurn();
            world.set(entity, Turn, incrementTurn(turn));
        }
    };
};
//# sourceMappingURL=turn.js.map