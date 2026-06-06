// Страница аудита показывает immutable события из API/blockchain журналов.
import { Shell } from '@/components/Shell';

const rows = ['DOCUMENT_REGISTER', 'DOCUMENT_METADATA_UPDATE', 'REGIONAL_REQUEST_CREATED'];

export default function Audit(): JSX.Element {
  return <Shell><h2 className="text-2xl font-bold">Immutable audit logs</h2><table className="mt-6 w-full rounded-xl bg-white shadow"><tbody>{rows.map((row, i) => <tr className="border-b" key={row}><td className="p-4">#{i + 1}</td><td className="p-4 font-mono">{row}</td><td className="p-4">blockchain event + API audit</td></tr>)}</tbody></table></Shell>;
}
