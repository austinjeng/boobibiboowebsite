"use client";

import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

interface AppLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function AppLayout({
  children,
  showHeader = true,
  showBottomNav = true,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {showHeader && <Header />}
      <main className="flex-1 pb-16">{children}</main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
