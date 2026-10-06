export const messageConsumersConfig: Record<string, string> = {
    battleMatched: process.env.MESSAGE_CONSUMER_TOPIC_BATTLE_MATCHED ?? 'battle.matched',
};

export default messageConsumersConfig;
