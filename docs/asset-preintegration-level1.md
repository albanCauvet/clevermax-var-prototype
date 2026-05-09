# Asset Pre-Integration - Level 1

## What was prepared
- Imported technical asset pack in `assets/level-01-pack-v2-technical`.
- Added automated background cleanup for generated sprite sheets:
  - `hero_max_16x24_4dir_v2.clean2.png`
  - `npc_pack_16x24_3chars_v2.clean2.png`
- Generated frame metadata manifest:
  - `sprite-manifest.auto.json`

## Scripts
- `scripts/clean_sprites_strict.mjs`
  - Removes checkerboard-like neutral backgrounds from generated sprite sheets.
- `scripts/build_sprite_manifest_clean2.mjs`
  - Detects sprite frame bounding boxes and writes an auto manifest.
- `scripts/build_sprite_manifest.mjs`
  - Initial detector (kept for reference).

## Runtime integration choices
- Hero animation driven by manifest rows/cols:
  - rows: down, left, right, up
  - cols: idle, walk_1, walk_2, walk_3
- NPC runtime mapping currently targets 3 characters:
  - student, merchant, rc

## Next technical step
- Replace temporary zone block rendering with actual tile atlas rendering from `tileset_city_med_16x16_v2.png`.
