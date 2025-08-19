// components/feed/QuickEmojiBar.jsx
export default function QuickEmojiBar({ onPick }) {
  const EMOJIS = [
    { e: '👍', title: 'Agree' },
    { e: '🔥', title: 'Hype' },
    { e: '👏', title: 'Well done' },
    { e: '🙌', title: 'Celebrate' },
    { e: '💡', title: 'Good idea' },
    { e: '❤️', title: 'Love / support' },
    { e: '💪', title: 'Strength' },
    { e: '🌱', title: 'Growth / new' },
    { e: '💯', title: 'Nailed it' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {EMOJIS.map(({ e, title }) => (
        <button
          key={e}
          type="button"
          title={title}
          aria-label={title}
          onClick={() => onPick?.(e)}
          className="px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-base"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
