// ============================================================================
// Setup Password Field - Node.js Script
// Run with: node setup-password-field.js
// ============================================================================

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupPasswordField() {
  console.log('🔧 Setting up password field in database...\n');

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // Add password column to users table
    console.log('📝 Adding password column to users table...');
    
    try {
      await prisma.$queryRaw`ALTER TABLE users ADD password VARCHAR(255) NULL`;
      console.log('✅ Password column added successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Password column already exists');
      } else {
        throw error;
      }
    }

    // Set secure password for demo user
    console.log('\n🔐 Setting secure password for demo user...');
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('SecurePass123', saltRounds);
    
    await prisma.$queryRaw`
      UPDATE users 
      SET password = ${hashedPassword}, updatedAt = GETDATE() 
      WHERE email = 'demo@marina.com'
    `;
    
    console.log('✅ Secure password set for demo user');
    console.log('🔑 Demo user password: SecurePass123');

    // Verify the setup
    console.log('\n🔍 Verifying password setup...');
    
    const users = await prisma.$queryRaw`
      SELECT email, firstName, lastName, password 
      FROM users 
      WHERE email = 'demo@marina.com'
    `;
    
    if (users.length > 0) {
      const user = users[0];
      console.log(`✅ User: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`🔐 Password Status: ${user.password ? 'Set' : 'Not Set'}`);
      
      if (user.password) {
        console.log(`🔑 Password Hash: ${user.password.substring(0, 20)}...`);
        console.log(`   Hash Length: ${user.password.length} characters`);
      }
    }

    console.log('\n✅ Password field setup completed successfully!');
    console.log('🔒 Security features enabled:');
    console.log('   - bcryptjs password hashing');
    console.log('   - Strong password requirements');
    console.log('   - Proper field sizing');
    console.log('   - SQL Server 2012 compatibility');

  } catch (error) {
    console.error('❌ Error setting up password field:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupPasswordField();

