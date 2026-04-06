// pages/feed.js
import React from "react";
import Head from "next/head";
import SeekerLayout from "@/components/layouts/SeekerLayout";
import Feed from "@/components/feed/Feed";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";
import SeekerTitleCard from "@/components/seeker/SeekerTitleCard";
import { getTimeGreeting } from "@/lib/dashboardGreeting";

export default function FeedPage() {
  const greeting = getTimeGreeting();

  return (
    <>
      <Head>
        <title>ForgeTomorrow — Community Feed</title>
      </Head>

      <SeekerLayout
        title="Community Feed | ForgeTomorrow"
        right={<RightRailPlacementManager />}
        rightVariant="light"
        activeNav="feed"
        header={
          <SeekerTitleCard
            greeting={greeting}
            title="Community Feed"
            subtitle="Share updates, get insights, and stay connected with your network."
          />
        }
      >
        <div
          style={{
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.58)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: 16,
            width: "100%",
            minHeight: "60vh",
          }}
        >
          <Feed />
        </div>
      </SeekerLayout>
    </>
  );
}