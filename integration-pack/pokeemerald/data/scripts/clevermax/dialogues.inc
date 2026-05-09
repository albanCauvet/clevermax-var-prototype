.include "constants/flags.inc"

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

CleverMax_NPC_RC_FINAL_Text:
	.string "Tu n'as pas juste gagne, tu as forme une defense collective. Mission CleverMax validee.$"

CleverMax_NPC_RC_FINAL_Script:
	lock
	msgbox CleverMax_NPC_RC_FINAL_Text, MSGBOX_DEFAULT
	setflag FLAG_CM_MISSION_08_DONE
	release
	end
