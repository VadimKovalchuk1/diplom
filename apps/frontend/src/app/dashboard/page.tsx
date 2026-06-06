// Dashboard показывает руководителю/нотариусу быстрые показатели системы.
import { Shell } from '@/components/Shell';
import { StatCard } from '@/components/StatCard';

export default function Dashboard(): JSX.Element {
  return <Shell><h2 className="text-2xl font-bold">Операционный dashboard</h2><div className="mt-6 grid grid-cols-3 gap-4"><StatCard label="Документы в реестре" value="1 284" /><StatCard label="Межрегиональные запросы" value="37" tone="amber" /><StatCard label="ZK проверок" value="412" tone="green" /></div><section className="mt-8 rounded-xl bg-white p-6 shadow"><h3 className="font-semibold">Архитектура</h3><p className="mt-2 text-slate-600">Документы шифруются off-chain, CID хранится в IPFS, hash и metadata commitment фиксируются в permissioned Ethereum-compatible сети.</p></section></Shell>;
}
