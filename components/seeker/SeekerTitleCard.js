// components/seeker/SeekerTitleCard.js
import React from "react";
import PageTitleCardBase from "@/components/shared/PageTitleCardBase";

export default function SeekerTitleCard({
  greeting,
  title,
  subtitle,
  isMobile = false,
  style = {},
}) {
  return (
    <PageTitleCardBase
      eyebrow={greeting}
      title={title}
      subtitle={subtitle}
      isMobile={isMobile}
      style={style}
      titleColor="#FF7043"
      eyebrowColor="#243B63"
      subtitleColor={isMobile ? "#546E7A" : "#4A5D73"}
    />
  );
}