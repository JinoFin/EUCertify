import { NextRequest } from 'next/server';
import { createQrPng } from '@/lib/qr';

export async function GET(request: NextRequest, { params }: { params: { docId: string } }) {
  const target = new URL(`/docs/${params.docId}`, request.nextUrl.origin).toString();
  const pngBuffer = await createQrPng(target);
  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store'
    }
  });
}
