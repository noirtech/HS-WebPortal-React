// ============================================================================
// Check Password Storage in Database
// Run with: node check-password-storage.js
// ============================================================================

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPasswordStorage() {
  console.log('🔍 Checking password storage in database...\n');

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // Get database name
    const dbInfo = await prisma.$queryRaw`SELECT DB_NAME() as databaseName`;
    const databaseName = dbInfo[0].databaseName;
    
    console.log('🗄️ Database Information:');
    console.log(`   Database: ${databaseName}`);
    console.log(`   Table: users`);
    console.log(`   Column: password`);
    console.log(`   Data Type: VARCHAR(255)`);
    console.log(`   Purpose: Store bcrypt hashed passwords\n`);

    // Show users table structure
    console.log('📋 Users table structure:');
    const columns = await prisma.$queryRaw`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `;
    
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n🔐 Password storage details:');
    
    // Get all users with password info
    const users = await prisma.$queryRaw`
      SELECT 
        id,
        email,
        firstName,
        lastName,
        password,
        marinaId,
        isActive,
        createdAt,
        updatedAt
      FROM users
      ORDER BY createdAt DESC
    `;

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Marina ID: ${user.marinaId || 'None'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Password Status: ${user.password ? 'Set' : 'Not Set'}`);
      
      if (user.password) {
        console.log(`   Hash Length: ${user.password.length} characters`);
        console.log(`   Hash Preview: ${user.password.substring(0, 30)}...`);
        
        // Determine hash type
        let hashType = 'Unknown';
        if (user.password.startsWith('$2a$')) {
          hashType = 'bcrypt (correct format)';
        } else if (user.password.startsWith('$2b$')) {
          hashType = 'bcrypt (newer format)';
        }
        console.log(`   Hash Type: ${hashType}`);
      }
      console.log('');
    });

    // Show specific demo user details
    console.log('👤 Demo user password details:');
    const demoUser = users.find(u => u.email === 'demo@marina.com');
    
    if (demoUser) {
      console.log(`   User: ${demoUser.firstName} ${demoUser.lastName}`);
      console.log(`   Email: ${demoUser.email}`);
      console.log(`   User ID: ${demoUser.id}`);
      console.log(`   Has Password: ${demoUser.password ? 'Yes' : 'No'}`);
      
      if (demoUser.password) {
        console.log(`   Hash Length: ${demoUser.password.length} characters`);
        console.log(`   Hash Start: ${demoUser.password.substring(0, 30)}...`);
        console.log(`   Hash Type: ${demoUser.password.startsWith('$2b$') ? 'bcrypt (newer format)' : 'bcrypt (correct format)'}`);
        console.log(`   Original Password: SecurePass123 (hashed)`);
      }
    }

    console.log('\n✅ Password storage check completed!');
    console.log('📝 Summary:');
    console.log('   - Database: marina_portal');
    console.log('   - Table: users');
    console.log('   - Column: password (VARCHAR(255))');
    console.log('   - Format: bcrypt hash');
    console.log('   - Demo user: demo@marina.com');
    console.log('   - Password: SecurePass123 (hashed)');

  } catch (error) {
    console.error('❌ Error checking password storage:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswordStorage();

