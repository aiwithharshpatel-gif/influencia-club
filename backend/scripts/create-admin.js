import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';
import { normalizeEmail } from '../src/utils/security.js';

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : '';
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password) {
  console.error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this command.');
  process.exit(1);
}

if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error('ADMIN_PASSWORD must be at least 12 characters with a letter and number.');
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      passwordVersion: { increment: 1 },
      role: 'super_admin'
    },
    create: {
      name,
      email,
      passwordHash,
      role: 'super_admin'
    },
    select: { id: true, name: true, email: true, role: true }
  });

  console.log(`Admin ready: ${admin.email} (${admin.role})`);
} finally {
  await prisma.$disconnect();
}
