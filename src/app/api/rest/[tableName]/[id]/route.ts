import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/lib/auth';
import { getDB } from '@/lib/db';

// GET /api/rest/[tableName]/[id] - Get single record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string; id: string }> }
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

    const { tableName, id } = await params;
    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Validate table exists
    const db = getDB();
    const schema = db.getTableSchema(tableName);
    if (!schema) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get single record
    const records = db.executeSQL(`SELECT * FROM ${tableName} WHERE id = ?`, [recordId]);

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: records[0]
    });

  } catch (error) {
    console.error(`GET /api/rest/${(await params).tableName}/${(await params).id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/rest/[tableName]/[id] - Update record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string; id: string }> }
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

    const { tableName, id } = await params;
    const recordId = parseInt(id);
    const data = await request.json();

    if (isNaN(recordId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Validate table exists
    const db = getDB();
    const schema = db.getTableSchema(tableName);
    if (!schema) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Remove id field from update data
    const { id: _, ...updateData } = data;

    const updatedRecord = db.updateInTable(tableName, recordId, updateData);

    if (!updatedRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Record updated successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error(`PUT /api/rest/${(await params).tableName}/${(await params).id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

// DELETE /api/rest/[tableName]/[id] - Delete record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string; id: string }> }
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

    const { tableName, id } = await params;
    const recordId = parseInt(id);

    if (isNaN(recordId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Validate table exists
    const db = getDB();
    const schema = db.getTableSchema(tableName);
    if (!schema) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    const success = db.deleteFromTable(tableName, recordId);

    if (!success) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Record deleted successfully'
    });

  } catch (error) {
    console.error(`DELETE /api/rest/${(await params).tableName}/${(await params).id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}