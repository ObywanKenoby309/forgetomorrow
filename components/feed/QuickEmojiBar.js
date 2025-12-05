// components/feed/QuickEmojiBar.js
export default function QuickEmojiBar({ onPick }) {
  const emojis = ['👍', '👏', '🔥', '🎉', '💡', '❤️'];

  return (
    <div className="flex flex-wrap gap-2 text-xl">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick?.(emoji)}
          className="rounded-full px-2 py-1 hover:bg-gray-100"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
