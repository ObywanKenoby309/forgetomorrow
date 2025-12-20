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
              background: "white",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              border: "1px solid #eee",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                color: "#FF7043",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Your Feed
            </h1>
            <p
              style={{
                margin: "6px auto 0",
                color: "#607D8B",
                maxWidth: 720,
              }}
            >
              Share updates, get insights, and stay connected with your network.
            </p>
          </section>
        }
      >
        {/* Glass container for the entire feed area */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            padding: "24px 16px",
            margin: "0 auto",
            maxWidth: "800px",
            minHeight: "60vh",
            overflow: "hidden",
          }}
        >
          {/* Filter bar with white backing only behind "Showing" */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* White pill just for "Showing" */}
            <span
              style={{
                backgroundColor: "#ffffff",
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              Showing
            </span>

            {/* Dropdown or filter label (replace with your actual component) */}
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#4B5563",
              }}
            >
              Community + Remote Jobs ▼
            </span>
          </div>

          {/* The actual feed component */}
          <Feed />
        </div>
      </SeekerLayout>
    </>
  );
}