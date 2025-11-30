// lib/resourceSections.js
// Centralized content for the entire Resource Library.
// Each article is now a React component, referenced in SECTION_DETAILS.
// The UI can render article.Component directly, and later we can reuse
// these components elsewhere if needed.

// ───────── Job Search Foundations Articles ─────────
function JobSearchFoundationsArticle1() {
  return (
    <>
      <p>
        The biggest mistake many job seekers make is applying to hundreds of
        positions and hoping something sticks. Today’s market does not reward
        volume. It rewards precision and relationships.
      </p>
      <p>
        One of the most effective strategies is the 80/20 method: spend roughly
        80% of your time on networking, outreach, conversations, and follow-ups,
        and 20% of your time on applications. This feels backwards at first, but
        many real opportunities come from people, not job boards.
      </p>
      <p>
        A simple weekly structure might look like this: on Monday, identify
        target roles and companies and send a few outreach messages. On Tuesday
        and Wednesday, tailor and submit a small number of high-quality
        applications. On Thursday and Friday, follow up, reconnect with people,
        and review what is working.
      </p>
      <p>
        This approach helps you avoid burnout, strengthens every application,
        and turns your job search into a system instead of a series of random
        reactions to whatever appears online.
      </p>
    </>
  );
}

function JobSearchFoundationsArticle2() {
  return (
    <>
      <p>
        The hidden job market is not a secret club. It simply refers to roles
        that are being discussed, planned, or quietly recruited for before they
        ever hit a public job board.
      </p>
      <p>
        Managers often lean on referrals, internal candidates, or informal
        networks long before they post something publicly. If you only apply to
        posted listings, you are competing with everyone who can click the Apply
        button.
      </p>
      <p>
        Practical ways to reach the hidden job market include connecting with
        managers and team leads, commenting thoughtfully on their posts, and
        sending short, low-pressure messages asking for insight instead of
        favors. You are not asking, “Are you hiring right now?” — you are
        saying, “I am exploring opportunities in this space and would value your
        perspective.”
      </p>
      <p>
        Over time, this kind of presence builds familiarity. When those leaders
        do have an opening, you are far more likely to be on their short list of
        people to talk to.
      </p>
    </>
  );
}

function JobSearchFoundationsArticle3() {
  return (
    <>
      <p>
        A calm, organized job search starts with a simple setup. Your first day
        should focus on building a foundation, not firing off applications.
      </p>
      <p>
        Create a dedicated, professional email address for career communication.
        Prepare two resumes: a master version that holds your full history, and
        a role-specific version that you can quickly tailor for each
        application.
      </p>
      <p>
        Make sure your online profiles tell a consistent story and align with
        the roles you are pursuing now. Then set up a simple tracker — even a
        basic spreadsheet — to log applications, dates, contacts, and follow-up
        steps.
      </p>
      <p>
        Finally, choose a short list of target companies. This gives your search
        direction so you are not only reacting to random listings each day.
      </p>
    </>
  );
}

// ───────── Resumes & Cover Letters Articles ─────────
function ResumesCoverArticle1() {
  return (
    <>
      <p>
        A resume’s job is simple: get interviews. Not likes, not compliments —
        interviews.
      </p>
      <p>
        Recruiters skim resumes in seconds. They look for titles, companies,
        dates, keywords, and achievements. A clean, single-column layout with
        clear headings beats a heavily designed resume almost every time.
      </p>
      <p>
        Use the Issue–Action–Outcome pattern for bullets: what problem you
        faced, what you did, and what changed. For example: “Reduced average
        response time by 27% by reorganizing the support queue and updating
        escalation rules.”
      </p>
      <p>
        Tailor your resume by mirroring key responsibilities and skills from the
        job description where they are honestly true. The goal is not to
        inflate your experience, but to make your real strengths easy to see.
      </p>
    </>
  );
}

