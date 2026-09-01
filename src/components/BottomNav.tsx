"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Heart } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function BottomNav({
  userId,
  username,
  avatarUrl,
  hasUnreadNotifications,
}: {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  hasUnreadNotifications: boolean;
}) {
  const pathname = usePathname();

  // Em conversas individuais o teclado/input já ocupam a base da tela —
  // esconde a barra pra não sobrepor.
  if (pathname.startsWith("/messages/")) return null;

  const isActive = (href: string) => pathname === href;
  const isOwnProfile = !!username && pathname === `/profile/${username}`;

  const iconClass = (active: boolean) =>
    `transition-colors ${active ? "text-foreground" : "text-foreground/45"}`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-white/10 bg-surface/55 backdrop-blur-2xl backdrop-saturate-150"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center justify-around">
      <Link href="/feed" className="flex flex-1 items-center justify-center py-3.5" aria-label="Início">
        <Home size={25} strokeWidth={isActive("/feed") ? 2.5 : 1.8} className={iconClass(isActive("/feed"))} />
      </Link>

      <Link href="/members" className="flex flex-1 items-center justify-center py-3.5" aria-label="Buscar">
        <Search
          size={25}
          strokeWidth={isActive("/members") ? 2.5 : 1.8}
          className={iconClass(isActive("/members"))}
        />
      </Link>

      <Link href="/post/new" className="flex flex-1 items-center justify-center py-3.5" aria-label="Criar">
        <Plus size={26} strokeWidth={1.8} className={iconClass(isActive("/post/new"))} />
      </Link>

      <div className="flex flex-1 items-center justify-center py-3.5">
        <NotificationBell
          userId={userId}
          initialUnread={hasUnreadNotifications}
          icon={Heart}
          size={25}
          className={`relative ${iconClass(isActive("/notifications"))}`}
        />
      </div>

      <Link href={username ? `/profile/${username}` : "/feed"} className="flex flex-1 items-center justify-center py-3.5" aria-label="Perfil">
        <div
          className={`relative flex h-[26px] w-[26px] items-center justify-center overflow-hidden rounded-full bg-accent text-[10px] font-medium text-accent-foreground ${
            isOwnProfile ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-70"
          }`}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" sizes="26px" />
          ) : (
            (username ?? "?").slice(0, 1).toUpperCase()
          )}
        </div>
      </Link>
      </div>
    </nav>
  );
}
