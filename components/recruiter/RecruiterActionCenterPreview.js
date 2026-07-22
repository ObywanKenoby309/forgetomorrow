// components/recruiter/RecruiterActionCenterPreview.js

export default function RecruiterQuickActions({ chromeQuery, isMobile }) {
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = async (isInitial = false) => {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch("/api/notifications/list?scope=RECRUITER&limit=25&includeRead=0", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {}
      finally {
        if (!alive) return;
        if (isInitial) setInitialLoading(false);
        setRefreshing(false);
      }
    };
    load(true);
    const t = setInterval(() => load(false), 25000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  const buckets = useMemo(() => {
    const b = { stalled: [], awaiting_feedback: [], unread_replies: [], upcoming: [] };
    for (const n of Array.isArray(items) ? items : []) {
      const k = pickRecruiterBucket(n);
      if (!b[k]) continue;
      b[k].push(n);
    }
    return {
      stalled: b.stalled.slice(0, 3),
      awaiting_feedback: b.awaiting_feedback.slice(0, 3),
      unread_replies: b.unread_replies.slice(0, 3),
      upcoming: b.upcoming.slice(0, 3),
    };
  }, [items]);
  const tiles = [
    { key: "unread_replies", title: "Unread Replies", emptyText: "No unread candidate replies.", href: "/action-center?scope=RECRUITER&tab=UNREAD_REPLIES", items: buckets.unread_replies, icon: "💬" },
    { key: "upcoming", title: "Upcoming Interviews", emptyText: "No upcoming interviews or conflicts.", href: "/action-center?scope=RECRUITER&tab=UPCOMING", items: buckets.upcoming, icon: "📅" },
    { key: "stalled", title: "Stalled Candidates", emptyText: "No stalled candidates right now.", href: "/action-center?scope=RECRUITER&tab=STALLED", items: buckets.stalled, icon: "⚠️" },
    { key: "awaiting_feedback", title: "Awaiting Feedback", emptyText: "No hiring manager feedback pending.", href: "/action-center?scope=RECRUITER&tab=AWAITING_FEEDBACK", items: buckets.awaiting_feedback, icon: "🔄" },
  ];
  const sortedTiles = [...tiles].sort((a, b) => {
    const aHas = a.items.length > 0 ? 1 : 0;
    const bHas = b.items.length > 0 ? 1 : 0;
    return bHas - aHas;
  });
  if (isMobile) {
    if (initialLoading) {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 64,
                borderRadius: 12,
                background: "rgba(255,255,255,0.70)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            />
          ))}
        </div>
      );
    }