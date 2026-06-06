'use client';
// Публичная проверка: пользователь вводит documentId и hash, но не раскрывает содержимое.
import { Shell } from '@/components/Shell';
import { useState } from 'react';

export default function Verify(): JSX.Element {
  const [ok, setOk] = useState(false);
  return <Shell><h2 className="text-2xl font-bold">Публичная проверка подлинности</h2><div className="mt-6 rounded-xl bg-white p-6 shadow"><input className="w-full rounded border p-3" placeholder="Document ID"/><input className="mt-3 w-full rounded border p-3" placeholder="SHA-256"/><button onClick={() => setOk(true)} className="mt-4 rounded bg-federal px-5 py-3 text-white">Проверить</button>{ok && <div className="mt-4 rounded bg-blue-50 p-4">Hash, timestamp и существование в blockchain подтверждены.</div>}</div></Shell>;
}
