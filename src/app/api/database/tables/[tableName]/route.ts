import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/lib/auth';
import { getDB } from '@/lib/db';

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
    const db = getDB();

    const schema = db.getTableSchema(tableName);
    if (!schema) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const rowCount = db.getTableRowCount(tableName);

    return NextResponse.json({
      table: {
        name: tableName,
        schema,
        rowCount
      }
    });

  } catch (error) {
    console.error('Get table API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Protect system tables
    if (tableName === 'admin_users' || tableName === 'app_users') {
      return NextResponse.json(
        { error: 'Cannot delete system tables' },
        { status: 403 }
      );
    }

    const db = getDB();
    const success = db.dropTable(tableName);

    if (success) {
      return NextResponse.json({
        message: `Table '${tableName}' deleted successfully`
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete table' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Delete table API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}