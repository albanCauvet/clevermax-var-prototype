# CleverMax -> pokeemerald (copier-coller)

## 1) Copier les fichiers

Depuis ce dossier, copier dans votre repo `pokeemerald`:

- `include/clevermax/flags.h` -> `include/clevermax/flags.h`
- `include/clevermax/missions.h` -> `include/clevermax/missions.h`
- `include/clevermax/strings.h` -> `include/clevermax/strings.h`
- `src/clevermax/missions.c` -> `src/clevermax/missions.c`
- `data/scripts/clevermax/dialogues.inc` -> `data/scripts/clevermax/dialogues.inc`
- `data/scripts/clevermax/main.inc` -> `data/scripts/clevermax/main.inc`

## 2) Raccorder la compilation C

Ajouter `src/clevermax/missions.o` dans la liste des objets du `Makefile` (ou build list equivalente).

## 3) Raccorder les scripts

Inclure `data/scripts/clevermax/main.inc` depuis votre agregateur principal de scripts.

## 4) Raccorder les flags

Option A (rapide): garder `include/clevermax/flags.h` et inclure ce header dans les modules CleverMax.

Option B (canonique): recopier les defines dans `include/constants/flags.h`, en remplacant `FLAG_CUSTOM_START + N` par un bloc libre adapte a votre fork.

## 5) Raccorder les events PNJ dans Porymap

Assigner les scripts suivants aux object events:

- `CleverMax_NPC_RC_BRIEF_Script`
- `CleverMax_NPC_CM_MERCHANT_Script`
- `CleverMax_NPC_CM_STUDENT_Script`
- `CleverMax_NPC_CM_SAILOR_Script`
- `CleverMax_NPC_RC_FINAL_Script`

Utiliser aussi la feuille de route des warps:
- `generated/clevermax_warp_routing.md` (dans ce repo design)

## 6) Test minimal

1. Build ROM
2. Spawn dans `CM_GARE`
3. Parler a RC -> verifier `FLAG_CM_MISSION_01_DONE`
4. Enchainer les PNJ et verifier debloquages de warps
