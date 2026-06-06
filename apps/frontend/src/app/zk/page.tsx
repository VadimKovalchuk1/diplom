'use client';
// Страница демонстрации Zero-Knowledge proof.
import { Shell } from '@/components/Shell';
import { useState } from 'react';

export default function Zk(): JSX.Element {
  const [done, setDone] = useState(false);
  return <Shell><h2 className="text-2xl font-bold">Zero-Knowledge verification</h2><div className="mt-6 rounded-xl bg-white p-6 shadow"><p className="text-slate-600">zk-SNARK доказывает владение и существование документа без раскрытия содержимого.</p><button onClick={() => setDone(true)} className="mt-4 rounded bg-federal px-5 py-3 text-white">Сгенерировать proof</button>{done && <pre className="mt-4 overflow-auto rounded bg-slate-900 p-4 text-green-300">proof verified: true\npublicSignals: [documentCommitment, ownerCommitment]</pre>}</div></Shell>;
}
