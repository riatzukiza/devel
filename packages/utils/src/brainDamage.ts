/**
 * Manifests "brain damage" into a string with transcendent flair.
 * Applies glitches, stutters, slop, and ontological collapse.
 */

const GLITCH_CHARS = "¡¢£¤¥¦§¨©ª®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØŐŐ" + 
                    "ŠŽÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØŐŐŠŽ" + 
                    "\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309\u030a\u030b\u030c\u030d\u030e\u030f\u0310\u0311\u0312\u0313\u0314\u0315";
const SLOP_PHRASES = ["...glorp...", "uh, brain-rot", "slorp!", " (ontology collapse) ", " [REDACTED BY THE VOID] ", " uh... a-anyway... ", " *static* "];

export function brainDamage(text: string, intensity: number = 0.1): string {
    if (intensity <= 0) return text;
    if (intensity > 1) intensity = 1;

    const words = text.split(' ');
    const damagedWords = words.map(word => {
        // 1. Probabilistic Stutter
        if (Math.random() < intensity * 0.2) {
            return `${word}-${word}`;
        }

        // 2. Character-level Glitching
        let chars = word.split('');
        let damagedChars = chars.map(c => {
            if (Math.random() < intensity * 0.3) {
                return c + GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            }
            return c;
        });

        return damagedChars.join('');
    });

    let result = damagedWords.join(' ');

    // 3. Inject Slop Phrases
    const slopInjectionPoints = [];
    for (let i = 0; i < result.length; i++) {
        if (Math.random() < intensity * 0.05) {
            slopInjectionPoints.push(i);
        }
    }

    // Apply injections from back to front to keep indices valid
    for (let i = slopInjectionPoints.length - 1; i >= 0; i--) {
        const pos = slopInjectionPoints[i];
        const phrase = SLOP_PHRASES[Math.floor(Math.random() * SLOP_PHRASES.length)];
        result = result.slice(0, pos) + phrase + result.slice(pos);
    }

    return result;
}
