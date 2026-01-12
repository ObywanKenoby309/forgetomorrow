// pages/api/profile/analytics.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import authOptions from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────────────────────────
// Auth helpers (match /api/profile/details.ts behavior)
// ─────────────────────────────────────────────────────────────
function getCookie(req: NextApiRequest, name: string) {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function getJwtSecret() {
  return process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";
}

async function getAuthedUserId(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  // 1) NextAuth session (prefer id if present)
  const session = (await getServerSession(req, res, authOptions)) as
    | { user?: { id?: string | null; email?: string | null } }
    | null;

  const sessionUserId = session?.user?.id ? String(session.user.id) : null;
  if (sessionUserId) return sessionUserId;

  const sessionEmail = session?.user?.email ? String(session.user.email) : null;
  if (sessionEmail) {
    const u = await prisma.user.findUnique({
      where: { email: sessionEmail.toLowerCase().trim() },
      select: { id: true },
    });
    return u?.id || null;
  }

  // 2) HttpOnly `auth` cookie JWT (email-based in your system)
  const token = getCookie(req, "auth");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { email?: string | null };
    const email = decoded?.email ? String(decoded.email).toLowerCase().trim() : null;
    if (!email) return null;

    const u = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return u?.id || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Analytics helpers
// ─────────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ✅ Slightly smarter search-source detector (still best-effort)
function isSearchSource(source: unknown) {
  const s = String(source || "").toLowerCase().trim();
  if (!s) return false;

  // treat these as "search-like impressions"
  const needles = [
    "search",
    "discover",
    "browse",
    "results",
    "directory",
    "people",
    "members",
    "candidates",
    "talent",
    "pool",
    "recruiter",
    "query",
  ];

  return needles.some((n) => s.includes(n));
}

function safeJsonArrayLen(v: unknown) {
  if (!v) return 0;
  if (Array.isArray(v)) return v.length;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────
// Same completion logic as Anvil (ProfileDevelopment.js)
// ─────────────────────────────────────────────────────────────
function safeArray(v: unknown): unknown[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "object" && v !== null && Array.isArray((v as { items?: unknown[] }).items)) {
    return ((v as { items?: unknown[] }).items || []).filter(Boolean);
  }
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function skillNamesFromAny(skillsJson: unknown): string[] {
  const arr = safeArray(skillsJson);
  return arr
    .map((x: unknown) => {
      if (typeof x === "string") return x;
      if (typeof x === "object" && x !== null) {
        const o = x as { name?: unknown; label?: unknown };
        return String(o.name || o.label || "");
      }
      return "";
    })
    .map((s: string) => String(s || "").trim())
    .filter(Boolean);
}

type DayRow = { createdAt: Date };
type SearchRow = { createdAt: Date; source: string | null };
type ContactRow = { createdAt: Date; userId?: string; contactUserId?: string };

// ✅ Feed comment shape (best-effort; comments are JSON today)
type FeedComment = {
  id?: string | number;
  userId?: string;
  authorId?: string;
  authorName?: string;
  name?: string;
  content?: string;
  text?: string;
  body?: string;

  // comment-like system
  likes?: number;
  likedBy?: unknown;

  // emoji reactions (NOT counted as likes)
  reactions?: unknown;
};

function commentTextOf(c: FeedComment) {
  return String(c?.content || c?.text || c?.body || "").trim();
}

// ✅ FIX: likes can be stored as number OR derived from likedBy[]
function commentLikesOf(c: FeedComment) {
  const n = Number((c as { likes?: unknown })?.likes);
  if (Number.isFinite(n) && n > 0) return n;

  const likedBy = (c as { likedBy?: unknown })?.likedBy;
  if (Array.isArray(likedBy)) return likedBy.length;

  // sometimes likedBy is JSON-stringified
  if (typeof likedBy === "string") {
    try {
      const parsed = JSON.parse(likedBy);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }

  return 0;
}

function commentAuthorIdOf(c: FeedComment) {
  return String(c?.authorId || c?.userId || "").trim();
}

function titleFromPostContent(content: unknown) {
  const s = String(content || "").replace(/\s+/g, " ").trim();
  if (!s) return "View post";
  if (s.length <= 60) return s;
  return s.slice(0, 57) + "...";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthedUserId(req, res);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const today = startOfDay(new Date());
    const start = addDays(today, -6); // 7-day window inclusive
    const end = addDays(today, 1); // tomorrow start (exclusive upper bound)

    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
      labels.push(dayLabel(addDays(start, i)));
    }

    // Pull user profile bits needed for completion + display
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        headline: true,
        aboutMe: true,
        skillsJson: true,
        languagesJson: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Primary resume exists?
    const primaryResume = await prisma.resume.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
    });

    // Views (ProfileView)
    const [totalViews, viewsRows, searchRows, recentViews] = await Promise.all([
      prisma.profileView.count({ where: { targetId: userId } }),
      prisma.profileView.findMany({
        where: { targetId: userId, createdAt: { gte: start, lt: end } },
        select: { createdAt: true },
      }) as Promise<DayRow[]>,
      prisma.profileView.findMany({
        where: { targetId: userId, createdAt: { gte: start, lt: end } },
        select: { createdAt: true, source: true },
      }) as Promise<SearchRow[]>,
      prisma.profileView.findMany({
        where: { targetId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          createdAt: true,
          viewer: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    // Bucket helper
    const bucketize = (rows: DayRow[]) => {
      const buckets = Array(7).fill(0) as number[];
      for (const r of rows) {
        const d = startOfDay(new Date(r.createdAt));
        const diffDays = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays >= 0 && diffDays < 7) buckets[diffDays] += 1;
      }
      return buckets;
    };

    const viewsLast7Days = bucketize(viewsRows);

    // Search appearances: ProfileView.source indicates search/browse/discover
    const searchFiltered: DayRow[] = searchRows
      .filter((r) => isSearchSource(r.source))
      .map((r) => ({ createdAt: r.createdAt }));
    const searchAppearancesLast7Days = bucketize(searchFiltered);

    // Connections (Contact)
    const [contactsOut, contactsIn, contactsOut7d, contactsIn7d] = await Promise.all([
      prisma.contact.findMany({
        where: { userId },
        select: { contactUserId: true, createdAt: true },
      }) as Promise<ContactRow[]>,
      prisma.contact.findMany({
        where: { contactUserId: userId },
        select: { userId: true, createdAt: true },
      }) as Promise<ContactRow[]>,
      prisma.contact.findMany({
        where: { userId, createdAt: { gte: start, lt: end } },
        select: { contactUserId: true, createdAt: true },
      }) as Promise<ContactRow[]>,
      prisma.contact.findMany({
        where: { contactUserId: userId, createdAt: { gte: start, lt: end } },
        select: { userId: true, createdAt: true },
      }) as Promise<ContactRow[]>,
    ]);

    // Unique total connections (best-effort)
    const uniqueConn = new Set<string>();
    for (const c of contactsOut) if (c.contactUserId) uniqueConn.add(String(c.contactUserId));
    for (const c of contactsIn) if (c.userId) uniqueConn.add(String(c.userId));
    const totalConnections = uniqueConn.size;

    // Connections gained in last 7 days (unique)
    const gainedSet = new Set<string>();
    for (const c of contactsOut7d) if (c.contactUserId) gainedSet.add(String(c.contactUserId));
    for (const c of contactsIn7d) if (c.userId) gainedSet.add(String(c.userId));
    const connectionsGained7d = gainedSet.size;

    // Connections trend: bucketize by createdAt across both directions
    const connectionsRowsCombined: DayRow[] = [
      ...contactsOut7d.map((x) => ({ createdAt: x.createdAt })),
      ...contactsIn7d.map((x) => ({ createdAt: x.createdAt })),
    ];
    const connectionsLast7Days = bucketize(connectionsRowsCombined);

    // Posts + comments (comments are JSON on posts today)
    const [postsCount, postsForComments, postsForTopComment] = await Promise.all([
      prisma.feedPost.count({ where: { authorId: userId } }),
      prisma.feedPost.findMany({
        where: { authorId: userId },
        select: { id: true, content: true, comments: true },
        take: 250,
        orderBy: { createdAt: "desc" },
      }),

      // ✅ NEW (minimal): pull recent posts across ALL authors so we can find your comments anywhere
      prisma.feedPost.findMany({
        select: { id: true, content: true, comments: true },
        take: 250,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    let commentsCount = 0;
    for (const p of postsForComments) commentsCount += safeJsonArrayLen((p as { comments?: unknown }).comments);

    // Completion (same rules as Anvil)
    const headline = String(user.headline || "").trim();
    const aboutMe = String((user as { aboutMe?: string | null }).aboutMe || "").trim();
    const skills = skillNamesFromAny(user.skillsJson);
    const languages = safeArray(user.languagesJson);

    const hasHeadline = headline.length >= 8;
    const hasSummary = aboutMe.length >= 120;
    const hasSkills = skills.length >= 8;
    const hasLanguages = safeArray(languages).length >= 1;
    const hasPrimaryResume = Boolean(primaryResume?.id);

    const total = 5;
    const completed =
      (hasHeadline ? 1 : 0) +
      (hasSummary ? 1 : 0) +
      (hasSkills ? 1 : 0) +
      (hasLanguages ? 1 : 0) +
      (hasPrimaryResume ? 1 : 0);

    const profileCompletionPct = Math.round((completed / total) * 100);

    const profileChecklist = [
      { label: "Headline", done: hasHeadline },
      { label: "Summary", done: hasSummary },
      { label: "Experience", done: hasPrimaryResume },
      { label: "Skills", done: hasSkills },
      { label: "Links / Portfolio", done: false },
      { label: "Contact Preferences", done: false },
    ];

    // Recent viewers payload (best-effort, safe URLs)
    const recentViewers = recentViews
      .map((v) => {
        const viewer = (v as { viewer?: { id?: string; name?: string | null } }).viewer;
        if (!viewer?.id) return null;
        const name = viewer?.name || "Member";
        const profileUrl = "/profile";
        return { name, profileUrl, viewedAt: (v as { createdAt: Date }).createdAt };
      })
      .filter(Boolean)
      .slice(0, 8) as { name: string; profileUrl: string; viewedAt: Date }[];

    const lastProfileViewer = recentViewers.length
      ? { name: recentViewers[0].name || null, profileUrl: "/profile?tab=views" }
      : { name: null, profileUrl: "/profile?tab=views" };

    // ─────────────────────────────────────────────────────────────
    // ✅ TOP CONTENT (NOW SUPPORTED)
    // 1) Highest viewed post via FeedPostView aggregation
    // 2) Highest liked comment (your comment on ANY post)
    // ─────────────────────────────────────────────────────────────

    // 1) Highest viewed post (your posts only)
    const postIds = postsForComments.map((p) => p.id).filter((x) => typeof x === "number") as number[];

    let highestViewedPost: null | { id: number; title: string; url: string; views: number } = null;

    if (postIds.length) {
      const viewCounts = await prisma.feedPostView.groupBy({
        by: ["postId"],
        where: { postId: { in: postIds } },
        _count: { postId: true },
        orderBy: { _count: { postId: "desc" } },
        take: 1,
      });

      const top = viewCounts?.[0];
      if (top?.postId) {
        const post = postsForComments.find((p) => p.id === top.postId);
        const title = titleFromPostContent((post as any)?.content);
        const url = `/post-view?id=${top.postId}`;
        highestViewedPost = {
          id: top.postId,
          title,
          url,
          views: Number((top as any)?._count?.postId || 0),
        };
      }
    }

    // 2) Highest liked comment (your comment anywhere)
    let highestViewedComment:
      | null
      | { snippet: string; url: string; likes: number } = null;

    try {
      let best: { likes: number; snippet: string; url: string } | null = null;

      for (const p of postsForTopComment) {
        const raw = (p as { comments?: unknown }).comments;
        const arr: unknown[] =
          Array.isArray(raw)
            ? raw
            : typeof raw === "string"
              ? (() => {
                  try {
                    const parsed = JSON.parse(raw);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch {
                    return [];
                  }
                })()
              : [];

        for (const item of arr) {
          if (!item || typeof item !== "object") continue;
          const c = item as FeedComment;

          const authorId = commentAuthorIdOf(c);
          if (!authorId || authorId !== String(userId)) continue;

          const likes = commentLikesOf(c);
          const text = commentTextOf(c);
          if (!text) continue;

          const snippet = text.length <= 90 ? text : text.slice(0, 87) + "...";
          const commentId = (c.id ?? "") as string | number;

          const url = commentId
            ? `/post-view?id=${(p as any).id}#comment-${String(commentId)}`
            : `/post-view?id=${(p as any).id}`;

          if (!best || likes > best.likes) {
            best = { likes, snippet, url };
          }
        }
      }

      if (best) {
        highestViewedComment = {
          snippet: best.snippet,
          url: best.url,
          likes: best.likes,
        };
      }
    } catch {
      highestViewedComment = null;
    }

    return res.status(200).json({
      // KPIs
      totalViews,
      postsCount,
      commentsCount,
      totalConnections,
      connectionsGained7d,
      profileCompletionPct,

      // charts
      daysLabels: labels,
      viewsLast7Days,
      searchAppearancesLast7Days,
      connectionsLast7Days,

      // viewers
      lastProfileViewer,
      recentViewers,

      // completion checklist
      profileChecklist,

      // ✅ top content
      highestViewedPost,
      highestViewedComment,
    });
  } catch (err) {
    console.error("[api/profile/analytics] error:", err);
    return res.status(500).json({ error: "Failed to load profile analytics" });
  }
}
