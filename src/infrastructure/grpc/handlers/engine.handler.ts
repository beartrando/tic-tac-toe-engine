import * as engineProto from '../../../contracts/proto/engine';
import * as emptyProto from '../../../contracts/proto/common/empty';
import logger from "@shared/logger";
import BattleEntity from "../../../domain/battle/battle.entity";
import BattleProtoMapper from "../mappers/battle.proto.mapper";
import BattleMoveProtoMapper from "../mappers/battle-move.proto.mapper";
import BattleLeaveProtoMapper from "../mappers/battle-leave.proto.mapper";
import EngineStream from "../types/engine.stream";
import EngineStreamContainer from "../streams/engine.stream.container";
import BattleService from "../../battle/service";
import BattleStartProtoMapper from "../mappers/battle-start-proto.mapper";


export class EngineHandler {
    constructor(
        private readonly battleService: BattleService,
        private readonly engineStreamContainer: EngineStreamContainer,
    ) {
    }

    async battleChannel(call: EngineStream) {

        logger.log('>>> BATTLE CHANNEL RPC RECEIVED');

        this.engineStreamContainer.add(call);

        try {
            // слушаем входящие события от Streaming
            call.on("data", async (event: engineProto.BattleRequest) => {
                try {
                    if (event.create) {
                        // logger.log(event);
                        const battleEntity: BattleEntity = BattleProtoMapper.toDomain(event.create);
                        await this.battleService.create(battleEntity, event.trackId);
                    } else if (event.start) {
                        // logger.log(event);
                        const battleStart = BattleStartProtoMapper.toDomain(event.start);
                        await this.battleService.start(battleStart, event.trackId);
                    } else if (event.move) {
                        // logger.log(event);
                        const battleMove = BattleMoveProtoMapper.toDomain(event.move);
                        await this.battleService.move(battleMove, event.trackId);
                    } else if (event.leave) {
                        // logger.log(event);
                        const battleLeave = BattleLeaveProtoMapper.toDomain(event.leave);
                        await this.battleService.leave(battleLeave, event.trackId);
                    } else if (event.ping) {
                        // logger.info('Streaming-engine stream Ping');
                        const ping = emptyProto.Empty.create({});
                        call.write(engineProto.BattleResponse.create({ping}));

                        // heartbeat — можно просто игнорировать или логировать
                    }
                } catch (err: any) {
                    console.error("Event error:", err);
                }
            });

            call.on("end", () => {
                call.end();
                this.engineStreamContainer.remove(call);
            });

            call.on("error", (err) => {
                this.engineStreamContainer.remove(call);
                console.error("Stream error:", err);
                call.end();
            });

            logger.log('Grpc streaming connection established');
        } catch (err: any) {
            this.engineStreamContainer.remove(call);
            console.error("battleChannel error:", err);
            // callbackError(callback, err);
            call.end();
        }
    }
}

export default EngineHandler;
