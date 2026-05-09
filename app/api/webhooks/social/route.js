import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findResponse } from '../../../lib/auto-responder';

// This endpoint receives webhooks from Meta (WhatsApp, Instagram, Messenger)
// and other platforms when a customer sends a message.

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Webhook received but Supabase is not configured.');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    // 1. Parse incoming message (example format, adapting to Meta's structure)
    // You will need to adjust this depending on the exact webhook payload structure of the platform
    let platform = 'unknown';
    let customerId = '';
    let customerName = 'Cliente';
    let messageText = '';

    if (body.object === 'page' || body.object === 'instagram') {
      // Meta Webhook (Messenger/Instagram)
      platform = body.object;
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];
      
      if (!messaging?.message?.text) {
        return NextResponse.json({ status: 'ignored - no text' }, { status: 200 });
      }

      customerId = messaging.sender.id;
      messageText = messaging.message.text;
    } else if (body.object === 'whatsapp_business_account') {
      // WhatsApp Webhook
      platform = 'whatsapp';
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];

      if (!message?.text?.body) {
        return NextResponse.json({ status: 'ignored - no text' }, { status: 200 });
      }

      customerId = message.from;
      customerName = changes?.contacts?.[0]?.profile?.name || 'Cliente';
      messageText = message.text.body;
    } else {
      return NextResponse.json({ status: 'ignored - unknown platform' }, { status: 200 });
    }

    // 2. Process message through Auto-Responder Bot
    console.log(`💬 New message from ${platform} [${customerId}]: "${messageText}"`);
    const botResult = findResponse(messageText);

    // 3. Save to database
    const { data: dbMessage, error } = await supabase.from('support_messages').insert({
      platform,
      customer_id: customerId,
      customer_name: customerName,
      message_text: messageText,
      response_text: botResult.response,
      was_auto_replied: botResult.wasAutoReplied,
      needs_human_review: botResult.needsHumanReview,
      status: botResult.wasAutoReplied ? 'auto_replied' : 'pending',
    }).select().single();

    if (error) {
      console.error('❌ Error saving message to DB:', error.message);
    }

    // 4. Send response back to customer via API (if auto-replied)
    if (botResult.wasAutoReplied) {
      // TODO: Implement actual API calls to Meta Graph API to send the response back
      // Example:
      // await sendMetaMessage(platform, customerId, botResult.response);
      console.log(`🤖 Auto-replied: "${botResult.response}"`);
    } else {
      console.log(`👤 Escalated to human. Message: "${botResult.response}"`);
      // Optionally send the escalation message so the user knows they are waiting
      // await sendMetaMessage(platform, customerId, botResult.response);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Meta requires webhook verification via GET request
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'clickeatienda_verify_123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Meta Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}