function ResumesCoverArticle2() {
  return (
    <>
      <p>
        Your professional summary is the headline of your resume. It should give
        a quick sense of who you are, what you do well, and where you want to
        go next.
      </p>
      <p>
        A simple structure is: your role and experience level, one or two key
        strengths, and the kind of impact you want to make. For example:
        “Operations leader with 8+ years experience improving workflows,
        supporting frontline teams, and driving measurable gains in service
        quality.”
      </p>
      <p>
        Keep it three to five lines. Avoid filler like “results-driven team
        player.” Focus on strengths and contributions you can back up with real
        examples in your work history.
      </p>
      <p>
        Update your summary first whenever you pivot roles or industries so the
        role you are targeting now is clear from the top of the page.
      </p>
    </>
  );
}

function ResumesCoverArticle3() {
  return (
    <>
      <p>
        Applicant tracking systems (ATS) store, search, and filter resumes —
        they do not automatically reject people or “hate” certain formats on
        principle.
      </p>
      <p>
        Most parsing problems come from complex tables, heavy graphics, and
        putting important text into headers, footers, or images. A simple,
        single-column layout with standard fonts almost always parses cleanly.
      </p>
      <p>
        If a human can quickly read and understand your resume, an ATS can
        usually handle it too. Focus on clear structure and relevant content
        rather than visual tricks.
      </p>
    </>
  );
}

function ResumesCoverArticle4() {
  return (
    <>
      <p>
        A modern cover letter is short, specific, and clearly written for one
        company. Many are skipped because they are generic or simply repeat the
        resume.
      </p>
      <p>
        A simple structure is three paragraphs: why you are interested in this
        company, two or three examples showing why you are a strong match, and a
        brief close expressing interest in talking further.
      </p>
      <p>
        Use the letter to connect the dots rather than restating your bullet
        points. You want the reader to think, “This person understands what we
        do and how they could help,” not just, “They copied their resume into
        paragraphs.”
      </p>
    </>
  );
}

// ───────── Interviews & Preparation Articles ─────────
function InterviewsArticle1() {
  return (
    <>
      <p>
        You do not need days of preparation to show up well to an interview. A
        focused thirty minutes can go a long way.
      </p>
      <p>
        Start by skimming the job description and highlighting the core
        responsibilities, required skills, and tools. Then quickly review the
        company’s site to understand what they do and who they serve.
      </p>
      <p>
        Choose three or four stories from your experience that show problem
        solving, working with people, handling pressure, and learning quickly.
        These stories will cover most behavioral questions.
      </p>
      <p>
        Finally, write down a few questions about the role, expectations, and
        what success looks like in the first few months. Going in with your own
        questions helps you feel like a participant instead of just being
        evaluated.
      </p>
    </>
  );
}

function InterviewsArticle2() {
  return (
    <>
      <p>
        Behavioral interviews focus on how you have actually behaved in real
        situations. Questions often start with “Tell me about a time when…”.
      </p>
      <p>
        Use the STAR method: Situation, Task, Action, Result. Briefly describe
        the context, what needed to be done, what you did, and what happened
        because of it.
      </p>
      <p>
        Keep the emphasis on your specific actions, not just what your team
        did. This helps interviewers see how you personally contribute to
        outcomes.
      </p>
      <p>
        You do not need a different story for every question. A small set of
        strong stories can be adapted to show different skills and themes.
      </p>
    </>
  );
}

function InterviewsArticle3() {
  return (
    <>
      <p>
        The questions you ask in an interview say as much about you as your
        answers. Good questions show curiosity, maturity, and a focus on doing
        the work well.
      </p>
      <p>
        Ask about expectations and success: “What does success look like in the
        first 90 days?” or “What challenges is the team focused on right now?”.
      </p>
      <p>
        Questions about growth and feedback are also helpful, such as “How is
        performance typically measured?” or “How do people usually grow in this
        role over time?”.
      </p>
      <p>
        Avoid questions that could be answered by a quick visit to the website
        or that focus only on perks before you even have an offer.
      </p>
    </>
  );
}

