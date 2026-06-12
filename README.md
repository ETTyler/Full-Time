# ⚽ Full Time ’26 — World Cup Sweepstake

A sweepstake app for the 2026 World Cup. Friends sign in with Google, join a league from a single invite link, and the 48 teams get dealt out at random. As the tournament progresses, an admin updates each team's stage and every league's table updates live.

## How it works

1. **Sign in** with Google (Auth.js v5), pick a username at onboarding.
2. **Create a league** → you get a 6-character invite code and a `/join/{code}` link to share.
3. **Run the draw** (league owner only). Two draw styles, chosen at creation or any time before the draw: **lucky dip** (all teams shuffled and dealt round-robin — someone can land both Argentina and France) or **seeded pots** (teams sorted by FIFA ranking and dealt in pots the size of the member list, so with 12 people pot 1 is the top 12 seeds — everyone gets one team per tier, a fair spread of favourites and outsiders). Every member always receives the same number of teams: a fixed count per member, or the biggest equal split (⌊48 / members⌋ — 12 people get 4 each, 10 people get 4 each with 8 leftover teams staying in the deck). The league locks afterwards. Leagues can be created and drawn at any point — even mid-tournament, for latecomers (teams that already progressed simply bring their points in). The owner can **redraw** (re-deal everyone's teams, optionally changing the draw settings) until a match that kicked off *after* the league's draw has a recorded result — results that pre-date the draw were already public knowledge, so they don't lock it.
4. **Admin panel** at `/admin` (email allowlist via `ADMIN_EMAILS`) — set each team's furthest stage and tick "eliminated" as results come in. Team progress is global, so one update feeds every league. The panel also manages **fixtures**: all 72 group games are pre-seeded from the official FIFA schedule, knockout matches (73–104) are seeded as placeholders ("Winner Group C", "Winner M97"…) with their real dates and venues — assign teams and enter scores as the bracket resolves. Kickoff times are edited in UTC.
5. **Your fixtures** on every league page — each member sees a chronological list of their teams' upcoming matches (kickoff shown in their own timezone, venue, round) with played matches collapsing into a results list.
6. **Leaderboard** on every league page, computed from `STAGE_POINTS` in `src/lib/scoring.ts`:

   | Stage reached | Points |
   |---|---|
   | Group exit | 0 |
   | Round of 32 | 4 |
   | Round of 16 | 10 |
   | Quarter-final | 20 |
   | Semi-final | 35 |
   | Runner-up | 50 |
   | Champion | 80 |

   Plus **live match bonuses**, computed automatically from the fixture scores the admin enters (no extra admin work): **+2** group-stage win, **+1** group-stage draw, **+3** giant-killing (beating a team ranked 20+ FIFA places higher, any round), **+2** giant-held (the underdog holding such a team to a group-stage draw), **+5** winning the third-place match. Knockout wins on penalties (level score recorded) earn no giant-kill/bronze bonus, since the score alone can't name the winner. Edit one file (`src/lib/scoring.ts`) to change any of it — everything recomputes on render.

## Stack

- **Next.js 15** (App Router, server components + server actions — no API routes needed beyond auth)
- **Auth.js v5** with Google OAuth + Prisma adapter
- **Prisma + PostgreSQL** (Railway/Neon/Supabase)
- **Tailwind v4** with a custom token set ("chalk on the pitch": pitch green, chalk white, trophy gold, red card)
- Deploys to **Vercel** with zero config

## Setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, AUTH_*, ADMIN_EMAILS
npx auth secret             # writes AUTH_SECRET
npm run db:push             # create tables
npm run db:seed             # load the real 48 qualified teams + groups
npm run dev
```

Google OAuth: create an OAuth client at console.cloud.google.com and add
`http://localhost:3000/api/auth/callback/google` (and your production URL)
as an authorised redirect URI.

## Project map

```
prisma/schema.prisma      # User/League/Membership/Team/Pick/Fixture + enums
prisma/seed.ts            # the 48 teams + all 104 fixtures (FIFA schedule)
src/lib/fixtures.ts       # fixture stage labels + helpers
src/auth.ts               # Auth.js config (Google)
src/lib/scoring.ts        # points table — the one file to tweak
src/lib/draft.ts          # Fisher–Yates shuffle + round-robin deal
src/lib/admin.ts          # ADMIN_EMAILS allowlist
src/app/actions.ts        # all server actions (create/join/draw/admin)
src/app/page.tsx          # landing + dashboard
src/app/onboarding/       # username picker
src/app/join/[code]/      # invite landing page
src/app/league/[code]/    # league hub: draw, your teams, table
src/app/admin/            # tournament control
src/components/           # TeamSticker, Leaderboard, DealReveal, InviteLink
```

## Design notes

The look is "chalk on the pitch": deep green field with faint mowing
stripes, chalk-white hairlines, gold reserved for points and leaders.
The signature moment is the draw reveal — your teams arrive as
face-down cards that flip over one by one, then live on as stickers
with a gold-foil edge while the team is alive and a red `OUT` stamp
once they're eliminated. Reduced motion is respected.

## Ideas for v2

- Seeded fairness: deal pot-by-pot so nobody gets two favourites (see note in `src/lib/draft.ts`)
- Bonus points: group wins, clean sheets, goals scored (add columns to `Team`, extend `scoring.ts`)
- Auto-update results from a football data API instead of the manual admin panel
- Live updates with polling or Pusher when a stage changes mid-watch-party
