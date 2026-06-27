const extractFrames = (world, components, ring) => (ring?.frames ?? [])
    .slice(-4)
    .map((entity) => world.get(entity, components.VisionFrame)?.ref)
    .filter((ref) => ref != null);
const clearTranscript = (world, components, agent, transcript) => {
    world.set(agent, components.TranscriptFinal, { ...transcript, text: '' });
};
export const OrchestratorSystem = ({ world, bus, components, getContext, systemPrompt }) => {
    const query = world.makeQuery({
        changed: [components.TranscriptFinal],
        all: [components.Turn, components.TranscriptFinal, components.VisionRing],
    });
    return async () => {
        for (const [agent] of world.iter(query)) {
            const transcript = world.get(agent, components.TranscriptFinal);
            if (!transcript || !transcript.text)
                continue;
            const turnId = world.get(agent, components.Turn)?.id ?? 0;
            const ring = world.get(agent, components.VisionRing);
            const frames = extractFrames(world, components, ring);
            const context = await getContext(transcript.text);
            bus.enqueue('llm.generate', {
                prompt: systemPrompt(),
                context,
                format: null,
                replyTopic: 'agent.llm.result',
                images: frames,
                turnId,
            });
            clearTranscript(world, components, agent, transcript);
        }
    };
};
//# sourceMappingURL=orchestrator.js.map