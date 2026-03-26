// components/shared/PageTitleCardBase.js
import React from "react";

const BASE_GLASS = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

export default function PageTitleCardBase({
  eyebrow,
  title,
  subtitle,
  isMobile = false,
  style = {},
  contentStyle = {},
  titleColor = "#FF7043",
  eyebrowColor = "#243B63",
  subtitleColor = "#4A5D73",
}) {
  return (
    <section
      style={{
        ...BASE_GLASS,
        padding: isMobile ? "18px 20px" : 16,
        textAlign: "center",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div style={{ ...contentStyle }}>
        {eyebrow ? (
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: eyebrowColor,
              marginBottom: 5,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              lineHeight: 1.2,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <h1
  style={{
    margin: isMobile ? "0 auto" : 0,
    textAlign: "center",
    fontSize: 22,
    fontWeight: 900,
    color: titleColor,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
    textShadow: `
      0 1px 0 rgba(255,255,255,0.35),
      0 1px 2px rgba(0,0,0,0.08)
    `,
  }}
>
  {title}
</h1>

        {subtitle ? (
          <p
            style={{
              margin: isMobile ? "8px auto 0" : "7px auto 0",
              color: subtitleColor,
              maxWidth: isMobile ? 520 : 740,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}