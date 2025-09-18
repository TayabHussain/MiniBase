import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/lib/auth';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const db = getDB();
    const tables = db.getTables();

    // Get detailed schema for each table
    const tablesWithSchema = tables.map(tableName => {
      const schema = db.getTableSchema(tableName);
      const rowCount = db.getTableRowCount(tableName);
      return {
        name: tableName,
        schema,
        rowCount
      };
    });

    return NextResponse.json({
      tables: tablesWithSchema
    });

  } catch (error) {
    console.error('Database tables API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { tableName, columns } = await request.json();

    if (!tableName || !columns || !Array.isArray(columns)) {
      return NextResponse.json(
        { error: 'Table name and columns are required' },
        { status: 400 }
      );
    }

    // Validate table name (prevent SQL injection)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name. Use only letters, numbers, and underscores.' },
        { status: 400 }
      );
    }

    const db = getDB();
    const success = db.createTable(tableName, columns);

    if (success) {
      return NextResponse.json({
        message: `Table '${tableName}' created successfully`,
        table: {
          name: tableName,
          schema: db.getTableSchema(tableName),
          rowCount: 0
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to create table' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Create table API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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