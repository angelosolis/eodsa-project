// Test script for registration and payment APIs
const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, method, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    const result = await response.json();
    console.log(`\n=== ${method} ${endpoint} ===`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Registration → Payment Flow');
  
  // Test 1: Dancer Registration (should fail with reCAPTCHA error)
  console.log('\n1️⃣ Testing Dancer Registration (no reCAPTCHA)');
  await testAPI('/api/dancers/register', 'POST', {
    name: 'Test Dancer',
    dateOfBirth: '2000-05-15',
    nationalId: '0005150123456',
    email: 'testdancer@test.com',
    phone: '0123456789'
    // No recaptchaToken - should fail
  });

  // Test 2: Dancer Registration (with fake token)
  console.log('\n2️⃣ Testing Dancer Registration (fake reCAPTCHA token)');
  await testAPI('/api/dancers/register', 'POST', {
    name: 'Test Dancer',
    dateOfBirth: '2000-05-15',
    nationalId: '0005150123456',
    email: 'testdancer@test.com',
    phone: '0123456789',
    recaptchaToken: 'fake_token_123'
  });

  // Test 3: Rate Limiting (try 4 registrations quickly)
  console.log('\n3️⃣ Testing Rate Limiting (multiple registrations)');
  for (let i = 1; i <= 4; i++) {
    console.log(`\n--- Registration Attempt ${i} ---`);
    await testAPI('/api/dancers/register', 'POST', {
      name: `Test Dancer ${i}`,
      dateOfBirth: '2000-05-15',
      nationalId: `000515012345${i}`,
      email: `testdancer${i}@test.com`,
      phone: '0123456789',
      recaptchaToken: 'fake_token_123'
    });
  }

  // Test 4: Studio Registration
  console.log('\n4️⃣ Testing Studio Registration');
  await testAPI('/api/studios/register', 'POST', {
    name: 'Test Studio',
    email: 'teststudio@test.com',
    password: 'TestPassword123',
    contactPerson: 'Test Contact',
    address: '123 Test Street',
    phone: '0123456789',
    recaptchaToken: 'fake_token_123'
  });

  // Test 5: Get Events (to test event entry)
  console.log('\n5️⃣ Getting Available Events');
  const eventsResponse = await testAPI('/api/events', 'GET');
  
  if (eventsResponse && eventsResponse.length > 0) {
    const testEvent = eventsResponse[0];
    console.log('Using event:', testEvent.name);

    // Test 6: Event Entry with New Fee System
    console.log('\n6️⃣ Testing Event Entry with EODSA Fees');
    await testAPI('/api/event-entries', 'POST', {
      eventId: testEvent.id,
      contestantId: 'test-contestant-id',
      eodsaId: 'E123456',
      participantIds: ['participant-1'],
      calculatedFee: 550, // R250 registration + R300 solo performance
      paymentStatus: 'pending',
      paymentMethod: 'invoice', // New Phase 1 payment method
      approved: false,
      itemName: 'Swan Lake Variation',
      choreographer: 'Marius Petipa',
      mastery: 'Water (Competition)',
      itemStyle: 'Ballet',
      estimatedDuration: 1.5
    });
  }

  // Test 7: Fee Calculation
  console.log('\n7️⃣ Testing EODSA Fee Calculation');
  
  // Import the fee calculation function
  const { calculateEODSAFee } = await import('./lib/types.js');
  
  const soloFee = calculateEODSAFee('Water (Competition)', 'Solo', 1);
  console.log('Solo Fee Calculation:', soloFee);
  
  const groupFee = calculateEODSAFee('Earth (Eisteddfod)', 'Group', 5);
  console.log('Group Fee Calculation:', groupFee);

  console.log('\n✅ Test Complete!');
}

// Run if called directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

export { runTests }; 