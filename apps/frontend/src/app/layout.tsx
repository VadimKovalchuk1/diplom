// Root layout Next.js App Router. Оборачивает все страницы приложения.
import './globals.css';
import { ReactNode } from 'react';

export const metadata = { title: 'ФНП Blockchain Notary', description: 'Enterprise blockchain notarial workflow demo' };

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return <html lang="ru"><body>{children}</body></html>;
}
