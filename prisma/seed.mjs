// Seed script (plain ESM — run with `node prisma/seed.mjs`, no tsx needed).
// Populates demo municipalities, DRRM budgets, a pre-created municipal official
// (officials are admin-created per the docs, not self-signup), and a couple of
// sample community reports. Idempotent: clears the demo tables first.

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

/** Same format as src/lib/auth/crypto.ts hashPassword: "scrypt$salt$hash". */
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Demo password for the seeded official accounts. */
const DEMO_OFFICIAL_PASSWORD = "klimaguard2026";

const BUDGETS = [
  {
    province: "Laguna",
    municipality: "Calamba",
    fiscalYear: 2024,
    totalAllocated: 58_000_000,
    totalSpent: 34_800_000,
    source: "Batay sa datos ng COA/DBM/DILG",
    lines: [
      { category: "prevention", label: "Pag-iwas", allocated: 18_000_000, spent: 11_000_000 },
      { category: "preparedness", label: "Paghahanda", allocated: 16_000_000, spent: 12_500_000 },
      { category: "response", label: "Pagtugon", allocated: 16_000_000, spent: 8_000_000 },
      { category: "recovery", label: "Pagbangon", allocated: 8_000_000, spent: 3_300_000 },
    ],
  },
  {
    province: "Laguna",
    municipality: "Santa Cruz",
    fiscalYear: 2024,
    totalAllocated: 41_200_000,
    totalSpent: 25_544_000,
    source: "Batay sa datos ng COA/DBM/DILG",
    lines: [
      { category: "prevention", label: "Pag-iwas", allocated: 13_000_000, spent: 8_200_000 },
      { category: "preparedness", label: "Paghahanda", allocated: 12_000_000, spent: 8_600_000 },
      { category: "response", label: "Pagtugon", allocated: 11_000_000, spent: 6_000_000 },
      { category: "recovery", label: "Pagbangon", allocated: 5_200_000, spent: 2_744_000 },
    ],
  },
];

async function main() {
  // Reset demo tables (order matters for FKs).
  await prisma.communityReport.deleteMany();
  await prisma.budgetLine.deleteMany();
  await prisma.municipalBudget.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Budgets + lines.
  for (const b of BUDGETS) {
    await prisma.municipalBudget.create({
      data: {
        province: b.province,
        municipality: b.municipality,
        fiscalYear: b.fiscalYear,
        totalAllocated: b.totalAllocated,
        totalSpent: b.totalSpent,
        source: b.source,
        lines: { create: b.lines },
      },
    });
  }

  // Pre-created Municipal Official (admin-created; username + password).
  const official = await prisma.user.create({
    data: {
      role: "lgu",
      onboarded: true,
      username: "mdrrmo.calamba",
      passwordHash: hashPassword(DEMO_OFFICIAL_PASSWORD),
      name: "Engr. Maria Santos",
      email: "mdrrmo@calamba.gov.ph",
      position: "MDRRMO Head",
      department: "MDRRMO",
      region: "Region IV-A (CALABARZON)",
      province: "Laguna",
      municipality: "Calamba",
    },
  });

  // Pre-created Barangay Official for Calamba / Parian.
  await prisma.user.create({
    data: {
      role: "barangay",
      onboarded: true,
      username: "brgy.parian",
      passwordHash: hashPassword(DEMO_OFFICIAL_PASSWORD),
      name: "Kap. Jose Reyes",
      email: "parian@calamba.gov.ph",
      position: "Barangay Captain",
      region: "Region IV-A (CALABARZON)",
      province: "Laguna",
      municipality: "Calamba",
      barangay: "Parian",
    },
  });

  // Pre-created Barangay Official for Santa Cruz / San Roque (matches the
  // Barangay Official dashboard design + municipal demo data).
  await prisma.user.create({
    data: {
      role: "barangay",
      onboarded: true,
      username: "brgy.sanroque",
      passwordHash: hashPassword(DEMO_OFFICIAL_PASSWORD),
      name: "Kap. Ana Dela Cruz",
      email: "sanroque@santacruz.gov.ph",
      position: "Barangay Captain",
      region: "Region IV-A (CALABARZON)",
      province: "Laguna",
      municipality: "Santa Cruz",
      barangay: "San Roque",
    },
  });
  // Sample community reports in Calamba / Parian (anonymous resident submissions).
  await prisma.communityReport.create({
    data: {
      title: "Baradong kanal sa Rizal St.",
      body: "Mabilis bumaha kapag umuulan dahil sa baradong drainage malapit sa palengke.",
      status: "open",
      region: "Region IV-A (CALABARZON)",
      province: "Laguna",
      municipality: "Calamba",
      barangay: "Parian",
    },
  });
  await prisma.communityReport.create({
    data: {
      title: "Sirang streetlight sa evacuation route",
      body: "Madilim ang daan papuntang evacuation center tuwing gabi. Delikado kung may lilikas.",
      status: "responded",
      response: "Naipasa na sa engineering office. Aayusin sa loob ng linggo.",
      responderId: official.id,
      region: "Region IV-A (CALABARZON)",
      province: "Laguna",
      municipality: "Calamba",
      barangay: "Parian",
    },
  });

  console.log("Seed complete: budgets, officials, and sample reports created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
