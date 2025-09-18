import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authService = getAuthService();
    const result = await authService.authenticateRequest(request);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: result.user
    });

  } catch (error) {
    console.error('Verify API error:', error);
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