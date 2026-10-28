"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Radio, LogOut, LayoutGrid, Wrench, Receipt, BarChart3, X } from "lucide-react";
import type { Role } from "@/lib/types";

interface AppHeaderProps {
  userName: string;
  userRole: Role;
}

const ROLE_LABEL: Record<Role, string> = {
  operations_director: "Operations Director",
  technician: "Field Technician",
  household: "Household",
};

export function AppHeader({ userName, userRole }: AppHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5">
        <div className="flex items-center justify-between">
          {/* Hamburger button */}
          <button
            type="button"
            onClick={() => setShowSideDrawer(true)}
            className="p-1.5 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Center Logo */}
          <Link
            href={userRole === "operations_director" ? "/dashboard" : "/technician"}
            className="flex items-center gap-2 group select-none"
          >
            <Radio className="w-5 h-5 text-blue-600 stroke-[2.4]" />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-[15px] tracking-[0.14em] text-slate-900 leading-none">
                BEACON
              </span>
              <span className="text-[8.5px] font-bold tracking-[0.22em] text-slate-500 leading-tight mt-0.5">
                UTILITY GRID
              </span>
            </div>
          </Link>

          {/* User avatar + dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-blue-500/20"
              aria-label="User profile"
            >
              <span className="text-xs font-bold">{userName.charAt(0)}</span>
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 text-sm leading-tight">{userName}</p>
                    <p className="text-blue-600 font-semibold text-[11px] mt-0.5">{ROLE_LABEL[userRole]}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <LayoutGrid className="w-4 h-4 text-slate-400" />
                      Operations Console
                    </Link>
                    <Link
                      href="/technician"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Wrench className="w-4 h-4 text-slate-400" />
                      Technician Field View
                    </Link>
                    <Link
                      href="/billing"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Receipt className="w-4 h-4 text-slate-400" />
                      Billing &amp; Payments
                    </Link>
                    <Link
                      href="/reports"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      Donor Impact Reporting
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <form action="/api/auth/signout" method="POST">
                      <button
                        type="submit"
                        className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Side Drawer Modal */}
      {showSideDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowSideDrawer(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-50 p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-600 stroke-[2.4]" />
                <span className="font-black text-sm tracking-wider text-slate-900">
                  BEACON UTILITY
                </span>
              </div>
              <button
                onClick={() => setShowSideDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-1 flex-1">
              <Link
                href="/dashboard"
                onClick={() => setShowSideDrawer(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-800 hover:bg-slate-50 font-bold text-xs"
              >
                <LayoutGrid className="w-4 h-4 text-blue-600" />
                Operations Console
              </Link>
              <Link
                href="/technician"
                onClick={() => setShowSideDrawer(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-800 hover:bg-slate-50 font-bold text-xs"
              >
                <Wrench className="w-4 h-4 text-blue-600" />
                Technician Field Entry
              </Link>
              <Link
                href="/billing"
                onClick={() => setShowSideDrawer(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-800 hover:bg-slate-50 font-bold text-xs"
              >
                <Receipt className="w-4 h-4 text-blue-600" />
                Billing &amp; Payments
              </Link>
              <Link
                href="/reports"
                onClick={() => setShowSideDrawer(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-800 hover:bg-slate-50 font-bold text-xs"
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Donor Impact Reporting
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="mb-3 px-1">
                <p className="font-bold text-xs text-slate-900">{userName}</p>
                <p className="text-[11px] text-slate-500">{ROLE_LABEL[userRole]}</p>
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
