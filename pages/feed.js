// pages/feed.js
import React from "react";
import Head from "next/head";
import SeekerLayout from "@/components/layouts/SeekerLayout";
import SeekerRightColumn from "@/components/seeker/SeekerRightColumn";
import Feed from "@/components/feed/Feed";

export default function FeedPage() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — Feed</title>
      </Head>

      <SeekerLayout
        title="Your Feed | ForgeTomorrow"
        right={<SeekerRightColumn variant="feed" />}
        activeNav="feed"
        header={
          <section
            aria-label="Your personalized ForgeTomorrow feed header"
            style={{
              background: "rgba(255, 255, 255, 0.85)", // ✅ MATCH Hearth Spotlight
              backdropFilter: "blur(12px)",
              borderRadius: 16,
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
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
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
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
