/* Auto-generated warp routing reference */
# CleverMax Zone Routing

[CM_GARE] Gare de Toulon
- (22,8) -> CM_CENTRE_RUES
[CM_CENTRE_RUES] Rues Provencales
- (1,9) -> CM_GARE
- (26,9) -> CM_PLACE_CENTRALE
[CM_PLACE_CENTRALE] Place de la Liberte
- (1,10) -> CM_CENTRE_RUES
- (22,6) -> CM_OPERA [requires FLAG_CM_MISSION_02_DONE]
- (22,12) -> CM_PORT_TOULON [requires FLAG_CM_MISSION_03_DONE]
[CM_OPERA] Opera de Toulon
- (1,8) -> CM_PLACE_CENTRALE
- (20,8) -> CM_PORT_TOULON [requires FLAG_CM_MISSION_04_DONE]
[CM_PORT_TOULON] Port de Toulon
- (1,8) -> CM_PLACE_CENTRALE
- (24,8) -> CM_MOURILLON [requires FLAG_CM_MISSION_05_DONE]
[CM_MOURILLON] Plages du Mourillon
- (1,9) -> CM_PORT_TOULON
- (26,9) -> CM_FARON [requires FLAG_CM_MISSION_06_DONE]
[CM_FARON] Mont Faron
- (2,7) -> CM_MOURILLON
- (22,7) -> CM_LICES_FINAL [requires FLAG_CM_MISSION_07_DONE]
[CM_LICES_FINAL] Cellule de crise Les Lices
- (2,7) -> CM_GARE
