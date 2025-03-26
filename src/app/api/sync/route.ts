import { NextRequest, NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { prisma } from '@/lib/prisma';

// 用于生成唯一ID的函数
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

// 从数据库获取特定syncId的历史记录
async function getSyncHistory(syncId: string): Promise<ResearchHistory[]> {
  try {
    // 查找该syncId的记录
    const data = await prisma.syncData.findFirst({
      where: { syncId },
    });
    
    if (data && data.history) {
      // 将JSON字符串解析为对象
      return JSON.parse(data.history) as ResearchHistory[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return [];
  }
}

// 将历史记录保存到数据库
async function saveSyncHistory(syncId: string, history: ResearchHistory[]) {
  try {
    // 查找是否已存在该syncId的记录
    const existingData = await prisma.syncData.findFirst({
      where: { syncId },
    });
    
    if (existingData) {
      // 如果存在，更新记录
      await prisma.syncData.update({
        where: { id: existingData.id },
        data: {
          history: JSON.stringify(history),
        },
      });
    } else {
      // 如果不存在，创建新记录
      await prisma.syncData.create({
        data: {
          id: nanoid(),
          syncId,
          history: JSON.stringify(history),
        },
      });
    }
  } catch (error) {
    console.error('Error saving sync history:', error);
    throw error;
  }
}

// 获取特定syncId的历史记录
export async function GET(request: NextRequest) {
  // 检查访问密码和同步ID
  const accessPassword = request.headers.get('x-access-password');
  const syncId = request.headers.get('x-sync-id');

  // 如果没有提供必要的信息，返回错误
  if (!accessPassword || !syncId) {
    return NextResponse.json(
      { error: 'Access password and sync ID are required' },
      { status: 400 }
    );
  }

  if (accessPassword !== process.env.ACCESS_PASSWORD) {
    return NextResponse.json({ error: 'Invalid access password' }, { status: 401 });
  }

  try {
    // 获取同步数据
    const history = await getSyncHistory(syncId);
    
    // 返回指定syncId的历史记录
    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error processing GET sync request:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
}

// 更新特定syncId的历史记录
export async function POST(request: NextRequest) {
  // 检查访问密码和同步ID
  const accessPassword = request.headers.get('x-access-password');
  const syncId = request.headers.get('x-sync-id');

  // 如果没有提供必要的信息，返回错误
  if (!accessPassword || !syncId) {
    return NextResponse.json(
      { error: 'Access password and sync ID are required' },
      { status: 400 }
    );
  }

  if (accessPassword !== process.env.ACCESS_PASSWORD) {
    return NextResponse.json({ error: 'Invalid access password' }, { status: 401 });
  }

  try {
    // 解析请求体，获取历史记录
    const { history } = await request.json();

    if (!Array.isArray(history)) {
      return NextResponse.json(
        { error: 'History must be an array' },
        { status: 400 }
      );
    }

    // 获取当前服务器上的历史记录
    const serverHistory = await getSyncHistory(syncId);
    
    // 合并历史记录，处理版本冲突
    const mergedHistory = mergeHistory(serverHistory, history);
    
    // 保存更新后的数据
    await saveSyncHistory(syncId, mergedHistory);
    
    // 返回最新的同步历史记录
    return NextResponse.json({
      success: true,
      history: mergedHistory
    });
  } catch (error) {
    console.error('Error processing POST sync request:', error);
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    );
  }
}

// 合并历史记录，解决版本冲突
function mergeHistory(serverHistory: ResearchHistory[], clientHistory: ResearchHistory[]): ResearchHistory[] {
  // 创建一个ID到记录的映射，以便于查找
  const recordMap = new Map<string, ResearchHistory>();
  
  // 先添加服务器上的所有记录
  for (const record of serverHistory) {
    recordMap.set(record.id, record);
  }
  
  // 处理客户端记录，解决冲突
  for (const clientRecord of clientHistory) {
    const serverRecord = recordMap.get(clientRecord.id);
    
    if (!serverRecord) {
      // 如果服务器上没有此记录，直接添加
      recordMap.set(clientRecord.id, clientRecord);
    } else {
      // 如果服务器上有此记录，比较创建时间，保留较新的
      if (clientRecord.createdAt > serverRecord.createdAt) {
        recordMap.set(clientRecord.id, clientRecord);
      }
      // 如果服务器记录较新，则保持不变
    }
  }
  
  // 将Map转回数组，并按创建时间降序排序
  return Array.from(recordMap.values())
    .sort((a, b) => b.createdAt - a.createdAt);
}