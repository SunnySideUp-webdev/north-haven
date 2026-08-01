"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { primaryNavigation } from "@/shared/content/navigation";

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 flex-1 items-center">
      <nav aria-label="Primary" className="ml-18 flex h-17 items-stretch gap-8">
        {primaryNavigation.map((item) => {
          const isCurrent = isCurrentPath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              className="text-muted hover:text-ink relative flex items-center text-sm font-bold"
            >
              {item.label}
              {isCurrent ? (
                <span
                  aria-hidden="true"
                  className="bg-lavender-300 absolute right-0 bottom-0 left-0 h-1 rounded-t"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="text-muted ml-auto flex items-center gap-8 text-sm font-bold">
        <button
          type="button"
          className="hover:text-ink"
          aria-label="Search work"
        >
          Search
        </button>
        <Link
          href="/settings"
          aria-current={
            isCurrentPath(pathname, "/settings") ? "page" : undefined
          }
          className="hover:text-ink relative flex h-17 items-center"
        >
          Settings
          {isCurrentPath(pathname, "/settings") ? (
            <span
              aria-hidden="true"
              className="bg-lavender-300 absolute right-0 bottom-0 left-0 h-1 rounded-t"
            />
          ) : null}
        </Link>
      </div>
    </div>
  );
}
