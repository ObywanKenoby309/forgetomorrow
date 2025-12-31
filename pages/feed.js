// pages/feed.js
import React from "react";
import Head from "next/head";
import SeekerLayout from "@/components/layouts/SeekerLayout";
import Feed from "@/components/feed/Feed";
import RightRailPlacementManager from "@/components/ads/RightRailPlacementManager";

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
          <section
            aria-label="Your personalized ForgeTomorrow feed header"
            style={{
              // ✅ MATCH PROFILE NUMBERS
              borderRadius: 14,
              padding: "24px 16px",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.58)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",

              // keep centered header like other pages
              margin: "0 auto",
              maxWidth: 1320,
            }}
          >
            <h1
              style={{
                margin: 0,
                color: "#FF7043",
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              Your Feed
            </h1>

            <p
              style={{
                margin: "8px auto 0",
                color: "#546E7A",
                maxWidth: 720,
                fontSize: 16,
              }}
            >
              Share updates, get insights, and stay connected with your network.
            </p>
          </section>
        }
      >
        <div
          style={{
            // ✅ MATCH PROFILE NUMBERS
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.58)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: "24px 16px",

            // ✅ WIDTH FIX (fill center column, no clamp)
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
