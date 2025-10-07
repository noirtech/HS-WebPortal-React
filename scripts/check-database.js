require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database structure...');

  try {
    // Test connection
    console.log('✅ Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection test result:', result);

    // Check what tables exist
    console.log('\n📋 Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      ORDER BY TABLE_NAME
    `;
    console.log('Existing tables:', tables);

    // Check if customers table exists and what's in it
    console.log('\n👥 Checking customers table...');
    try {
      const customerCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM customers`;
      console.log('Customers count:', customerCount);
      
      if (customerCount[0].count > 0) {
        const sampleCustomers = await prisma.$queryRaw`SELECT TOP 3 * FROM customers`;
        console.log('Sample customers:', sampleCustomers);
      }
    } catch (error) {
      console.log('Customers table error:', error.message);
    }

    // Check if owners table exists
    console.log('\n👤 Checking owners table...');
    try {
      const ownerCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM owners`;
      console.log('Owners count:', ownerCount);
    } catch (error) {
      console.log('Owners table error:', error.message);
    }

    // Check other key tables
    const keyTables = ['boats', 'berths', 'contracts', 'invoices', 'work_orders'];
    for (const table of keyTables) {
      console.log(`\n🔍 Checking ${table} table...`);
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.raw(table)}`;
        console.log(`${table} count:`, count);
      } catch (error) {
        console.log(`${table} table error:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });
