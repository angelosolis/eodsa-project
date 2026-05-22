/**
 * Backfill 4 missing Elite Dance Gauteng entries for payment ENTRY_BATCH_1779301783325_3b1c70d6
 * Usage: DATABASE_URL="..." node scripts/backfill-elite-gauteng-entries.js
 */

const { neon } = require('@neondatabase/serverless');

const PAYMENT_ID = 'ENTRY_BATCH_1779301783325_3b1c70d6';
const EVENT_ID = 'event-1770536298379';

const MISSING = [
  {
    itemName: 'BERLIN',
    choreographer: 'Emma Mothee',
    itemStyle: 'Contemporary',
    performanceType: 'Group',
    calculatedFee: 180,
    participantIds: [
      '1779296483469xibrj1', '1779283840940mdg3x6', '17792834585860zlo1t', '1779283183324hbr1iq',
      '1779296389637c859np', '1779283628798i4wtnx', '1779283312049sdtj7f', '1779283089360jnwkj6',
      '1779282986438kr9qta', '1779282873530zip2wz', '1779282784937g408ij', '1779213270984noardl',
    ],
  },
  {
    itemName: 'HEARTFULNESS',
    choreographer: 'Emma Mothee',
    itemStyle: 'Contemporary',
    performanceType: 'Group',
    calculatedFee: 180,
    participantIds: [
      '177928191327015chwj', '1779281434522cu95xh', '1779280898103k3e0bl', '1779281269467pyjoh7',
      '17792802748346e48t4', '1779280441035fpo7jg',
    ],
  },
  {
    itemName: 'LA FIESTA',
    choreographer: 'CATRIONA MONTHY AND JULIE SHAMLAYE',
    itemStyle: 'Jazz',
    performanceType: 'Group',
    calculatedFee: 180,
    participantIds: [
      '1779296589713npz50q', '1779296389637c859np', '1779283628798i4wtnx', '1779283312049sdtj7f',
      '1779283089360jnwkj6', '1779296483469xibrj1', '1779283840940mdg3x6', '17792834585860zlo1t',
      '1779282986438kr9qta', '1779282784937g408ij', '1779282873530zip2wz', '1779213270984noardl',
    ],
  },
  {
    itemName: 'ORDINARY GIRL',
    choreographer: 'JULIE SHAMLAYE',
    itemStyle: 'Contemporary',
    performanceType: 'Group',
    calculatedFee: 180,
    participantIds: [
      '17792834585860zlo1t', '1779283089360jnwkj6', '1779282873530zip2wz', '1779282784937g408ij',
      '1779282986438kr9qta', '1779213270984noardl',
    ],
  },
];

function fingerprint(itemName, participantIds) {
  return `${(itemName || '').trim().toLowerCase()}|${[...participantIds].sort().join(',')}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const existing = await sql`
    SELECT id, item_name, participant_ids FROM event_entries WHERE payment_id = ${PAYMENT_ID}
  `;
  const existingFp = new Set(
    existing.map((r) => {
      let ids = r.participant_ids;
      if (typeof ids === 'string') ids = JSON.parse(ids);
      return fingerprint(r.item_name, ids);
    })
  );

  console.log(`Existing entries for payment: ${existing.length}`);

  for (const entry of MISSING) {
    const fp = fingerprint(entry.itemName, entry.participantIds);
    if (existingFp.has(fp)) {
      console.log(`Skip (exists): ${entry.itemName}`);
      continue;
    }

    const id = `${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
    const submittedAt = new Date().toISOString();

    await sql`
      INSERT INTO event_entries (
        id, event_id, contestant_id, eodsa_id, participant_ids, calculated_fee, payment_status,
        submitted_at, approved, qualified_for_nationals, item_name, choreographer, mastery, item_style,
        estimated_duration, entry_type, performance_type, payment_id, payment_method
      ) VALUES (
        ${id}, ${EVENT_ID}, ${'1772965654764'}, ${'S350029'},
        ${JSON.stringify(entry.participantIds)}, ${entry.calculatedFee}, ${'paid'},
        ${submittedAt}, ${true}, ${true},
        ${entry.itemName}, ${entry.choreographer}, ${'Water (Competitive)'}, ${entry.itemStyle},
        ${2}, ${'live'}, ${entry.performanceType}, ${PAYMENT_ID}, ${'payfast'}
      )
    `;

    console.log(`Created entry ${id}: ${entry.itemName}`);
    existingFp.add(fp);
    await new Promise((r) => setTimeout(r, 50));
  }

  const after = await sql`
    SELECT COUNT(*)::int AS c FROM event_entries WHERE payment_id = ${PAYMENT_ID}
  `;
  console.log(`Total entries for payment now: ${after[0].c}`);

  await sql`
    INSERT INTO payment_logs (payment_id, event_type, event_data, ip_address, user_agent)
    VALUES (
      ${PAYMENT_ID}, 'entries_recovered',
      ${JSON.stringify({ source: 'backfill-elite-gauteng-entries.js', at: new Date().toISOString() })},
      'recovery_script', 'recovery_script'
    )
  `;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
