import { prisma } from '../src/db.js';

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL;

  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: "Initial Admin",
        role: "admin",
        googleId: "initial-provision", // Placeholder until they first login
      },
    });
    console.log(`Admin user ${adminEmail} provisioned.`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());