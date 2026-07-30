# Guest List & Invite Links

Permanent reference for the wedding website invites. The source of truth is the
`Guest` table in the database (seeded from `prisma/seed.ts`).

## How invite links work

Each link carries two query params:

- `guest` — the guest's identifier, which personalizes their greeting
- `code` — the access code (everyone currently shares `love2026`)

Link format: `<site>/?guest=<identifier>&code=love2026`

Below the links use `http://localhost:3000` (local dev). Swap `localhost:3000`
for the real domain once deployed.

## Previewing the share image

Each guest gets a personalized Open Graph (link preview) image with their name
baked in. Two ways to check it:

- **Rendered image directly** — open the "OG preview" link below. It hits
  `/api/og?to=<Name>` and returns the exact PNG that shows up in the link
  preview.
- **In context** — open the invite link, then paste it into iMessage/Slack or a
  tool like [opengraph.xyz](https://www.opengraph.xyz) to see the card the way
  guests will.

OG preview format: `<site>/api/og?to=<Display%20Name>` (no name → generic card).

## Guests

| Guest | Plus-one | Invite link | OG preview |
|---|---|---|---|
| Elliot Bourgeous | — | http://localhost:3000/?guest=elliot_bourgeous&code=love2026 | http://localhost:3000/api/og?to=Elliot%20Bourgeous |
| Isaiah Stinnett | — | http://localhost:3000/?guest=isaiah_stinnett&code=love2026 | http://localhost:3000/api/og?to=Isaiah%20Stinnett |
| Bennett Greene | +1 | http://localhost:3000/?guest=bennett_greene&code=love2026 | http://localhost:3000/api/og?to=Bennett%20Greene |
| Liam Cronin | +1 | http://localhost:3000/?guest=liam_cronin&code=love2026 | http://localhost:3000/api/og?to=Liam%20Cronin |
| Magic | — | http://localhost:3000/?guest=magic&code=love2026 | http://localhost:3000/api/og?to=Magic |
| Ruth Geiger | — | http://localhost:3000/?guest=ruth_geiger&code=love2026 | http://localhost:3000/api/og?to=Ruth%20Geiger |
| Lydia Burrell | — | http://localhost:3000/?guest=lydia_burrell&code=love2026 | http://localhost:3000/api/og?to=Lydia%20Burrell |
| Julie Ann Peterson | +1 | http://localhost:3000/?guest=julie_ann_peterson&code=love2026 | http://localhost:3000/api/og?to=Julie%20Ann%20Peterson |
| Jansey Brewer | — | http://localhost:3000/?guest=jansey_brewer&code=love2026 | http://localhost:3000/api/og?to=Jansey%20Brewer |
| Mary Ruple | — | http://localhost:3000/?guest=mary_ruple&code=love2026 | http://localhost:3000/api/og?to=Mary%20Ruple |
| Elizabeth Jackson | — | http://localhost:3000/?guest=elizabeth_jackson&code=love2026 | http://localhost:3000/api/og?to=Elizabeth%20Jackson |
| Maris Morton | +1 | http://localhost:3000/?guest=maris_morton&code=love2026 | http://localhost:3000/api/og?to=Maris%20Morton |
| Emmaline Hodson | — | http://localhost:3000/?guest=emmaline_hodson&code=love2026 | http://localhost:3000/api/og?to=Emmaline%20Hodson |
| Brooke Elam | — | http://localhost:3000/?guest=brooke_elam&code=love2026 | http://localhost:3000/api/og?to=Brooke%20Elam |
| Mark Croy | — | http://localhost:3000/?guest=mark_croy&code=love2026 | http://localhost:3000/api/og?to=Mark%20Croy |
| Sharon Croy | — | http://localhost:3000/?guest=sharon_croy&code=love2026 | http://localhost:3000/api/og?to=Sharon%20Croy |
| Lexie Croy | — | http://localhost:3000/?guest=lexie_croy&code=love2026 | http://localhost:3000/api/og?to=Lexie%20Croy |
| Trey Croy | — | http://localhost:3000/?guest=trey_croy&code=love2026 | http://localhost:3000/api/og?to=Trey%20Croy |
| Mr Stacy | — | http://localhost:3000/?guest=mr_stacy&code=love2026 | http://localhost:3000/api/og?to=Mr%20Stacy |
| Mrs Stacy | — | http://localhost:3000/?guest=mrs_stacy&code=love2026 | http://localhost:3000/api/og?to=Mrs%20Stacy |
| Logan Stacy | — | http://localhost:3000/?guest=logan_stacy&code=love2026 | http://localhost:3000/api/og?to=Logan%20Stacy |
| Brandon Taylor | — | http://localhost:3000/?guest=brandon_taylor&code=love2026 | http://localhost:3000/api/og?to=Brandon%20Taylor |
| Summer Woody | — | http://localhost:3000/?guest=summer_woody&code=love2026 | http://localhost:3000/api/og?to=Summer%20Woody |
| Camden Croy | — | http://localhost:3000/?guest=camden_croy&code=love2026 | http://localhost:3000/api/og?to=Camden%20Croy |
| Jordan Stacy | — | http://localhost:3000/?guest=jordan_stacy&code=love2026 | http://localhost:3000/api/og?to=Jordan%20Stacy |

## Notes

- **"Magic"** was seeded exactly as given (`magic`). Update the record if that's
  a nickname or placeholder.
- **Plus-ones** are stored on the `Guest.plusOne` flag, but the RSVP form is
  still the simulated skeleton and doesn't read it yet.
- **Access code**: everyone shares `love2026`. Switching to per-guest codes also
  requires updating the client-side validation in `lib/guest.ts` / `lib/content.ts`.
- **Re-seeding** (`npm run db:seed`) wipes and recreates the guest list (and any
  RSVPs). Avoid re-seeding once real responses start coming in.

## Editing the list

1. Edit the `GUESTS` array in `prisma/seed.ts`.
2. Run `npm run db:seed` (only before real RSVPs exist — see note above).
3. Update this file to match.
