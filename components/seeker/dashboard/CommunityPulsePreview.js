// components/seeker/dashboard/CommunityPulsePreview.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CommunityPulsePreview() {
  const [data, setData] = useState({ topPosts: [], myActivity: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/seeker/community-pulse');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Community pulse load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return null; // silent while loading
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-orange-600">
          Your Community Pulse
        </h2>
        <Link
          href="/community/feed"
          className="text-orange-600 font-medium hover:underline text-sm"
        >
          View full feed →
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Posts */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Posts</h3>
          {data.topPosts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts yet</p>
          ) : (
            <div className="space-y-3">
              {data.topPosts.map((post) => (
                <div key={post.id} className="text-sm">
                  <p className="font-medium text-gray-900">{post.authorName}</p>
                  <p className="text-gray-700 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.likes} likes
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Your Recent Activity */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Your Recent Posts</h3>
          {data.myActivity.length === 0 ? (
            <p className="text-sm text-gray-500">You haven't posted yet</p>
          ) : (
            <div className="space-y-3">
              {data.myActivity.map((post) => (
                <div key={post.id} className="text-sm">
                  <p className="text-gray-700 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.likes} likes • {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}