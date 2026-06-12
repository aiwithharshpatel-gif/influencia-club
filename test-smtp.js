import nodemailer from 'nodemailer';

async function test(port, secure) {
  console.log(`Testing port ${port} (secure: ${secure})...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: port,
    secure: secure,
    auth: {
      user: 'no-reply@influenziaclub.com',
      pass: 'Influenzia@2026'
    }
  });

  try {
    await transporter.verify();
    console.log(`✅ SUCCESS on port ${port}!`);
    return true;
  } catch (error) {
    console.error(`❌ FAILED on port ${port}:`, error.message);
    return false;
  }
}

async function main() {
  const r1 = await test(465, true);
  const r2 = await test(587, false);
}

main();
