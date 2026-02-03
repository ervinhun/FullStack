import { useRef, useState } from 'react';
import { EmojiPicker } from './emojiPicker.tsx';
import {emojify} from "../../helpers/emojify.ts";

type Props = {
    onSend: (msg: string) => void;
};

export function ChatInput({ onSend }: Props) {
    const [value, setValue] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    function insertEmoji(emoji: string) {
        const input = inputRef.current!;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        const next =
            value.slice(0, start) +
            emoji +
            value.slice(end);

        setValue(next);

        requestAnimationFrame(() => {
            input.focus();
            input.selectionStart = input.selectionEnd = start + emoji.length;
        });
    }

    function send() {
        if (!value.trim()) return;
        onSend(emojify(value));
        setValue('');
    }

    return (
        <div className="relative flex gap-2 mt-3">
            {showPicker && <EmojiPicker onSelect={insertEmoji} />}

            <textarea
                ref={inputRef}
                value={value}
                onChange={e => setValue(emojify(e.target.value))}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                    }
                }}
                className="textarea textarea-bordered flex-grow"
                rows={2}
                placeholder="Type a message..."
            />

            <button
                type="button"
                className="btn"
                onClick={() => setShowPicker(v => !v)}
            >
                😊
            </button>

            <button className="btn btn-primary" onClick={send}>
                Send
            </button>
        </div>
    );
}
