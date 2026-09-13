"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Upload, PenLine, BookOpen, AlertCircle } from "lucide-react";
import SignOutButton from "./SignOutButton";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/upload", label: "Upload Materi", icon: Upload },
  { href: "/practice/setup", label: "Latihan", icon: PenLine },
  { href: "/belajar", label: "Mode Belajar", icon: BookOpen },
  { href: "/practice/review", label: "Perlu Diulang", icon: AlertCircle },
];

export default function TopNav({ reviewCount = 0 }: { reviewCount?: number }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-line bg-white">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-sage text-white flex items-center justify-center font-voice text-base">
          学
        </div>
        <span className="font-medium text-sm text-ink">Nihongo Practice</span>
      </Link>
      <div className="flex items-center gap-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href.split("?")[0]);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] ${
                active ? "bg-sage-soft text-sage-dark" : "text-muted hover:text-ink"
              }`}
            >
              <item.icon size={15} />
              {item.label}
              {item.href === "/practice/review" && reviewCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-accentRed text-white text-[10px] flex items-center justify-center">
                  {reviewCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <SignOutButton />
    </div>
  );
}
