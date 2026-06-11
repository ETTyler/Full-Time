import { PrismaClient, FixtureStage } from "@prisma/client";

const prisma = new PrismaClient();

// The confirmed 12 groups for the 2026 World Cup (final draw, Dec 2025,
// playoff slots resolved March 2026).
const TEAMS: [id: string, name: string, flag: string, group: string][] = [
  // Group A
  ["MEX", "Mexico", "🇲🇽", "A"],
  ["RSA", "South Africa", "🇿🇦", "A"],
  ["KOR", "South Korea", "🇰🇷", "A"],
  ["CZE", "Czechia", "🇨🇿", "A"],
  // Group B
  ["CAN", "Canada", "🇨🇦", "B"],
  ["BIH", "Bosnia and Herzegovina", "🇧🇦", "B"],
  ["QAT", "Qatar", "🇶🇦", "B"],
  ["SUI", "Switzerland", "🇨🇭", "B"],
  // Group C
  ["BRA", "Brazil", "🇧🇷", "C"],
  ["HAI", "Haiti", "🇭🇹", "C"],
  ["MAR", "Morocco", "🇲🇦", "C"],
  ["SCO", "Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "C"],
  // Group D
  ["USA", "United States", "🇺🇸", "D"],
  ["PAR", "Paraguay", "🇵🇾", "D"],
  ["AUS", "Australia", "🇦🇺", "D"],
  ["TUR", "Türkiye", "🇹🇷", "D"],
  // Group E
  ["GER", "Germany", "🇩🇪", "E"],
  ["CUW", "Curaçao", "🇨🇼", "E"],
  ["CIV", "Ivory Coast", "🇨🇮", "E"],
  ["ECU", "Ecuador", "🇪🇨", "E"],
  // Group F
  ["NED", "Netherlands", "🇳🇱", "F"],
  ["JPN", "Japan", "🇯🇵", "F"],
  ["SWE", "Sweden", "🇸🇪", "F"],
  ["TUN", "Tunisia", "🇹🇳", "F"],
  // Group G
  ["BEL", "Belgium", "🇧🇪", "G"],
  ["EGY", "Egypt", "🇪🇬", "G"],
  ["IRN", "Iran", "🇮🇷", "G"],
  ["NZL", "New Zealand", "🇳🇿", "G"],
  // Group H
  ["ESP", "Spain", "🇪🇸", "H"],
  ["CPV", "Cape Verde", "🇨🇻", "H"],
  ["KSA", "Saudi Arabia", "🇸🇦", "H"],
  ["URU", "Uruguay", "🇺🇾", "H"],
  // Group I
  ["FRA", "France", "🇫🇷", "I"],
  ["SEN", "Senegal", "🇸🇳", "I"],
  ["IRQ", "Iraq", "🇮🇶", "I"],
  ["NOR", "Norway", "🇳🇴", "I"],
  // Group J
  ["ARG", "Argentina", "🇦🇷", "J"],
  ["ALG", "Algeria", "🇩🇿", "J"],
  ["AUT", "Austria", "🇦🇹", "J"],
  ["JOR", "Jordan", "🇯🇴", "J"],
  // Group K
  ["POR", "Portugal", "🇵🇹", "K"],
  ["COD", "DR Congo", "🇨🇩", "K"],
  ["UZB", "Uzbekistan", "🇺🇿", "K"],
  ["COL", "Colombia", "🇨🇴", "K"],
  // Group L
  ["ENG", "England", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "L"],
  ["CRO", "Croatia", "🇭🇷", "L"],
  ["GHA", "Ghana", "🇬🇭", "L"],
  ["PAN", "Panama", "🇵🇦", "L"],
];

// All 72 group-stage fixtures from the official FIFA match schedule
// (match number, kickoff UTC, venue, home, away).
// Source: FIFA match schedule via fixturedownload.com, June 2026.
const GROUP_FIXTURES: [
  match: number,
  kickoffUtc: string,
  venue: string,
  home: string,
  away: string,
][] = [
  [1, "2026-06-11T19:00:00Z", "Mexico City Stadium", "MEX", "RSA"],
  [2, "2026-06-12T02:00:00Z", "Guadalajara Stadium", "KOR", "CZE"],
  [3, "2026-06-12T19:00:00Z", "Toronto Stadium", "CAN", "BIH"],
  [4, "2026-06-13T01:00:00Z", "Los Angeles Stadium", "USA", "PAR"],
  [5, "2026-06-14T01:00:00Z", "Boston Stadium", "HAI", "SCO"],
  [6, "2026-06-14T04:00:00Z", "BC Place Vancouver", "AUS", "TUR"],
  [7, "2026-06-13T22:00:00Z", "New York/New Jersey Stadium", "BRA", "MAR"],
  [8, "2026-06-13T19:00:00Z", "San Francisco Bay Area Stadium", "QAT", "SUI"],
  [9, "2026-06-14T23:00:00Z", "Philadelphia Stadium", "CIV", "ECU"],
  [10, "2026-06-14T17:00:00Z", "Houston Stadium", "GER", "CUW"],
  [11, "2026-06-14T20:00:00Z", "Dallas Stadium", "NED", "JPN"],
  [12, "2026-06-15T02:00:00Z", "Monterrey Stadium", "SWE", "TUN"],
  [13, "2026-06-15T22:00:00Z", "Miami Stadium", "KSA", "URU"],
  [14, "2026-06-15T16:00:00Z", "Atlanta Stadium", "ESP", "CPV"],
  [15, "2026-06-16T01:00:00Z", "Los Angeles Stadium", "IRN", "NZL"],
  [16, "2026-06-15T19:00:00Z", "Seattle Stadium", "BEL", "EGY"],
  [17, "2026-06-16T19:00:00Z", "New York/New Jersey Stadium", "FRA", "SEN"],
  [18, "2026-06-16T22:00:00Z", "Boston Stadium", "IRQ", "NOR"],
  [19, "2026-06-17T01:00:00Z", "Kansas City Stadium", "ARG", "ALG"],
  [20, "2026-06-17T04:00:00Z", "San Francisco Bay Area Stadium", "AUT", "JOR"],
  [21, "2026-06-17T23:00:00Z", "Toronto Stadium", "GHA", "PAN"],
  [22, "2026-06-17T20:00:00Z", "Dallas Stadium", "ENG", "CRO"],
  [23, "2026-06-17T17:00:00Z", "Houston Stadium", "POR", "COD"],
  [24, "2026-06-18T02:00:00Z", "Mexico City Stadium", "UZB", "COL"],
  [25, "2026-06-18T16:00:00Z", "Atlanta Stadium", "CZE", "RSA"],
  [26, "2026-06-18T19:00:00Z", "Los Angeles Stadium", "SUI", "BIH"],
  [27, "2026-06-18T22:00:00Z", "BC Place Vancouver", "CAN", "QAT"],
  [28, "2026-06-19T01:00:00Z", "Guadalajara Stadium", "MEX", "KOR"],
  [29, "2026-06-20T01:00:00Z", "Philadelphia Stadium", "BRA", "HAI"],
  [30, "2026-06-19T22:00:00Z", "Boston Stadium", "SCO", "MAR"],
  [31, "2026-06-20T04:00:00Z", "San Francisco Bay Area Stadium", "TUR", "PAR"],
  [32, "2026-06-19T19:00:00Z", "Seattle Stadium", "USA", "AUS"],
  [33, "2026-06-20T20:00:00Z", "Toronto Stadium", "GER", "CIV"],
  [34, "2026-06-21T00:00:00Z", "Kansas City Stadium", "ECU", "CUW"],
  [35, "2026-06-20T17:00:00Z", "Houston Stadium", "NED", "SWE"],
  [36, "2026-06-21T04:00:00Z", "Monterrey Stadium", "TUN", "JPN"],
  [37, "2026-06-21T22:00:00Z", "Miami Stadium", "URU", "CPV"],
  [38, "2026-06-21T16:00:00Z", "Atlanta Stadium", "ESP", "KSA"],
  [39, "2026-06-21T19:00:00Z", "Los Angeles Stadium", "BEL", "IRN"],
  [40, "2026-06-22T01:00:00Z", "BC Place Vancouver", "NZL", "EGY"],
  [41, "2026-06-23T00:00:00Z", "New York/New Jersey Stadium", "NOR", "SEN"],
  [42, "2026-06-22T21:00:00Z", "Philadelphia Stadium", "FRA", "IRQ"],
  [43, "2026-06-22T17:00:00Z", "Dallas Stadium", "ARG", "AUT"],
  [44, "2026-06-23T03:00:00Z", "San Francisco Bay Area Stadium", "JOR", "ALG"],
  [45, "2026-06-23T20:00:00Z", "Boston Stadium", "ENG", "GHA"],
  [46, "2026-06-23T23:00:00Z", "Toronto Stadium", "PAN", "CRO"],
  [47, "2026-06-23T17:00:00Z", "Houston Stadium", "POR", "UZB"],
  [48, "2026-06-24T02:00:00Z", "Guadalajara Stadium", "COL", "COD"],
  [49, "2026-06-24T22:00:00Z", "Miami Stadium", "SCO", "BRA"],
  [50, "2026-06-24T22:00:00Z", "Atlanta Stadium", "MAR", "HAI"],
  [51, "2026-06-24T19:00:00Z", "BC Place Vancouver", "SUI", "CAN"],
  [52, "2026-06-24T19:00:00Z", "Seattle Stadium", "BIH", "QAT"],
  [53, "2026-06-25T01:00:00Z", "Mexico City Stadium", "CZE", "MEX"],
  [54, "2026-06-25T01:00:00Z", "Monterrey Stadium", "RSA", "KOR"],
  [55, "2026-06-25T20:00:00Z", "Philadelphia Stadium", "CUW", "CIV"],
  [56, "2026-06-25T20:00:00Z", "New York/New Jersey Stadium", "ECU", "GER"],
  [57, "2026-06-25T23:00:00Z", "Dallas Stadium", "JPN", "SWE"],
  [58, "2026-06-25T23:00:00Z", "Kansas City Stadium", "TUN", "NED"],
  [59, "2026-06-26T02:00:00Z", "Los Angeles Stadium", "TUR", "USA"],
  [60, "2026-06-26T02:00:00Z", "San Francisco Bay Area Stadium", "PAR", "AUS"],
  [61, "2026-06-26T19:00:00Z", "Boston Stadium", "NOR", "FRA"],
  [62, "2026-06-26T19:00:00Z", "Toronto Stadium", "SEN", "IRQ"],
  [63, "2026-06-27T03:00:00Z", "Seattle Stadium", "EGY", "IRN"],
  [64, "2026-06-27T03:00:00Z", "BC Place Vancouver", "NZL", "BEL"],
  [65, "2026-06-27T00:00:00Z", "Houston Stadium", "CPV", "KSA"],
  [66, "2026-06-27T00:00:00Z", "Guadalajara Stadium", "URU", "ESP"],
  [67, "2026-06-27T21:00:00Z", "New York/New Jersey Stadium", "PAN", "ENG"],
  [68, "2026-06-27T21:00:00Z", "Philadelphia Stadium", "CRO", "GHA"],
  [69, "2026-06-28T02:00:00Z", "Kansas City Stadium", "ALG", "AUT"],
  [70, "2026-06-28T02:00:00Z", "Dallas Stadium", "JOR", "ARG"],
  [71, "2026-06-27T23:30:00Z", "Miami Stadium", "COL", "POR"],
  [72, "2026-06-27T23:30:00Z", "Atlanta Stadium", "COD", "UZB"],
];

// Knockout fixtures (matches 73–104) — seeded as placeholders with the
// official bracket labels, dates and venues. Teams get filled in from
// the admin panel as the bracket resolves.
const KNOCKOUT_FIXTURES: [
  match: number,
  stage: FixtureStage,
  kickoffUtc: string,
  venue: string,
  homeLabel: string,
  awayLabel: string,
][] = [
  // Round of 32 (June 28 – July 3)
  [73, "R32", "2026-06-28T19:00:00Z", "Los Angeles Stadium", "Runner-up A", "Runner-up B"],
  [74, "R32", "2026-06-29T20:30:00Z", "Boston Stadium", "Winner E", "3rd A/B/C/D/F"],
  [75, "R32", "2026-06-30T01:00:00Z", "Monterrey Stadium", "Winner F", "Runner-up C"],
  [76, "R32", "2026-06-29T17:00:00Z", "Houston Stadium", "Winner C", "Runner-up F"],
  [77, "R32", "2026-06-30T21:00:00Z", "New York/New Jersey Stadium", "Winner I", "3rd C/D/F/G/H"],
  [78, "R32", "2026-06-30T17:00:00Z", "Dallas Stadium", "Runner-up E", "Runner-up I"],
  [79, "R32", "2026-07-01T01:00:00Z", "Mexico City Stadium", "Winner A", "3rd C/E/F/H/I"],
  [80, "R32", "2026-07-01T16:00:00Z", "Atlanta Stadium", "Winner L", "3rd E/H/I/J/K"],
  [81, "R32", "2026-07-02T00:00:00Z", "San Francisco Bay Area Stadium", "Winner D", "3rd B/E/F/I/J"],
  [82, "R32", "2026-07-01T20:00:00Z", "Seattle Stadium", "Winner G", "3rd A/E/H/I/J"],
  [83, "R32", "2026-07-02T23:00:00Z", "Toronto Stadium", "Runner-up K", "Runner-up L"],
  [84, "R32", "2026-07-02T19:00:00Z", "Los Angeles Stadium", "Winner H", "Runner-up J"],
  [85, "R32", "2026-07-03T03:00:00Z", "BC Place Vancouver", "Winner B", "3rd E/F/G/I/J"],
  [86, "R32", "2026-07-03T22:00:00Z", "Miami Stadium", "Winner J", "Runner-up H"],
  [87, "R32", "2026-07-04T01:30:00Z", "Kansas City Stadium", "Winner K", "3rd D/E/I/J/L"],
  [88, "R32", "2026-07-03T18:00:00Z", "Dallas Stadium", "Runner-up D", "Runner-up G"],
  // Round of 16 (July 4–7)
  [89, "R16", "2026-07-04T21:00:00Z", "Philadelphia Stadium", "Winner M74", "Winner M77"],
  [90, "R16", "2026-07-04T17:00:00Z", "Houston Stadium", "Winner M73", "Winner M75"],
  [91, "R16", "2026-07-05T20:00:00Z", "New York/New Jersey Stadium", "Winner M76", "Winner M78"],
  [92, "R16", "2026-07-06T00:00:00Z", "Mexico City Stadium", "Winner M79", "Winner M80"],
  [93, "R16", "2026-07-06T19:00:00Z", "Dallas Stadium", "Winner M83", "Winner M84"],
  [94, "R16", "2026-07-07T00:00:00Z", "Seattle Stadium", "Winner M81", "Winner M82"],
  [95, "R16", "2026-07-07T16:00:00Z", "Atlanta Stadium", "Winner M86", "Winner M88"],
  [96, "R16", "2026-07-07T20:00:00Z", "BC Place Vancouver", "Winner M85", "Winner M87"],
  // Quarter-finals (July 9–11)
  [97, "QF", "2026-07-09T20:00:00Z", "Boston Stadium", "Winner M89", "Winner M90"],
  [98, "QF", "2026-07-10T19:00:00Z", "Los Angeles Stadium", "Winner M93", "Winner M94"],
  [99, "QF", "2026-07-11T21:00:00Z", "Miami Stadium", "Winner M91", "Winner M92"],
  [100, "QF", "2026-07-12T01:00:00Z", "Kansas City Stadium", "Winner M95", "Winner M96"],
  // Semi-finals (July 14–15)
  [101, "SF", "2026-07-14T19:00:00Z", "Dallas Stadium", "Winner M97", "Winner M98"],
  [102, "SF", "2026-07-15T19:00:00Z", "Atlanta Stadium", "Winner M99", "Winner M100"],
  // Third place + final
  [103, "THIRD_PLACE", "2026-07-18T21:00:00Z", "Miami Stadium", "Loser M101", "Loser M102"],
  [104, "FINAL", "2026-07-19T19:00:00Z", "New York/New Jersey Stadium", "Winner M101", "Winner M102"],
];

async function main() {
  for (const [id, name, flag, groupName] of TEAMS) {
    await prisma.team.upsert({
      where: { id },
      update: { name, flag, groupName },
      create: { id, name, flag, groupName },
    });
  }
  console.log(`Seeded ${TEAMS.length} teams.`);

  // Group fixtures: keep teams/kickoff/venue in sync, never touch scores.
  for (const [matchNumber, kickoff, venue, home, away] of GROUP_FIXTURES) {
    const data = {
      stage: "GROUP" as FixtureStage,
      kickoff: new Date(kickoff),
      venue,
      homeTeamId: home,
      awayTeamId: away,
    };
    await prisma.fixture.upsert({
      where: { matchNumber },
      update: data,
      create: { matchNumber, ...data },
    });
  }
  console.log(`Seeded ${GROUP_FIXTURES.length} group fixtures.`);

  // Knockout fixtures: create-only, so re-seeding never overwrites the
  // teams/kickoffs/scores you set from the admin panel.
  for (const [matchNumber, stage, kickoff, venue, homeLabel, awayLabel] of KNOCKOUT_FIXTURES) {
    await prisma.fixture.upsert({
      where: { matchNumber },
      update: {},
      create: {
        matchNumber,
        stage,
        kickoff: new Date(kickoff),
        venue,
        homeLabel,
        awayLabel,
      },
    });
  }
  console.log(`Seeded ${KNOCKOUT_FIXTURES.length} knockout fixtures.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
