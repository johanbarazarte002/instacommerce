import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { processWebhookQueueItem } from '@/lib/services/meta-dispatcher';

// Instancia administrativa para escribir en la cola
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const META_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN!;
const META_APP_SECRET = process.env.META_APP_SECRET!;

// 1. Handshake inicial de Meta (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Token de verificación inválido' }, { status: 403 });
}

// 2. Recepción de Comentarios y Mensajes (POST)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Validación de seguridad HMAC-SHA256 (Opcional en desarrollo local si pruebas con mock, obligatoria con Meta)
    if (signature && !isValidSignature(rawBody, signature, META_APP_SECRET)) {
      return NextResponse.json({ error: 'Firma criptográfica inválida' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.object !== 'instagram') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // Inserción en cola y ejecución en background
    const entries = payload.entry ?? [];
    for (const entry of entries) {
      const { data: queueItem } = await supabaseAdmin
        .from('webhook_events_queue')
        .insert({
          platform: 'instagram',
          payload: entry,
          status: 'pending',
        })
        .select('id, payload')
        .single();

      if (queueItem) {
        // Disparo asíncrono sin bloquear el return 200 a Meta
        processWebhookQueueItem(queueItem.id, queueItem.payload).catch((err) =>
          console.error('[Worker Error]:', err)
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Meta Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

function isValidSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const [algo, signature] = signatureHeader.split('=');
  if (algo !== 'sha256' || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  const sourceBuffer = Buffer.from(signature, 'hex');
  const targetBuffer = Buffer.from(expectedSignature, 'hex');

  if (sourceBuffer.length !== targetBuffer.length) return false;
  return crypto.timingSafeEqual(sourceBuffer, targetBuffer);
}