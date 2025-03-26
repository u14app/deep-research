import { NextRequest, NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { prisma } from '@/lib/prisma';

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);
async function getSyncHistory(syncId: string): Promise<ResearchHistory[]> {
  try {

    const data = await prisma.syncData.findFirst({
      where: { syncId },
    });
    
    if (data && data.history) {
      return JSON.parse(data.history) as ResearchHistory[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return [];
  }
}


async function saveSyncHistory(syncId: string, history: ResearchHistory[]) {
  try {
    const existingData = await prisma.syncData.findFirst({
      where: { syncId },
    });
    
    if (existingData) {
      await prisma.syncData.update({
        where: { id: existingData.id },
        data: {
          history: JSON.stringify(history),
        },
      });
    } else {
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

export async function GET(request: NextRequest) {
  const accessPassword = request.headers.get('x-access-password');
  const syncId = request.headers.get('x-sync-id');

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
    const history = await getSyncHistory(syncId);
    
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

export async function POST(request: NextRequest) {
  const accessPassword = request.headers.get('x-access-password');
  const syncId = request.headers.get('x-sync-id');

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
    const { history } = await request.json();

    if (!Array.isArray(history)) {
      return NextResponse.json(
        { error: 'History must be an array' },
        { status: 400 }
      );
    }

    const serverHistory = await getSyncHistory(syncId);
    
    // Merge the histories
    const mergedHistory = mergeHistory(serverHistory, history);
    
    await saveSyncHistory(syncId, mergedHistory);
    
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

// Merge the histories
function mergeHistory(serverHistory: ResearchHistory[], clientHistory: ResearchHistory[]): ResearchHistory[] {
  const recordMap = new Map<string, ResearchHistory>();
  
  for (const record of serverHistory) {
    recordMap.set(record.id, record);
  }
  
  for (const clientRecord of clientHistory) {
    const serverRecord = recordMap.get(clientRecord.id);
    
    if (!serverRecord) {
      recordMap.set(clientRecord.id, clientRecord);
    } else {
      if (clientRecord.createdAt > serverRecord.createdAt) {
        recordMap.set(clientRecord.id, clientRecord);
      }
    }
  }
  
  return Array.from(recordMap.values())
    .sort((a, b) => b.createdAt - a.createdAt);
}