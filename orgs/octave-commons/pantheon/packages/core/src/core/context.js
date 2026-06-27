/**
 * Context Engine — Dynamic context compilation port adapter
 * Wraps @promethean-os/persistence collections to provide Pantheon-native context
 */
import { makeContextStore } from '@promethean-os/persistence';
const ASSISTANT_NAME = 'Pantheon';
export const makeContextPort = (deps) => ({
    compile: async ({ texts = [], sources, recentLimit, queryLimit, limit }) => {
        const { compileContext } = makeContextStore({
            getCollections: () => deps.getCollectionsFor(sources),
            resolveRole: deps.resolveRole,
            resolveDisplayName: deps.resolveName,
            formatTime: deps.formatTime,
            assistantName: ASSISTANT_NAME,
        });
        return compileContext({ texts, recentLimit, queryLimit, limit });
    },
});
//# sourceMappingURL=context.js.map