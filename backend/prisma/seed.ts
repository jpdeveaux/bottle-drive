import { prisma } from '../src/db.js';

async function main() {
  // Clear existing addresses to avoid duplicates on restart
  await prisma.address.deleteMany({});

  const sampleAddresses = [
    { street: '123 Main Ave', lat: 44.6488, lng: -63.5752, status: 'unvisited' },
    { street: '456 Oak St', lat: 44.6510, lng: -63.5820, status: 'unvisited' },
    { street: '789 Pine Rd', lat: 44.6450, lng: -63.5700, status: 'completed' },
  ];

  for (const addr of sampleAddresses) {
    await prisma.address.create({ data: addr });
  }

  console.log('Seed: Created 3 sample addresses.');
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })