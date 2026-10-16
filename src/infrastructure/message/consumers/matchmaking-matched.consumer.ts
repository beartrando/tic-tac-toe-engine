import * as battleProto from "../../../contracts/proto/battle";
import BattleProtoMapper from "../../grpc/mappers/battle.proto.mapper";
import logger from "@shared/logger";
import UseCaseInterface from "../interfaces/use-case.interface";
import BattleService from "../../battle/service";

export class MatchmakingMatchedConsumer implements UseCaseInterface<battleProto.TracedBattle> {
    constructor(
        private readonly battleService: BattleService,
    ) {
    }

    async execute(topic: string, partition: number, message: battleProto.TracedBattle): Promise<void> {
        logger.log(message);
        try {
            if (!message.battle) {
                return;
            }
            const battle = BattleProtoMapper.toDomain(message.battle);
            // logger.log(battle);
            await this.battleService.create(battle, message.trackId);
        } catch (error) {
            logger.error(`[Kafka] Failed to process message`, {
                rawValue: message.battle?.id,
                error,
            });
        }
    }

}

export default MatchmakingMatchedConsumer;
