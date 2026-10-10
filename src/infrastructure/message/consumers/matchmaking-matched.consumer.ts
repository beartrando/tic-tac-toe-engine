import * as battleProto from "../../../contracts/proto/battle";
import BattleProtoMapper from "../../grpc/mappers/battle.proto.mapper";
import logger from "@shared/logger";
import UseCaseInterface from "../interfaces/use-case.interface";
import BattleService from "../../battle/service";

export class MatchmakingMatchedConsumer implements UseCaseInterface<battleProto.BattleObject> {
    constructor(
        private readonly battleService: BattleService,
    ) {
    }

    async execute(topic: string, partition: number, message: battleProto.BattleObject): Promise<void> {
        logger.log(message);
        try {
            const battle = BattleProtoMapper.toDomain(message);
            // logger.log(battle);
            await this.battleService.create(battle);
        } catch (error) {
            logger.error(`[Kafka] Failed to process message`, {
                rawValue: message.id,
                error,
            });
        }
    }

}

export default MatchmakingMatchedConsumer;
