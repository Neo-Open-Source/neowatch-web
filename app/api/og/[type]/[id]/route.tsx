import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Jimp } from "jimp";
import { dicts, normalizeLangParam, SITE_NAME, type Locale } from "@/lib/i18n";
import { toApiLanguage, type MovieDetails, type TVDetails } from "@/lib/api/types";
import { releaseYear } from "@/lib/utils/media-format";
import { getMediaDetail } from "@/lib/api/server-data";

// ─── Card geometry ──────────────────────────────────────────────────────────

export const size = { width: 1200, height: 628 };
export const contentType = "image/png";

const POSTER_W = 540;
const PANEL_W = 680;
const TEXT_PADDING = { top: 48, right: 40, bottom: 44, left: 56 };

/** Cover seam, relative to the cover's left edge: a straight diagonal, top
 * edge further right (like the reference), with a thin softened edge. */
const SEAM_TOP = 130;
const SEAM_BOTTOM = 78;
const SEAM_SOFTNESS = 26;

/** The blurred layer is composed at a fraction of the card size and upscaled
 * afterwards — visually identical, an order of magnitude less CPU (blur and
 * per-pixel loops dominate the render time on Vercel). */
const BLUR_LAYER_SCALE = 1 / 3;
const BLUR_RADIUS = 6; // at blur-layer resolution

// ─── Design tokens ──────────────────────────────────────────────────────────

const COLORS = {
  panel: "#2c323a",
  gold: "#e9b558",
  white: "#ffffff",
  meta: "rgba(255,255,255,0.72)",
  textShadow: "0 2px 14px rgba(0,0,0,0.45)",
  /** Dim overlay tint over the blurred backdrop. */
  dim: { r: 44, g: 50, b: 58, alpha: 150 },
  /** Brightness/saturation dimming of the blurred backdrop itself. */
  backdrop: { brightness: 0.78, saturation: 0.88 },
} as const;

const FONT = { name: "Nunito", weights: { regular: 400, semiBold: 600, extraBold: 800 } } as const;

const fontCache: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 600 | 800 }[]> = (async () => {
  const load = async (file: string, weight: 400 | 600 | 800) => ({
    name: FONT.name,
    data: (await readFile(join(process.cwd(), "assets/fonts", file))).buffer as ArrayBuffer,
    weight,
  });
  return Promise.all([
    load("Nunito-Regular.ttf", FONT.weights.regular),
    load("Nunito-SemiBold.ttf", FONT.weights.semiBold),
    load("Nunito-ExtraBold.ttf", FONT.weights.extraBold),
  ]);
})();

// ─── Data helpers ───────────────────────────────────────────────────────────

function posterUrl(data: MovieDetails | TVDetails): string | null {
  return data.poster ? data.poster.replace("/w500/", "/w780/") : null;
}

/** Wide backdrop for the blurred left side (falls back to the poster). */
function backdropUrl(data: MovieDetails | TVDetails): string | null {
  return data.backdrop ?? posterUrl(data);
}

function metaLine(type: "movie" | "tv", data: MovieDetails | TVDetails, t: (typeof dicts)[Locale]["og"]): string {
  return [releaseYear(data.releaseDate), type === "movie" ? t.movie : t.tv].filter(Boolean).join(" • ");
}

function genreList(data: MovieDetails | TVDetails, max = 4): string[] {
  return (data.genres ?? []).slice(0, max).map((g) => g.name).filter(Boolean);
}

