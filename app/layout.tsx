import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 👇 Updated branding to CareerFirst AI
export const metadata: Metadata = {
  title: "CareerFirst AI",
  description: "Crack interviews and optimize resumes with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-slate-900 antialiased relative min-h-screen bg-slate-50`}>
        
        {/* 1. Soft off-white base with a subtle gray grid pattern */}
        <div className="fixed inset-0 z-[-2] h-full w-full bg-slate-50 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* 2. Refreshing, soft pastel blue glow at the top center */}
        <div className="fixed left-0 right-0 top-0 z-[-1] m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>

        <main className="relative z-10">
          {children}
        </main>

      </body>
    </html>
  );
}