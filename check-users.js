// ============================================================================
// Check Users in Database - Node.js Script
// Run with: node check-users.js
// ============================================================================

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking users in database...\n');

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // Count total users
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    console.log(`📊 Total users found: ${userCount[0].count}\n`);

    // Get all users
    const users = await prisma.$queryRaw`
      SELECT 
        id,
        email,
        firstName,
        lastName,
        phone,
        isActive,
        marinaId,
        marinaGroupId,
        createdAt,
        updatedAt
      FROM users
      ORDER BY createdAt DESC
    `;

    console.log('👥 All users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Marina ID: ${user.marinaId || 'None'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Get user roles
    const userRoles = await prisma.$queryRaw`
      SELECT 
        u.email,
        u.firstName + ' ' + u.lastName as fullName,
        ur.role,
        ur.marinaId
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      ORDER BY u.email, ur.role
    `;

    console.log('🔐 User roles:');
    userRoles.forEach(role => {
      console.log(`   ${role.fullName} (${role.email}) - ${role.role}`);
    });

    // Check for demo user specifically
    const demoUser = await prisma.$queryRaw`
      SELECT 
        id,
        email,
        firstName,
        lastName,
        isActive,
        marinaId
      FROM users 
      WHERE email = 'demo@marina.com'
    `;

    console.log('\n🔍 Demo user check:');
    if (demoUser.length > 0) {
      const user = demoUser[0];
      console.log(`   ✅ Found: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Marina ID: ${user.marinaId || 'None'}`);
    } else {
      console.log('   ❌ Demo user not found');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ User check completed!');
  }
}

checkUsers();

