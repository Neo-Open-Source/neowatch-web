"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import { useParams, notFound } from "next/navigation";
import { Bookmark, Clapperboard, Share2 } from "lucide-react";
import { toast } from "sonner";
import { FocusContext, useFocusable, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useI18n } from "@/lib/context/i18n-context";
import { hreflangOf, type Locale } from "@/lib/i18n";
import { useAuth } from "@/lib/context/auth-context";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { useEmbeddableTrailers } from "@/lib/hooks/use-embeddable-trailers";
import { useInputMode } from "@/lib/context/input-mode";
import { useInitialFocus } from "@/lib/hooks/use-initial-focus";
import { isScrollRestoring } from "@/lib/state/scroll-restore";
import {
  getFavoritesSnapshot,
  recalledFavoriteState,
  rememberFavoriteState,
} from "@/lib/state/favorites-cache";
import { getHeaderOffset } from "@/lib/utils/scroll-into-view";
import { getOffsetInScrollRoot, scrollRootTo } from "@/lib/state/scroll-root";
import { api } from "@/lib/api";
import { toApiLanguage } from "@/lib/api/types";
import type { MovieDetails, TVDetails } from "@/lib/api/types";
import { formatRuntime, releaseYear } from "@/lib/utils/media-format";
import { NAVBAR_SEARCH_FOCUS_KEY } from "@/components/Header";
import { UpTargetsProvider } from "@/lib/context/up-navigation";
import { ShelfSection } from "@/components/sections/ShelfSection";
import { MediaCard } from "@/components/cards/MediaCard";
import { CastCard } from "@/components/cards/CastCard";
import { SeasonCard } from "@/components/cards/SeasonCard";
import { TrailerCard } from "@/components/cards/TrailerCard";
import { TrailerModal } from "@/components/TrailerModal";
import { WatchActions } from "@/components/watch/WatchActions";
import { PageTitle } from "@/components/ui/PageTitle";
import { DetailHeroSkeleton } from "@/components/skeletons/DetailHeroSkeleton";
import { ImdbBadge, TmdbBadge } from "@/components/ui/RatingBadges";
import { makeSkeletonKeys } from "@/lib/utils/skeletons";

const CAST_SKELETONS = makeSkeletonKeys(10);
const SEASON_SKELETONS = makeSkeletonKeys(6);
const MEDIA_SKELETONS = makeSkeletonKeys(10);

export const DETAIL_HERO_FOCUS_KEY = "DETAIL_HERO";

function scrollToHero() {
  if (typeof window === "undefined") return;
  if (isScrollRestoring()) return;
  const hero = document.querySelector<HTMLElement>("[data-detail-hero]");
  if (!hero) return;
  const top = Math.max(0, getOffsetInScrollRoot(hero) - getHeaderOffset());
  scrollRootTo(top, "smooth");
}

interface HeroActionButtonProps {
  focusKey: string;
  className: string;
  label: string;
  onActivate?: () => void;
  icon: React.ReactNode;
  /** Force the expanded-pill look even when this button isn't the focused one. */
  active?: boolean;
}

/**
 * Focusable (d-pad) hero action. Renders as a circle; when focused (or forced
 * active) it morphs into a labelled pill (like the Watch button) via CSS. All
 * hero actions share the same height, so focus can move between them with
 * left/right arrows.
 */
function HeroActionButton({ focusKey, className, label, onActivate, icon, active }: HeroActionButtonProps) {
  const isSpatial = useInputMode();
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onActivate,
    onFocus: () => { if (isSpatial) scrollToHero(); },
  });
  const isActive = focused || !!active;

  return (
    <button
      type="button"
      ref={ref}
      aria-label={label}
      onClick={onActivate}
      className={`detail-hero-action ${className}${isActive ? " detail-hero-action--active" : ""}`}
    >
      <span className="detail-hero-action__icon">{icon}</span>
      <span className="detail-hero-action__label">{label}</span>
    </button>
  );
}

