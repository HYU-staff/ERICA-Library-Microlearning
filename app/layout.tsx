import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "학술정보관 조각공부 | 나에게 맞는 도서관 이용자 교육",
  description: "신분과 이용 수준에 맞는 도서관 교육 영상을 추천받고 한곳에서 학습하세요.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
