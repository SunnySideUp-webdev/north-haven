import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description: React.ReactNode;
  intention?: string;
  action?: React.ReactNode;
  align?: "center" | "left";
  backLink?: {
    href: string;
    label: string;
  };
  titleSize?: "compact" | "default";
};

export function PageHeader({
  title,
  description,
  intention,
  action,
  align = "left",
  backLink,
  titleSize = "default",
}: PageHeaderProps) {
  const centered = align === "center";
  const splitLayout = Boolean(action) && !centered;

  return (
    <section className="border-blush-200 bg-lavender-100 border-b-2">
      <div
        className={`mx-auto grid min-h-38 max-w-[1440px] items-center gap-x-10 gap-y-6 px-14 py-8 ${
          splitLayout
            ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto]"
            : "grid-cols-1"
        }`}
      >
        <div
          className={`min-w-0 ${centered ? "justify-self-center text-center" : "text-left"}`}
        >
          {backLink ? (
            <Link
              href={backLink.href}
              className="group text-lavender-700 hover:text-ink inline-flex items-center text-sm font-bold transition-colors"
            >
              <span
                aria-hidden="true"
                className="transition-transform group-hover:-translate-x-0.5"
              >
                ←
              </span>
              <span className="ml-2">{backLink.label}</span>
            </Link>
          ) : null}
          <h1
            className={`text-ink font-bold break-words ${
              backLink ? "mt-4" : ""
            } ${
              titleSize === "compact"
                ? "text-[34px] leading-[1.12] tracking-[-0.035em]"
                : "text-[42px] leading-none tracking-[-0.045em]"
            }`}
          >
            {title}
          </h1>
          <p className="text-muted mt-4 text-sm">{description}</p>
          {intention ? (
            <p className="text-muted mt-3 text-xs">{intention}</p>
          ) : null}
        </div>
        {action ? (
          <div
            className={`max-w-full ${centered ? "justify-self-center" : "justify-self-end"}`}
          >
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}
