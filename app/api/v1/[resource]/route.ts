/**
 * Public read-only JSON API.
 *
 * Each resource maps to a file in /data. Allowed resources are listed below.
 * Responses are CORS-enabled (Access-Control-Allow-Origin: *) so journalists,
 * analysts and LLM agents can fetch directly from any origin.
 *
 * Cite as: "EuroOilWatch — eurooilwatch.com/api/v1/<resource>"
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALLOWED = new Set([
  'stocks',
  'prices',
  'prices-history',
  'brent',
  'brent-history',
  'brent-eia-daily',
  'gas',
  'ara-stocks',
  'bunker',
  'bunker-history',
  'sea-state',
  'history',
  'france-fuel-prices',
  'spain-fuel-prices',
  'italy-fuel-prices',
  'marad-advisories',
  'centcom-advisories',
  'crea-feed',
  'changelog',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age':       '86400',
};

const CACHE_HEADERS = {
  // 5 minutes fresh, 1 hour stale-while-revalidate at the CDN edge
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_req: NextRequest, { params }: { params: { resource: string } }) {
  const { resource } = params;

  if (!ALLOWED.has(resource)) {
    return NextResponse.json(
      { error: 'Not found', resource, allowed: Array.from(ALLOWED).sort() },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const filePath = path.join(process.cwd(), 'data', `${resource}.json`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: 'Data not yet populated', resource },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return new Response(raw, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...CORS_HEADERS,
        ...CACHE_HEADERS,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to read resource', resource, detail: err.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
