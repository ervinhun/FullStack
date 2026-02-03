import {emojiMap} from "./emojiMap.ts";

export function emojify(text: string): string {
    const escaped = Object.keys(emojiMap)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

    return text.replace(
        new RegExp(escaped, 'g'),
        match => emojiMap[match]
    );
}
