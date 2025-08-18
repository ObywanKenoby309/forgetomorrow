// components/layouts/PublicLayout.js
import React from "react";

export default function PublicLayout({ left, right, children }) {
  const hasLeft = Boolean(left);
  const hasRight = Boolean(right);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: hasLeft
          ? "300px minmax(740px,1fr) 280px"
          : hasRight
          ? "minmax(740px,1fr) 280px"
          : "1fr",
        gridTemplateAreas: hasLeft
          ? `"left content right"`
          : hasRight
          ? `"content right"`
          : `"content"`,
        gap: 20,
        padding: "30px",
      }}
    >
      {hasLeft && <aside style={{ gridArea: "left" }}>{left}</aside>}
      <main style={{ gridArea: "content" }}>{children}</main>
      {hasRight && <aside style={{ gridArea: "right" }}>{right}</aside>}
    </div>
  );
}
