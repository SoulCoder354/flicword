import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export const AppShell = ({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) => (
  <div className="relative min-h-dvh w-full overflow-x-hidden">
    <main className="mx-auto max-w-md px-6 pt-8 pb-32 animate-fade-in">{children}</main>
    {!hideNav && <BottomNav />}
  </div>
);
