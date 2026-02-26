// components/common/Avatar.js
import React from "react";

const SIZE_MAP = {
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-9 w-9", text: "text-sm" },
  lg: { box: "h-11 w-11", text: "text-base" },
};

export default function Avatar({
  avatarUrl,
  initials = "FT",
  size = "md",
  className = "",
  resolved = true, // ✅ NEW (default true = backward compatible)
}) {
  const sizeCfg = SIZE_MAP[size] || SIZE_MAP.md;

  // ✅ If not resolved yet, show neutral shimmer circle (no letters)
  if (!resolved) {
    return (
      <div
        className={`${sizeCfg.box} rounded-full bg-gray-200 border border-black/10 animate-pulse ${className}`}
      />
    );
  }

  if (avatarUrl) {
    return (
      <div
        className={`${sizeCfg.box} rounded-full bg-gray-700 overflow-hidden border border-black/30 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={initials || "User avatar"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const safeInitials =
    (initials || "")
      .toString()
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "FT";

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#FF7043] to-[#F4511E] text-white font-bold ${sizeCfg.box} ${sizeCfg.text} ${className}`}
    >
      {safeInitials}
    </div>
  );
}