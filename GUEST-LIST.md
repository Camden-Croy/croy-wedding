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

## Guests

| Guest | Plus-one | Invite link |
|---|---|---|
| Elliot Bourgeous | — | http://localhost:3000/?guest=elliot_bourgeous&code=love2026 |
| Isaiah Stinnett | — | http://localhost:3000/?guest=isaiah_stinnett&code=love2026 |
| Bennett Greene | +1 | http://localhost:3000/?guest=bennett_greene&code=love2026 |
| Liam Cronin | +1 | http://localhost:3000/?guest=liam_cronin&code=love2026 |
| Magic | — | http://localhost:3000/?guest=magic&code=love2026 |
| Ruth Geiger | — | http://localhost:3000/?guest=ruth_geiger&code=love2026 |
| Lydia Burrell | — | http://localhost:3000/?guest=lydia_burrell&code=love2026 |
| Julie Ann Peterson | +1 | http://localhost:3000/?guest=julie_ann_peterson&code=love2026 |
| Jansey Brewer | — | http://localhost:3000/?guest=jansey_brewer&code=love2026 |
| Mary Ruple | — | http://localhost:3000/?guest=mary_ruple&code=love2026 |
| Elizabeth Jackson | — | http://localhost:3000/?guest=elizabeth_jackson&code=love2026 |
| Maris Morton | +1 | http://localhost:3000/?guest=maris_morton&code=love2026 |
| Emmaline Hodson | — | http://localhost:3000/?guest=emmaline_hodson&code=love2026 |
| Brooke Elam | — | http://localhost:3000/?guest=brooke_elam&code=love2026 |
| Mark Croy | — | http://localhost:3000/?guest=mark_croy&code=love2026 |
| Sharon Croy | — | http://localhost:3000/?guest=sharon_croy&code=love2026 |
| Lexie Croy | — | http://localhost:3000/?guest=lexie_croy&code=love2026 |
| Trey Croy | — | http://localhost:3000/?guest=trey_croy&code=love2026 |
| Mr Stacy | — | http://localhost:3000/?guest=mr_stacy&code=love2026 |
| Mrs Stacy | — | http://localhost:3000/?guest=mrs_stacy&code=love2026 |
| Logan Stacy | — | http://localhost:3000/?guest=logan_stacy&code=love2026 |
| Brandon Taylor | — | http://localhost:3000/?guest=brandon_taylor&code=love2026 |
| Summer Woody | — | http://localhost:3000/?guest=summer_woody&code=love2026 |
| Camden Croy | — | http://localhost:3000/?guest=camden_croy&code=love2026 |
| Jordan Stacy | — | http://localhost:3000/?guest=jordan_stacy&code=love2026 |

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
