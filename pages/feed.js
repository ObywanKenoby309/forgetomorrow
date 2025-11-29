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
        <Feed />
      </SeekerLayout>
    </>
  );
}
