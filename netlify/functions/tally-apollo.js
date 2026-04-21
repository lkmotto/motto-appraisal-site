/**
 * Tally → Apollo.io Bridge
 * Netlify Function — runs serverless at:
 * https://mottoappraisalservice.netlify.app/.netlify/functions/tally-apollo
 *
 * Setup:
 * 1. Set APOLLO_API_KEY in Netlify → Site settings → Environment variables
 * 2. Set APOLLO_SEQUENCE_ID to the sequence ID you want contacts added to
 * 3. In Tally: Form yPM0Od → Integrations → Webhooks → add this URL
 * 4. (Optional) Set TALLY_SIGNING_SECRET for webhook verification
 */

const https = require('https');

const APOLLO_API_KEY     = process.env.APOLLO_API_KEY;
const APOLLO_SEQUENCE_ID = process.env.APOLLO_SEQUENCE_ID || '';  // set in Netlify env
const MAILBOX_EMAIL      = process.env.APOLLO_MAILBOX_EMAIL || 'luke@mottoappraisal.cloud';

// ── Helpers ─────────────────────────────────────────────────────────

function apolloRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.apollo.io',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APOLLO_API_KEY,
        'Cache-Control': 'no-cache',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Extract a Tally field value by label (case-insensitive partial match)
function extractField(fields, labelFragment) {
  if (!fields || !Array.isArray(fields)) return '';
  const field = fields.find(f =>
    f.label && f.label.toLowerCase().includes(labelFragment.toLowerCase())
  );
  return field ? (field.value || '') : '';
}

// ── Main handler ─────────────────────────────────────────────────────

exports.handler = async (event) => {

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!APOLLO_API_KEY) {
    console.error('APOLLO_API_KEY not set');
    return { statusCode: 500, body: 'Apollo API key not configured' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  console.log('Tally payload received:', JSON.stringify(payload, null, 2));

  // Tally sends: { eventId, eventType, createdAt, data: { responseId, fields: [...] } }
  const fields = payload?.data?.fields || [];

  // Extract fields from Tally form yPM0Od
  // These field labels must match what's in your Tally form — adjust if needed
  const firstName  = extractField(fields, 'first name') || extractField(fields, 'name').split(' ')[0] || '';
  const lastName   = extractField(fields, 'last name')  || extractField(fields, 'name').split(' ').slice(1).join(' ') || '';
  const fullName   = extractField(fields, 'name') || `${firstName} ${lastName}`.trim();
  const email      = extractField(fields, 'email');
  const phone      = extractField(fields, 'phone');
  const serviceType = extractField(fields, 'service') || extractField(fields, 'type') || extractField(fields, 'appraisal');
  const address    = extractField(fields, 'address') || extractField(fields, 'property');
  const message    = extractField(fields, 'message') || extractField(fields, 'note') || extractField(fields, 'comment');

  if (!email) {
    console.error('No email found in Tally submission');
    return { statusCode: 400, body: 'No email in submission' };
  }

  // ── Step 1: Create or update Apollo contact ──────────────────────
  const contactPayload = {
    first_name: firstName || fullName.split(' ')[0] || 'Unknown',
    last_name:  lastName  || fullName.split(' ').slice(1).join(' ') || '',
    email:      email,
    phone:      phone || undefined,
    label_names: ['Website Lead', 'Appraisal Inquiry'],
    // Custom fields / notes
    present_raw_address: address || undefined,
    // Tag the source
    organization_name: undefined,  // residential client — no company
  };

  let contactId;
  try {
    const createRes = await apolloRequest('POST', '/v1/contacts', contactPayload);
    console.log('Apollo contact response:', createRes.status, JSON.stringify(createRes.body).slice(0, 200));

    if (createRes.status === 200 || createRes.status === 201) {
      contactId = createRes.body?.contact?.id;
    } else if (createRes.status === 422 && createRes.body?.contact?.id) {
      // Contact already exists
      contactId = createRes.body.contact.id;
      console.log('Contact already exists, ID:', contactId);
    } else {
      console.error('Apollo contact creation failed:', createRes.status, createRes.body);
      return { statusCode: 502, body: 'Apollo contact creation failed' };
    }
  } catch (err) {
    console.error('Apollo request error:', err);
    return { statusCode: 502, body: 'Apollo request failed' };
  }

  // ── Step 2: Add a note to the contact ───────────────────────────
  if (contactId) {
    const noteLines = [
      `Source: Tally Form (Appraisal Order)`,
      serviceType ? `Service type: ${serviceType}` : '',
      address ? `Property address: ${address}` : '',
      message ? `Notes: ${message}` : '',
      `Submitted: ${payload.createdAt || new Date().toISOString()}`,
    ].filter(Boolean);

    try {
      await apolloRequest('POST', '/v1/notes', {
        contact_ids: [contactId],
        body: noteLines.join('\n'),
      });
      console.log('Note added to contact', contactId);
    } catch (e) {
      console.error('Note creation error (non-fatal):', e);
    }
  }

  // ── Step 3: Add to outreach sequence ────────────────────────────
  if (contactId && APOLLO_SEQUENCE_ID) {
    try {
      const seqRes = await apolloRequest('POST', '/v1/emailer_campaigns/' + APOLLO_SEQUENCE_ID + '/add_contact_ids', {
        contact_ids: [contactId],
        emailer_campaign_id: APOLLO_SEQUENCE_ID,
        send_email_from_email_address: MAILBOX_EMAIL,
      });
      console.log('Sequence enroll response:', seqRes.status);
    } catch (e) {
      console.error('Sequence enroll error (non-fatal):', e);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      contactId: contactId,
      email: email,
    }),
  };
};
