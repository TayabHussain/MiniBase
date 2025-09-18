import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/lib/auth';
import { getDB } from '@/lib/db';

// GET /api/rest/[tableName] - List all records
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    // Authenticate request
    const authService = getAuthService();
    const authResult = await authService.authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { tableName } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate table exists
    const db = getDB();
    const schema = db.getTableSchema(tableName);
    if (!schema) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const records = db.getAllFromTable(tableName, limit, offset);
    const totalCount = db.getTableRowCount(tableName);

    return NextResponse.json({
      data: records,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error(`GET /api/rest/${(await params).tableName} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/rest/[tableName] - Create new record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    // Authenticate request
    const authService = getAuthService();
    const authResult = await authService.authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { tableName } = await params;
    const data = await request.json();

    // Validate table exists
    const db = getDB();
    const schema = db.getTableSchema(tableName);
    if (!schema) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Remove id field if present (auto-increment)
    const { id, ...insertData } = data;

    const newRecord = db.insertIntoTable(tableName, insertData);

    return NextResponse.json({
      message: 'Record created successfully',
      data: newRecord
    }, { status: 201 });

  } catch (error) {
    console.error(`POST /api/rest/${(await params).tableName} error:`, error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}