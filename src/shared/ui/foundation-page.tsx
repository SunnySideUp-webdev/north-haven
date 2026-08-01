import { PageHeader } from "@/shared/ui/page-header";

type FoundationPageProps = {
  title: string;
  description: string;
  sectionTitle: string;
  sectionBody: string;
  actionLabel?: string;
};

export function FoundationPage({
  title,
  description,
  sectionTitle,
  sectionBody,
  actionLabel,
}: FoundationPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          actionLabel ? (
            <button
              type="button"
              className="border-lavender-500 bg-lavender-300 text-lavender-700 hover:bg-lavender-200 min-h-12 rounded-lg border px-6 text-sm font-bold"
            >
              {actionLabel}
            </button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-[1440px] p-8">
        <section className="border-border/70 bg-paper shadow-surface min-h-[520px] rounded-xl border p-10">
          <div className="bg-lavender-50 max-w-2xl rounded-lg p-8">
            <p className="text-muted text-xs font-bold tracking-[0.12em] uppercase">
              Technical foundation
            </p>
            <h2 className="text-ink mt-4 text-xl font-bold">{sectionTitle}</h2>
            <p className="text-muted mt-3 max-w-xl text-sm leading-6">
              {sectionBody}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
