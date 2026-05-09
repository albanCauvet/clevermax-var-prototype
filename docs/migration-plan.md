# Plan de Migration vers Porymap

## Phase 1 - Fondations

1. Installer toolchain `pokeemerald` (agbcc/devkitARM selon setup cible)
2. Installer `Porymap`
3. Valider build ROM vanilla

## Phase 2 - Monde (parcours V2)

1. Creer tilesets CleverMax (16x16, palettes GBA)
2. Construire les maps dans Porymap selon `data/maps/zones.json`
3. Ajouter collisions, warps, connexions selon l'ordre 1 -> 8
4. Integrer signaletique visuelle des transitions (portes, panneaux, PNJ guide)

## Phase 3 - Narration

1. Integrer PNJ et dialogues (`data/dialogues/dialogues.json`)
2. Associer scripts map/events par mission
3. Integrer RC (mentor) et Grand William (twist final)

## Phase 4 - Progression

1. Implementer missions via flags (`data/quests/quests.json`)
2. Debloquer les zones par flags `FLAG_CM_MISSION_*_DONE`
3. Integrer la quete annexe audio (6 collectibles)

## Phase 5 - Vertical Slice

1. Boucle complete jouable: Gare -> Centre -> Place -> Opera -> Port -> Mourillon -> Faron -> Les Lices
2. Test sur emulateur mGBA
3. Ajustements pacing, lisibilite et coherence touristique