function InterviewsArticle4() {
  return (
    <>
      <p>
        “Tell me about yourself” is one of the most common interview questions,
        and it is easy to overthink.
      </p>
      <p>
        A clear answer is usually about a minute long and covers who you are
        professionally, a couple of strengths or themes in your work, and what
        you are looking for next.
      </p>
      <p>
        A simple pattern is: current or most recent role, key strengths or focus
        areas, one or two notable achievements or patterns, and why you are
        interested in this role or direction now.
      </p>
      <p>
        Keep it focused on your professional path and how it connects to the
        opportunity in front of you.
      </p>
    </>
  );
}

// ───────── Negotiation & Compensation Articles ─────────
function NegotiationArticle1() {
  return (
    <>
      <p>
        Negotiation can feel uncomfortable, but in most professional settings it
        is expected. Employers assume that serious candidates will at least ask
        whether there is room to adjust an offer.
      </p>
      <p>
        Confidence starts with information. If you know typical pay ranges for
        your role and location, you can treat the conversation as aligning
        expectations rather than proving your worth.
      </p>
      <p>
        When you receive an offer, thank them and ask for time to review it.
        Come back with a calm, specific request such as, “Based on my
        experience and the scope of this role, I was hoping for something closer
        to X. Is there any flexibility on the base salary?”.
      </p>
      <p>
        Even if the answer is no, you have practiced advocating for yourself and
        gathered useful information for future conversations.
      </p>
    </>
  );
}

function NegotiationArticle2() {
  return (
    <>
      <p>
        Before you negotiate, it helps to build a realistic view of what similar
        roles pay. Use salary tools, job postings with ranges, and professional
        conversations to gather data.
      </p>
      <p>
        Define a low, target, and high point for your range. The low point is
        the minimum you would realistically accept, the target is what you are
        aiming for, and the high is what you would be happy to receive.
      </p>
      <p>
        In negotiation, you usually lead with the higher end of your realistic
        range, knowing that the final number may land closer to the middle.
      </p>
      <p>
        Your research is not a guarantee of pay, but it gives you a grounded
        starting point for the conversation.
      </p>
    </>
  );
}

function NegotiationArticle3() {
  return (
    <>
      <p>
        Having a few phrases ready can make negotiation feel less stressful. You
        do not need to memorize scripts word for word, but you can adapt them to
        your tone.
      </p>
      <p>
        For example: “Thank you for the offer. I am excited about the role.
        Based on my experience and what we discussed, I was hoping for something
        closer to X. Is there any flexibility on the base salary?”.
      </p>
      <p>
        If base salary is fixed, you can ask: “If the base is firm, is there
        room to adjust benefits, remote flexibility, or a signing bonus to help
        close the gap?”.
      </p>
      <p>
        When you accept, a simple “I appreciate you working with me on this. I’m
        happy to accept and excited to get started” reinforces mutual respect.
      </p>
    </>
  );
}

// ───────── Networking & Personal Branding Articles ─────────
function NetworkingArticle1() {
  return (
    <>
      <p>
        Networking often feels awkward because many people think it means asking
        strangers for favors. Healthy networking is simply staying in touch with
        people in your field and being visible in a respectful way.
      </p>
      <p>
        Start small: react to posts, leave short, genuine comments, or send a
        quick note when something someone shared was helpful.
      </p>
      <p>
        When you reach out directly, ask for insight instead of opportunity.
        “I’m exploring roles in your field and would appreciate any advice
        you’re comfortable sharing” is far easier to respond to than “Are you
        hiring?”.
      </p>
      <p>
        Over time, these low-pressure interactions build real relationships and
        trust.
      </p>
    </>
  );
}

function NetworkingArticle2() {
  return (
    <>
      <p>
        Your professional brand is not about becoming an influencer. It’s about
        making it easier for the right people to understand who you are and how
        you work.
      </p>
      <p>
        You can build this in about ten minutes a day. Share small reflections
        on what you’re learning, comment thoughtfully on discussions in your
        field, and keep your profile updated with your current direction and
        strengths.
      </p>
      <p>
        Short, genuine posts and comments over time do far more than a single
        long post every few months.
      </p>
    </>
  );
}

