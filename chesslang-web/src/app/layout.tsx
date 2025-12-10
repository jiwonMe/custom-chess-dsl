import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/shared/Header';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ChessLang - 코드로 체스 변형 만들기',
  description:
    'ChessLang은 커스텀 체스 변형을 쉽게 만들 수 있는 도메인 특화 언어입니다.',
  keywords: ['체스', 'DSL', '프로그래밍 언어', '체스 변형', '게임 개발', 'chess'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
