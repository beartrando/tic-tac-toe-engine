export const domainBattleConfig = {
    battleTurnTimeLimit: Number(process.env.BATTLE_TURN_TIME_LIMIT ?? 21),
    battleStartTimeLimit: Number(process.env.BATTLE_START_TIME_LIMIT ?? 5),
};

export default domainBattleConfig;
