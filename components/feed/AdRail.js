// components/feed/AdRail.jsx
export default function AdRail() {
  const Card = ({ title, body }) => (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: '#1e1f21', border: '1px solid #2e3135', color: '#e5e7eb' }}
    >
      <div className="text-sm font-bold mb-1">{title}</div>
      <div className="text-xs opacity-80">{body}</div>
    </div>
  );

  return (
    <aside className="hidden lg:block w-[300px]">
      <Card
        title="Sponsored"
        body="Grow your reach. Promote your coaching or open roles on ForgeTomorrow."
      />
      <Card
        title="Level up"
        body="Try Creator tools to polish your resume and portfolio."
      />
      <Card
        title="Coming soon"
        body="Contextual ads and partner offers will appear here."
      />
    </aside>
  );
}
