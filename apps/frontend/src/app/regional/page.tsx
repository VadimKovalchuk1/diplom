// Страница межрегиональных запросов демонстрирует маршрутизацию документов между палатами.
import { Shell } from '@/components/Shell';

export default function Regional(): JSX.Element {
  return <Shell><h2 className="text-2xl font-bold">Межрегиональный документооборот</h2><div className="mt-6 grid gap-4"><div className="rounded-xl bg-white p-5 shadow">Москва → Санкт-Петербург · IN_REVIEW</div><div className="rounded-xl bg-white p-5 shadow">Татарстан → Москва · APPROVED</div></div></Shell>;
}
