// @/app/api/saved/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

// Redirect all requests to /api/repositories/saved for consistency
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // Update the pathname to the new endpoint
  url.pathname = '/api/repositories/saved';
  
  // Redirect to the new endpoint with all query parameters preserved
  return NextResponse.redirect(url);
}