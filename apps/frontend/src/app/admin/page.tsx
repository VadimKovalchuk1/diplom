// Admin panel объясняет модель ролей и в будущем будет управлять пользователями.
import { Shell } from '@/components/Shell';

const roles = ['SUPER_ADMIN', 'FEDERAL_CHAMBER_ADMIN', 'REGIONAL_CHAMBER_ADMIN', 'NOTARY', 'AUDITOR', 'VERIFIER'];

export default function Admin(): JSX.Element {
  return <Shell><h2 className="text-2xl font-bold">User & role management</h2><div className="mt-6 rounded-xl bg-white p-6 shadow"><p className="text-slate-600">Выдача и отзыв ролей синхронизируются с smart contract access control.</p><div className="mt-4 flex flex-wrap gap-2">{roles.map((r) => <span className="rounded-full bg-slate-100 px-3 py-1 text-sm" key={r}>{r}</span>)}</div></div></Shell>;
}