function NetworkingArticle3() {
  return (
    <>
      <p>
        Simple message patterns can make outreach easier. You can adapt them to
        sound like yourself without overthinking every word.
      </p>
      <p>
        For example: “Hi, I appreciated your post on X — it helped clarify
        something I’d been stuck on. I’m exploring similar paths and would love
        to connect.” Or after a call: “Thank you again for taking the time to
        share your experience. Your advice gave me a clearer sense of my next
        steps.”.
      </p>
      <p>
        When you see a role at someone’s company, you might say: “I noticed a
        role on your team that looks like a strong fit for my background. I’m
        planning to apply and would appreciate any insight you can share about
        what the team is looking for.”.
      </p>
    </>
  );
}

// ───────── Career Development & Skill Growth Articles ─────────
function CareerDevArticle1() {
  return (
    <>
      <p>
        Feeling unsure about your next career move is normal. Most people shift
        directions several times over their working life.
      </p>
      <p>
        A helpful starting point is to look for patterns in your past roles.
        What work have you consistently enjoyed? Where have you performed well?
        What do people often come to you for?
      </p>
      <p>
        These patterns reveal strengths and preferences that matter more than
        specific job titles. From there, you can look for roles that use the
        same core skills, even in new industries.
      </p>
    </>
  );
}

function CareerDevArticle2() {
  return (
    <>
      <p>
        A six-month development plan gives you enough time to make real progress
        without feeling overwhelming.
      </p>
      <p>
        Choose two or three focus areas, such as communication, a specific
        technical skill, or a tool that is common in the roles you want. Then
        outline small weekly steps like lessons, practice projects, or applying
        the skill in your current job.
      </p>
      <p>
        At the end of each month, review what you completed, adjust what didn’t
        fit, and decide what to emphasize next. The goal is steady movement, not
        perfection.
      </p>
    </>
  );
}

function CareerDevArticle3() {
  return (
    <>
      <p>
        Transferable skills are abilities that carry across roles and
        industries, such as communication, problem solving, time management, and
        working well with others.
      </p>
      <p>
        When you pivot, make the connection explicit: describe not only what you
        did, but how those actions and outcomes matter in the new role you’re
        targeting.
      </p>
      <p>
        Once you see how much you already bring to the table, changing direction
        feels less like starting over and more like applying your strengths in a
        new context.
      </p>
    </>
  );
}

// ───────── Special Situations & Tough Scenarios Articles ─────────
function SpecialSituationsArticle1() {
  return (
    <>
      <p>
        Many people have employment gaps due to layoffs, caregiving, health
        issues, or relocation. A gap is not a moral failing; it’s a part of
        life.
      </p>
      <p>
        When you explain a gap, keep it short, honest, and future-focused. For
        example: “I took time away from full-time work for family
        responsibilities, and now I’m ready to return and fully focus on my
        career again.”.
      </p>
      <p>
        You do not need to share private medical or personal details. Employers
        mainly want to know that you’re able and ready to work now.
      </p>
    </>
  );
}

function SpecialSituationsArticle2() {
  return (
    <>
      <p>
        Changing industries or roles is common, especially as markets and
        technology evolve. A pivot is easier when you clearly explain what
        strengths you are bringing with you.
      </p>
      <p>
        You might say: “I’m transitioning from frontline service work into
        operations coordination. My experience handling complex customer
        situations, managing time pressure, and staying organized translates
        well to supporting internal workflows.”.
      </p>
      <p>
        The key is to show you’re reusing your experience in a new context, not
        abandoning it.
      </p>
    </>
  );
}

