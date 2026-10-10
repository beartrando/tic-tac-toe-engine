export const messageConsumersConfig: Record<string, string> = {
    matchmakingMatched: process.env.MESSAGE_CONSUMER_TOPIC_MATCHMAKING_MATCHED ?? 'matchmaking.matched',
};

export default messageConsumersConfig;
