import 'server-only';
import { NextResponse } from 'next/server';

/** An error with the same body the API uses, so the browser reads one shape. */
export function errorResponse(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ status, error, message, timestamp: new Date().toISOString() }, { status });
}
