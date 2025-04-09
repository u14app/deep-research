import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Create Prisma client
const prisma = new PrismaClient();

// Check access password
async function validateAccessPassword(request: NextRequest) {
  const accessPassword = process.env.ACCESS_PASSWORD || "";
  const requestPassword = request.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!accessPassword || !requestPassword || accessPassword !== requestPassword) {
    return NextResponse.json(
      { 
        error: {
          code: 403,
          message: "Authentication failed",
          status: "FORBIDDEN",
          accesspaword: accessPassword
        } 
      },
      { status: 403 }
    );
  }
  
  return null;
}

// Get history records
export async function GET(request: NextRequest) {
  // Check access password
  const authError = await validateAccessPassword(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const syncId = searchParams.get('syncId');
  
  if (!syncId) {
    return NextResponse.json(
      { 
        error: {
          code: 400,
          message: "Sync ID is required",
          status: "BAD_REQUEST",
        } 
      },
      { status: 400 }
    );
  }

  try {
    const history = await prisma.researchHistory.findMany({
      where: { syncId },
      orderBy: { updatedAt: 'desc' }
    });
    
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching history records:', error);
    return NextResponse.json(
      { 
        error: {
          code: 500,
          message: "Failed to fetch history records",
          status: "INTERNAL_SERVER_ERROR",
        } 
      },
      { status: 500 }
    );
  }
}

// History schema
const historySchema = z.object({
  id: z.string(),
  syncId: z.string(),
  title: z.string(),
  question: z.string(),
  questions: z.string(),
  finalReport: z.string(),
  query: z.string(),
  suggestion: z.string(),
  tasks: z.array(z.any()), // Simplified task verification
  sources: z.array(z.any()), // Source verification
  feedback: z.string(),
  createdAt: z.union([z.number(), z.string(), z.date()]).optional(),
  updatedAt: z.union([z.number(), z.string(), z.date()]).optional(),
});

// Save history record
export async function POST(request: NextRequest) {
  // Check access password
  const authError = await validateAccessPassword(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    
    // Check if history data is valid
    const result = historySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          error: {
            code: 400,
            message: "Invalid history data",
            status: "BAD_REQUEST",
            details: result.error.format(),
          } 
        },
        { status: 400 }
      );
    }
    
    const historyData = result.data;
    const { id, syncId, ...rest } = historyData;
    
    // Check if record exists
    const existingRecord = await prisma.researchHistory.findUnique({
      where: { id }
    });
    
    if (existingRecord) {
      // If client version is newer, update the record
      const clientUpdatedAt = new Date(historyData.updatedAt || Date.now());
      const serverUpdatedAt = existingRecord.updatedAt;
      
      // If client version is newer, update the record
      if (clientUpdatedAt > serverUpdatedAt) {
        const updatedRecord = await prisma.researchHistory.update({
          where: { id },
          data: {
            title: rest.title,
            question: rest.question,
            questions: rest.questions,
            finalReport: rest.finalReport,
            query: rest.query,
            suggestion: rest.suggestion,
            feedback: rest.feedback,
            syncId,
            updatedAt: new Date(historyData.updatedAt || Date.now()),
            tasks: JSON.stringify(historyData.tasks),
            sources: JSON.stringify(historyData.sources),
          }
        });
        
        return NextResponse.json({ 
          history: updatedRecord,
          action: 'updated'
        });
      } else {
        // If server version is newer, return the server record
        return NextResponse.json({ 
          history: existingRecord,
          action: 'server_newer'
        });
      }
    } else {
      // If record doesn't exist, create a new record
      const newRecord = await prisma.researchHistory.create({
        data: {
          id,
          syncId,
          title: rest.title,
          question: rest.question,
          questions: rest.questions,
          finalReport: rest.finalReport,
          query: rest.query,
          suggestion: rest.suggestion,
          feedback: rest.feedback,
          createdAt: new Date(historyData.createdAt || Date.now()),
          updatedAt: new Date(historyData.updatedAt || Date.now()),
          tasks: JSON.stringify(historyData.tasks),
          sources: JSON.stringify(historyData.sources),
        }
      });
      
      return NextResponse.json({ 
        history: newRecord,
        action: 'created'
      });
    }
  } catch (error) {
    console.error('Error saving history:', error);
    return NextResponse.json(
      { 
        error: {
          code: 500,
          message: "Failed to save history record",
          status: "INTERNAL_SERVER_ERROR",
        } 
      },
      { status: 500 }
    );
  }
}

// Delete history record
export async function DELETE(request: NextRequest) {
  // Check access password
  const authError = await validateAccessPassword(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { 
        error: {
          code: 400,
          message: "Record ID is required",
          status: "BAD_REQUEST",
        } 
      },
      { status: 400 }
    );
  }

  try {
    await prisma.researchHistory.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting history:', error);
    return NextResponse.json(
      { 
        error: {
          code: 500,
          message: "Failed to delete history record",
          status: "INTERNAL_SERVER_ERROR",
        } 
      },
      { status: 500 }
    );
  }
}