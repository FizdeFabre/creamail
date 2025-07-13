// /app/api/open/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Un mini GIF noir 1x1, encodé en base64
const gifBuffer = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
  'base64'
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    console.warn('📭 Pixel appelé sans ID');
    return new NextResponse('Missing ID', { status: 400 });
  }

  const { error } = await supabase
    .from('emails_sent')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('❌ Erreur enregistrement ouverture :', error.message);
    return new NextResponse('Erreur', { status: 500 });
  }

  console.log(`👁️ Pixel de suivi vu pour email ID ${id}`);

  return new NextResponse(gifBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': gifBuffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  });
}