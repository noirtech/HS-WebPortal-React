require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateCustomersToOwners() {
  console.log('🔄 Starting customers to owners table migration...');

  try {
    // Check if customers table exists and has data
    console.log('🔍 Checking customers table...');
    const customerCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM customers`;
    console.log(`📊 Found ${customerCount[0].count} existing customers`);

    if (customerCount[0].count === 0) {
      console.log('⚠️ No customers found, nothing to migrate');
      return;
    }

    // Check if owners table already exists
    console.log('🔍 Checking if owners table exists...');
    try {
      const ownerCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM owners`;
      console.log(`⚠️ Owners table already exists with ${ownerCount[0].count} records`);
      console.log('🔄 Dropping existing owners table...');
      await prisma.$executeRaw`DROP TABLE owners`;
      console.log('✅ Dropped existing owners table');
    } catch (error) {
      console.log('✅ Owners table does not exist, proceeding with migration');
    }

    // Rename customers table to owners
    console.log('🔄 Renaming customers table to owners...');
    await prisma.$executeRaw`EXEC sp_rename 'customers', 'owners'`;
    console.log('✅ Successfully renamed customers table to owners');

    // Verify the rename worked
    console.log('🔍 Verifying migration...');
    const newOwnerCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM owners`;
    console.log(`📊 Owners table now contains ${newOwnerCount[0].count} records`);

    if (newOwnerCount[0].count === customerCount[0].count) {
      console.log('✅ Data integrity verified - all records preserved');
    } else {
      console.log('❌ Data integrity issue - record count mismatch');
      throw new Error('Record count mismatch after migration');
    }

    // Check final table state
    console.log('\n🔍 Final table state:');
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      ORDER BY TABLE_NAME
    `;
    console.table(tables);

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateCustomersToOwners()
  .then(() => {
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  });
