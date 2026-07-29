import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, X, Clock, Users, ShieldAlert } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { AdminSignOut } from "@/components/admin-signout";
import { RegistryManager, type AdminRegistryItem } from "@/components/registry-manager";
import { StoryPhotosManager, type AdminStoryPhoto } from "@/components/story-photos-manager";
import { GuestManager, type AdminGuest } from "@/components/guest-manager";
import { DashboardTabs, type DashboardTab } from "@/components/dashboard-tabs";
import { getAdminSession } from "@/lib/admin";
import { formatPrice, REGISTRY_CATEGORY_ORDER } from "@/lib/content";
import {
  getGuestsWithRsvps,
  getRegistryClaims,
  getRegistryItems,
  getStoryPhotos,
  summarizeRsvps,
  rsvpStatus,
  isBringingPlusOne,
  type GuestWithRsvp,
} from "@/lib/data";

// Admin data is per-request and behind auth, so never prerender it.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const admin = await getAdminSession();

  // Not signed in → send to the admin sign-in page.
  if (!admin.signedIn) {
    redirect("/admin/sign-in");
  }

  // Signed in but not on the allowlist → show a friendly "no access" screen.
  if (!admin.isAdmin) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-border bg-surface p-10 text-center shadow-sm">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-accent-strong">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <h1 className="mt-5 font-serif text-2xl text-foreground">Not authorized</h1>
          <p className="mt-2 text-sm text-muted">
            You&apos;re signed in as{" "}
            <span className="font-medium text-foreground">{admin.email}</span>, which isn&apos;t on
            the admin list. Try a different account.
          </p>
          <div className="mt-6">
            <AdminSignOut />
          </div>
        </div>
      </PageTransition>
    );
  }

  let guests: GuestWithRsvp[] | null = null;
  let claims: Awaited<ReturnType<typeof getRegistryClaims>> | null = null;
  let registryItems: AdminRegistryItem[] | null = null;
  let faceTimePhotos: AdminStoryPhoto[] | null = null;
  let visitPhotos: AdminStoryPhoto[] | null = null;
  let loadError = false;

  const toStoryPhoto = (p: { id: string; imageUrl: string; caption: string | null }): AdminStoryPhoto => ({
    id: p.id,
    imageUrl: p.imageUrl,
    caption: p.caption ?? null,
  });

  try {
    const [guestRows, claimRows, itemRows, faceTimeRows, visitRows] = await Promise.all([
      getGuestsWithRsvps(),
      getRegistryClaims(),
      getRegistryItems(),
      getStoryPhotos("facetime"),
      getStoryPhotos("visits"),
    ]);
    guests = guestRows;
    claims = claimRows;
    registryItems = itemRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category ?? "Gifts",
      url: r.url ?? null,
      priceCents: r.priceCents ?? null,
      note: r.note ?? null,
      isFund: r.isFund,
      claimed: r.claimedById !== null || r.claimedByEmail !== null,
    }));
    faceTimePhotos = faceTimeRows.map(toStoryPhoto);
    visitPhotos = visitRows.map(toStoryPhoto);
  } catch {
    loadError = true;
  }

  const summary = guests ? summarizeRsvps(guests) : null;

  // Shape guests for the RSVP table, which doubles as the management surface
  // (CRUD + RSVP override + invite-link copy).
  const adminGuests: AdminGuest[] | null = guests
    ? guests.map((g) => ({
        id: g.id,
        name: g.name,
        identifier: g.identifier,
        accessCode: g.accessCode,
        plusOne: g.plusOne,
        rsvp: rsvpStatus(g),
        bringingGuest: isBringingPlusOne(g),
        guestCount: g.rsvp?.guestCount ?? 1,
        respondedAt: g.rsvp?.respondedAt ?? null,
        message: g.rsvp?.message ?? null,
      }))
    : null;

  // Category suggestions for the manage form: the configured order plus any
  // categories already present in the data.
  const registryCategories = registryItems
    ? Array.from(
        new Set([...REGISTRY_CATEGORY_ORDER, ...registryItems.map((i) => i.category)]),
      )
    : [...REGISTRY_CATEGORY_ORDER];

  // Each dashboard section becomes a tab so the page isn't one long scroll.
  const tabs: DashboardTab[] = [
    {
      key: "rsvps",
      label: "RSVPs",
      count: guests?.length,
      content: (
        <div>
          {summary ? (
            <>
              <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <SummaryCard icon={<Users className="size-5" />} label="Invited" value={summary.invited} />
                <SummaryCard
                  icon={<Check className="size-5" />}
                  label="Attending"
                  value={summary.attending}
                  accent="text-emerald-600 dark:text-emerald-400"
                />
                <SummaryCard
                  icon={<X className="size-5" />}
                  label="Declined"
                  value={summary.declined}
                  accent="text-rose-600 dark:text-rose-400"
                />
                <SummaryCard icon={<Clock className="size-5" />} label="Awaiting" value={summary.awaiting} />
              </section>
              <p className="mb-6 text-sm text-muted">
                Expected headcount from attending parties:{" "}
                <span className="font-medium text-foreground">{summary.headcount}</span>
                <span className="text-muted">
                  {" "}
                  ({summary.attending} {summary.attending === 1 ? "guest" : "guests"} +{" "}
                  {summary.plusOnesAttending}{" "}
                  {summary.plusOnesAttending === 1 ? "plus-one" : "plus-ones"})
                </span>
              </p>
            </>
          ) : null}

          {adminGuests ? (
            <GuestManager guests={adminGuests} />
          ) : (
            <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
              Couldn&apos;t load guests.
            </p>
          )}
        </div>
      ),
    },
    {
      key: "claims",
      label: "Gift claims",
      count: claims?.length,
      content:
        claims && claims.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium">Gift</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Claimed by</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((item) => {
                  // Invited guest, or a non-invited "identified" email giver.
                  const isGuest = item.claimedBy !== null;
                  const who =
                    item.claimedBy?.name ?? item.claimedByName ?? item.claimedByEmail ?? "—";
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-4 font-medium text-foreground">{item.title}</td>
                      <td className="px-5 py-4 text-muted">{formatPrice(item.priceCents) ?? "—"}</td>
                      <td className="px-5 py-4 text-muted">
                        <span className="text-foreground">{who}</span>
                        {!isGuest && item.claimedByEmail ? (
                          <span className="block text-xs text-muted">{item.claimedByEmail}</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " +
                            (isGuest
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-surface-2 text-muted")
                          }
                        >
                          {isGuest ? "Invited guest" : "Email giver"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted">{formatDate(item.purchasedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
            No gifts have been claimed yet.
          </p>
        ),
    },
    {
      key: "registry",
      label: "Manage registry",
      count: registryItems?.length,
      content: registryItems ? (
        <RegistryManager items={registryItems} categories={registryCategories} />
      ) : (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          Couldn&apos;t load registry items.
        </p>
      ),
    },
    {
      key: "facetime",
      label: "Face time",
      count: faceTimePhotos?.length,
      content: faceTimePhotos ? (
        <StoryPhotosManager section="facetime" noun="FaceTime photo" photos={faceTimePhotos} />
      ) : (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          Couldn&apos;t load FaceTime photos.
        </p>
      ),
    },
    {
      key: "visits",
      label: "Visits",
      count: visitPhotos?.length,
      content: visitPhotos ? (
        <StoryPhotosManager section="visits" noun="visit photo" photos={visitPhotos} />
      ) : (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          Couldn&apos;t load visit photos.
        </p>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent-strong"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to home
        </Link>
        <AdminSignOut />
      </div>

      <header className="mb-10">
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">Admin Dashboard</h1>
        <p className="mt-3 text-muted">
          Signed in as <span className="font-medium text-foreground">{admin.email}</span>.
        </p>
      </header>

      {loadError ? (
        <p className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
          Couldn&apos;t load data. The database may not be reachable right now.
        </p>
      ) : (
        <DashboardTabs tabs={tabs} />
      )}
    </PageTransition>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent = "text-accent",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <span className={accent} aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <p className="mt-2 font-serif text-3xl text-foreground">{value}</p>
    </div>
  );
}
