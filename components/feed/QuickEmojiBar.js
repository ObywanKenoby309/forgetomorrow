// components/feed/QuickEmojiBar.js
export default function QuickEmojiBar({ onPick }) {
  const emojis = ['👍', '🎉', '💪', '🔥', '🙏', '😊'];

  const handleClick = (emoji) => {
    onPick?.(emoji);
  };

  return (
    <div className="flex flex-wrap gap-2 text-xl mt-1">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleClick(emoji)}
          className="hover:scale-110 transition-transform"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
