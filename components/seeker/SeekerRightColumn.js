// components/seeker/SeekerRightColumn.jsx
import React from "react";
import Link from "next/link";

function Card({ title, children }) {
  return (
    <section
      style={{
        background: "white",
        borderRadius: 12,
        padding: 12,
        border: "1px solid #eee",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      {title && (
        <h3 style={{ margin: 0, marginBottom: 8, fontWeight: 800, color: "#263238" }}>
          {title}
        </h3>
      )}
      <div>{children}</div>
    </section>
  );
}

export default function SeekerRightColumn({ variant = "default", showShortcuts = true }) {
  // Common shortcuts block
  const Shortcuts = (
    <Card title="Shortcuts">
      <ul className="space-y-2">
        <li>
          <Link href="/pinned-jobs" className="text-[#FF7043] font-semibold">
            Pinned Jobs
          </Link>
        </li>
        <li>
          <Link href="/applications" className="text-[#FF7043] font-semibold">
            Applications
          </Link>
        </li>
        <li>
          <Link href="/open-creator" className="text-[#FF7043] font-semibold">
            Open Creator
          </Link>
        </li>
      </ul>
    </Card>
  );

  // Feed-only extras
  const Sponsored = (
    <Card title="Sponsored">
      <p className="text-sm text-gray-600">
        Grow your reach. Promote your coaching or open roles on ForgeTomorrow.
      </p>
    </Card>
  );

  const LevelUp = (
    <Card title="Level up">
      <p className="text-sm text-gray-600">
        Try Creator tools to polish your resume and portfolio.
      </p>
    </Card>
  );

  const ComingSoon = (
    <Card title="Coming soon">
      <p className="text-sm text-gray-600">
        Contextual ads and partner offers will appear here.
      </p>
    </Card>
  );

  return (
    <div className="grid gap-3">
      {showShortcuts && Shortcuts}

      {variant === "feed" && (
        <>
          {Sponsored}
          {LevelUp}
          {ComingSoon}
        </>
      )}
    </div>
  );
}
