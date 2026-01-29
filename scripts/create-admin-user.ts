import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  const email = 'admin@tradingweb.com';
  const password = 'admin123';
  const name = 'Admin User';

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('✅ User already exists:', email);
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'admin',
    }
  });

  console.log('✅ User created successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('👤 Name:', name);
  console.log('🔐 Role:', user.role);
}

createUser()
  .catch((e) => {
    console.error('❌ Error creating user:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
