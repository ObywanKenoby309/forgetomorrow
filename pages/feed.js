// pages/feed.js
import React from "react";
import Head from "next/head";
import Feed from "@/components/feed/Feed";

export default function FeedPage() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow — Feed</title>
      </Head>

      {/* UniversalHeader is injected by _app.js for /feed */}
      <main className="px-4">
        <Feed />
      </main>
    </>
  );
}
