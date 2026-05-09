# Architecture Cible (GBA)

## Couches

1. `Data metier` (ce repo)
- Maps logiques
- Dialogues narratifs
- Quetes et progression

2. `Adaptation GBA`
- Generation de scripts/events/flags
- Mapping warps/collisions

3. `Runtime pokeemerald`
- Engine GBA
- Rendering tile/sprite
- Input/hitbox/events natifs

## Conventions

- Maps nommees: `CM_<ZONE>_<SUBZONE>` (ex: `CM_CENTRE_RUES`)
- Flags de mission: `FLAG_CM_MISSION_*_DONE`
- Flags annexes: `FLAG_CM_*`
- Vars etat: `VAR_CM_*`
- NPC events: `OBJ_EVENT_GFX_CM_*`

## Vision parcours reel + jeu

Le parcours principal suit 8 zones pensables en balade reelle a Toulon:

1. `CM_GARE`
2. `CM_CENTRE_RUES`
3. `CM_PLACE_CENTRALE`
4. `CM_OPERA`
5. `CM_PORT_TOULON`
6. `CM_MOURILLON`
7. `CM_FARON`
8. `CM_LICES_FINAL`

Chaque zone combine:
- un role gameplay (hub, heritage, waterfront, finale)
- une subtilite touristique locale
- une mission cyber de sensibilisation
