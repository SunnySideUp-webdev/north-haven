import Link from "next/link";

export function AuthFrame({
  children,
  description,
  footer,
  title,
}: Readonly<{
  children: React.ReactNode;
  description: string;
  footer?: React.ReactNode;
  title: string;
}>) {
  return (
    <main className="bg-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-10 py-16">
      <div
        aria-hidden="true"
        className="bg-lavender-100 absolute top-0 right-0 h-64 w-[44%] rounded-bl-[88px]"
      />
      <div
        aria-hidden="true"
        className="bg-blush-100 absolute bottom-0 left-0 h-44 w-[34%] rounded-tr-[72px]"
      />
      <section className="bg-paper border-border shadow-surface relative w-full max-w-[520px] rounded-[28px] border px-14 py-12">
        <Link
          href="/"
          className="text-ink inline-block text-[27px] font-bold tracking-[-0.04em]"
        >
          North Haven
        </Link>
        <div className="bg-lavender-200 mt-6 h-1 w-12 rounded-full" />
        <h1 className="text-ink mt-9 text-[36px] leading-tight font-bold tracking-[-0.035em]">
          {title}
        </h1>
        <p className="text-muted mt-3 max-w-md text-[15px] leading-6">
          {description}
        </p>
        <div className="mt-9">{children}</div>
        {footer ? (
          <div className="border-border text-muted mt-9 border-t pt-7 text-sm">
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  );
}
