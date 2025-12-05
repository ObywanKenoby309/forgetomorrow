// components/feed/QuickEmojiBar.js
export default function QuickEmojiBar({ onPick }) {
  const emojis = ['👍', '🎉', '❤️', '🔥', '👏'];

  const handlePick = (emoji) => {
    // No alerts, no browser popups — just notify parent
    onPick?.(emoji);
  };

  return (
    <div className="flex flex-wrap gap-1 text-base mt-1">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handlePick(emoji)}
          className="px-2 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
