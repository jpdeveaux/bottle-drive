import { prisma } from '../src/db.js';

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const adminName = process.env.INITIAL_ADMIN_NAME;

  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: adminName,
        role: "admin",
        googleId: null,
        isApproved: true
      },
    });
    console.log(`Admin user ${adminEmail} provisioned.`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());