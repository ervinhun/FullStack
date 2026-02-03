import { emojis } from '../../helpers/emojiMap.ts';

type Props = {
    onSelect: (emoji: string) => void;
};

export function EmojiPicker({ onSelect }: Props) {
    return (
        <div style={pickerStyle}>
            {emojis.map(e => (
                <button
                    key={e}
                    onClick={() => onSelect(e)}
                    style={emojiButton}
                >
                    {e}
                </button>
            ))}
        </div>
    );
}

const pickerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '48px',
    left: 0,
    background: '#1e1e1e',
    borderRadius: 8,
    padding: 8,
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,.3)',
};

const emojiButton: React.CSSProperties = {
    fontSize: 20,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
};