function scoreLabel(data: MovieDetails | TVDetails): string | null {
  return data.voteAverage > 0 ? `${Math.min(10, data.voteAverage).toFixed(1)}/10` : null;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Bigger type for shorter titles. */
function titleStyle(title: string): { fontSize: number; lineHeight: number } {
  if (title.length <= 16) return { fontSize: 60, lineHeight: 1.12 };
  if (title.length <= 28) return { fontSize: 50, lineHeight: 1.15 };
  if (title.length <= 44) return { fontSize: 40, lineHeight: 1.18 };
  return { fontSize: 32, lineHeight: 1.2 };
}

// ─── Image compositing ──────────────────────────────────────────────────────

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Blur layer at reduced resolution, dimmed, upscaled back to card size. */
async function blurredBackdropLayer(source: Buffer) {
  const w = Math.round(size.width * BLUR_LAYER_SCALE);
  const h = Math.round(size.height * BLUR_LAYER_SCALE);

  const layer = (await Jimp.read(source)).cover({ w, h });
  const { brightness, saturation } = COLORS.backdrop;
  const px = layer.bitmap.data;
  for (let i = 0; i < px.length; i += 4) {
    px[i] = Math.round(px[i] * brightness);
    px[i + 1] = Math.round(px[i + 1] * brightness);
    px[i + 2] = Math.round(px[i + 2] * (2 - saturation)); // 1 - (saturation - 1)
  }
  layer.blur(BLUR_RADIUS);

  return layer.resize({ w: size.width, h: size.height });
}

/** Semi-transparent tint over the backdrop, fading out before the cover's
 * diagonal seam. Also composed small and upscaled. */
function dimLayer() {
  const w = Math.round(size.width * BLUR_LAYER_SCALE);
  const h = Math.round(size.height * BLUR_LAYER_SCALE);
  const scale = w / size.width;
  const coverLeft = (size.width - POSTER_W) * scale;
  const { r, g, b, alpha } = COLORS.dim;
  const FADE_START = 90 * scale;
  const FADE_END = 10 * scale;

  const dim = new Jimp({ width: w, height: h, color: 0x00000000 });
  const raw = dim.bitmap.data;
  for (let y = 0; y < h; y++) {
    const t = y / Math.max(1, h - 1);
    const seam = coverLeft + (SEAM_TOP + (SEAM_BOTTOM - SEAM_TOP) * t) * scale;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] =
        x < seam - FADE_START
          ? alpha
          : x < seam - FADE_END
            ? Math.round(alpha * (1 - smoothstep((x - (seam - FADE_START)) / (FADE_START - FADE_END))))
            : 0;
    }
  }

  return dim.resize({ w: size.width, h: size.height });
}

/** Upright poster with the diagonal left edge, slightly softened. */
async function featheredCover(source: Buffer) {
  const img = (await Jimp.read(source)).cover({ w: POSTER_W, h: size.height });
  const { data } = img.bitmap;

  for (let y = 0; y < size.height; y++) {
    const t = y / Math.max(1, size.height - 1);
    const seam = SEAM_TOP + (SEAM_BOTTOM - SEAM_TOP) * t;
    const fadeStart = seam - SEAM_SOFTNESS;
    for (let x = 0; x < Math.min(POSTER_W, seam + SEAM_SOFTNESS); x++) {
      data[(y * POSTER_W + x) * 4 + 3] = Math.round(
        data[(y * POSTER_W + x) * 4 + 3] * smoothstep((x - fadeStart) / SEAM_SOFTNESS)
      );
    }
  }

  return img;
}

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** Blur layer + dim + cover, composed in one pass and inlined as a data URI. */
async function composeBackdrop(blurSource: Buffer, coverSource: Buffer): Promise<string> {
  const [blurred, cover] = await Promise.all([blurredBackdropLayer(blurSource), featheredCover(coverSource)]);
  blurred.composite(dimLayer(), 0, 0);
  blurred.composite(cover, size.width - POSTER_W, 0);

  const jpeg = await blurred.getBuffer("image/jpeg", { quality: 88 });
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

async function fetchBackdrop(data: MovieDetails | TVDetails): Promise<string | null> {
  const coverUrl = posterUrl(data);
  if (!coverUrl) return null;
  const blurUrl = backdropUrl(data) ?? coverUrl;

  const [blurBuf, coverBuf] = await Promise.all([fetchImage(blurUrl), fetchImage(coverUrl)]);
  if (!blurBuf || !coverBuf) return null;

  return composeBackdrop(blurBuf, coverBuf);
}

// ─── UI pieces ──────────────────────────────────────────────────────────────

function Star() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true">
      {/* Rounded-tip star (heroicons solid) */}
      <path
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.578.65 2.347l-4.12 3.166 1.26 5.254a1.08 1.08 0 01-1.617 1.143L12 18.35l-4.491 2.7a1.08 1.08 0 01-1.617-1.143l1.26-5.254-4.12-3.166c-.986-.77-.513-2.254.65-2.347l5.404-.434 2.082-5.005z"
        fill={COLORS.gold}
      />
    </svg>
  );
}

function GenrePill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 22px",
        borderRadius: 999,
        // Darker than before: light translucent pills vanish when the card is
        // scaled down in chat previews (Telegram/Discord show it ~400px wide).
        background: "rgba(14,17,21,0.55)",
        color: COLORS.white,
        fontSize: 23,
        fontWeight: FONT.weights.extraBold,
        textShadow: COLORS.textShadow,
      }}
    >
      {label}
    </div>
  );
}