function DetailHeroActions({
  mediaId,
  mediaType,
  title,
  locale,
  kpId,
  imdbId,
  watchLabel,
  watchlistLabel,
  inWatchlistLabel,
  shareLabel,
  linkCopiedLabel,
  addedToWatchlistLabel,
  removedFromWatchlistLabel,
  watchlistErrorLabel,
  trailerLabel,
  trailerYoutubeId,
}: {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  locale: Locale;
  kpId: number | null;
  imdbId: string | null;
  watchLabel: string;
  watchlistLabel: string;
  inWatchlistLabel: string;
  shareLabel: string;
  linkCopiedLabel: string;
  addedToWatchlistLabel: string;
  removedFromWatchlistLabel: string;
  watchlistErrorLabel: string;
  trailerLabel?: string;
  /** First embeddable trailer — when present the "watch trailer" button opens it. */
  trailerYoutubeId?: string;
}) {
  const { isAuthenticated, signIn } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  // Set while the user is toggling so the background favorite check (fired on
  // mount) can't clobber the optimistic value with a stale server response.
  const toggledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) {
      startTransition(() => setInWatchlist(false));
      return;
    }
    toggledRef.current = false;

    // Instant provisional state from local caches — no network wait. The
    // server check below reconciles in the background (3–4s cold API calls
    // must not keep the button in the wrong state).
    const recalled = recalledFavoriteState(mediaId, mediaType);
    if (recalled !== null) {
      startTransition(() => setInWatchlist(recalled));
    } else {
      const snapshot = getFavoritesSnapshot();
      if (snapshot) {
        startTransition(() =>
          setInWatchlist(snapshot.items.some((item) => item.mediaId === mediaId)),
        );
      }
    }

    api.user
      .checkFavorite(mediaId, mediaType)
      .then((res) => {
        // A toggle may have happened while the check was in flight — don't
        // overwrite the optimistic value with a stale server response.
        if (!cancelled && !toggledRef.current) {
          rememberFavoriteState(mediaId, mediaType, res.isFavorite);
          setInWatchlist(res.isFavorite);
        }
      })
      .catch(() => {
        if (!cancelled && !toggledRef.current) setInWatchlist(recalled ?? false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, mediaId, mediaType]);

  /** Share the canonical ?lang= URL via the native sheet, or copy it. */
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", hreflangOf(locale));
    const shareUrl = url.toString();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (err) {
        // The user deliberately dismissed the sheet — respect that and don't
        // surprise them by copying the link afterwards.
        if (err instanceof DOMException && (err.name === "AbortError" || err.name === "NotAllowedError")) {
          return;
        }
        // Any other failure — try the clipboard below.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(linkCopiedLabel);
    } catch {
      /* clipboard unavailable (non-secure context) — ignore */
    }
  };

  const toggleWatchlist = async () => {
    if (!isAuthenticated) {
      void signIn();
      return;
    }
    if (watchlistBusy) return;
    setWatchlistBusy(true);
    toggledRef.current = true;
    const next = !inWatchlist;
    setInWatchlist(next);
    try {
      if (next) {
        await api.user.addFavorite(mediaId, mediaType);
        toast.success(addedToWatchlistLabel);
      } else {
        await api.user.removeFavorite(mediaId, mediaType);
        toast.success(removedFromWatchlistLabel);
      }
    } catch {
      setInWatchlist(!next);
      toast.error(watchlistErrorLabel);
    } finally {
      setWatchlistBusy(false);
    }
  };

  const { ref, focusKey } = useFocusable({
    focusKey: DETAIL_HERO_FOCUS_KEY,
    trackChildren: true,
    saveLastFocusedChild: true,
    preferredChildFocusKey: "detail-play",
    onArrowPress: (dir) => {
      if (dir === "up") {
        setFocus(NAVBAR_SEARCH_FOCUS_KEY);
        scrollRootTo(0, "smooth");
        return false;
      }
      return true;
    },
    onFocus: () => scrollToHero(),
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref as React.RefObject<HTMLDivElement>} className="detail-actions">
        <WatchActions
          mediaType={mediaType}
          tmdbId={mediaId}
          kpId={kpId}
          imdbId={imdbId}
          title={title}
          label={watchLabel}
        />

        <div className="detail-actions__secondary">
          <HeroActionButton
            focusKey="detail-watchlist"
            className={inWatchlist ? "detail-hero-action--on" : ""}
            label={inWatchlist ? inWatchlistLabel : watchlistLabel}
            onActivate={() => void toggleWatchlist()}
            icon={<Bookmark size={20} strokeWidth={1.75} fill={inWatchlist ? "currentColor" : "none"} />}
          />

          {trailerYoutubeId && (
            <HeroActionButton
              focusKey="detail-trailer"
              className=""
              label={trailerLabel ?? ""}
              onActivate={() => setTrailerOpen(true)}
              icon={<Clapperboard size={20} strokeWidth={1.75} />}
            />
          )}

          <HeroActionButton
            focusKey="detail-share"
            className=""
            label={shareLabel}
            onActivate={() => void handleShare()}
            icon={<Share2 size={20} strokeWidth={1.75} />}
          />
        </div>
      </div>

      {trailerOpen && trailerYoutubeId && (
        <TrailerModal youtubeId={trailerYoutubeId} title={trailerLabel} onClose={() => setTrailerOpen(false)} />
      )}
    </FocusContext.Provider>
  );
}

