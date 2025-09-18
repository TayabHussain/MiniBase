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

    // Calculate statistics
    let totalRows = 0;
    const tableStats = tables.map(tableName => {
      const rowCount = db.getTableRowCount(tableName);
      totalRows += rowCount;
      return {
        name: tableName,
        rowCount
      };
    });

    return NextResponse.json({
      totalTables: tables.length,
      totalRows,
      tables: tableStats
    });

  } catch (error) {
    console.error('Database stats API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}