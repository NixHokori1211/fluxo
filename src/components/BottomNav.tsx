"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Users, PlusSquare } from "lucide-react";
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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-surface/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link
        href="/feed"
        className={`flex flex-1 items-center justify-center py-3 ${isActive("/feed") ? "text-accent" : "text-foreground/60"}`}
        aria-label="Feed"
      >
        <Home size={24} />
      </Link>

      <Link
        href="/members"
        className={`flex flex-1 items-center justify-center py-3 ${isActive("/members") ? "text-accent" : "text-foreground/60"}`}
        aria-label="Membros"
      >
        <Users size={24} />
      </Link>

      <Link
        href="/post/new"
        className="flex flex-1 items-center justify-center py-3"
        aria-label="Nova publicação"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <PlusSquare size={18} />
        </span>
      </Link>

      <div className="flex flex-1 items-center justify-center py-3 text-foreground/60">
        <NotificationBell userId={userId} initialUnread={hasUnreadNotifications} />
      </div>

      <Link
        href={username ? `/profile/${username}` : "/feed"}
        className="flex flex-1 items-center justify-center py-3"
        aria-label="Meu perfil"
      >
        <div
          className={`relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-accent text-[10px] font-medium text-accent-foreground ${
            isOwnProfile ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
          }`}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" sizes="24px" />
          ) : (
            (username ?? "?").slice(0, 1).toUpperCase()
          )}
        </div>
      </Link>
    </nav>
  );
}
