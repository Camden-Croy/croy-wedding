import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { WEDDING } from "@/lib/content";

/**
 * Dynamic Open Graph image for the home page.
 *
 * Two treatments over public/photos/1.jpg (Jordan with the ring), both on a
 * gray gradient wash so the text stays legible:
 *
 *  - Invitation (personalized): when `?to=<display name>` is present, shows a
 *    "You're Invited" eyebrow + "Dear {name}," greeting. Invite links carry
 *    `?guest=<slug>`, which the home page's `generateMetadata` turns into `?to=`.
 *  - Announcement (generic): when there's no name — i.e. someone shared the bare
 *    site URL with a non-invitee — shows a neutral "We're getting married" card
 *    with no invitation language.
 *
 * The name is passed in via the query string because the crawler fetches this
 * URL directly and can't see the visitor's cookies. Runs on the Node runtime so
 * it can read the photo and fonts off disk.
 */
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

// Palette tuned for white-on-photo legibility (site colors live in globals.css).
const INK = "15, 23, 19"; // deep green-charcoal, used for the gray wash (rgba)
const CREAM = "#f6f3ec";
const ROSE = "#eaa7ba"; // lightened accent-strong so it reads on the dark wash
const WHITE = "#ffffff";

/** Keep the injected name sane: single line, trimmed, capped. */
function sanitizeName(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, " ").trim().slice(0, 48);
  return cleaned.length > 0 ? cleaned : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = sanitizeName(searchParams.get("to"));

  const fontsDir = join(process.cwd(), "assets", "fonts");
  const [cormorant, interMedium, interRegular, photo] = await Promise.all([
    readFile(join(fontsDir, "CormorantGaramond-SemiBold.ttf")),
    readFile(join(fontsDir, "Inter-Medium.ttf")),
    readFile(join(fontsDir, "Inter-Regular.ttf")),
    readFile(join(process.cwd(), "public", "photos", "1.jpg")),
  ]);

  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          fontFamily: "Inter",
        }}
      >
        {/* Full-bleed photo, biased toward the top so faces + ring stay in frame.
            next/image can't be used inside ImageResponse (Satori) — a raw <img> is required. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          alt=""
          width={WIDTH}
          height={HEIGHT}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            objectFit: "cover",
            objectPosition: "50% 20%",
          }}
        />

        {/* Gray wash: heavier on the left where the text sits, fading to reveal
            the photo on the right. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, rgba(${INK},0.92) 0%, rgba(${INK},0.80) 42%, rgba(${INK},0.55) 72%, rgba(${INK},0.32) 100%)`,
          }}
        />
        {/* Gentle overall tint to unify the composition. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `rgba(${INK},0.22)`,
          }}
        />

        {/* Thin inner frame for an invitation feel. */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            right: 30,
            bottom: 30,
            border: "1.5px solid rgba(246,243,236,0.55)",
            borderRadius: 10,
          }}
        />

        {/* Text column */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            padding: "0 76px",
          }}
        >
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: ROSE,
            }}
          >
            {name ? "You\u2019re Invited" : "We\u2019re Getting Married"}
          </div>

          {name ? (
            <div
              style={{
                fontFamily: "Cormorant",
                fontWeight: 600,
                fontSize: 46,
                color: CREAM,
                marginTop: 26,
              }}
            >
              {`Dear ${name},`}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              flexShrink: 0,
              whiteSpace: "nowrap",
              marginTop: name ? 4 : 24,
              fontFamily: "Cormorant",
              fontWeight: 600,
              fontSize: 104,
              lineHeight: 1,
              color: WHITE,
            }}
          >
            <span>{WEDDING.partners.one.firstName}</span>
            <span style={{ color: ROSE, margin: "0 24px" }}>&amp;</span>
            <span>{WEDDING.partners.two.firstName}</span>
          </div>

          {/* Small rule */}
          <div
            style={{
              width: 96,
              height: 2,
              background: `rgba(246,243,236,0.7)`,
              marginTop: 34,
              marginBottom: 26,
            }}
          />

          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 500,
              fontSize: 26,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: CREAM,
            }}
          >
            {WEDDING.date}
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 400,
              fontSize: 24,
              color: "rgba(246,243,236,0.82)",
              marginTop: 10,
            }}
          >
            Cades Cove &middot; Great Smoky Mountains, TN
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Cormorant", data: cormorant, style: "normal", weight: 600 },
        { name: "Inter", data: interRegular, style: "normal", weight: 400 },
        { name: "Inter", data: interMedium, style: "normal", weight: 500 },
      ],
      // Let the CDN + preview crawlers cache the rendered PNG (keyed by the full
      // URL, incl. ?to=) so we don't re-render on every fetch and risk a crawler
      // timeout. Safe to cache long — the content is deterministic per name.
      headers: {
        "cache-control": "public, no-transform, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