/** Backdrop image, absolutely filling the card. Renders nothing if there's no image. */
function BackdropImage({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- satori <img>
    <img
      src={src}
      alt=""
      width={size.width}
      height={size.height}
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}
    />
  );
}

interface CardCopy {
  meta: string;
  title: { text: string; fontSize: number; lineHeight: number };
  tagline: string | null;
  score: string | null;
  genres: string[];
}

/** Meta line, title and gold tagline — top of the text panel. */
function InfoHeader({ meta, title, tagline }: Pick<CardCopy, "meta" | "title" | "tagline">) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 26, fontWeight: FONT.weights.semiBold, color: COLORS.meta }}>{meta}</div>

      <div
        style={{
          display: "flex",
          marginTop: 12,
          fontSize: title.fontSize,
          lineHeight: title.lineHeight,
          fontWeight: FONT.weights.extraBold,
          color: COLORS.white,
          letterSpacing: "-0.01em",
          textShadow: COLORS.textShadow,
        }}
      >
        {title.text}
      </div>

      {tagline && (
        <div
          style={{
            display: "flex",
            marginTop: 10,
            fontSize: 24,
            lineHeight: 1.25,
            fontWeight: FONT.weights.semiBold,
            color: COLORS.gold,
            textShadow: COLORS.textShadow,
          }}
        >
          {tagline}
        </div>
      )}
    </div>
  );
}

/** Star + score. Renders nothing if there's no score. */
function RatingRow({ score }: { score: string | null }) {
  if (!score) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Star />
      <div style={{ display: "flex", fontSize: 62, fontWeight: FONT.weights.extraBold, color: COLORS.white, textShadow: COLORS.textShadow }}>
        {score}
      </div>
    </div>
  );
}

/** Wrapping row of genre pills. */
function GenreRow({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
      {genres.map((g) => (
        <GenrePill key={g} label={g} />
      ))}
    </div>
  );
}

/** Left-hand text panel: header up top, rating + genres pinned to the bottom. */
function TextPanel({ meta, title, tagline, score, genres }: CardCopy) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        display: "flex",
        flexDirection: "column",
        width: PANEL_W,
        height: size.height,
        padding: `${TEXT_PADDING.top}px ${TEXT_PADDING.right}px ${TEXT_PADDING.bottom}px ${TEXT_PADDING.left}px`,
      }}
    >
      <InfoHeader meta={meta} title={title} tagline={tagline} />
      <div style={{ display: "flex", flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <RatingRow score={score} />
        <GenreRow genres={genres} />
      </div>
    </div>
  );
}

/** Full card: backdrop image behind, text panel on top. */
function OgCard({ backdrop, ...copy }: CardCopy & { backdrop: string | null }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: COLORS.panel,
      }}
    >
      <BackdropImage src={backdrop} />
      <TextPanel {...copy} />
    </div>
  );
}

function FallbackCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.panel,
      }}
    >
      <div style={{ display: "flex", fontSize: 42, fontWeight: FONT.weights.extraBold, color: COLORS.white }}>
        {SITE_NAME}
      </div>
    </div>
  );
}

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
} as const;

// ─── Route ──────────────────────────────────────────────────────────────────

export async function GET(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const tmdbId = Number(id);
  if ((type !== "movie" && type !== "tv") || !Number.isFinite(tmdbId)) {
    return new Response("Not found", { status: 404 });
  }

  const locale: Locale = normalizeLangParam(new URL(request.url).searchParams.get("lang")) ?? "en";
  const responseInit = { ...size, fonts: await fontCache, headers: CACHE_HEADERS };

  const data = await getMediaDetail(type, tmdbId, toApiLanguage(locale)).catch(() => null);
  if (!data) return new ImageResponse(<FallbackCard />, responseInit);

  const titleText = truncate(data.title, 64);
  const card: CardCopy = {
    meta: metaLine(type, data, dicts[locale].og),
    title: { text: titleText, ...titleStyle(titleText) },
    tagline: data.tagline ? truncate(data.tagline, 90) : null,
    score: scoreLabel(data),
    genres: genreList(data),
  };

  return new ImageResponse(<OgCard {...card} backdrop={await fetchBackdrop(data)} />, responseInit);
}
