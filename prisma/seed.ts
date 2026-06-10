import { PrismaClient } from "@prisma/client";

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

async function main() {
  for (const [id, name, flag, groupName] of TEAMS) {
    await prisma.team.upsert({
      where: { id },
      update: { name, flag, groupName },
      create: { id, name, flag, groupName },
    });
  }
  console.log(`Seeded ${TEAMS.length} teams.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
