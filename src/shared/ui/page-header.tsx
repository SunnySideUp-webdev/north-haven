type PageHeaderProps = {
  title: string;
  description: React.ReactNode;
  intention?: string;
  action?: React.ReactNode;
  align?: "center" | "left";
};

export function PageHeader({
  title,
  description,
  intention,
  action,
  align = "left",
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <section className="border-blush-200 bg-lavender-100 border-b-2">
      <div
        className={`relative mx-auto flex min-h-38 max-w-[1440px] flex-col justify-center px-14 py-8 ${
          centered ? "items-center text-center" : "items-start"
        }`}
      >
        <h1 className="text-ink text-[42px] leading-none font-bold tracking-[-0.045em]">
          {title}
        </h1>
        <p className="text-muted mt-5 text-sm">{description}</p>
        {intention ? (
          <p className="text-muted mt-3 text-xs">{intention}</p>
        ) : null}
        {action ? (
          <div className="absolute top-1/2 right-14 -translate-y-1/2">
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}
