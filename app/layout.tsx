import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getMetadataBase, ogLocaleOf } from "@/lib/metadata";
import { TosModal } from "@/components/ui/TosModal";
import { DataLoaderBar } from "@/components/ui/DataLoaderBar";
import { ScrollTopButton } from "@/components/ui/ScrollTopButton";
import { Providers } from "@/app/providers";
import { getLocale } from "@/lib/i18n-server";
import { SITE_NAME, dicts } from "@/lib/i18n";
import { getConfig } from "@/lib/constants/config";
import NextTopLoader from "nextjs-toploader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = dicts[locale];
  const description =
    locale === "ru"
      ? "NeoWatch — каталог фильмов и сериалов: описания, рейтинги, актёры, трейлеры, жанры и даты выхода."
      : locale === "uk"
        ? "NeoWatch — каталог фільмів і серіалів: описи, рейтинги, актори, трейлери, жанри та дати виходу."
        : "NeoWatch — a catalog of movies and TV shows: synopses, ratings, cast, trailers, genres and release dates.";

  return {
    metadataBase: await getMetadataBase(),
    title: {
      default: `${SITE_NAME} - ${t.meta.home}`,
      template: `%s - ${SITE_NAME}`,
    },
    description,
    alternates: { canonical: "/" },
    icons: {
      icon: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: `${SITE_NAME} - ${t.meta.home}`,
      description,
      type: "website",
      url: "/",
      siteName: SITE_NAME,
      locale: ogLocaleOf(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} - ${t.meta.home}`,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const { showHitboxes, apiUrl } = getConfig();

  let apiOrigin = "";
  try { apiOrigin = new URL(apiUrl).origin; } catch { /* ignore invalid */ }

  return (
    <html
      lang={locale}
      className={`${geistSans.variable}${showHitboxes ? " show-focus-hitbox" : ""}`}
      style={{ colorScheme: "dark" }}
    >
      <head>
        {apiOrigin && (
          <>
            <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={apiOrigin} />
          </>
        )}
      </head>
      <body className="app-body">
        <NextTopLoader
          color="linear-gradient(to right, #c3dbe3, #626e97, #8b5cf6)"
          height={2}
          showSpinner={false}
          shadow={false}
        />
        <Providers initialLocale={locale}>
          {children}
          <DataLoaderBar />
          <ScrollTopButton />
          <TosModal />
        </Providers>
      </body>
    </html>
  );
}
