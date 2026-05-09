# CleverMax - ROM First (Porymap + pokeemerald)

Base de projet pour construire **CleverMax** comme vrai jeu GBA en s'appuyant sur:
- decompilation `pokeemerald`
- edition de maps via `Porymap`

## Objectif

Construire un jeu narratif cyber de sensibilisation, ancre dans Toulon, avec un parcours principal en 8 zones rejouable aussi comme balade reelle.

## Structure

- `docs/` : architecture cible et plan de migration
- `data/maps/` : specs des zones CleverMax (source de verite design)
- `data/dialogues/` : dialogues metier (source de verite narrative)
- `data/quests/` : progression et flags (source de verite gameplay)
- `scripts/` : scripts utilitaires de generation
- `generated/` : sorties d'integration pokeemerald
- `tools/porymap/` : notes et config d'integration Porymap

## Parcours principal V2

1. Gare de Toulon
2. Rues provencales du centre
3. Place de la Liberte
4. Opera de Toulon
5. Port de Toulon
6. Plages du Mourillon
7. Mont Faron
8. Les Lices (finale)

## Generer le squelette pokeemerald

```bash
node scripts/generate_pokeemerald_skeleton.mjs
```

Puis suivre:
- `docs/pokeemerald-integration.md`
- `generated/clevermax_warp_routing.md`
