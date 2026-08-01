import Link from "next/link";

import { signOutAction } from "@/server/auth/actions";
import { PrimaryNavigation } from "@/shared/ui/primary-navigation";

export function AppShell({
  children,
  displayName,
}: Readonly<{ children: React.ReactNode; displayName: string }>) {
  return (
    <div className="bg-canvas min-h-screen">
      <a
        href="#main-content"
        className="bg-paper text-ink shadow-surface fixed top-3 left-3 z-50 -translate-y-20 rounded-md px-4 py-2 text-sm font-bold focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="border-t-blush-200 border-b-border bg-paper/95 sticky top-0 z-40 border-t-4 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-17 max-w-[1440px] items-center px-10">
          <Link
            href="/today"
            className="text-ink shrink-0 text-[25px] font-bold tracking-[-0.04em]"
          >
            North Haven
          </Link>
          <PrimaryNavigation />
          <div className="border-border ml-7 flex items-center gap-4 border-l pl-7">
            <span className="text-muted max-w-32 truncate text-sm font-bold">
              {displayName}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-muted hover:text-ink text-sm font-bold"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}
