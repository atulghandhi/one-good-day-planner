export const SITE_URL = "https://www.onegoodday.work";
export const SITE_NAME = "One Good Day";

export function seoHead({
  title,
  description,
  path,
  noindex = false,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
}) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: noindex ? "noindex, follow" : "index, follow, max-image-preview:large",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: type },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function jsonLd(value: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(value).replace(/</g, "\\u003c") };
}
