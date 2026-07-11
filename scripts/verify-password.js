require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyPassword() {
  console.log('\n=== VERIFY PASSWORD ===\n');
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@notetube.ai' },
    });
    
    if (!user) {
      console.log('❌ User tidak ditemukan');
      return;
    }
    
    console.log('📧 Email:', user.email);
    console.log('🔒 Password hash di DB:', user.password);
    console.log('   Length:', user.password?.length);
    console.log('   Starts with $2:', user.password?.startsWith('$2'));
    
    const inputPassword = 'Admin@123';
    console.log('\n🔐 Input password:', inputPassword);
    
    const isMatch = await bcrypt.compare(inputPassword, user.password);
    console.log('✅ bcrypt.compare result:', isMatch);
    
    if (!isMatch) {
      console.log('\n⚠️ Password tidak cocok!');
      console.log('   Mungkin password di DB belum di-hash dengan bcrypt?');
      console.log('   Atau password yang dimasukkan salah?');
      
      // Cek apakah password plain text
      if (user.password === inputPassword) {
        console.log('   ❗ Password di DB adalah PLAIN TEXT, bukan hash!');
      }
    }
    
    console.log('\n=== END VERIFY ===\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPassword();