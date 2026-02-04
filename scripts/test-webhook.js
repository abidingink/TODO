#!/usr/bin/env node
/**
 * Test script to simulate Facebook webhook events
 * Usage: node scripts/test-webhook.js
 */

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';

// Simulated webhook event
const testEvent = {
  object: 'page',
  entry: [
    {
      id: '123456789',
      time: Date.now(),
      messaging: [
        {
          sender: { id: '987654321' },
          recipient: { id: '123456789' },
          timestamp: Date.now(),
          message: {
            mid: `test-msg-${Date.now()}`,
            text: 'Hey Fred, what do you think about AI?',
          },
        },
      ],
    },
  ],
};

async function testWebhook() {
  console.log('Testing Fred Messenger Worker...\n');
  console.log(`Worker URL: ${WORKER_URL}`);
  console.log('');

  // Test 1: Health check
  console.log('1. Health check...');
  try {
    const health = await fetch(`${WORKER_URL}/health`);
    const data = await health.json();
    console.log('   ✅ Health:', JSON.stringify(data));
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Webhook verification
  console.log('\n2. Webhook verification...');
  try {
    const verify = await fetch(
      `${WORKER_URL}/webhook?hub.mode=subscribe&hub.verify_token=FRED_VERIFY_TOKEN_12345&hub.challenge=test_challenge_123`
    );
    const text = await verify.text();
    if (text === 'test_challenge_123') {
      console.log('   ✅ Verification passed');
    } else {
      console.log('   ❌ Verification failed, got:', text);
    }
  } catch (error) {
    console.log('   ❌ Verification error:', error.message);
  }

  // Test 3: Send webhook event
  console.log('\n3. Sending test webhook event...');
  console.log('   Message: "Hey Fred, what do you think about AI?"');
  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEvent),
    });
    const text = await response.text();
    console.log(`   ✅ Response: ${text} (status: ${response.status})`);
  } catch (error) {
    console.log('   ❌ Webhook error:', error.message);
  }

  // Test 4: Check messages
  console.log('\n4. Checking stored messages...');
  try {
    const messages = await fetch(`${WORKER_URL}/api/messages?limit=5`);
    const data = await messages.json();
    console.log(`   ✅ Messages stored: ${data.messages?.length || 0}`);
    if (data.messages?.length > 0) {
      console.log('   Latest message:', data.messages[0].text.substring(0, 50) + '...');
    }
  } catch (error) {
    console.log('   ❌ Messages error:', error.message);
  }

  // Test 5: Check stats
  console.log('\n5. Checking stats...');
  try {
    const stats = await fetch(`${WORKER_URL}/api/stats`);
    const data = await stats.json();
    console.log('   ✅ Stats:', JSON.stringify(data.stats));
  } catch (error) {
    console.log('   ❌ Stats error:', error.message);
  }

  // Test 6: Check config
  console.log('\n6. Checking config...');
  try {
    const config = await fetch(`${WORKER_URL}/api/config`);
    const data = await config.json();
    console.log('   ✅ Trigger word:', data.config?.triggerWord);
    console.log('   ✅ Enabled:', data.config?.enabled);
  } catch (error) {
    console.log('   ❌ Config error:', error.message);
  }

  console.log('\n✨ Testing complete!\n');
}

// Test without Fred trigger
async function testNonTrigger() {
  console.log('\nTesting message without Fred trigger...');
  const event = {
    object: 'page',
    entry: [
      {
        id: '123456789',
        time: Date.now(),
        messaging: [
          {
            sender: { id: '987654321' },
            recipient: { id: '123456789' },
            timestamp: Date.now(),
            message: {
              mid: `test-msg-no-trigger-${Date.now()}`,
              text: 'Just a normal message without any trigger',
            },
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(`${WORKER_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    console.log('✅ Non-trigger message sent (should NOT trigger Fred)');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run tests
testWebhook()
  .then(() => testNonTrigger())
  .catch(console.error);
