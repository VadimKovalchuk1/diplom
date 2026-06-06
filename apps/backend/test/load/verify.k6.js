import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 10, duration: '30s' };

export default function () {
  const payload = JSON.stringify({ documentId: '0x' + '1'.repeat(64), sha256: '2'.repeat(64) });
  const response = http.post('http://localhost:3001/api/v1/documents/verify', payload, { headers: { 'Content-Type': 'application/json' } });
  check(response, { 'status is 2xx/4xx under load': (r) => r.status >= 200 && r.status < 500 });
  sleep(1);
}
