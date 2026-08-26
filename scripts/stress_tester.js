/**
 * CBRS-X High-Concurrency Telemetry Stress Tester & Multi-Responder Fleet Simulator
 * Simulates concurrent NDRF responders streaming sensor telemetry, equipment donning,
 * casualty rescues, and decontamination passes to test API latency and broker throughput.
 *
 * Usage: node scripts/stress_tester.js [responders=25] [eventsPerResponder=20] [targetUrl=http://localhost:8080]
 */

const http = require('http');
const https = require('https');

const NUM_RESPONDERS = parseInt(process.argv[2], 10) || 25;
const EVENTS_PER_RESPONDER = parseInt(process.argv[3], 10) || 20;
const BASE_URL = process.argv[4] || 'http://localhost:8080';

const SCENARIOS = ['CBRN-CHEM-01', 'CBRN-RAD-02', 'CBRN-BIO-03'];
const SQUADS = ['alpha', 'bravo', 'charlie'];

const EVENT_TYPES = [
  'ppe_level_a_verified',
  'detector_ppm_sweep',
  'leak_source_identified',
  'casualty_evacuated',
  'clamp_applied',
  'decontamination_washdown_completed',
];

function sendRequest(endpoint, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;

    const payload = data ? JSON.stringify(data) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const startTime = Date.now();
    const req = client.request(
      url,
      {
        method,
        headers: reqHeaders,
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const duration = Date.now() - startTime;
          resolve({ status: res.statusCode, body, duration });
        });
      }
    );

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message, duration: Date.now() - startTime });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408, error: 'Request Timeout', duration: Date.now() - startTime });
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function runResponderSession(responderIndex) {
  const traineeId = `stress-trn-${responderIndex + 1}`;
  const squadId = SQUADS[responderIndex % SQUADS.length];
  const scenarioCode = SCENARIOS[responderIndex % SCENARIOS.length];
  const results = { passed: 0, failed: 0, totalLatency: 0 };

  // 1. Initialize Session
  const startRes = await sendRequest('/api/sessions/start', 'POST', {
    traineeId,
    traineeName: `Stress Responder ${responderIndex + 1}`,
    batchUnit: '10th NDRF Battalion',
    scenarioCode,
    squadId,
  });

  if (startRes.status !== 200) {
    results.failed += EVENTS_PER_RESPONDER;
    return results;
  }

  let sessionId = null;
  try {
    sessionId = JSON.parse(startRes.body).sessionId;
  } catch {
    sessionId = `sess-stress-${responderIndex}`;
  }

  // 2. Stream High-Frequency Telemetry Events
  for (let i = 0; i < EVENTS_PER_RESPONDER; i++) {
    const eventType = EVENT_TYPES[i % EVENT_TYPES.length];
    const eventData = {
      sequence: i,
      sensorValue: Math.round((Math.random() * 500 + 10) * 10) / 10,
      scbaPsi: 3000 - i * 50,
      heartRate: 110 + Math.floor(Math.random() * 40),
      timestamp: new Date().toISOString(),
    };

    const eventRes = await sendRequest('/api/events/log', 'POST', {
      sessionId,
      eventType,
      eventData: JSON.stringify(eventData),
      timestamp: new Date().toISOString(),
    });

    results.totalLatency += eventRes.duration;
    if (eventRes.status === 200) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Micro-delay between events (20-50ms)
    await new Promise((r) => setTimeout(r, Math.random() * 30 + 20));
  }

  // 3. Finalize Session
  await sendRequest(`/api/sessions/${sessionId}/complete`, 'POST');
  return results;
}

async function main() {
  console.log(`================================================================================`);
  console.log(`[CBRS-X FLEET SIMULATOR & TELEMETRY STRESS TESTER]`);
  console.log(`Target Host           : ${BASE_URL}`);
  console.log(`Concurrent Responders : ${NUM_RESPONDERS}`);
  console.log(`Events / Responder    : ${EVENTS_PER_RESPONDER}`);
  console.log(`Total Event Stream    : ${NUM_RESPONDERS * EVENTS_PER_RESPONDER} events`);
  console.log(`================================================================================`);

  const globalStart = Date.now();
  const tasks = [];

  for (let i = 0; i < NUM_RESPONDERS; i++) {
    tasks.push(runResponderSession(i));
  }

  const allResults = await Promise.all(tasks);
  const totalElapsed = (Date.now() - globalStart) / 1000;

  let totalPassed = 0;
  let totalFailed = 0;
  let accumulatedLatency = 0;

  for (const r of allResults) {
    totalPassed += r.passed;
    totalFailed += r.failed;
    accumulatedLatency += r.totalLatency;
  }

  const totalReqs = totalPassed + totalFailed;
  const avgLatency = totalReqs > 0 ? (accumulatedLatency / totalReqs).toFixed(2) : 0;
  const throughput = (totalReqs / totalElapsed).toFixed(2);

  console.log(`\n================================================================================`);
  console.log(`[STRESS TEST RESULTS SUMMARY]`);
  console.log(`Total Runtime         : ${totalElapsed.toFixed(2)}s`);
  console.log(`Successful Ingestions : ${totalPassed}`);
  console.log(`Failed Ingestions     : ${totalFailed}`);
  console.log(`Success Rate          : ${((totalPassed / (totalReqs || 1)) * 100).toFixed(2)}%`);
  console.log(`Average API Latency   : ${avgLatency} ms`);
  console.log(`Throughput            : ${throughput} req/sec`);
  console.log(`================================================================================\n`);
}

main().catch(console.error);
