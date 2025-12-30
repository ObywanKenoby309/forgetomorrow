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
        // ✅ Replace SeekerRightColumn with the new ad-ready right-rail system
        right={<RightRailPlacementManager />}
        activeNav="feed"
        header={
          <section
            aria-label="Your personalized ForgeTomorrow feed header"
            style={{
              background: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              padding: "24px 16px",
              margin: "0 auto",
              maxWidth: "1200px",
              textAlign: "center",
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
                color: "#546E7A", // readable, matches Hearth tone
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
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.55)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            padding: "24px 16px",
            margin: "24px auto 0",
            maxWidth: "1200px",
            minHeight: "60vh",
          }}
        >
          {/* ✅ Removed remote jobs filter label (do not remove the actual Feed filter dropdown) */}
          <Feed />
        </div>
      </SeekerLayout>
    </>
  );
}
