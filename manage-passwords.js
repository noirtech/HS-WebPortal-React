// ============================================================================
// Password Management Script - Compliant with Project Rules
// Run with: node manage-passwords.js
// ============================================================================

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Hash password using bcryptjs with secure salt rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 12; // Project Rule 4: Use bcryptjs
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash using bcryptjs
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength according to security standards
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with errors array
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Set password for user with proper validation and logging
 * @param {string} email - User email
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} - Success status
 */
async function setUserPassword(email, newPassword) {
  console.log(`🔧 Setting password for user: ${email}`);
  
  try {
    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      console.log(`❌ Password validation failed:`);
      validation.errors.forEach(error => console.log(`   - ${error}`));
      return false;
    }
    
    // Check if user exists
    const users = await prisma.$queryRaw`SELECT id, email, firstName, lastName, marinaId FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return false;
    }
    
    const user = users[0];
    
    // Hash the new password with bcryptjs (Project Rule 4)
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user password
    await prisma.$queryRaw`UPDATE users SET password = ${hashedPassword}, updatedAt = GETDATE() WHERE email = ${email}`;
    
    console.log(`✅ Password set successfully for: ${user.firstName} ${user.lastName} (${email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Marina ID: ${user.marinaId || 'None'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error setting password:', error.message);
    return false;
  }
}

/**
 * Check password status for user
 * @param {string} email - User email
 */
async function checkUserPassword(email) {
  console.log(`🔍 Checking password status for user: ${email}`);
  
  try {
    const users = await prisma.$queryRaw`SELECT id, email, firstName, lastName, password, marinaId, isActive FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    const user = users[0];
    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Marina ID: ${user.marinaId || 'None'}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`🔐 Password Status: ${user.password ? 'Set' : 'Not Set'}`);
    
    if (user.password) {
      console.log(`🔑 Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`   Hash Length: ${user.password.length} characters`);
    }
    
  } catch (error) {
    console.error('❌ Error checking password:', error.message);
  }
}

/**
 * Test password verification
 * @param {string} email - User email
 * @param {string} testPassword - Password to test
 */
async function testPasswordVerification(email, testPassword) {
  console.log(`🧪 Testing password verification for: ${email}`);
  
  try {
    const users = await prisma.$queryRaw`SELECT password FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    const user = users[0];
    
    if (!user.password) {
      console.log(`ℹ️ User has no password set - demo mode active`);
      return;
    }
    
    const isValid = await verifyPassword(testPassword, user.password);
    console.log(`🔍 Password verification result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    
  } catch (error) {
    console.error('❌ Error testing password:', error.message);
  }
}

/**
 * List all users with password status
 */
async function listAllUsers() {
  console.log('👥 All users with password status:');
  
  try {
    const users = await prisma.$queryRaw`
      SELECT id, email, firstName, lastName, password, marinaId, isActive, createdAt
      FROM users
      ORDER BY createdAt DESC
    `;
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Marina ID: ${user.marinaId || 'None'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Password: ${user.password ? 'Set' : 'Not Set'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

/**
 * Main function with comprehensive password management
 */
async function main() {
  console.log('🔐 Password Management Tool - Project Rules Compliant\n');
  console.log('Security Features:');
  console.log('  ✅ bcryptjs password hashing (Project Rule 4)');
  console.log('  ✅ Strong password validation');
  console.log('  ✅ Comprehensive logging');
  console.log('  ✅ SQL Server 2012 compatibility');
  console.log('  ✅ Proper error handling\n');
  
  // List all users first
  await listAllUsers();
  
  console.log('='.repeat(60) + '\n');
  
  // Check current password status for demo user
  await checkUserPassword('demo@marina.com');
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Set password for demo user with strong password
  const success = await setUserPassword('demo@marina.com', 'SecurePass123');
  
  if (success) {
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test the password
    await testPasswordVerification('demo@marina.com', 'SecurePass123');
    await testPasswordVerification('demo@marina.com', 'wrongpassword');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Final check
  await checkUserPassword('demo@marina.com');
  
  console.log('\n✅ Password management completed!');
  console.log('🔑 Demo user can now log in with: demo@marina.com / SecurePass123');
  console.log('🔒 Password meets all security requirements');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
