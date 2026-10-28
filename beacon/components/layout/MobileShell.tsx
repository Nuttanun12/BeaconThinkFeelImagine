"use client";

import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import type { Role } from "@/lib/types";

interface MobileShellProps {
  children: ReactNode;
  userName: string;
  userRole: Role;
}

export function MobileShell({ children, userName, userRole }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-slate-100/60 flex justify-center text-slate-900 font-sans antialiased">
      <div className="w-full max-w-md min-h-screen bg-[#f8fafc] border-x border-slate-200/60 shadow-xl flex flex-col relative pb-20">
        <AppHeader userName={userName} userRole={userRole} />
        <main className="flex-1 px-4 py-4 space-y-4">
          {children}
        </main>
        <BottomNav userRole={userRole} />
      </div>
    </div>
  );
}
