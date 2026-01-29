const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  const password = 'admin123';
  const hash = bcrypt.hashSync(password, 10);
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'admin@tradingweb.com' },
      update: { password: hash },
      create: {
        email: 'admin@tradingweb.com',
        password: hash,
        name: 'Admin User',
        role: 'admin'
      }
    });
    console.log('✓ Admin user created/updated:', user.email);
    console.log('  Password: admin123');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