function SpecialSituationsArticle3() {
  return (
    <>
      <p>
        Rejection is a normal part of any job search, even for strong
        candidates. Hearing “no” — or hearing nothing — can be discouraging, but
        it does not mean you are unqualified.
      </p>
      <p>
        It helps to separate outcomes you cannot control from actions you can.
        You can’t force a company to choose you, but you can improve your
        materials, practice interviews, and reach out to new connections.
      </p>
      <p>
        Tracking small weekly wins — applications sent, conversations started,
        skills practiced — reminds you that you’re moving forward even when
        offers take time to show up.
      </p>
    </>
  );
}

// ───────── ForgeTomorrow Platform Tutorials Articles ─────────
function PlatformArticle1() {
  return (
    <>
      <p>
        The ForgeTomorrow resume builder is designed to help you create a clear,
        professional resume without wrestling with formatting.
      </p>
      <p>
        You enter your contact information, summary, work experience, skills,
        education, and any extra sections. As you fill it out, focus on
        achievements and outcomes rather than listing every task.
      </p>
      <p>
        When you’re ready, you can export your resume in formats that work well
        for both online applications and human readers.
      </p>
    </>
  );
}

function PlatformArticle2() {
  return (
    <>
      <p>
        SmartNetworking helps you find and connect with people who are relevant
        to your goals — peers, mentors, or hiring managers.
      </p>
      <p>
        Use filters to find people by role, industry, or interests, then send
        short, thoughtful messages instead of generic connection requests.
      </p>
      <p>
        Over time, this helps you build a smaller, stronger network of people
        you actually interact with.
      </p>
    </>
  );
}

function PlatformArticle3() {
  return (
    <>
      <p>
        When you receive an offer, ForgeTomorrow’s negotiation support tools can
        help you think through your response.
      </p>
      <p>
        By entering details about the role, the offer, and your background, you
        can get guidance on typical ranges and example phrases you might use
        when asking about flexibility.
      </p>
      <p>
        These tools are there to support you — not to replace your judgment.
        They give you a more confident starting point for the conversation.
      </p>
    </>
  );
}

