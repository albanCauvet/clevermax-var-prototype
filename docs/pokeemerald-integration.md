# Integration pokeemerald (squelette auto-genere)

## Generation

Depuis ce repo:

```bash
node scripts/generate_pokeemerald_skeleton.mjs
```

Sortie dans `generated/`.

## Fichiers produits

- `generated/clevermax_flags.h`
- `generated/clevermax_missions.h`
- `generated/clevermax_strings.h`
- `generated/clevermax_map_meta.h`
- `generated/clevermax_dialogue_scripts.inc`
- `generated/clevermax_warp_routing.md`

## Import conseille dans pokeemerald

1. Copier les `.h` et `.inc` vers un namespace dedie, par ex:
- `include/clevermax/`
- `data/scripts/clevermax/`

2. Raccorder les flags:
- Integrer definitions dans `constants/flags.h` (ou include secondaire)
- Ajuster les offsets `FLAG_CUSTOM_START + N` selon bloc libre

3. Raccorder les scripts PNJ:
- Assigner `CleverMax_<NPC>_Script` aux object events des maps `CM_*`

4. Mapper les warps:
- Suivre `generated/clevermax_warp_routing.md` dans Porymap

## Note

Ce squelette est volontairement simple: il fournit l'ossature de branchement et laisse la main sur les details de script/engine selon votre fork `pokeemerald`.
