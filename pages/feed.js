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
        <title>ForgeTomorrow — Career Signal Feed</title>
      </Head>

      <SeekerLayout
        title="Career Signal Feed | ForgeTomorrow"
        right={<RightRailPlacementManager />}
        rightVariant="light"
        activeNav="feed"
        header={
          <SeekerTitleCard
            greeting={greeting}
            title="Career Signal Feed"
            subtitle="Share updates, spot momentum, and stay connected with what matters in your network."
          />
        }
      >
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.24)",
            background: "rgba(255,255,255,0.52)",
            boxShadow: "0 14px 36px rgba(0,0,0,0.12)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
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