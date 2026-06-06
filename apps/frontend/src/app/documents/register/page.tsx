'use client';
// Страница подготовки регистрации документа. В реальном режиме она будет вызывать API,
// затем просить MetaMask подписать blockchain-транзакцию.
import { Shell } from '@/components/Shell';
import { useState } from 'react';

export default function RegisterDocument(): JSX.Element {
  const [result, setResult] = useState('');
  return <Shell><h2 className="text-2xl font-bold">Регистрация документа</h2><form className="mt-6 max-w-2xl rounded-xl bg-white p-6 shadow" onSubmit={(e) => { e.preventDefault(); setResult('Документ зашифрован, CID создан, blockchain transaction ожидает подписи'); }}><label className="block text-sm font-medium">Файл</label><input className="mt-2 w-full rounded border p-3" type="file" /><label className="mt-4 block text-sm font-medium">Региональная палата</label><input className="mt-2 w-full rounded border p-3" placeholder="77" /><button className="mt-6 rounded bg-federal px-5 py-3 text-white">Зарегистрировать hash</button>{result && <p className="mt-4 rounded bg-green-50 p-3 text-green-700">{result}</p>}</form></Shell>;
}
