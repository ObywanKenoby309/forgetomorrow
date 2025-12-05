// components/layouts/PublicLayout.js
import React, { useEffect, useState } from "react";

export default function PublicLayout({ left, right, children }) {
  const hasLeft = Boolean(left);
  const hasRight = Boolean(right);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Run only on client
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // < 768px = mobile
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Base layout values
  let gridTemplateColumns;
  let gridTemplateAreas;

  if (isMobile) {
    // Mobile: stack, content first
    gridTemplateColumns = "1fr";

    if (hasLeft && hasRight) {
      gridTemplateAreas = `"content"
                           "left"
                           "right"`;
    } else if (hasLeft) {
      gridTemplateAreas = `"content"
                           "left"`;
    } else if (hasRight) {
      gridTemplateAreas = `"content"
                           "right"`;
    } else {
      gridTemplateAreas = `"content"`;
    }
  } else {
    // Desktop: your original layout
    gridTemplateColumns = hasLeft
      ? "300px minmax(740px,1fr) 280px"
      : hasRight
      ? "minmax(740px,1fr) 280px"
      : "1fr";

    gridTemplateAreas = hasLeft
      ? `"left content right"`
      : hasRight
      ? `"content right"`
      : `"content"`;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns,
        gridTemplateAreas,
        gap: 20,
        padding: isMobile ? "16px" : "30px",
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {hasLeft && <aside style={{ gridArea: "left" }}>{left}</aside>}
      <main style={{ gridArea: "content" }}>{children}</main>
      {hasRight && <aside style={{ gridArea: "right" }}>{right}</aside>}
    </div>
  );
}
