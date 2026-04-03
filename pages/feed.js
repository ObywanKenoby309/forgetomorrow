// pages/feed.js
import React from "react";
import Head from "next/head";
import SeekerLayout from "@/components/layouts/SeekerLayout";
import Feed from "@/components/feed/Feed";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import SeekerTitleCard from "@/components/seeker/SeekerTitleCard"; // ✅ ADDED

export default function FeedPage() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — Feed</title>
      </Head>

      <SeekerLayout
        title="Your Feed | ForgeTomorrow"
        right={<RightRailPlacementManager />}
        activeNav="feed"
        header={
          // ✅ REPLACED HEADER ONLY
          <SeekerTitleCard
            title="Your Feed"
            subtitle="Share updates, get insights, and stay connected with your network."
          />
        }
      >
        <div
          style={{
            // ✅ KEEP EXISTING (DO NOT TOUCH)
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.58)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: "24px 16px",

            // ✅ WIDTH FIX (unchanged)
            margin: "24px 0 0",
            width: "100%",
            maxWidth: "none",

            minHeight: "60vh",
          }}
        >
          <Feed />
        </div>
      </SeekerLayout>
    </>
  );
}