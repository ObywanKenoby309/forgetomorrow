// components/seeker/SeekerRightColumn.jsx
import React from "react";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";

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
        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontWeight: 800,
            color: "#263238",
          }}
        >
          {title}
        </h3>
      )}
      <div>{children}</div>
    </section>
  );
}

export default function SeekerRightColumn({
  variant = "default",
}) {
  return (
    <div className="grid gap-3">
      <RightRailPlacementManager placement="default_right_rail" />
    </div>
  );
}