export default function DetailPage({ initialData }: { initialData?: MovieDetails | TVDetails | null }) {
  const params = useParams<{ type: string; id: string }>();
  const { t, locale } = useI18n();
  const lang = toApiLanguage(locale);

  const type = params.type as "movie" | "tv";
  if (type !== "movie" && type !== "tv") notFound();
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();

  // On TV, land focus on the Play button as soon as the hero renders.
  useInitialFocus(["detail-play"]);

  // Logo comes directly from the GraphQL media query as data.logo
  const [logoFailed, setLogoFailed] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Reset logo state whenever the media changes
  useEffect(() => {
    startTransition(() => {
      setLogoFailed(false);
      setLogoLoaded(false);
    });
  }, [id, type]);

  // Cached images can complete before React attaches onLoad — detect and reveal immediately
  useEffect(() => {
    const img = logoRef.current;
    if (!img || !img.complete) return;
    startTransition(() => {
      if (img.naturalWidth > 0) setLogoLoaded(true);
      else setLogoFailed(true);
    });
  });

  const { data, loading, error } = useAsyncResource<MovieDetails | TVDetails>(
    () =>
      type === "movie"
        ? api.media.movieDetail(id, { language: lang })
        : api.media.tvDetail(id, { language: lang }),
    [id, type, lang],
    // Server-fetched data from generateMetadata — the client skips its own
    // request while it stays current (refetches only on language switch).
    initialData,
  );

  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const backdropRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    startTransition(() => {
      setBackdropLoaded(false);
    });
  }, [data?.backdrop]);

  // Same cached-image guard as the logo — reveal an already-complete backdrop
  // so a hard reload doesn't leave the hero art stuck at opacity 0.
  useEffect(() => {
    const img = backdropRef.current;
    if (!img || !img.complete) return;
    startTransition(() => setBackdropLoaded(true));
  }, [data?.backdrop]);

  const { data: similar, loading: similarLoading } = useAsyncResource(
    () => api.media.similar(type, id, { language: lang, page: 1 }),
    [id, type, lang],
  );

  const { data: relatedCast, loading: relatedCastLoading } = useAsyncResource(
    () => api.media.relatedByCast(type, id, { language: lang, page: 1 }),
    [id, type, lang],
  );

  const { data: relatedStudio, loading: relatedStudioLoading } = useAsyncResource(
    () => api.media.relatedByStudio(type, id, { language: lang, page: 1 }),
    [id, type, lang],
  );

  if (error) notFound();

  const tv = data && "seasons" in data ? (data as TVDetails) : null;
  const movie = data && "runtime" in data ? (data as MovieDetails) : null;

  const year = releaseYear(data?.releaseDate);
  const genres = data?.genres?.map((g) => g.name).join(", ");
  const runtime = movie ? formatRuntime(movie.runtime) : null;
  const cast = data?.credits?.cast ?? [];
  const trailers = data?.trailers ?? [];
  const availableTrailers = useEmbeddableTrailers(trailers);
  const studioLabel = relatedStudio?.label;
  const studioTitle = studioLabel
    ? `${t.detail.relatedStudio} ${studioLabel}`
    : t.detail.relatedStudio;

  return (
    <UpTargetsProvider targets={[DETAIL_HERO_FOCUS_KEY]}>
      <PageTitle>{data?.title ?? ""}</PageTitle>

      {/* ── Hero: right-aligned backdrop + solid left, rounded card over shelves ── */}
      <div className="detail-hero-wrap">
        <div className="detail-hero-card" data-detail-hero>
          {data?.backdrop && (
            <div className="detail-hero-backdrop">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={backdropRef}
                src={data.backdrop}
                alt=""
                className={`detail-hero-backdrop__img${backdropLoaded ? " detail-hero-backdrop__img--loaded" : ""}`}
                onLoad={() => setBackdropLoaded(true)}
                onError={() => setBackdropLoaded(true)}
                draggable={false}
                decoding="async"
                fetchPriority="high"
              />
            </div>
          )}

          <div className="detail-hero-content">
            {loading ? (
              <DetailHeroSkeleton />
            ) : data ? (
              <div className="detail-hero-reveal">
                {data.logo && !logoFailed ? (
                  <>
                    <h1 className="visually-hidden">{data.title}</h1>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={data.logo}
                      ref={logoRef}
                      src={data.logo}
                      alt=""
                      className={`detail-logo${logoLoaded ? " detail-logo--loaded" : ""}`}
                      onLoad={() => setLogoLoaded(true)}
                      onError={() => setLogoFailed(true)}
                      draggable={false}
                      decoding="async"
                    />
                  </>
                ) : (
                  <h1 className="detail-title">
                    {data.title}
                  </h1>
                )}

                <div className="detail-meta">
                  {data.certification && (
                    <span className="detail-age">
                      {data.certification}
                    </span>
                  )}

                  {year && <span>{year}</span>}
                  {runtime && <span>{runtime}</span>}
                  {tv && (
                    <span>
                      {tv.numberOfSeasons} {t.detail.seasonsLabel(tv.numberOfSeasons)}
                    </span>
                  )}
                  {genres && <span className="detail-genres">{genres}</span>}
                </div>

                <div className="detail-ratings">
                  {data.voteAverage > 0 && (
                    <TmdbBadge score={data.voteAverage} />
                  )}

                  {data.imdbRating && (
                    <ImdbBadge score={data.imdbRating} />
                  )}
                </div>

                <DetailHeroActions
                  mediaId={data.tmdbId}
                  mediaType={type}
                  title={data.title}
                  locale={locale}
                  kpId={data.kpId}
                  imdbId={data.imdbId}
                  watchLabel={t.detail.watch}
                  watchlistLabel={t.detail.addToWatchlist}
                  inWatchlistLabel={t.detail.inWatchlist}
                  shareLabel={t.detail.share}
                  linkCopiedLabel={t.detail.linkCopied}
                  addedToWatchlistLabel={t.detail.addedToWatchlist}
                  removedFromWatchlistLabel={t.detail.removedFromWatchlist}
                  watchlistErrorLabel={t.detail.watchlistError}
                  trailerLabel={t.detail.watchTrailer}
                  trailerYoutubeId={availableTrailers[0]}
                />

                {data.overview && (
                  <p className="detail-overview">
                    {data.overview}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Shelves layer below the hero card */}
        <div className="detail-shelves-layer">
          {(loading || availableTrailers.length > 0) && (
            <div id="detail-trailers">
              <ShelfSection title={t.detail.trailers} loading={loading} focusKey="detail-trailers">
                {availableTrailers.map((yid, i) => (
                  <TrailerCard key={yid} youtubeId={yid} focusKey={`detail-trailer-${i}`} />
                ))}
              </ShelfSection>
            </div>
          )}

          {(loading || (tv && tv.seasons.length > 0)) && (
            <ShelfSection title={t.detail.seasons} loading={loading} focusKey="detail-seasons">
              {loading
                ? SEASON_SKELETONS.map((k) => <SeasonCard key={k} />)
                : tv?.seasons.map((s, i) => (
                    <SeasonCard
                      key={s.id}
                      season={s}
                      episodesLabel={t.detail.episodes}
                      focusKey={`detail-season-${i}`}
                    />
                  ))}
            </ShelfSection>
          )}

          {(loading || cast.length > 0) && (
            <ShelfSection title={t.detail.cast} loading={loading} focusKey="detail-cast">
              {loading
                ? CAST_SKELETONS.map((k) => <CastCard key={k} />)
                : cast.map((m, i) => <CastCard key={m.id} member={m} focusKey={`detail-cast-${i}`} />)}
            </ShelfSection>
          )}

          {(similarLoading || (similar?.items?.length ?? 0) > 0) && (
            <ShelfSection title={t.detail.similar} loading={similarLoading} focusKey="detail-similar">
              {similarLoading
                ? MEDIA_SKELETONS.map((k) => <MediaCard key={k} />)
                : (similar?.items ?? []).map((item, i) => (
                    <MediaCard key={item.tmdbId} item={item} mediaType={type} focusKey={`detail-similar-${i}`} />
                  ))}
            </ShelfSection>
          )}

          {(relatedCastLoading || (relatedCast?.items?.length ?? 0) > 0) && (
            <ShelfSection title={t.detail.relatedCast} loading={relatedCastLoading} focusKey="detail-related-cast">
              {relatedCastLoading
                ? MEDIA_SKELETONS.map((k) => <MediaCard key={k} />)
                : (relatedCast?.items ?? []).map((item, i) => (
                    <MediaCard key={item.tmdbId} item={item} mediaType={type} focusKey={`detail-related-cast-${i}`} />
                  ))}
            </ShelfSection>
          )}

          {(relatedStudioLoading || (relatedStudio?.items?.length ?? 0) > 0) && (
            <ShelfSection title={studioTitle} loading={relatedStudioLoading} focusKey="detail-related-studio">
              {relatedStudioLoading
                ? MEDIA_SKELETONS.map((k) => <MediaCard key={k} />)
                : (relatedStudio?.items ?? []).map((item, i) => (
                    <MediaCard key={item.tmdbId} item={item} mediaType={type} focusKey={`detail-related-studio-${i}`} />
                  ))}
            </ShelfSection>
          )}
        </div>
      </div>
    </UpTargetsProvider>
  );
}
