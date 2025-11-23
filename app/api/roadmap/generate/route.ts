// app/api/roadmap/generate/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { resumeId } = await request.json();
  if (!resumeId) return NextResponse.json({ error: 'Resume ID required' }, { status: 400 });

  // === LIMIT CHECK ===
  const existing = await prisma.careerRoadmap.findFirst({
    where: { userId: session.user.id },
  });

  const isPro = session.user.plan === 'PRO';
  if (!isPro && existing) {
    return NextResponse.json(
      { error: 'You have already used your free roadmap. Upgrade to Pro for monthly refreshes.' },
      { status: 403 }
    );
  }

  if (isPro) {
    const lastPro = await prisma.careerRoadmap.findFirst({
      where: { userId: session.user.id, isPro: true },
      orderBy: { createdAt: 'desc' },
    });
    if (lastPro) {
      const now = new Date();
      const last = new Date(lastPro.createdAt);
      if (now.getMonth() === last.getMonth() && now.getFullYear() === last.getFullYear()) {
        return NextResponse.json(
          { error: 'You’ve already generated a roadmap this month. Next one available on the 1st.' },
          { status: 403 }
        );
      }
    }
  }

  // === FETCH RESUME ===
  // Make sure we have a valid user on the session first
if (!session || !session.user || !session.user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const userId = session.user.id.toString();

const resume = await prisma.resume.findUnique({
  where: { id: parseInt(resumeId, 10) },
});

if (!resume || resume.userId !== userId) {
  return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
}

  // === CALL GEMINI ===
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `You are a senior executive coach who has placed 500+ people into $150k–$400k roles.

User's full resume:
${resume.content}

Generate a brutally honest, actionable 12-month career acceleration roadmap with:
• Exact role/title they should target in 12 months
• Top 3 skill gaps holding them back right now
• 30-day, 60-day, 90-day milestones with measurable deliverables
• 3 high-impact projects they should volunteer for
• Exact promotion timeline + salary jump expectation
• One non-obvious move that will 10x their visibility

Format as clean, beautiful Markdown with clear sections and bold headings.`;

  const result = await model.generateContent(prompt);
  const roadmap = result.response.text();

  // === SAVE TO DB ===
  const saved = await prisma.careerRoadmap.create({
    data: {
      userId: session.user.id,
      data: { roadmap, resumeId },
      pdfUrl: '', // we’ll add PDF later if you want
      isPro: isPro,
    },
  });

  return NextResponse.json({
    roadmap,
    pdfUrl: '', // placeholder — we can add real PDF later
    message: 'Your Forge Plan is ready!',
  });
}