// StatCard — маленькая карточка KPI на dashboard.
export function StatCard({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'green' | 'amber' }): JSX.Element {
  // Цвет выбирается по tone, чтобы разные показатели визуально отличались.
  const colors = { blue: 'border-blue-200 bg-blue-50', green: 'border-green-200 bg-green-50', amber: 'border-amber-200 bg-amber-50' };
  return <div className={`rounded-xl border p-5 shadow-sm ${colors[tone]}`}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>;
}
