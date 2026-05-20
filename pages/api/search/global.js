// pages/api/search/global.js
// ForgeTomorrow Global Platform Search
// --------------------------------------------------
// General platform discovery search for members, companies,
// pages, groups, posts, newsletters, and help-style content.
//
// This is NOT career intelligence search.
// Jobs/career alignment should stay with jobSearchEngine + Universal Brain.
// --------------------------------------------------

import prisma from '@/lib/prisma';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

function clean(value = '') {
  return String(value || '').trim();
}

function toNeedle(value = '') {
  return clean(value).toLowerCase();
}

function contains(value = '') {
  return {
    contains: clean(value),
    mode: 'insensitive',
  };
}

function clip(value = '', length = 180) {
  const text = clean(value).replace(/\s+/g, ' ');
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
}

function scoreText({ query, title = '', subtitle = '', snippet = '', base = 50 }) {
  const q = toNeedle(query);
  const t = toNeedle(title);
  const s = toNeedle(subtitle);
  const body = toNeedle(snippet);

  if (!q) return base;
  if (t === q) return 100;
  if (t.startsWith(q)) return 94;
  if (t.includes(q)) return 88;
  if (s.includes(q)) return 78;
  if (body.includes(q)) return 68;
  return base;
}

function result({
  type,
  id,
  title,
  subtitle = '',
  snippet = '',
  url = '',
  avatar = '',
  relevance = 50,
  visibilityReason = '',
  meta = {},
}) {
  return {
    type,
    id: String(id),
    title: title || 'Untitled',
    subtitle,
    snippet: clip(snippet),
    url,
    avatar,
    relevance,
    visibilityReason,
    meta,
  };
}

async function safeSearch(label, fn) {
  try {
    return await fn();
  } catch (error) {
    console.error(`[global search][${label}]`, error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const query = clean(body.query || body.q || '');
  const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  if (query.length < 2) {
    return res.status(200).json({
      query,
      groups: {
        members: [],
        companies: [],
        pages: [],
        groups: [],
        posts: [],
        newsletters: [],
        events: [],
        faqs: [],
        knowledgeBase: [],
        forums: [],
      },
      all: [],
      total: 0,
    });
  }

  const [members, companies, pages, groups, posts, newsletters] = await Promise.all([
    safeSearch('members', async () => {
      const rows = await prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { isProfilePublic: true },
            { profileVisibility: 'PUBLIC' },
          ],
          AND: [
            {
              OR: [
                { name: contains(query) },
                { firstName: contains(query) },
                { lastName: contains(query) },
                { headline: contains(query) },
                { aboutMe: contains(query) },
                { location: contains(query) },
                { slug: contains(query) },
              ],
            },
          ],
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          slug: true,
          headline: true,
          aboutMe: true,
          location: true,
          avatarUrl: true,
          image: true,
          role: true,
        },
      });

      return rows.map((u) => {
        const displayName = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'ForgeTomorrow Member';
        const subtitle = [u.headline, u.location].filter(Boolean).join(' • ');
        return result({
          type: 'member',
          id: u.id,
          title: displayName,
          subtitle,
          snippet: u.aboutMe || '',
          url: u.slug ? `/portfolio/${u.slug}` : `/portfolio/${u.id}`,
          avatar: u.avatarUrl || u.image || '',
          relevance: scoreText({ query, title: displayName, subtitle, snippet: u.aboutMe, base: 60 }),
          visibilityReason: 'Public member profile',
          meta: { role: u.role },
        });
      });
    }),

    safeSearch('companies', async () => {
      const rows = await prisma.organization.findMany({
        where: {
          status: { in: ['PILOT', 'ACTIVE'] },
          OR: [
            { name: contains(query) },
            { accountKey: contains(query) },
          ],
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          accountKey: true,
          status: true,
          updatedAt: true,
        },
      });

      return rows.map((org) => result({
        type: 'company',
        id: org.id,
        title: org.name,
        subtitle: org.status ? `Company • ${org.status}` : 'Company',
        snippet: org.accountKey ? `Account: ${org.accountKey}` : '',
        url: `/companies/${org.accountKey || org.id}`,
        relevance: scoreText({ query, title: org.name, subtitle: org.accountKey, base: 65 }),
        visibilityReason: 'Active/pilot company profile',
        meta: { accountKey: org.accountKey, status: org.status },
      }));
    }),

    safeSearch('pages', async () => {
      const rows = await prisma.page.findMany({
        where: {
          OR: [
            { name: contains(query) },
            { description: contains(query) },
            { website: contains(query) },
          ],
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
        },
      });

      return rows.map((p) => result({
        type: 'page',
        id: p.id,
        title: p.name,
        subtitle: p.website || 'Page',
        snippet: p.description || '',
        url: `/pages/${p.id}`,
        relevance: scoreText({ query, title: p.name, subtitle: p.website, snippet: p.description, base: 60 }),
        visibilityReason: 'Platform page',
      }));
    }),

    safeSearch('groups', async () => {
      const rows = await prisma.group.findMany({
        where: {
          isPrivate: false,
          OR: [
            { name: contains(query) },
            { description: contains(query) },
          ],
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      return rows.map((g) => result({
        type: 'group',
        id: g.id,
        title: g.name,
        subtitle: 'Group',
        snippet: g.description || '',
        url: `/groups/${g.id}`,
        relevance: scoreText({ query, title: g.name, snippet: g.description, base: 58 }),
        visibilityReason: 'Public group',
      }));
    }),

    safeSearch('posts', async () => {
      const rows = await prisma.feedPost.findMany({
        where: {
          OR: [
            { authorName: contains(query) },
            { content: contains(query) },
            { type: contains(query) },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          authorId: true,
          authorName: true,
          content: true,
          type: true,
          createdAt: true,
          likes: true,
        },
      });

      return rows.map((p) => result({
        type: 'post',
        id: p.id,
        title: p.authorName ? `Post by ${p.authorName}` : 'Feed post',
        subtitle: p.type ? `Post • ${p.type}` : 'Post',
        snippet: p.content || '',
        url: `/feed?postId=${p.id}`,
        relevance: scoreText({ query, title: p.authorName, subtitle: p.type, snippet: p.content, base: 55 }),
        visibilityReason: 'Public feed post',
        meta: { authorId: p.authorId, likes: p.likes, createdAt: p.createdAt },
      }));
    }),

    safeSearch('newsletters', async () => {
      const rows = await prisma.newsletter.findMany({
        where: {
          OR: [
            { title: contains(query) },
            { description: contains(query) },
          ],
        },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
        },
      });

      return rows.map((n) => result({
        type: 'newsletter',
        id: n.id,
        title: n.title,
        subtitle: 'Newsletter',
        snippet: n.description || '',
        url: `/newsletters/${n.id}`,
        relevance: scoreText({ query, title: n.title, snippet: n.description, base: 55 }),
        visibilityReason: 'Public newsletter',
      }));
    }),
  ]);

  const grouped = {
    members,
    companies,
    pages,
    groups,
    posts,
    newsletters,
    // Placeholders until these models/routes exist or are confirmed.
    events: [],
    faqs: [],
    knowledgeBase: [],
    forums: [],
  };

  const all = Object.values(grouped)
    .flat()
    .sort((a, b) => Number(b.relevance || 0) - Number(a.relevance || 0));

  return res.status(200).json({
    query,
    groups: grouped,
    all,
    total: all.length,
  });
}
