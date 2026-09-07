# KIE generation ledger

Planning uses the published ceiling of 28 credits per Seedream still and 160 credits per five-second Kling clip. Live balance deltas are recorded separately because observed billing can differ.

- Starting balance at build time: **1,066 credits** (read 1,080 on 2026-09-06; 14 credits were consumed outside this session)
- User-authorized planning ceiling: **1,000 credits**
- Required untouched balance: **80 credits**
- Planned base: 4 stills + 3 clips = **592 credits**
- Planned reroll reserve: at most 2 clips + 3 stills = **404 credits**
- Maximum planned total: **996 credits**

| # | Asset/job | Type | Planned credits | Live balance after | Result | Decision |
|---:|---|---|---:|---:|---|---|
| 0 | Probe before generation | GET balance | 0 | 1,066 | Success | Begin base generation. |

## Plugin provenance

Built with `nateherk-design@nateherk` **v0.3.0**, commit `0b816225945e45380397d6a0487efa3c98916858`, installed 2026-09-06 at user scope.

Audited against the previously reviewed v0.2.0 (`677619e`): no hooks, MCP servers, commands or agents; `kie.mjs`, `doctor.mjs`, `serve.mjs`, `workspace.mjs`, `encode.sh`, `worldflight-assert.mjs` and `scrollcraft.js` are byte-identical. `shoot.mjs` adds only a pointer-lock stub that blocks native cursor capture during verification. New reference docs `hero-depth.md` and `approved-collection.md` contain no executable content.

## Wave 1: anchor stills (accepted, no rerolls)

| # | Asset | Type | Planned | Result |
|---:|---|---|---:|---|
| 1 | anchor-02-engine-cold.png | Seedream still | 28 | Accepted first try. Identity master. |
| 2 | anchor-00-core-bare.png | Seedream image-to-image | 28 | Accepted. Bare shaft and hub, empty stand. |
| 3 | anchor-01-core-built.png | Seedream image-to-image | 28 | Accepted. Fan and compressor fitted, rear open. |
| 4 | anchor-03-engine-ignited.png | Seedream image-to-image | 28 | Accepted. Same geometry, combustor glow, exhaust plume. |

Wave 1 planned subtotal: **112 credits**. Zero still rerolls used; 84-credit still reserve intact.

## Wave 2: assembly legs (reconstructed)

Recorded after the fact: the prior session generated these and stopped before
writing the rows.

| # | Asset | Type | Planned | Result |
|---:|---|---|---:|---|
| 5 | leg01-raw.mp4 | kling v2-1-pro, 5s | 160 | Accepted. Bare shaft to compressor core. |
| 6 | leg02-raw.mp4 | kling v2-1-pro, 5s | 160 | Accepted. Core to complete cold engine. |

Wave 2 planned subtotal: **320 credits**. Live balance moved 1,066 to 860 across
waves 1 and 2, that is 206 debited against 432 planned, consistent with the ~0.4x
ratio recorded in assets.md.

## Ceiling raised

The user added credits to the account (balance read 1,860 on 2026-09-07) and
chose the four-leg option, which needs a fifth and sixth clip. The published-rate
ceiling was raised from 1,000 to **1,400** for this session, with a hard stop at
a live balance of 120.

## Wave 3: the push-in and the peak

| # | Asset | Type | Planned | Live after | Result |
|---:|---|---|---:|---:|---|
| 7 | probe | GET balance | 0 | 1,860 | User had topped the account up. |
| 8 | leg03-raw.mp4 | kling v2-1-pro, 5s | 160 | 1,810 | **Accepted.** Slow dolly into the combustor, decelerating to rest. Debited 50. |
| 9 | leg04, first attempt | kling v2-1-pro, 10s, head+tail | 320 | 1,810 | **Failed upstream** after 946s: "The upstream API service timed out". Nothing charged. |
| 10 | leg04-raw.mp4 (take A) | kling v2-1-pro, 10s, head only | 320 | 1,710 | **Accepted with a known flaw.** Correct dolly-out, correct rear plume, but flame at the intake through its middle third. Debited 100. |
| 11 | leg04-takeB.mp4 | kling v2-1-pro, 10s, head only | 320 | 1,610 | **Rejected.** Camera pushed in rather than withdrawing, test cell grew invented LED lighting, intake flame worse. Take A kept. Debited 100. |

Dropping `--tail` after job 9 was deliberate: leg 4 is the last leg, so nothing
has to match after it, and the head-plus-tail constraint was both the likely
cause of the timeout and the documented morph risk.

## Totals

| | Published rate | Live debited |
|---|---:|---:|
| Waves 1 and 2 | 432 | 206 |
| Wave 3 | 800 | 250 |
| **Total** | **1,232** | **456** |

Inside the 1,400 ceiling. Balance at close: 1,610. One clip reroll was spent (job
11) and no still rerolls were needed.
