#!/usr/bin/env node

/**
 * 测试 Prisma 与 SQLite 数据库连接的简单脚本
 * 使用方法: node scripts/test-prisma-db.js
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('测试 Prisma 数据库连接...');
  
  // 检查数据目录是否存在
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    console.log('创建数据目录: data/');
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 初始化Prisma客户端
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // 连接数据库
    await prisma.$connect();
    console.log('✅ 数据库连接成功!');

    // 查询数据库以验证表结构
    try {
      const count = await prisma.syncData.count();
      console.log(`✅ 数据库表结构验证成功! 共有 ${count} 条同步记录`);
      
      // 创建测试记录
      const testId = 'test-' + Date.now();
      console.log('创建测试记录...');
      await prisma.syncData.create({
        data: {
          id: testId,
          syncId: 'test-sync-id',
          history: JSON.stringify([{
            id: 'test-history-' + Date.now(),
            createdAt: Date.now(),
            title: '测试标题',
            question: '测试问题',
            questions: '子问题1\n子问题2',
            finalReport: '测试最终报告',
            query: '测试查询',
            suggestion: '测试建议',
            tasks: [],
            feedback: ''
          }])
        }
      });
      
      // 查询刚创建的记录
      const record = await prisma.syncData.findUnique({
        where: { id: testId }
      });
      console.log('✅ 测试记录创建成功!');
      console.log('记录ID:', record.id);
      console.log('同步ID:', record.syncId);
      console.log('更新时间:', record.updatedAt);
      
      // 删除测试记录
      await prisma.syncData.delete({
        where: { id: testId }
      });
      console.log('✅ 测试记录已清理');
      
    } catch (error) {
      console.error('❌ 数据库表结构验证失败:', error);
      console.log('请检查是否已执行数据库迁移: npx prisma migrate dev');
    }
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

main().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});