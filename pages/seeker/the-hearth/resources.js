import { useState } from 'react';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ fontWeight: 800, color: 'black', marginBottom: 8 }}>
          Shortcuts
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Link href="/seeker/the-hearth">Back to Hearth</Link>
          <Link href="/seeker/the-hearth/mentorship">Mentorship Programs</Link>
          <Link href="/seeker/the-hearth/events">Community Events</Link>
          <Link href="/seeker/the-hearth/forums">Discussion Forums</Link>
        </div>
      </div>
    </div>
  );
}

const Header = (
  <section
    style={{
      background: 'white',
      border: '1px solid #eee',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      textAlign: 'center',
    }}
  >
    <h1
      style={{
        margin: 0,
        color: '#FF7043',
        fontSize: 24,
        fontWeight: 800,
      }}
    >
      Resource Library
    </h1>
    <p
      style={{
        margin: '6px auto 0',
        color: '#607D8B',
        maxWidth: 720,
      }}
    >
      Browse core learning sections now. Articles and guides today; paid certs
      and courses later.
    </p>
  </section>
);

// ─────────────────────────────────────────────
// Section metadata + full article content
// ─────────────────────────────────────────────
const SECTION_DETAILS = {
  // ───────── 1. Job Search Foundations ─────────
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
        paragraphs: [
          'The biggest mistake many job seekers make is applying to hundreds of positions and hoping something sticks. Today’s market does not reward volume. It rewards precision and relationships.',
          'One of the most effective strategies is the 80/20 method: spend roughly 80% of your time on networking, outreach, conversations, and follow-ups, and 20% of your time on applications. This feels backwards at first, but more than half of real opportunities come from people, not job boards.',
          'A simple weekly structure might look like this: on Monday, identify target roles and companies and send a few outreach messages. On Tuesday and Wednesday, tailor and submit a small number of high-quality applications. On Thursday and Friday, follow up, reconnect with people, and review what is working.',
          'This approach does three important things. First, it keeps you from burning out by chasing every listing. Second, it makes your applications much stronger because they are targeted. Third, it turns your job search into a system with rhythm, rather than a random burst of activity whenever you see a posting.',
          'When you follow the 80/20 method, your job search stops feeling like shouting into the void and starts feeling like a series of intentional moves toward the roles you actually want.',
        ],
      },
      {
        title: 'The Hidden Job Market (How to Use It Effectively)',
        paragraphs: [
          'The hidden job market is not a secret club. It simply refers to roles that are being discussed, planned, or quietly recruited for before they ever hit a public job board. Managers often lean on referrals, internal candidates, or informal networks long before they post something publicly.',
          'This matters because if you only apply to posted listings, you are competing with everyone who can click the Apply button. When you tap into the hidden job market, you are often one of a small handful of people who even know the opportunity exists.',
          'Practical ways to reach the hidden job market include connecting with managers and team leads, commenting thoughtfully on their posts, and sending short, low-pressure messages that ask for insight instead of favors. You are not asking, “Are you hiring right now?” You are saying, “I am exploring opportunities in this space and would value your perspective.”',
          'Over time, this kind of presence builds familiarity. When those leaders do have an opening, they are far more likely to think of the people who have already been showing up in their world in a respectful way.',
          'The goal is simple: become the person they already know a little, instead of another stranger in a long list of online applications.',
        ],
      },
      {
        title: 'Job Search Setup Checklist (Day 1 Setup)',
        paragraphs: [
          'Before you send a single application, it helps to set up a basic foundation so that your search is organized from day one. A little structure up front saves you a lot of stress later.',
          'First, create a clean, professional email address that you will use only for career-related communication. Second, prepare two versions of your resume: a master version that holds your full history and a role-specific version that you can quickly tailor for each application.',
          'Third, make sure your online profiles, including ForgeTomorrow and any other platforms you choose to use, tell a consistent story. Your headline, summary, and recent experience should make it clear what kind of roles you are targeting now, not just what you did in the past.',
          'Fourth, set up a simple tracker for your search. This can be a spreadsheet where you log each application, the date, the contact person, follow-up dates, and the current status. It does not need to be fancy, it just needs to be consistent.',
          'Finally, identify a short list of target companies that feel like a good fit for your skills and values. This gives you a place to aim your networking and research, instead of only reacting to whatever appears on job boards each day.',
          'With these pieces in place, you will have a clear starting point. You will know what you have done, what is pending, and where to focus next, instead of feeling like everything is scattered.',
        ],
      },
    ],
  },

  // ───────── 2. Resumes & Cover Letters ─────────
  'Resumes & Cover Letters': {
    description:
      'Turn your experience into a resume and cover letters that actually get interviews. Learn how recruiters scan resumes in six seconds, how to write Issue–Action–Outcome bullets, and how to tailor your documents without rewriting them from scratch every time.',
    items: [
      'High-conversion resume layout that works for both ATS and human review.',
      'Professional summary templates you can adapt by role and level.',
      'ATS reality: what it really does, common myths, and how to avoid formatting traps.',
      'Modern cover letter structure with short, specific examples instead of filler.',
    ],
    articles: [
      {
        title: 'How to Build a High-Conversion Resume',
        paragraphs: [
          'A high-conversion resume is simple: it gets interviews. Not compliments on the design, not “nice layout,” but consistent invitations to talk.',
          'Recruiters and hiring managers typically scan resumes in a few seconds. In that short time they are looking for job titles, company names, dates, key skills, and concrete achievements that match the role they are trying to fill.',
          'Your resume should be easy to skim. Use clear sections, consistent formatting, and simple headings. Avoid heavy graphics, complex tables, and multi-column layouts that can break in applicant tracking systems.',
          'Focus your bullets on outcomes instead of duties. A strong pattern is Issue–Action–Outcome: what problem you faced, what you did, and what changed. For example, “Reduced average response time by 27% by reorganizing the support queue and updating escalation rules.”',
          'Finally, tailor your resume for each application by reflecting back the language and priorities of the job description where they are honestly true. This is not about padding your resume; it is about making your real experience easier to recognize.',
        ],
      },
      {
        title: 'Professional Summary Templates (Adapting Your Headline)',
        paragraphs: [
          'Your professional summary is the headline of your resume. It is not a full story of your career; it is a short snapshot of who you are, what you do well, and where you intend to go next.',
          'A useful structure for a summary is: your role and experience level, one or two key strengths, and the kind of impact you want to make. For example, “Operations leader with 8+ years experience improving workflows, supporting frontline teams, and driving measurable gains in service quality.”',
          'You can adapt this core pattern for different paths: technical support, customer experience, logistics, healthcare support, and more. The key is to be specific enough that someone reading your summary can immediately imagine where you fit.',
          'Keep your summary to three to five short lines. Avoid buzzwords and filler like “results-oriented team player.” Focus on strengths and contributions that can be backed up by the bullets in your experience section.',
          'When you change roles or industries, update your summary first so that the role you are targeting now is clear from the very top of the page.',
        ],
      },
      {
        title: 'ATS Reality: What It Actually Does',
        paragraphs: [
          'Applicant tracking systems, or ATS, are widely misunderstood. They are primarily databases that help recruiters store, search, and filter applications. They do not “hate” resumes, and they do not automatically reject people just because a keyword is missing once.',
          'Most ATS software parses your resume into text, tries to identify sections like experience and education, and allows recruiters to search by skills, titles, and other fields. If your formatting is simple and your content is relevant, the system becomes a tool that helps highlight you, not block you.',
          'Common pitfalls include putting crucial information inside images, complicated tables, and headers or footers that the parser ignores. Overly decorative layouts can also cause parsing errors, making it harder for recruiters to see your details in their system.',
          'A clean, single-column layout with clear headings, standard fonts, and straightforward bullet points will perform better than almost any complex design. If a human can easily read it and it uses language that matches the role, the ATS can usually handle it too.',
        ],
      },
      {
        title: 'Cover Letters That Actually Get Read',
        paragraphs: [
          'Many cover letters fail because they are generic, long, or simply repeat the resume. A strong modern cover letter is short, specific, and clearly written for one company.',
          'A simple three-paragraph structure works well. In the first paragraph, explain why you are interested in this company or role, showing that you understand something about their work or values. In the second paragraph, link two or three concrete examples from your background to what they need. In the third, express your interest in talking further and thank them for their time.',
          'Avoid copying entire bullet points from your resume. The cover letter is your chance to connect the dots: how your experience, mindset, and values line up with the role and the organization.',
          'You do not need fancy language. A clear, respectful, human voice stands out more than corporate buzzwords. The goal is to make the person reading think, “This is someone who understands what we do and could genuinely help here.”',
        ],
      },
    ],
  },

  // ───────── 3. Interviews & Preparation ─────────
  'Interviews & Preparation': {
    description:
      'Show up to interviews prepared, calm, and clear. Learn how to prep in 30 minutes, build a story bank using the STAR method, ask smart questions, and answer Tell me about yourself without rambling.',
    items: [
      '30-minute interview prep checklist that covers research, stories, and questions.',
      'Behavioral interviewing and how to answer using the STAR method.',
      'Common interview questions mapped to your own stories.',
      'Structures and examples for Tell me about yourself.',
    ],
    articles: [
      {
        title: 'How to Prepare for an Interview in 30 Minutes',
        paragraphs: [
          'You do not need days of preparation to show up well to an interview. With a focused plan, thirty minutes can be enough to feel clear and confident.',
          'Spend the first few minutes reviewing the job description and highlighting the key responsibilities, required skills, and any tools or systems they mention. These are the core things they care about.',
          'Next, quickly scan the company website and recent updates. Learn what they do, who they serve, and anything new they are working on. You do not need to memorize everything, just enough to show genuine interest.',
          'Then, choose three or four stories from your own experience that show problem solving, dealing with people, handling pressure, and learning quickly. These stories will cover most behavioral questions they ask.',
          'Finally, write down a few questions you want to ask them about the role, the team, and what success looks like after the first few months. Walking in with your own questions helps you feel like a participant, not just someone being evaluated.',
        ],
      },
      {
        title: 'Mastering Behavioral Interviewing',
        paragraphs: [
          'Behavioral interviews are built around questions that start with phrases like “Tell me about a time when…” or “Give me an example of…”. The goal is to understand how you have behaved in real situations, not how you think you might act in theory.',
          'The STAR method is a simple structure for answering these questions: Situation, Task, Action, Result. You briefly describe the situation, explain what needed to be done, describe what you did, and then share what happened as a result.',
          'When you prepare a story, focus on your specific actions. Instead of “we handled it,” make it clear what you personally did. For example, “I called the customer, listened to their concerns, and then coordinated with the shipping team to fix the mistake.”',
          'You do not need a story for every possible question. A handful of good examples can be adapted to show teamwork, problem solving, conflict resolution, and learning from mistakes.',
        ],
      },
      {
        title: 'How to Ask Smart Questions in an Interview',
        paragraphs: [
          'The questions you ask in an interview say as much about you as the answers you give. Thoughtful questions show curiosity, maturity, and an interest in contributing instead of just getting hired.',
          'Good questions focus on the work, the team, and expectations. Examples include: “What does success look like in this role after the first 90 days?” or “What are some of the biggest challenges the team is working on right now?”.',
          'Questions about growth and feedback are also helpful, such as “How is performance typically measured?” or “How do people usually grow in this role over time?”.',
          'Try to avoid questions that could have been answered with a quick look at the website, or that focus only on perks and time off before you even have an offer.',
        ],
      },
      {
        title: 'Answering Tell Me About Yourself',
        paragraphs: [
          'Tell me about yourself is one of the most common opening questions in interviews. It is also one of the easiest to overcomplicate.',
          'A clear answer is usually about a minute long and covers who you are professionally, a few key strengths or experiences, and what you are looking for next.',
          'One simple pattern is: start with your current or most recent role, mention one or two strengths or focus areas, highlight a couple of achievements or themes from your background, and finish with what excites you about this role or direction.',
          'You do not need to start with childhood or personal history. Keep it focused on your professional path and how it connects to the opportunity in front of you.',
        ],
      },
    ],
  },

  // ───────── 4. Negotiation & Compensation ─────────
  'Negotiation & Compensation': {
    description:
      'Once offers start arriving, this section helps you understand your market value, anchor your salary range, and negotiate without burning bridges. It focuses on clear, respectful scripts instead of pressure tactics.',
    items: [
      'How to research realistic salary ranges for your role and location.',
      'Anchoring your desired salary so the conversation starts near your target.',
      'Counteroffer and benefits negotiation scripts you can adapt to your tone.',
      'How to respond when a company says the budget is fixed.',
    ],
    articles: [
      {
        title: 'How to Negotiate Confidently',
        paragraphs: [
          'Negotiation can feel intimidating, but in most professional settings it is expected. Employers assume that serious candidates will at least ask whether there is room to adjust an offer.',
          'Confidence in negotiation starts with information. If you have a sense of typical pay ranges for your role and location, you can treat the conversation as a discussion about aligning expectations, not as a personal judgment of your worth.',
          'When you receive an offer, thank them and ask for time to review the details. Coming back with a calm, specific request such as “I was hoping for something closer to X based on my experience and the scope of this role” keeps the tone professional.',
          'Remember that you are not demanding; you are exploring whether there is flexibility. Even when the answer is no, you have practiced advocating for yourself and gathered useful information for future negotiations.',
        ],
      },
      {
        title: 'How to Research Your Market Value',
        paragraphs: [
          'Before you negotiate, it helps to build a realistic picture of what similar roles pay. You can look at salary tools, job postings that include ranges, and conversations in professional communities.',
          'As you gather data, you can define a low, middle, and high point for your range. The low point is the minimum you would realistically accept, the middle is your target, and the high is the number you would be happy to receive if everything lines up.',
          'When you discuss compensation, you typically lead with the higher end of your realistic range, knowing that there may be movement down toward the middle. This is called anchoring, and it keeps the negotiation near a number that works for you.',
          'Market value is a guide, not a guarantee. Your experience, the specific company, and the responsibilities of the role will all influence the final number, but good research gives you a solid starting point.',
        ],
      },
      {
        title: 'Negotiation Scripts You Can Adapt',
        paragraphs: [
          'Having a few phrases ready can make negotiation feel less stressful. You do not have to memorize scripts word for word, but you can use them as starting points.',
          'For example, you might say, “Thank you for the offer. I am excited about the role. Based on my experience and the responsibilities we discussed, I was hoping for something closer to X. Is there any flexibility on the base salary?”.',
          'If the salary is fixed, you can ask about other areas: “If the base is firm, is there room to adjust benefits, remote flexibility, or a signing bonus to help close the gap?”.',
          'When you decide to accept, you can still show that you approached the conversation thoughtfully: “I appreciate you working with me on this. I am happy to accept and look forward to getting started.” This reinforces professionalism and respect on both sides.',
        ],
      },
    ],
  },

  // ───────── 5. Networking & Personal Branding ─────────
  'Networking & Personal Branding': {
    description:
      'Networking does not have to feel awkward or fake. This section shows you how to build real connections, one small interaction at a time, and keep a simple, consistent professional presence in about ten minutes a day.',
    items: [
      'Low-pressure ways to start conversations without asking for a job.',
      'A daily 10-minute routine to slowly build your professional brand.',
      'Script ideas for introductions, follow-ups, and ask for insight messages.',
      'How to stay visible over time without spamming people.',
    ],
    articles: [
      {
        title: 'How to Network Without Feeling Awkward',
        paragraphs: [
          'Networking often feels strange because many people think it means asking strangers for favors. In reality, healthy networking is simply staying in touch with people in your field, sharing value, and being visible in a respectful way.',
          'You can start small by reacting to posts, leaving short, genuine comments, or sending a quick note to say that you appreciated someone’s insight. These light touches build familiarity without any pressure.',
          'When you do reach out directly, focus on asking for insight instead of opportunity. A message such as “I am exploring roles in your field and would appreciate any advice you are comfortable sharing” is far easier for someone to respond to than a direct request for a job.',
          'Over time, this pattern of low-pressure contact creates real professional relationships. If an opportunity does come up, you are no longer a stranger; you are someone they have already seen contributing and engaging.',
        ],
      },
      {
        title: 'Building a Professional Brand in 10 Minutes a Day',
        paragraphs: [
          'Your professional brand is not about becoming an influencer. It is about making it easier for the right people to see who you are, what you care about, and how you work.',
          'You can build this in just a few minutes each day. Share small reflections on what you are learning, comment on discussions in your field, and keep your profile updated with your current direction and strengths.',
          'Short posts about a lesson from your workday, a tool you found helpful, or a problem you solved can all show your mindset without feeling like self-promotion.',
          'Consistency matters more than intensity. A little bit of visible activity each week does more for your brand than a single long post once every few months.',
        ],
      },
      {
        title: 'Using Simple Scripts to Make Outreach Easier',
        paragraphs: [
          'It can be helpful to have a few basic message patterns to lean on when you are unsure what to say. For example, an introduction might sound like, “Hi, I came across your work in this area and really appreciated how you explained it. I am exploring similar paths and wanted to connect.”',
          'A follow-up after a conversation could be, “Thank you again for taking the time to share your experience. Your advice gave me a clearer sense of my next steps.”',
          'When you see a role at someone’s company and you have already connected, you might say, “I noticed an opening for this role on your team. I am interested and would appreciate any insight you can share about what the team is looking for.”',
          'You can adjust the tone and detail to sound like yourself, but having these patterns makes it easier to reach out without overthinking every word.',
        ],
      },
    ],
  },

  // ───────── 6. Career Development & Skill Growth ─────────
  'Career Development & Skill Growth': {
    description:
      'If you are unsure about your long-term direction, this section helps you map your strengths, pick a realistic target path, and build a six-month plan focused on small, compounding wins.',
    items: [
      'How to identify patterns in your work history and transferable skills.',
      'Choosing a one-step pivot instead of trying to jump across the map.',
      'Building a six-month development plan you can actually stick to.',
      'Using small experiments to test new career directions before fully switching.',
    ],
    articles: [
      {
        title: 'How to Pick Your Career Direction When You Are Unsure',
        paragraphs: [
          'Feeling uncertain about your next career move is common. Most people shift paths several times over their working lives, often in response to new interests, opportunities, or circumstances.',
          'A helpful starting point is to look for patterns in your past roles. What tasks have you enjoyed most? Where have you consistently performed well? What do people often ask you for help with?',
          'These patterns reveal your strengths and preferences, which are more important than specific job titles. Once you understand them, you can look for roles that use the same core skills, even in different industries.',
          'Instead of aiming for a complete career overhaul in one jump, consider a one-step pivot into a role that is close to what you do now but moves you in the direction you want to go.',
        ],
      },
      {
        title: 'Building a Six-Month Development Plan',
        paragraphs: [
          'A six-month development plan gives you enough time to make real progress without feeling overwhelming. It can be simple and still powerful.',
          'Start by choosing two or three focus areas, such as communication, a specific technical skill, or a tool that is common in the roles you want. Then outline what small steps you can take each week to build those skills.',
          'For example, you might complete a short course, practice by creating a small project, or volunteer to use the skill in your current job or community.',
          'Review your plan at the end of each month. Celebrate what you completed, adjust what did not fit, and decide what to emphasize next. The goal is steady movement, not perfection.',
        ],
      },
      {
        title: 'Understanding and Using Transferable Skills',
        paragraphs: [
          'Transferable skills are abilities that apply across different roles and industries. Communication, problem solving, time management, and working well with others are just a few examples.',
          'When you consider a new direction, look at how your existing skills might fit the work. If you have handled difficult customers, you likely have strengths in communication, patience, and conflict resolution that could transfer into client success or operations roles.',
          'On your resume and in interviews, make the connection explicit. Describe not only what you did, but how those actions and outcomes would matter in the new role you are targeting.',
          'Once you see how much you already bring to the table, changing direction feels less like starting over and more like shifting where you apply what you know.',
        ],
      },
    ],
  },

  // ───────── 7. Special Situations & Tough Scenarios ─────────
  'Special Situations & Tough Scenarios': {
    description:
      'Life happens. This section helps you talk about job gaps, layoffs, health breaks, and career pivots honestly and professionally—without oversharing or apologizing for existing.',
    items: [
      'Simple, confident ways to explain employment gaps and breaks.',
      'How to frame layoffs, restructures, or tough seasons without sounding defensive.',
      'Guidance on pivoting into a new field while highlighting your strengths.',
      'Mindset tools for handling rejection and staying focused during long searches.',
    ],
    articles: [
      {
        title: 'Talking About Job Gaps and Employment Challenges',
        paragraphs: [
          'Many people have employment gaps for reasons such as layoffs, caregiving, health issues, or relocation. A gap is not a moral failing; it is a part of life.',
          'When you explain a gap, keep it short, honest, and future-focused. For example, “I took time away from full-time work for family responsibilities, and now I am ready to return and fully focus on my career again.”',
          'You do not need to share private medical or personal details. Employers mainly want to know whether you are able and ready to work now.',
          'If you took steps to grow during that time, such as learning new skills or doing part-time work, you can briefly mention that as well.',
        ],
      },
      {
        title: 'Navigating Career Pivots and Industry Changes',
        paragraphs: [
          'Changing industries or roles is common, especially as the job market and technology continue to evolve. A pivot is easier when you can clearly explain what parts of your background you are bringing with you.',
          'You might say, “I am transitioning from frontline service work into operations coordination. My experience handling complex customer situations, managing time pressure, and keeping things organized translates well to supporting internal workflows.”',
          'The key is to show that you are not abandoning your past experience; you are reusing it in a new context. This helps hiring managers see the value you would add, even if your last job title does not match the one you are applying for.',
        ],
      },
      {
        title: 'Handling Rejection and Staying Steady',
        paragraphs: [
          'Rejection is a normal part of any job search. Even strong candidates hear “no” or never hear back. This can be discouraging, but it does not mean you are unqualified or that you will never find a role.',
          'It can help to separate outcomes you cannot control from actions you can. You cannot force a company to choose you, but you can improve your resume, practice interviews, and reach out to new connections.',
          'Keeping a simple record of your weekly wins—applications sent, conversations started, skills practiced—can remind you that you are moving forward, even when the results are not immediate.',
          'Over time, consistent effort in the right direction tends to compound. The goal is to stay in motion, not to feel perfect every day.',
        ],
      },
    ],
  },

  // ───────── 8. ForgeTomorrow Platform Tutorials ─────────
  'ForgeTomorrow Platform Tutorials': {
    description:
      'Learn how to make the most of the ForgeTomorrow tools themselves so the platform works like a co-pilot in your search, not just a place to upload a resume.',
    items: [
      'How to build and export resumes using the ForgeTomorrow resume builder.',
      'Using ATS or match insights to refine your applications instead of guessing.',
      'SmartNetworking: finding and reaching out to the right people on the platform.',
      'How to use negotiation support tools to prepare before responding to an offer.',
    ],
    articles: [
      {
        title: 'Using the ForgeTomorrow Resume Builder',
        paragraphs: [
          'The ForgeTomorrow resume builder is designed to help you create a clear, professional resume without needing to wrestle with formatting.',
          'You start by entering your contact information, then add your summary, work experience, skills, education, and any extra sections such as certifications or projects.',
          'As you fill in your experience, focus on achievements and outcomes rather than listing every task you have ever done. The builder helps keep your layout consistent while you work on the words.',
          'When you are ready, you can export your resume in formats that work for both online applications and human readers.',
        ],
      },
      {
        title: 'SmartNetworking on ForgeTomorrow',
        paragraphs: [
          'SmartNetworking features on ForgeTomorrow help you find and connect with people who are relevant to your goals, such as peers in your field, potential mentors, or hiring managers.',
          'You can search and filter by role, industry, location, and interests, then send short, thoughtful connection messages instead of generic requests.',
          'Over time, use these tools to build a small, solid network of people you interact with regularly, not just a large list of silent connections.',
        ],
      },
      {
        title: 'Negotiation Support Tools',
        paragraphs: [
          'When you receive an offer, the negotiation support tools on ForgeTomorrow can help you think through your response.',
          'By entering details about the role, the offer, and your background, you can get guidance on typical market ranges and example phrases you might use when asking about flexibility.',
          'These tools are not a script you must follow; they are a starting point to help you feel more prepared when you talk with a recruiter or hiring manager about compensation.',
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────
// Viewer component
// ─────────────────────────────────────────────
function SectionViewer({ selectedSection }) {
  const cardStyle = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    minHeight: 200,
  };

  if (!selectedSection) {
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, color: '#263238', marginBottom: 8 }}>
          Pick a learning section
        </div>
        <p style={{ color: '#455A64', marginTop: 6 }}>
          Select a section on the left to see what is inside. Each area includes
          focused guides, checklists, and scripts designed to move your job
          search forward without overwhelm.
        </p>
      </div>
    );
  }

  const details = SECTION_DETAILS[selectedSection];

  if (!details) {
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, color: '#263238', marginBottom: 8 }}>
          {selectedSection}
        </div>
        <p style={{ color: '#455A64', marginTop: 6 }}>
          Content for this section is coming soon.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 800, color: '#263238', marginBottom: 8 }}>
        {selectedSection}
      </div>

      {details.description && (
        <p style={{ color: '#455A64', marginTop: 6 }}>{details.description}</p>
      )}

      {details.items && details.items.length > 0 && (
        <ul style={{ marginTop: 10, paddingLeft: 18, color: '#455A64' }}>
          {details.items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {item}
            </li>
          ))}
        </ul>
      )}

      {details.articles && details.articles.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {details.articles.map((article, idx) => (
            <div key={idx} style={{ marginTop: idx === 0 ? 0 : 18 }}>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 6,
                  color: '#263238',
                }}
              >
                {article.title}
              </div>
              {article.paragraphs &&
                article.paragraphs.map((para, pIdx) => (
                  <p key={pIdx} style={{ color: '#455A64', marginTop: 4 }}>
                    {para}
                  </p>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
export default function SeekerHearthResources() {
  const [selectedSection, setSelectedSection] = useState(null);

  const Item = ({ title, blurb }) => (
    <button
      type="button"
      onClick={() => setSelectedSection(title)}
      style={{
        textAlign: 'left',
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontWeight: 800, color: '#263238' }}>{title}</div>
      <p style={{ color: '#455A64', marginTop: 6 }}>{blurb}</p>
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 700,
          color: '#FF7043',
        }}
      >
        View details →
      </div>
    </button>
  );

  return (
    <SeekerLayout
      title="Resources | ForgeTomorrow"
      header={Header}
      right={<RightRail />}
      activeNav="the-hearth"
    >
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.6fr)',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        {/* Left: section list */}
        <div style={{ display: 'grid', gap: 12 }}>
          <Item
            title="Job Search Foundations"
            blurb="Start here if you’re restarting your search or feel stuck. Learn how to structure your week, tap into the hidden job market, and avoid burnout while moving forward."
          />
          <Item
            title="Resumes & Cover Letters"
            blurb="Turn your experience into a high-conversion resume and modern cover letters. Learn the 6-second scan rule, Issue–Action–Outcome bullets, ATS reality, and reusable templates."
          />
          <Item
            title="Interviews & Preparation"
            blurb="Get ready fast and show up confident. Use 30-minute prep checklists, STAR story banks, strong questions to ask, and a simple structure for Tell me about yourself."
          />
          <Item
            title="Negotiation & Compensation"
            blurb="Research your market value, anchor your range, and negotiate with confidence. Includes counteroffer scripts, benefits negotiation phrasing, and how to respond to fixed-budget offers."
          />
          <Item
            title="Networking & Personal Branding"
            blurb="Network without feeling awkward and build a simple, consistent professional brand in 10 minutes a day. Includes ready-made outreach and follow-up message scripts."
          />
          <Item
            title="Career Development & Skill Growth"
            blurb="Choose your next direction, map transferable skills, and build a six-month growth plan. Focus on small, compounding wins instead of trying to reinvent yourself overnight."
          />
          <Item
            title="Special Situations & Tough Scenarios"
            blurb="Handle job gaps, layoffs, and career pivots with confidence. Learn how to talk about your story honestly while staying future-focused and resilient through rejection."
          />
          <Item
            title="ForgeTomorrow Platform Tutorials"
            blurb="Learn how to use the ForgeTomorrow tools themselves: the resume builder, SmartNetworking, and negotiation support—so the platform works like a co-pilot in your job search."
          />
        </div>

        {/* Right: viewer pane */}
        <SectionViewer selectedSection={selectedSection} />
      </section>
    </SeekerLayout>
  );
}
