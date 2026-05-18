// news-data.js — game site news posts
// Categories: "server" | "minecraft" | "gaming"

const NEWS = [
    {
        id: "ancient-vault-base",
        title: "Building the Ancient Vault: A 3-Story Underground Base",
        category: "server",
        date: "2026-05-18",
        summary: "We built a fully featured 3-floor underground compound on the Java server — command console, armory, greenhouse, observation deck, and more.",
        tags: ["java", "build", "worldedit"],
        content: `
<p>The Ancient Vault is a hand-built underground compound carved out of a 64×64×64 air cube below the Java world. It spans three full stories connected by a wide oak staircase with iron bar railings.</p>

<h4>Floor 1 — Operations Level (Y=32–43)</h4>
<p>The ground floor is split into five rooms: a 49-wide Command Center with a 42-button console (three rows of labeled command blocks for time, weather, gamemode, teleport, and server toggles), a Library, Workshop, Living Quarters, and a central Main Hall with a hanging chandelier. Walls are smooth quartz with waxed copper columns every 10 blocks and sea lanterns embedded in the ceiling.</p>

<h4>Floor 2 — Vault Level (Y=44–54)</h4>
<p>Polished deepslate walls give the second floor a darker, heavier feel. The Navigation Bridge sits directly above the Command Center with a central command table, amethyst pillars, and soul lanterns. The Armory houses iron bar display racks, an anvil, smithing table, and grindstone. The Research Bay on the east side has an enchanting table ringed by bookshelves, two brewing stands, and a cauldron.</p>

<h4>Floor 3 — Crown Level (Y=55–65)</h4>
<p>Polished blackstone brick walls cap the structure. The Observation Deck faces north with tinted glass panels and an amethyst cluster telescope mount. The Greenhouse on the west has a full glass roof, grass floor, two trees, a water pool with lily pad, and flower patches. Sleeping Quarters on the east fit four colored beds (red, blue, cyan, white) with bedside chests and candles.</p>

<h4>Block Palette</h4>
<p>Smooth quartz · Polished deepslate · Polished blackstone bricks · Waxed cut copper · Sea lantern · Soul lantern · Tinted glass · Oak stairs · Iron bars · Amethyst blocks · Dark oak planks · Spruce planks · Grass block</p>
        `
    },
    {
        id: "worldedit-schematics",
        title: "50+ Schematics Now on the Java Server",
        category: "server",
        date: "2026-05-17",
        summary: "Converted all .nbt structure files to WorldEdit .schem format. You can now ask to place any schematic in-game via the console.",
        tags: ["java", "worldedit", "schematics"],
        content: `
<p>All Minecraft structure files in the schematics folder have been converted from the native <code>.nbt</code> format to WorldEdit Sponge Schematic v2 (<code>.schem</code>). That's over 50 builds now ready to paste in-world.</p>

<p>The library includes pixel art (Yoshi, Zelda board, various Pokemon sprites), fantasy structures (Fantasy Fort, Gran Hotel), and decorative builds. Pixel art files are prefixed <code>pixel_</code> for easy filtering.</p>

<p>To place any schematic, stand where you want it and use <code>//schematic load filename.schem</code> followed by <code>//paste -a</code> (the <code>-a</code> flag skips air blocks).</p>
        `
    },
    {
        id: "emulator-cdn-switch",
        title: "Emulator Switched to CDN — Saves 296MB",
        category: "server",
        date: "2026-05-17",
        summary: "The local EmulatorJS data folder was removed. All cores now load from the CDN, and Firebase cloud saves still work.",
        tags: ["emulator", "performance"],
        content: `
<p>The emulator was previously loading its cores (SNES, GBA, N64, NDS, PS1) from a 296MB local <code>data/</code> folder. That folder has been removed — the emulator now loads from <code>cdn.emulatorjs.org</code>.</p>

<p>ROM access still requires a logged-in Firebase account. Cloud saves continue to work. If you notice load times are slightly longer on first launch, that's the CDN fetching the core — subsequent loads use the browser cache.</p>
        `
    },
    {
        id: "mc-server-cloudflare",
        title: "Servers Now Accessible via luissolutions.us",
        category: "server",
        date: "2026-05-14",
        summary: "Cloudflare Tunnel is live. Jellyfin and the main site are accessible from anywhere without port forwarding.",
        tags: ["infrastructure", "cloudflare"],
        content: `
<p>A Cloudflare Zero Trust tunnel now routes external traffic to the homelab without any open ports on the router. The main site at <strong>luissolutions.us</strong> and Jellyfin at <strong>jellyfin.luissolutions.us</strong> are publicly accessible with automatic SSL.</p>

<p>Portainer and NPM are internal-only. If you're on the local network you can reach them at their LAN addresses; they are not exposed externally by design.</p>
        `
    },
    {
        id: "mc-26-1-release",
        title: "Minecraft 26.1 — What's Changed",
        category: "minecraft",
        date: "2026-05-01",
        summary: "A rundown of the key additions in the 26.1 release and what it means for building and survival.",
        tags: ["update", "1.21"],
        content: `
<p>Minecraft 26.1 (internal build Paper 26.1.2-64) brings several quality-of-life changes relevant to builders and survival players. Command syntax for item components has changed — the old NBT bracket syntax (<code>ItemTag:{...}</code>) no longer works. Use the component format: <code>item[component={...}]</code>.</p>

<p>The data pack and WorldEdit compatibility has improved. WorldEdit 7.4.4-SNAPSHOT runs cleanly on 26.1. Sign data still uses <code>front_text.messages</code> with JSON text components.</p>
        `
    },
    {
        id: "speedrun-mario64",
        title: "New Any% Sub-17 Route — Breakdown",
        category: "gaming",
        date: "2026-05-10",
        summary: "The latest optimized any% route for Super Mario 64 breaks down the key tricks that push the run under 17 minutes.",
        tags: ["mario64", "speedrun"],
        content: `
<p>The current any% world record route relies on three major skips: the BLJ into basement to skip all 30-star door, Mips clip for the 50-star door, and the final bowser fight optimizations. Routing through Hazy Maze Cave and Lethal Lava Land in a specific order saves roughly 40 seconds over older routes.</p>

<p>For Louman 64 practice, focus on consistent BLJ timing before optimizing individual movement. A clean BLJ every run is worth more time than optimized movement with occasional resets.</p>
        `
    }
];
