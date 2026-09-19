// Server-only. Renders a schema.org JSON-LD block that React 19 hoists into
// the document head. `<` is escaped so a malicious/quirky title can never
// break out of the script tag.

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
