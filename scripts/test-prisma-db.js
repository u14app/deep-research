#!/usr/bin/env node

/**
 * Test Prisma Database Connection
 * node scripts/test-prisma-db.js
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Testing Prisma Database Connection...');
  
  // Check if data directory exists, create it if not
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('Create DB Directory: data/');
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize Prisma Client
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // connect to the database
    await prisma.$connect();
    console.log('Connected to the database!');

    // check if the database tables exist
    try {
      const count = await prisma.syncData.count();
      console.log(`Database Checked, There are ${count} records.`);
      
      // Create a test record
      const testId = 'test-' + Date.now();
      console.log('Creating a test record...');
      await prisma.syncData.create({
        data: {
          id: testId,
          syncId: 'test-sync-id',
          history: JSON.stringify([{
            id: 'test-history-' + Date.now(),
            createdAt: Date.now(),
            title: 'Test Title',
            question: 'Test question',
            questions: 'questions1\nquestions2',
            finalReport: 'test report',
            query: 'test query',
            suggestion: 'test suggestion',
            tasks: [],
            feedback: ''
          }])
        }
      });
      
      // Test the record
      const record = await prisma.syncData.findUnique({
        where: { id: testId }
      });
      console.log('Test Record Created');
      console.log('Record ID:', record.id);
      console.log('SyncID:', record.syncId);
      console.log('Update Time:', record.updatedAt);
      
      // Delete the test record
      await prisma.syncData.delete({
        where: { id: testId }
      });
      console.log('Test Record Deleted');
      
    } catch (error) {
      console.error('Error when testing the table:', error);
      console.log('Please try this: npx prisma migrate dev');
    }
  } catch (error) {
    console.error('Error when connecting DB:', error);
  } finally {
    await prisma.$disconnect();
    console.log('DB Connection Closed');
  }
}

main().catch(error => {
  console.error('Testing Failed:', error);
  process.exit(1);
});