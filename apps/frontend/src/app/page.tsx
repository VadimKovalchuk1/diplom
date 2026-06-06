// Стартовая страница входа. Для демонстрации кнопка ведёт сразу в dashboard.
import Link from 'next/link';

export default function LoginPage(): JSX.Element {
  return <main className="flex min-h-screen items-center justify-center"><section className="w-full max-w-xl rounded-2xl bg-white p-10 shadow"><h1 className="text-3xl font-bold">Вход в платформу ФНП</h1><p className="mt-3 text-slate-600">JWT + wallet-signature authentication для нотариусов, аудиторов и администраторов палат.</p><Link className="mt-8 inline-flex rounded bg-federal px-5 py-3 text-white" href="/dashboard">Демо-вход</Link></section></main>;
}
