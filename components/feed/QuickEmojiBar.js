// components/feed/QuickEmojiBar.js
export default function QuickEmojiBar({ onPick }) {
  const emojis = ['👍', '🔥', '🎉', '👏', '❤️'];

  const handleClick = (emoji) => {
    console.log('[EMOJI BAR] emoji clicked', {
      emoji,
      hasOnPick: typeof onPick === 'function',
    });
    if (typeof onPick === 'function') {
      onPick(emoji);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 text-lg mt-1">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleClick(emoji)}
          className="px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
          aria-label={`Add ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
