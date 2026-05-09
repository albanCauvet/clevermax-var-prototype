#include "global.h"
#include "clevermax/missions.h"
#include "clevermax/strings.h"
#include "clevermax/flags.h"

const struct CleverMaxMissionDef gCleverMaxMissions[CM_MISSION_COUNT] =
{
    [CM_MISSION_ID_NONE] = { .title = NULL, .completionFlag = 0 },
    [CM_MISSION_ID_1] = { .title = sCleverMaxMissionTitle1, .completionFlag = FLAG_CM_MISSION_01_DONE },
    [CM_MISSION_ID_2] = { .title = sCleverMaxMissionTitle2, .completionFlag = FLAG_CM_MISSION_02_DONE },
    [CM_MISSION_ID_3] = { .title = sCleverMaxMissionTitle3, .completionFlag = FLAG_CM_MISSION_03_DONE },
    [CM_MISSION_ID_4] = { .title = sCleverMaxMissionTitle4, .completionFlag = FLAG_CM_MISSION_04_DONE },
    [CM_MISSION_ID_5] = { .title = sCleverMaxMissionTitle5, .completionFlag = FLAG_CM_MISSION_05_DONE },
    [CM_MISSION_ID_6] = { .title = sCleverMaxMissionTitle6, .completionFlag = FLAG_CM_MISSION_06_DONE },
    [CM_MISSION_ID_7] = { .title = sCleverMaxMissionTitle7, .completionFlag = FLAG_CM_MISSION_07_DONE },
    [CM_MISSION_ID_8] = { .title = sCleverMaxMissionTitle8, .completionFlag = FLAG_CM_MISSION_08_DONE },
};
