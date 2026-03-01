// prisma/seed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ==========================================================================
  //  EXISTING — Admin user
  // ==========================================================================

  const adminEmail = "admin@forgetomorrow.com";
  const passwordHash =
    "$2b$10$rmTG94GuJNYjRfVmgD396exB1h0SntgZPXBZHQHgWNCsgWcpNVoxO";

  console.log("Seeding admin user:", adminEmail);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      name: "Platform Admin",
      role: "ADMIN",
      plan: "ENTERPRISE",
      emailVerified: true,
      newsletter: true,
      slug: null,
      slugChangeCount: 0,
      slugLastChangedAt: null,
      mfaEnabled: false,
      mfaSecret: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    },
  });

  // ==========================================================================
  //  CRM — Queues
  //  All 9 queues. Safe to re-run — upsert on unique name field.
  //  Add more queues here later without touching anything else.
  // ==========================================================================

  console.log("Seeding CRM queues...");

  const queueDefs = [
    {
      name: "CX",
      description: "Customer Experience — inbound client issues and escalations",
      color: "#E8590C",
      icon: "headset",
    },
    {
      name: "CS",
      description: "Customer Success — onboarding, renewals, and proactive outreach",
      color: "#3B82F6",
      icon: "star",
    },
    {
      name: "HR",
      description: "Human Resources — internal employee requests and incidents",
      color: "#A78BFA",
      icon: "users",
    },
    {
      name: "Dev",
      description: "Engineering — bug reports, feature requests, and technical debt",
      color: "#22C55E",
      icon: "code",
    },
    {
      name: "Security",
      description: "Security — vulnerability reports, access requests, and incidents",
      color: "#EF4444",
      icon: "shield",
    },
    {
      name: "Training",
      description: "Training — onboarding tasks, certification requests, and LMS issues",
      color: "#F59E0B",
      icon: "book-open",
    },
    {
      name: "Compliance",
      description: "Compliance — audit requests, policy exceptions, and regulatory tasks",
      color: "#14B8A6",
      icon: "check-circle",
    },
    {
      name: "Legal",
      description: "Legal — contract reviews, NDA requests, and legal holds",
      color: "#6366F1",
      icon: "briefcase",
    },
    {
      name: "Storage",
      description: "Storage — data retention, backup issues, and capacity requests",
      color: "#8B5CF6",
      icon: "database",
    },
  ];

  const queues = {};

  for (const q of queueDefs) {
    const queue = await prisma.queue.upsert({
      where: { name: q.name },
      update: {
        description: q.description,
        color: q.color,
        icon: q.icon,
      },
      create: {
        name: q.name,
        description: q.description,
        color: q.color,
        icon: q.icon,
        isActive: true,
      },
    });
    queues[q.name] = queue;
    console.log(`  ✓ Queue: ${q.name} (${queue.id})`);
  }

  // ==========================================================================
  //  CRM — SLA Policies
  //
  //  CX  — tighter SLAs, client-facing, stricter response windows
  //  CS  — slightly more relaxed, relationship-driven work
  //  All other queues — default internal SLA policy
  //
  //  Business hours: 8am–6pm CT Mon–Fri (Nashville)
  //  Timezone:       America/Chicago
  //  All times in MINUTES.
  //
  //  P1 = Critical   P2 = High   P3 = Medium   P4 = Low
  // ==========================================================================

  console.log("Seeding CRM SLA policies...");

  // CX — client-facing, tightest SLAs
  const cxSla = await prisma.slaPolicy.upsert({
    where: { queueId: queues["CX"].id },
    update: {},
    create: {
      name: "CX Queue SLA",
      queueId: queues["CX"].id,
      // Response targets
      p1ResponseMin: 30,    // 30 min  — critical client issue
      p2ResponseMin: 120,   // 2 hrs
      p3ResponseMin: 480,   // 8 hrs   (1 business day)
      p4ResponseMin: 1440,  // 24 hrs
      // Resolution targets
      p1ResolutionMin: 120,  // 2 hrs
      p2ResolutionMin: 480,  // 8 hrs
      p3ResolutionMin: 1440, // 24 hrs
      p4ResolutionMin: 2880, // 48 hrs
      // Business hours
      useBusinessHours: true,
      businessStart: 8,      // 8am CT
      businessEnd: 18,       // 6pm CT
      businessDays: [1, 2, 3, 4, 5], // Mon–Fri
      timezone: "America/Chicago",
      warningThreshold: 75,  // alert at 75% of window consumed
    },
  });
  console.log(`  ✓ SLA Policy: CX Queue SLA (${cxSla.id})`);

  // CS — relationship-driven, slightly more relaxed
  const csSla = await prisma.slaPolicy.upsert({
    where: { queueId: queues["CS"].id },
    update: {},
    create: {
      name: "CS Queue SLA",
      queueId: queues["CS"].id,
      // Response targets
      p1ResponseMin: 60,    // 1 hr
      p2ResponseMin: 240,   // 4 hrs
      p3ResponseMin: 480,   // 8 hrs
      p4ResponseMin: 1440,  // 24 hrs
      // Resolution targets
      p1ResolutionMin: 240,  // 4 hrs
      p2ResolutionMin: 480,  // 8 hrs
      p3ResolutionMin: 1440, // 24 hrs
      p4ResolutionMin: 4320, // 72 hrs
      // Business hours
      useBusinessHours: true,
      businessStart: 8,
      businessEnd: 18,
      businessDays: [1, 2, 3, 4, 5],
      timezone: "America/Chicago",
      warningThreshold: 75,
    },
  });
  console.log(`  ✓ SLA Policy: CS Queue SLA (${csSla.id})`);

  // Default internal SLA — applied to HR, Dev, Security, Training,
  // Compliance, Legal, Storage
  const internalQueues = ["HR", "Dev", "Security", "Training", "Compliance", "Legal", "Storage"];

  for (const qName of internalQueues) {
    const queue = queues[qName];
    const sla = await prisma.slaPolicy.upsert({
      where: { queueId: queue.id },
      update: {},
      create: {
        name: `${qName} Queue SLA`,
        queueId: queue.id,
        // Response targets — internal, more relaxed
        p1ResponseMin: 60,    // 1 hr
        p2ResponseMin: 240,   // 4 hrs
        p3ResponseMin: 960,   // 16 hrs (~2 business days)
        p4ResponseMin: 2880,  // 48 hrs
        // Resolution targets
        p1ResolutionMin: 480,  // 8 hrs
        p2ResolutionMin: 1440, // 24 hrs
        p3ResolutionMin: 2880, // 48 hrs
        p4ResolutionMin: 5760, // 96 hrs
        // Business hours
        useBusinessHours: true,
        businessStart: 8,
        businessEnd: 18,
        businessDays: [1, 2, 3, 4, 5],
        timezone: "America/Chicago",
        warningThreshold: 75,
      },
    });
    console.log(`  ✓ SLA Policy: ${qName} Queue SLA (${sla.id})`);
  }

  // ==========================================================================
  //  Done
  // ==========================================================================

  console.log("✅ CRM seeding complete.");
  console.log(`   ${queueDefs.length} queues seeded`);
  console.log(`   ${queueDefs.length} SLA policies seeded (CX + CS unique, rest default)`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("prisma.$disconnect() failed:", e);
    }
  });