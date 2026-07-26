import { type DB } from './db.js';
import { importCampaign, EXPORT_FORMAT, EXPORT_VERSION, type CampaignExport } from './transfer.js';

/** Sample fantasy magitek campaign, shipped in the same shape as an export file. */
export const SAMPLE_CAMPAIGN: CampaignExport = {
  format: EXPORT_FORMAT,
  version: EXPORT_VERSION,
  campaign: {
    name: 'Cinders of the Aether Engine',
    setting: 'Voltengard — a city-state powered by arcane engines that burn refined aether',
    description:
      'The party are licensed troubleshooters for the Cogwright Guild. Someone is sabotaging ' +
      'the Aether Engine that keeps Voltengard aloft, and every faction in the city has a ' +
      'reason to want it — or the blame for it.',
  },
  records: [
    // ---- NPCs ----
    {
      type: 'npc',
      name: 'Magistrix Ilsa Varn',
      subtitle: 'Guildmaster of the Cogwrights',
      tags: 'ally, quest-giver, guild',
      description:
        'Stern, brilliant, and perpetually short on sleep. Hired the party after the first ' +
        'sabotage attempt. **Secret:** she signed off on the Undervault safety waivers that ' +
        'the Ashveil now uses as recruitment propaganda.',
      data: {
        stats: [
          { label: 'Race', value: 'Human' },
          { label: 'Role', value: 'Artificer 9' },
          { label: 'Found at', value: 'The Brass Spire' },
          { label: 'Attitude', value: 'Ally (guarded)' },
        ],
      },
    },
    {
      type: 'npc',
      name: 'Krail Emberjaw',
      subtitle: 'Foundry boss of the Emberflow',
      tags: 'neutral, industry, secret',
      description:
        'Dragonborn foreman with a handshake like a hydraulic press. Publicly loyal to the ' +
        'Guild. *Secretly funnels scrap and coin to the Ashveil* — he believes the Engine is ' +
        'killing the district\'s children with aether-lung.',
      data: {
        stats: [
          { label: 'Race', value: 'Dragonborn (brass)' },
          { label: 'Role', value: 'Fighter 6' },
          { label: 'Found at', value: 'Emberflow Foundry' },
          { label: 'Attitude', value: 'Friendly mask, hidden agenda' },
        ],
      },
    },
    {
      type: 'npc',
      name: 'Tessa "Nine-Volt" Marrow',
      subtitle: 'Street tinker & information broker',
      tags: 'contact, rogue, comic-relief',
      description:
        'Gnome fence who trades in rumors, salvaged sparkcells, and favors. Prices in ' +
        '"volts" (favors owed). Knows every smuggler tunnel into the Undervault.',
      data: {
        stats: [
          { label: 'Race', value: 'Gnome' },
          { label: 'Role', value: 'Rogue 5' },
          { label: 'Found at', value: 'Sparkgutter Market' },
          { label: 'Price', value: '1 volt per secret' },
        ],
      },
    },
    {
      type: 'npc',
      name: 'Archcanon Deverel',
      subtitle: 'Voice of the Machine-Saint',
      tags: 'religion, wildcard',
      description:
        'Preaches that the Aether Engine is a caged god and must be *ministered to*, not ' +
        'merely maintained. His congregation includes half the Engine\'s night crew — which ' +
        'makes him either the best ally or the worst enemy the party could pick.',
      data: {
        stats: [
          { label: 'Race', value: 'Half-elf' },
          { label: 'Role', value: 'Cleric 8 (Forge)' },
          { label: 'Found at', value: 'Cathedral of the Turning Wheel' },
          { label: 'Attitude', value: 'Unreadable' },
        ],
      },
    },
    {
      type: 'npc',
      name: 'Unit KLN-4 "Kiln"',
      subtitle: 'Awakened warforged laborer',
      tags: 'ally, sootborn, heart',
      description:
        'Woke up mid-shift three years ago and has been quietly organizing the Sootborn ever ' +
        'since. Wants citizenship for constructed folk. Carries the **Heartcore** — proof that ' +
        'House Voss has been harvesting warforged cores to overclock the Engine.',
      data: {
        stats: [
          { label: 'Race', value: 'Warforged' },
          { label: 'Role', value: 'Barbarian 4' },
          { label: 'Found at', value: 'The Undervault, Shift Hall 3' },
          { label: 'Attitude', value: 'Loyal once earned' },
        ],
      },
    },
    {
      type: 'npc',
      name: 'Lady Ophira Voss',
      subtitle: 'Aether-baroness of House Voss',
      tags: 'villain, nobility, main-plot',
      description:
        'Owns the refineries that feed the Engine. Charming, patient, and entirely willing to ' +
        'let the city fall a few hundred feet if it breaks the Guild\'s charter first. ' +
        '**The Voss Ledger is the key to exposing her.**',
      data: {
        stats: [
          { label: 'Race', value: 'Human' },
          { label: 'Role', value: 'Aristocrat / Wizard 7' },
          { label: 'Found at', value: 'Voss Manor, High Ring' },
          { label: 'Attitude', value: 'Cordially hostile' },
        ],
      },
    },
    // ---- Locations ----
    {
      type: 'location',
      name: 'Voltengard',
      subtitle: 'The flying city-state',
      tags: 'city, hub',
      description:
        'A ringed city held aloft by the Aether Engine at its core. The High Ring holds the ' +
        'noble houses; the Mid Ring, guilds and markets; the Low Ring chokes on engine soot. ' +
        'When the Engine stutters, the whole city *tilts*.',
      data: {
        stats: [
          { label: 'Population', value: '~40,000' },
          { label: 'Government', value: 'Guild charter + noble houses' },
          { label: 'Danger', value: 'Falling. Literally.' },
        ],
      },
    },
    {
      type: 'location',
      name: 'The Brass Spire',
      subtitle: 'Cogwright Guild headquarters',
      tags: 'guild, safe-haven, quest-hub',
      description:
        'A drill-shaped tower of workshops. The party\'s licenses, bounties, and repair ' +
        'contracts are issued from Magistrix Varn\'s office on the 12th floor. Guild law: no ' +
        'open flame, no open spellbooks, no open questions about the Undervault.',
      data: {
        stats: [
          { label: 'District', value: 'Mid Ring' },
          { label: 'Notable NPC', value: 'Magistrix Ilsa Varn' },
        ],
      },
    },
    {
      type: 'location',
      name: 'Emberflow Foundry',
      subtitle: 'Where the Engine\'s parts are forged',
      tags: 'industry, danger',
      description:
        'Rivers of molten brass, chained fire elementals, and a workforce that never fully ' +
        'clocks out. Site of the Foundry Floor Ambush. The east gantry has a "maintenance ' +
        'hatch" that Krail pretends not to know about.',
      data: {
        stats: [
          { label: 'District', value: 'Low Ring' },
          { label: 'Notable NPC', value: 'Krail Emberjaw' },
          { label: 'Hazard', value: 'Molten metal, DC 12 Con vs. heat' },
        ],
      },
    },
    {
      type: 'location',
      name: 'The Undervault',
      subtitle: 'Aether mains beneath the city',
      tags: 'dungeon, restricted',
      description:
        'Miles of humming conduit, condensation like glowing rain, and work crews who are ' +
        'paid double not to talk. Aether leaks spawn **sparkwisps** and worse. Access requires ' +
        'a Guild sigil-key — or Tessa\'s tunnels.',
      data: {
        stats: [
          { label: 'District', value: 'Beneath everything' },
          { label: 'Hazard', value: 'Aether leaks, wild magic surges' },
          { label: 'Light', value: 'Dim (blue-green glow)' },
        ],
      },
    },
    {
      type: 'location',
      name: 'Greyreach Wastes',
      subtitle: 'The mana-blighted lands below',
      tags: 'wilderness, travel',
      description:
        'The scarred country Voltengard flies over — drained of magic by a century of aether ' +
        'strip-mining. Ash storms, salvager caravans, and things that learned to live without ' +
        'mana. Where the city\'s garbage (and bodies) land.',
      data: {
        stats: [
          { label: 'Terrain', value: 'Ash flats, dead forests' },
          { label: 'Encounter DC', value: 'Roll d20 per day, encounter on 15+' },
        ],
      },
    },
    // ---- Factions ----
    {
      type: 'faction',
      name: 'Cogwright Guild',
      subtitle: 'Keepers of the Aether Engine',
      tags: 'patron, law',
      description:
        'Engineers, artificers, and clerks who hold the city charter. They pay the party\'s ' +
        'retainer. Publicly neutral; privately terrified that the sabotage is an inside job.',
      data: {
        stats: [
          { label: 'Leader', value: 'Magistrix Ilsa Varn' },
          { label: 'Goal', value: 'Keep the Engine (and the charter) running' },
          { label: 'Party standing', value: 'Employed, rank: Licensed Troubleshooter' },
        ],
      },
    },
    {
      type: 'faction',
      name: 'The Ashveil',
      subtitle: 'Saboteur cult of the grounded world',
      tags: 'antagonist, cult',
      description:
        'Believe Voltengard is a parasite and the Engine\'s fall would let the Greyreach ' +
        'heal. Cells organized in threes; members marked by a soot handprint over the heart. ' +
        'Their prophet, the Cindermage, answers to someone with real money.',
      data: {
        stats: [
          { label: 'Leader', value: 'The Cindermage (identity unknown)' },
          { label: 'Goal', value: 'Bring the city down — gently, they claim' },
          { label: 'Party standing', value: 'Hostile' },
        ],
      },
    },
    {
      type: 'faction',
      name: 'House Voss Aetherworks',
      subtitle: 'The refinery monopoly',
      tags: 'antagonist, nobility, money',
      description:
        'Refines raw aether for the Engine and owns the debt of half the Low Ring. Lady ' +
        'Ophira wants the Guild charter revoked so the houses rule directly. Quietly bankrolls ' +
        'the Ashveil through four shell companies — it\'s all in the Ledger.',
      data: {
        stats: [
          { label: 'Leader', value: 'Lady Ophira Voss' },
          { label: 'Goal', value: 'Break the Guild, own the city' },
          { label: 'Party standing', value: 'Politely surveilled' },
        ],
      },
    },
    {
      type: 'faction',
      name: 'The Sootborn',
      subtitle: 'Warforged labor movement',
      tags: 'ally, underdog',
      description:
        'Constructed workers seeking personhood under the charter. No violence yet — Kiln ' +
        'keeps the hotheads in check, barely. If the party proves the Heartcore harvesting, ' +
        'the Sootborn march; the only question is on whom.',
      data: {
        stats: [
          { label: 'Leader', value: 'Unit KLN-4 "Kiln"' },
          { label: 'Goal', value: 'Citizenship for constructed folk' },
          { label: 'Party standing', value: 'Cautiously hopeful' },
        ],
      },
    },
    // ---- Items ----
    {
      type: 'item',
      name: 'Aetherlock Pistol',
      subtitle: 'Sidearm that fires bound sparks',
      tags: 'weapon, magitek',
      description:
        'A brass revolver charged from a sparkcell. On a natural 1 the cell vents: wielder ' +
        'takes 1d4 lightning and the shot goes wild.',
      data: {
        stats: [
          { label: 'Damage', value: '1d10 lightning, range 60/180' },
          { label: 'Properties', value: 'Reload 6, loud' },
          { label: 'Rarity', value: 'Uncommon' },
        ],
      },
    },
    {
      type: 'item',
      name: 'Coil of Binding',
      subtitle: 'Rope that obeys spoken knots',
      tags: 'utility, magitek',
      description:
        '15 m of braided copper-silk. Speak a command word to tie, untie, or constrict ' +
        '(escape DC 15). The Ashveil use these as tripwires wired to sparkcells.',
      data: {
        stats: [
          { label: 'Rarity', value: 'Uncommon' },
          { label: 'Charges', value: '3/day' },
        ],
      },
    },
    {
      type: 'item',
      name: "Kiln's Heartcore",
      subtitle: 'Evidence, and a life',
      tags: 'plot, quest-item',
      description:
        'A warforged core stamped with a House Voss refinery mark it should not have. Proof ' +
        'of the harvesting program. Kiln will *not* hand it over — it belonged to a friend.',
      data: {
        stats: [
          { label: 'Rarity', value: 'Unique' },
          { label: 'Plot use', value: 'Exposes House Voss if paired with the Ledger' },
        ],
      },
    },
    {
      type: 'item',
      name: 'The Voss Ledger',
      subtitle: 'Four shell companies, one signature',
      tags: 'plot, macguffin',
      description:
        'Lady Ophira\'s private accounts. Currently in a warded safe in Voss Manor\'s study. ' +
        'Tessa knows the safe\'s maker; the maker owes Tessa two volts.',
      data: {
        stats: [
          { label: 'Rarity', value: 'Unique' },
          { label: 'Location', value: 'Voss Manor, study safe (Arcane Lock, DC 17)' },
        ],
      },
    },
    {
      type: 'item',
      name: 'Stormcell Battery',
      subtitle: 'A thunderstorm in a jar',
      tags: 'consumable, magitek',
      description:
        'Powers any magitek device for a week, or discharges as a 20-ft lightning burst ' +
        '(4d8, Dex DC 14 half). The Engine eats forty of these a day.',
      data: {
        stats: [
          { label: 'Rarity', value: 'Common (in Voltengard)' },
          { label: 'Price', value: '25 gp, restricted sale' },
        ],
      },
    },
    {
      type: 'item',
      name: 'Gauntlet of the Machine-Saint',
      subtitle: 'Relic of the first Engineer',
      tags: 'relic, religion',
      description:
        'Deverel\'s cathedral relic. Lets the wearer *speak with constructs* at will and, ' +
        'once ever, still a machine the size of a city. Deverel believes the party will need ' +
        'it. He\'s right.',
      data: {
        stats: [
          { label: 'Rarity', value: 'Legendary' },
          { label: 'Attunement', value: 'Yes (any class)' },
        ],
      },
    },
    // ---- Encounters ----
    {
      type: 'encounter',
      name: 'Foundry Floor Ambush',
      subtitle: 'Ashveil saboteurs hit the Emberflow',
      tags: 'combat, act-1',
      description:
        'Three zealots plant sparkcell charges on the main crucible while a Cindermage acolyte ' +
        'covers them from the gantry. **Terrain:** molten brass channels (DC 12 Dex or 2d6 ' +
        'fire), chain hoists (swing as bonus action). Zealots fight to the death; the acolyte ' +
        'flees at half HP with the detonator.',
      data: {
        combatants: [
          { id: 'e1a', name: 'Cindermage Acolyte', init: 15, hp: 27, maxHp: 27 },
          { id: 'e1b', name: 'Ashveil Zealot A', init: 12, hp: 16, maxHp: 16 },
          { id: 'e1c', name: 'Ashveil Zealot B', init: 12, hp: 16, maxHp: 16 },
          { id: 'e1d', name: 'Ashveil Zealot C', init: 8, hp: 16, maxHp: 16 },
        ],
      },
    },
    {
      type: 'encounter',
      name: 'Undervault Leak',
      subtitle: 'A ruptured main births an elemental',
      tags: 'combat, hazard, act-2',
      description:
        'A cracked conduit floods Junction 9 with raw aether. An **aether elemental** ' +
        'coalesces, trailed by sparkwisps. Closing the valve (3 successes, DC 13 Arcana or ' +
        'thieves\' tools) starves the elemental — 10 fewer HP per success. Wild magic surge on ' +
        'any spell cast within the mist.',
      data: {
        combatants: [
          { id: 'e2a', name: 'Aether Elemental', init: 10, hp: 90, maxHp: 90 },
          { id: 'e2b', name: 'Sparkwisp A', init: 17, hp: 10, maxHp: 10 },
          { id: 'e2c', name: 'Sparkwisp B', init: 17, hp: 10, maxHp: 10 },
          { id: 'e2d', name: 'Sparkwisp C', init: 17, hp: 10, maxHp: 10 },
          { id: 'e2e', name: 'Sparkwisp D', init: 17, hp: 10, maxHp: 10 },
        ],
      },
    },
    {
      type: 'encounter',
      name: 'Voss Gala Confrontation',
      subtitle: 'The heist goes loud',
      tags: 'combat, social, act-3',
      description:
        'If the party is caught with the Ledger, Captain Mercer and the house guard move in — ' +
        'politely, in front of two hundred guests. Lady Ophira would *prefer* a scandal-free ' +
        'arrest. Fighting drops party reputation with every noble house; talking their way to ' +
        'the balcony gives a clean escape via airskiff.',
      data: {
        combatants: [
          { id: 'e3a', name: 'Captain Mercer', init: 14, hp: 58, maxHp: 58 },
          { id: 'e3b', name: 'House Guard A', init: 11, hp: 22, maxHp: 22 },
          { id: 'e3c', name: 'House Guard B', init: 11, hp: 22, maxHp: 22 },
        ],
      },
    },
  ],
  notes: [
    {
      title: 'Session 1 — Sparks over the Emberflow',
      session_date: '2026-07-03',
      content: [
        '## Recap',
        '',
        'The party signed their Guild licenses, met **Magistrix Varn**, and were sent to the',
        'Emberflow to investigate a "quality control problem" — which turned out to be the',
        '**Foundry Floor Ambush**.',
        '',
        '- Zealots defeated; one captured alive (currently in Spire holding)',
        '- The acolyte escaped with the detonator via the east gantry hatch',
        '- Krail was *very* fast to blame outside agitators. Too fast?',
        '',
        '## Loot',
        '',
        '- 2× Stormcell Battery',
        '- Soot-handprint pendant (Ashveil cell token)',
        '',
        '## Next time',
        '',
        '1. Interrogate the captured zealot',
        '2. Tessa claims she can trace the pendant — for one volt',
      ].join('\n'),
    },
    {
      title: 'Session 2 — Two Volts Down',
      session_date: '2026-07-10',
      content: [
        '## Recap',
        '',
        'Interrogation revealed the cell answers to a drop-box in **Sparkgutter Market**.',
        'Tessa traced it — the box is emptied by a courier wearing *House Voss livery*.',
        'The party now owes Tessa **two volts** total. She has opinions about interest.',
        '',
        'Kiln approached the party after hours and showed them the **Heartcore**.',
        '',
        '## GM prep for Session 3',
        '',
        '- [ ] Stat the Undervault Junction 9 map (use **Undervault Leak** encounter)',
        '- [ ] Decide what Deverel knows about the harvesting program',
        '- [ ] If the party goes to Varn with the courier lead, she stalls — she needs the',
        '      charter review to pass *first*',
        '',
        '> Cliffhanger: the city tilted 2° at dawn. The Engine skipped a beat.',
      ].join('\n'),
    },
  ],
  formulas: [
    { name: 'Attack +7', formula: '1d20+7' },
    { name: 'Check with advantage', formula: '2d20kh1+5' },
    { name: 'Fireball', formula: '8d6' },
    { name: 'Sneak Attack', formula: '3d6+4' },
    { name: 'Healing Word', formula: '1d4+3' },
    { name: 'Aether Surge (wild)', formula: '1d100' },
  ],
};

/** Seeds the sample campaign on first run (empty database only). */
export function seedIfEmpty(db: DB): boolean {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM campaigns').get() as { n: number };
  if (n > 0) return false;
  importCampaign(db, SAMPLE_CAMPAIGN);
  return true;
}
