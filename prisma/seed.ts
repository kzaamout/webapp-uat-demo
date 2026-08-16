import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Demo1234!";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // --- Team Acme Corp: the main demo team, all three roles present ---
  const acme = await prisma.team.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Corp", slug: "acme" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: {},
    create: { email: "admin@demo.local", passwordHash, name: "Ada (Admin)" },
  });
  const editor = await prisma.user.upsert({
    where: { email: "editor@demo.local" },
    update: {},
    create: { email: "editor@demo.local", passwordHash, name: "Eli (Editor)" },
  });
  const guest = await prisma.user.upsert({
    where: { email: "guest@demo.local" },
    update: {},
    create: { email: "guest@demo.local", passwordHash, name: "Gus (Guest)" },
  });

  for (const [user, role] of [
    [admin, "ADMIN"],
    [editor, "EDITOR"],
    [guest, "GUEST"],
  ] as const) {
    await prisma.membership.upsert({
      where: { userId_teamId: { userId: user.id, teamId: acme.id } },
      update: { role },
      create: { userId: user.id, teamId: acme.id, role },
    });
  }

  // --- Team Globex: exists purely for cross-tenant isolation testing ---
  const globex = await prisma.team.upsert({
    where: { slug: "globex" },
    update: {},
    create: { name: "Globex", slug: "globex" },
  });
  const globexAdmin = await prisma.user.upsert({
    where: { email: "globex-admin@demo.local" },
    update: {},
    create: { email: "globex-admin@demo.local", passwordHash, name: "Gil (Globex Admin)" },
  });
  await prisma.membership.upsert({
    where: { userId_teamId: { userId: globexAdmin.id, teamId: globex.id } },
    update: { role: "ADMIN" },
    create: { userId: globexAdmin.id, teamId: globex.id, role: "ADMIN" },
  });

  // --- Documents: spread across visibility/tags/authors so search, filtering,
  // pagination, and a genuine empty state all have real data to hit ---
  const existing = await prisma.document.count({ where: { teamId: acme.id } });
  if (existing === 0) {
    const docs = [
      { title: "Q1 Roadmap Overview", tags: ["planning", "roadmap"], visibility: "TEAM" as const, author: admin },
      { title: "Onboarding Checklist", tags: ["hr", "onboarding"], visibility: "TEAM" as const, author: admin },
      { title: "API Style Guide", tags: ["engineering"], visibility: "TEAM" as const, author: editor },
      { title: "Incident Postmortem: Outage", tags: ["engineering", "incident"], visibility: "PRIVATE" as const, author: editor },
      { title: "Brand Guidelines", tags: ["design", "brand"], visibility: "PUBLIC" as const, author: admin },
      { title: "Sales Deck Q2", tags: ["sales"], visibility: "TEAM" as const, author: editor },
      { title: "Customer Interview Notes", tags: ["research"], visibility: "PRIVATE" as const, author: editor },
      { title: "Release Notes v1.4", tags: ["engineering", "release"], visibility: "PUBLIC" as const, author: admin },
      { title: "Hiring Plan 2026", tags: ["hr", "planning"], visibility: "PRIVATE" as const, author: admin },
      { title: "Design System Tokens", tags: ["design", "engineering"], visibility: "TEAM" as const, author: editor },
      { title: "All-Hands Notes August", tags: ["planning"], visibility: "TEAM" as const, author: admin },
      { title: "Vendor Contract Summary", tags: ["legal"], visibility: "PRIVATE" as const, author: admin },
    ];

    for (const d of docs) {
      await prisma.document.create({
        data: {
          teamId: acme.id,
          authorId: d.author.id,
          title: d.title,
          body: `This is seed content for "${d.title}". Replace with real content during a UAT scenario as needed.`,
          tags: d.tags,
          visibility: d.visibility,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Acme Corp accounts (all password Demo1234!):");
  console.log("  admin@demo.local  (ADMIN)");
  console.log("  editor@demo.local (EDITOR)");
  console.log("  guest@demo.local  (GUEST)");
  console.log("Globex (cross-tenant isolation control):");
  console.log("  globex-admin@demo.local (ADMIN)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
