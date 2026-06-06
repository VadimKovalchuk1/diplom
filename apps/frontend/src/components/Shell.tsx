// Shell — общий каркас интерфейса: левое меню + рабочая область.
// Все страницы админки используют этот компонент, чтобы интерфейс выглядел единообразно.
import Link from 'next/link';
import { ReactNode } from 'react';

// Список разделов системы. as const фиксирует строки как неизменяемые литералы TypeScript.
const items = [
  ['Панель', '/dashboard'],
  ['Регистрация', '/documents/register'],
  ['Проверка', '/verify'],
  ['Аудит', '/audit'],
  ['Регионы', '/regional'],
  ['Администрирование', '/admin'],
  ['ZK', '/zk']
] as const;

export function Shell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen">
      {/* aside — постоянное навигационное меню enterprise-приложения. */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-federal text-white p-6">
        <h1 className="text-xl font-bold">ФНП Blockchain</h1>
        <p className="mt-2 text-sm text-blue-100">Распределённый нотариальный документооборот</p>
        <nav className="mt-8 space-y-2">
          {items.map(([label, href]) => <Link className="block rounded px-3 py-2 hover:bg-white/10" href={href} key={href}>{label}</Link>)}
        </nav>
      </aside>
      {/* main сдвинут вправо на ширину sidebar. */}
      <main className="ml-72 p-8">{children}</main>
    </div>
  );
}
