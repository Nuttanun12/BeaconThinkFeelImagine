"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Wrench, Receipt, BarChart3 } from "lucide-react";
import type { Role } from "@/lib/types";

interface BottomNavProps {
  userRole?: Role;
}

export function BottomNav({ userRole: _userRole }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Operations",
      href: "/dashboard",
      icon: LayoutGrid,
      isActive: pathname === "/dashboard" || pathname === "/operations",
    },
    {
      label: "Technician",
      href: "/technician",
      icon: Wrench,
      isActive:
        pathname === "/technician" ||
        pathname.startsWith("/check-in") ||
        pathname.startsWith("/meter-reading"),
    },
    {
      label: "Billing",
      href: "/billing",
      icon: Receipt,
      isActive: pathname.startsWith("/billing"),
    },
    {
      label: "Reports",
      href: "/reports",
      icon: BarChart3,
      isActive: pathname.startsWith("/reports"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200"
      aria-label="Bottom navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={[
                "flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors select-none",
                item.isActive
                  ? "text-blue-600 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium",
              ].join(" ")}
            >
              <Icon
                className={[
                  "w-5 h-5 transition-transform duration-150",
                  item.isActive ? "scale-105 stroke-[2.3]" : "stroke-[1.8]",
                ].join(" ")}
              />
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
