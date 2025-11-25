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
}) {
  const sizeCfg = SIZE_MAP[size] || SIZE_MAP.md;

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
