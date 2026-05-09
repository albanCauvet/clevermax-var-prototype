#ifndef GUARD_CLEVERMAX_MISSIONS_H
#define GUARD_CLEVERMAX_MISSIONS_H

#include "global.h"

enum
{
    CM_MISSION_ID_NONE,
    CM_MISSION_ID_1,
    CM_MISSION_ID_2,
    CM_MISSION_ID_3,
    CM_MISSION_ID_4,
    CM_MISSION_ID_5,
    CM_MISSION_ID_6,
    CM_MISSION_ID_7,
    CM_MISSION_ID_8,
    CM_MISSION_COUNT,
};

struct CleverMaxMissionDef
{
    const u8 *title;
    u16 completionFlag;
};

extern const struct CleverMaxMissionDef gCleverMaxMissions[CM_MISSION_COUNT];

#endif
