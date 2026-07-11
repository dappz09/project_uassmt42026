// Script untuk cek user di database
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('\n=== CHECK DATABASE ===\n');
  
  try {
    // Cek semua users
    const users = await prisma.user.findMany({
      include: {
        role: true,
      }
    });
    
    console.log(`👥 Total users: ${users.length}\n`);
    
    users.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Has Password: ${!!user.password}`);
      console.log(`   Role: ${user.role?.name || 'No role'}`);
      console.log(`   Role ID: ${user.roleId || 'NULL'}`);
      console.log(`   Created: ${user.createdAt}\n`);
    });
    
    // Cek roles
    const roles = await prisma.role.findMany();
    console.log(`🎭 Total roles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
    });
    
    console.log('\n=== END CHECK ===\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();