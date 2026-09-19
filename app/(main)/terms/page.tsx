import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";
import { dicts } from "@/lib/i18n";

const URL_RE = /(https?:\/\/[^\s)\]]+)/g;

/** Renders a text paragraph, turning bare URLs (e.g. the Neo ID domain) into links. */
function renderBody(body: string) {
  const parts = body.split(URL_RE);
  return parts.map((part, i) =>
    part.startsWith("http") ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = dicts[locale].termsPage;
  return {
    title: t.title,
    description: t.intro,
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const t = dicts[locale].termsPage;

  return (
    <main className="legal-page">
      <h1 className="legal-page__title">{t.title}</h1>
      <p className="legal-page__updated">{t.updated}</p>
      <p className="legal-page__intro">{t.intro}</p>
      {t.sections.map((section) => (
        <section key={section.heading} className="legal-page__section">
          <h2 className="legal-page__heading">{section.heading}</h2>
          <p className="legal-page__body">{renderBody(section.body)}</p>
        </section>
      ))}
    </main>
  );
}
