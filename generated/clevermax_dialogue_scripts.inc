/* Auto-generated dialogue script skeleton */
#include "global.h"
#include "event_data.h"
#include "constants/flags.h"

CleverMax_NPC_RC_BRIEF_Text:
    .string "Max, Toulon est notre terrain d'enquete. Observe les details, protege les gens, puis avance.$"

CleverMax_NPC_RC_BRIEF_Script:
    lock
    msgbox CleverMax_NPC_RC_BRIEF_Text, MSGBOX_DEFAULT
    setflag FLAG_CM_MISSION_01_DONE
    release
    end

CleverMax_NPC_CM_MERCHANT_Text:
    .string "En ville, les infos circulent vite. Verifie toujours avant de relayer.$"

CleverMax_NPC_CM_MERCHANT_Script:
    lock
    msgbox CleverMax_NPC_CM_MERCHANT_Text, MSGBOX_DEFAULT
    setflag FLAG_CM_MISSION_02_DONE
    release
    end

CleverMax_NPC_CM_STUDENT_Text:
    .string "Un message urgent n'est pas toujours legitime. Prends 10 secondes pour verifier la source.$"

CleverMax_NPC_CM_STUDENT_Script:
    lock
    msgbox CleverMax_NPC_CM_STUDENT_Text, MSGBOX_DEFAULT
    setflag FLAG_CM_MISSION_03_DONE
    release
    end

CleverMax_NPC_CM_SAILOR_Text:
    .string "Au port, on se connecte vite... parfois trop vite. Retiens: reseau public = vigilance maximale.$"

CleverMax_NPC_CM_SAILOR_Script:
    lock
    msgbox CleverMax_NPC_CM_SAILOR_Text, MSGBOX_DEFAULT
    setflag FLAG_CM_MISSION_05_DONE
    release
    end

CleverMax_NPC_GUIDE_LOCAL_Text:
    .string "La place relie les quartiers comme un hub vivant. Dans la ville comme en cyber, tout est connexion.$"

CleverMax_NPC_GUIDE_LOCAL_Script:
    lock
    msgbox CleverMax_NPC_GUIDE_LOCAL_Text, MSGBOX_DEFAULT
    release
    end

CleverMax_NPC_GUIDE_TOUR_Text:
    .string "D'ici, tu vois toute la rade. Croiser les perspectives, c'est aussi ca la securite.$"

CleverMax_NPC_GUIDE_TOUR_Script:
    lock
    msgbox CleverMax_NPC_GUIDE_TOUR_Text, MSGBOX_DEFAULT
    release
    end

CleverMax_NPC_RC_FINAL_Text:
    .string "Tu n'as pas juste gagne, tu as forme une defense collective. Mission CleverMax validee.$"

CleverMax_NPC_RC_FINAL_Script:
    lock
    msgbox CleverMax_NPC_RC_FINAL_Text, MSGBOX_DEFAULT
    setflag FLAG_CM_MISSION_08_DONE
    release
    end

CleverMax_NPC_GRAND_WILLIAM_Text:
    .string "Vous cherchiez la faille technique. J'attendais la faille humaine.$"

CleverMax_NPC_GRAND_WILLIAM_Script:
    lock
    msgbox CleverMax_NPC_GRAND_WILLIAM_Text, MSGBOX_DEFAULT
    release
    end
