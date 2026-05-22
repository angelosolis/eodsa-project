/**
 * Reconcile missing event_entries for a completed PayFast batch payment.
 *
 * Usage:
 *   DATABASE_URL="..." node scripts/reconcile-batch-payment.js ENTRY_BATCH_1779301783325_3b1c70d6
 */

require('dotenv').config({ path: '.env.local' });

async function main() {
  const paymentId = process.argv[2];
  if (!paymentId) {
    console.error('Usage: node scripts/reconcile-batch-payment.js <payment_id>');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const { reconcileBatchEntriesFromPending } = await import('../lib/batch-entry-creation.ts');

  function parsePendingEntriesData(raw) {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(data) ? data : [];
  }
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);

  const [payment] = await sql`
    SELECT payment_id, status, pending_entries_data
    FROM payments
    WHERE payment_id = ${paymentId}
  `;

  if (!payment) {
    console.error('Payment not found:', paymentId);
    process.exit(1);
  }
  if (payment.status !== 'completed') {
    console.error('Payment is not completed:', payment.status);
    process.exit(1);
  }

  const entriesData = parsePendingEntriesData(payment.pending_entries_data);
  console.log(`Payment ${paymentId}: ${entriesData.length} items in pending snapshot`);

  const before = await sql`
    SELECT COUNT(*)::int AS c FROM event_entries WHERE payment_id = ${paymentId}
  `;
  console.log(`Entries in DB before: ${before[0].c}`);

  const result = await reconcileBatchEntriesFromPending(paymentId, entriesData, 'recovery_script');

  const after = await sql`
    SELECT COUNT(*)::int AS c FROM event_entries WHERE payment_id = ${paymentId}
  `;
  console.log(`Entries in DB after: ${after[0].c}`);
  console.log('Created:', result.created);
  console.log('Skipped:', result.skipped);
  if (result.errors.length) console.log('Errors:', result.errors);

  await sql`
    INSERT INTO payment_logs (payment_id, event_type, event_data, ip_address, user_agent)
    VALUES (
      ${paymentId}, 'entries_recovered',
      ${JSON.stringify({
        created_count: result.created.length,
        skipped_count: result.skipped.length,
        error_count: result.errors.length,
        recovery_time: new Date().toISOString(),
        source: 'reconcile-batch-payment.js',
      })},
      'recovery_script', 'recovery_script'
    )
  `;

  if (result.errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
