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
        {/* Glass container for the entire feed */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)", // semi-transparent white
            backdropFilter: "blur(12px)", // the magic glass effect
            borderRadius: 16,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            padding: "24px 16px",
            margin: "0 auto",
            maxWidth: "800px", // or whatever your feed width is
            minHeight: "60vh", // prevents it from collapsing when empty
            overflow: "hidden", // keeps cards inside
          }}
        >
          <Feed />
        </div>
      </SeekerLayout>
    </>
  );
}