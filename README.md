# L2NodeSolo

L2NodeSolo is a local-first Lineage II Chronicle 2 server emulator tuned for a solo MMO experiment: one real player, a live world, and SimPlayer bots that make the server feel populated.

It is not trying to be a retail-complete private server. The current focus is bot behavior, party companions, town trade loops, and observability while keeping the server easy to run locally.

## Current State

Works now:

- Chronicle 2 protocol 485 login and game servers.
- Local MariaDB-backed accounts, characters, skills, inventory, shortcuts, and positions.
- Auto account creation when enabled in `config/default.ini`.
- One-command local startup with `npm start`.
- NPC spawn loading plus spatial-grid lookup for nearby NPC queries.
- Player combat, movement, gear equip/unequip, basic item use, drops, pickup, shop buy/sell, and `.sell` junk cleanup.
- Soulshot consume/load flow with the client activation effect and physical damage boost.
- Admin panel with teleport, item shop, random teleport, and Adena tools.
- SimPlayer bots that hunt, rest, flee, revive, shop, restock, chatter, and react to nearby player chat.
- Dynamic bot scaling around online real players, including level/gear/class adjustment.
- Companion bots through the normal `/invite` flow with party HUD packets and an in-game control panel.
- Bot status surfaces through `.botstatus`, companion panel status links, and periodic `BotStatus :: ...` server logs.
- Merchant bots in Talking Island, Gludio, Dion, Giran, and Oren with buy/sell stores and trade-chat ads.
- PK bot behavior, including hunting, fleeing, and nearby bot reactions.
- Optional OpenRouter-backed bot brain, gated to bots visible to real players.

Known rough edges:

- This is a development server, not a hardened public shard.
- Some geodata regions may be missing locally; the server falls back and logs warnings.
- C2 client packet compatibility is fragile. Store nameplate and party UI changes need live client testing.
- The database bootstrap preserves existing data by default. Resetting the database is explicit.

## Requirements

- Node.js LTS.
- Docker, unless you run MariaDB yourself.
- A Lineage II C2 Splendor client using protocol 485.

Client reference: [LINEAGE II C2 Splendor Client](https://drive.google.com/file/d/1NVA4XY3bC2xD_Jejggo_b0fuMFChsZqe/view?usp=sharing)

## Quick Start

```bash
npm start
```

That command will:

- install Node dependencies if `node_modules` is missing;
- create or start a local `nodel2-mariadb` Docker container when the configured database host is `127.0.0.1` or `localhost`;
- import `database/sql/database.sql` on first boot if database `nodel2` does not exist;
- start the auth server on `2106` and the game server on `7777`.

If you run MariaDB yourself, set:

```bash
L2NODE_SKIP_DOCKER=1 npm start
```

The old direct server command still works:

```bash
npm run NodeL2
```

Use it when dependencies and database are already prepared and you want no bootstrap behavior.

## Configuration

Committed defaults live in `config/default.ini`.

Private local overrides go in ignored `config/local.ini`. This is where API keys and machine-specific database settings belong.

Example:

```ini
[OpenRouter]
enabled = true
apiKey = sk-or-v1-your-key-here
model = google/gemini-2.5-flash-lite
debug = true
```

If you use your own database instead of the local Docker container, override the `Database` section there as well.

OpenRouter can also read the key/model from environment variables:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here npm start
```

Useful startup variables:

- `L2NODE_SKIP_DOCKER=1` - skip Docker bootstrap and use the configured database.
- `L2NODE_DB_CONTAINER=some-name` - override the Docker container name.
- `L2NODE_DB_IMAGE=mariadb:10.6` - override the MariaDB image.
- `BOT_STATUS_LOGS=0` - disable periodic bot status log lines.

## In-Game Commands

- `.admin` - open the admin menu.
- `.sell` - sell all unequipped non-Adena items for 50% item value.
- `.bot` or `.companion` - open the companion control panel.
- `.botstatus` - show a bot overview panel.
- `.botstatus <name>` - show detailed status for a specific bot.
- `.leave` - dismiss all companion bots.
- `.kick <name>` - dismiss one companion bot.
- `/invite` while targeting a bot - recruit that bot as a companion.
- `/dismiss <name>` and `/leave` also work through the party request path.

Nearby bots also react to plain chat lines such as `hi`, `follow`, `wait`, `hunt`, `heal`, and `buff`. Healing/buff help is intentionally tied to Gandalf-style mage behavior.

## Bot Systems

SimPlayers are normal server sessions backed by database characters. On startup, `BotManager` loads them, assigns plans, and ticks their behavior.

Main bot modes:

- `hunting` - find monsters, fight, loot, and move between spots.
- `resting` - recover HP/MP.
- `getting_buffed` - visit newbie buff flow when low-level buffs expire.
- `shopping` - return to town, sell junk, and restock consumables.
- `following` - assist a real player as a companion.
- `merchant` - stand in town with private buy/sell store state.
- `pk_hunting` / `pk_fleeing` - hostile player-killer loop and safety recovery.

Bot status is meant to be inspectable. Use `.botstatus`, the companion panel `Status` links, or watch `BotStatus :: ...` lines in the server logs.

## Merchant Bots

Merchant bots currently cover:

- Talking Island: starter materials, starter gear, and island-drop buyers.
- Gludio: D-grade materials, gear, and plains-drop buyers.
- Dion: C-grade crafting stock, parts, and Dion-drop buyers.
- Giran: C/B-grade materials, gear, and Giran-drop buyers.
- Oren: B/A-grade materials, gear, and Oren-drop buyers.

The source of truth for town merchant stock is `src/GameServer/Bot/MerchantStoreConfigs.js`.

## OpenRouter Bot Brain

The deterministic server code still owns combat, movement, inventory, shopping, and safety. The optional LLM brain is only allowed to influence small, whitelisted decisions.

Important behavior:

- Disabled by default.
- Requires `OpenRouter.enabled = true` plus an API key.
- Only considers bots visible to a real online player.
- Skips merchant plans and missing-player contexts.
- Emits debug skip reasons when `OpenRouter.debug = true`.

This keeps token spend tied to player-visible moments instead of letting offline bots burn calls in an empty world.

## Development

Run the focused tests:

```bash
node tests/test_pathfinder_astar.js
node tests/test_path_obstacle.js
```

Run a full boot check:

```bash
npm start
```

Expected healthy boot signs:

- `DB :: connected`
- `Datapack :: cached`
- `SpawnsGrid :: Indexed ... npcs in 2D spatial grid`
- `AuthServer :: successful init for 0.0.0.0:2106`
- `GameServer :: successful init for 0.0.0.0:7777`
- `BotManager :: ... is active in World`

## Credits

This project is a heavily modified solo-MMO fork of the original [NodeL2 Server Emulator](https://github.com/NodeL2/NodeL2).

L2NodeSolo is licensed under the Apache 2.0 license.