// ─────────────────────────────────────────────
// SECTION_DETAILS mapping
// ─────────────────────────────────────────────
export const SECTION_DETAILS = {
  'ForgeTomorrow Platform Tutorials': {
    description:
      'Learn how to use ForgeTomorrow’s tools so your job search runs smoother with less guesswork.',
    items: [
      'Resume builder basics.',
      'ATS / match insights.',
      'SmartNetworking.',
      'Negotiation tools.',
    ],
    articles: [
      {
        title: 'Using the ForgeTomorrow Resume Builder',
        Component: PlatformArticle1,
      },
      {
        title: 'SmartNetworking',
        Component: PlatformArticle2,
      },
      {
        title: 'Negotiation Support Tools',
        Component: PlatformArticle3,
      },
    ],
  },

  'Job Search Foundations': {
    description:
      'Start here if you are restarting your search or feel stuck. This section walks you through structuring your week using the 80/20 method, tapping into the hidden job market, and building a simple system so your search does not feel chaotic.',
    items: [
      'How to structure your job search using the 80/20 method (80% networking, 20% applications).',
      'The hidden job market and how to reach opportunities before they are posted.',
      'Day-1 job search setup checklist: email, resume, profiles, tracker, and target companies.',
    ],
    articles: [
      {
        title: 'How to Structure Your Job Search (The 80/20 Method)',
        Component: JobSearchFoundationsArticle1,
      },
      {
        title: 'The Hidden Job Market (How to Use It Effectively)',
        Component: JobSearchFoundationsArticle2,
      },
      {
        title: 'Job Search Setup Checklist (Day 1 Setup)',
        Component: JobSearchFoundationsArticle3,
      },
    ],
  },

  'Resumes & Cover Letters': {
    description:
      'Turn your experience into a resume and cover letters that actually get interviews. Learn how recruiters scan resumes in six seconds, how to write Issue–Action–Outcome bullets, and how to tailor your documents without rewriting them from scratch.',
    items: [
      'High-conversion resume layout for ATS + human readability.',
      'Professional summary templates for fast tailoring.',
      'ATS myths vs. reality.',
      'Modern cover letter structure.',
    ],
    articles: [
      {
        title: 'How to Build a High-Conversion Resume',
        Component: ResumesCoverArticle1,
      },
      {
        title: 'Professional Summary Templates',
        Component: ResumesCoverArticle2,
      },
      {
        title: 'ATS Reality: What It Actually Does',
        Component: ResumesCoverArticle3,
      },
      {
        title: 'Cover Letters That Actually Get Read',
        Component: ResumesCoverArticle4,
      },
    ],
  },

  'Interviews & Preparation': {
    description:
      'Show up prepared, calm, and clear. Learn how to prep in 30 minutes, build a story bank, ask smart questions, and answer “Tell me about yourself” confidently.',
    items: [
      '30-minute prep checklist.',
      'Behavioral interview mastery.',
      'Smart questions to ask.',
      'Tell me about yourself — simple structure.',
    ],
    articles: [
      {
        title: 'How to Prepare for an Interview in 30 Minutes',
        Component: InterviewsArticle1,
      },
      {
        title: 'Mastering Behavioral Interviews (STAR Method)',
        Component: InterviewsArticle2,
      },
      {
        title: 'How to Ask Smart Questions',
        Component: InterviewsArticle3,
      },
      {
        title: 'Answering “Tell Me About Yourself”',
        Component: InterviewsArticle4,
      },
    ],
  },

  'Negotiation & Compensation': {
    description:
      'Understand your market value, anchor your salary range, and negotiate respectfully and confidently.',
    items: [
      'Market research methods.',
      'Anchoring your range.',
      'Negotiation scripts.',
      'Handling fixed-budget offers.',
    ],
    articles: [
      {
        title: 'How to Negotiate Confidently',
        Component: NegotiationArticle1,
      },
      {
        title: 'How to Research Your Market Value',
        Component: NegotiationArticle2,
      },
      {
        title: 'Negotiation Scripts You Can Adapt',
        Component: NegotiationArticle3,
      },
    ],
  },

  'Networking & Personal Branding': {
    description:
      'Networking doesn’t have to be awkward. Build genuine professional relationships over time.',
    items: [
      'Low-pressure conversation starters.',
      '10-minute daily branding routine.',
      'Message scripts.',
      'Staying visible respectfully.',
    ],
    articles: [
      {
        title: 'How to Network Without Feeling Awkward',
        Component: NetworkingArticle1,
      },
      {
        title: 'Building a Professional Brand in 10 Minutes a Day',
        Component: NetworkingArticle2,
      },
      {
        title: 'Simple Outreach Scripts',
        Component: NetworkingArticle3,
      },
    ],
  },

  'Career Development & Skill Growth': {
    description:
      'Pick your direction, build a six-month plan, and grow your skills with small, compounding steps.',
    items: [
      'Identifying strengths.',
      'One-step pivots.',
      'Six-month growth plans.',
      'Testing new directions.',
    ],
    articles: [
      {
        title: 'How to Pick Your Career Direction',
        Component: CareerDevArticle1,
      },
      {
        title: 'Building a Six-Month Development Plan',
        Component: CareerDevArticle2,
      },
      {
        title: 'Using Transferable Skills',
        Component: CareerDevArticle3,
      },
    ],
  },

  'Special Situations & Tough Scenarios': {
    description:
      'Handle gaps, layoffs, pivots, and difficult seasons with confidence and professionalism.',
    items: ['Explaining gaps.', 'Pivoting industries.', 'Handling rejection.'],
    articles: [
      {
        title: 'Talking About Job Gaps',
        Component: SpecialSituationsArticle1,
      },
      {
        title: 'Navigating Career Pivots',
        Component: SpecialSituationsArticle2,
      },
      {
        title: 'Handling Rejection',
        Component: SpecialSituationsArticle3,
      },
    ],
  },
};
