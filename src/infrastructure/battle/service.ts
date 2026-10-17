import {randomUUID} from "crypto";
import {TimerServiceInterface} from "@shared/timer";
import JobService from "../job/service";
import BattleLeaveUseCase from "../../application/use-cases/engine/battle-leave";
import BattleMoveUseCase from "../../application/use-cases/engine/battle-move";
import BattleCreateUseCase from "../../application/use-cases/engine/battle-init";
import BattleLeave from "../../domain/battle/value-objects/battle-leave.vo";
import BattleEntity from "../../domain/battle/battle.entity";
import EngineStreamContainer from "../grpc/streams/engine.stream.container";
import * as engineProto from "../../contracts/proto/engine";
import * as battleProto from "../../contracts/proto/battle";
import BattleProtoMapper from "../grpc/mappers/battle.proto.mapper";
import BattleMove from "../../domain/battle/value-objects/battle-move.vo";
import BattleStatusEnum from "../../domain/battle/enums/battle-status.enum";
import BattleStatus from "../../domain/battle/value-objects/battle-status.vo";
import BattleId from "../../domain/battle/value-objects/battle-id.vo";
import BattleStart from "../../domain/battle/value-objects/battle-start.vo";
import BattleTimeoutUseCase from "../../application/use-cases/engine/battle-timeout";
import BattleStartUseCase from "../../application/use-cases/engine/battle-start";
import logger from "@shared/logger";
import BattleOperationLogger from "../elastic/battle-operation-logger";

export class BattleService {
    constructor(
        private readonly battleTimeoutUseCase: BattleTimeoutUseCase,
        private readonly battleCreateUseCase: BattleCreateUseCase,
        private readonly battleMoveUseCase: BattleMoveUseCase,
        private readonly battleStartUseCase: BattleStartUseCase,
        private readonly battleLeaveUseCase: BattleLeaveUseCase,
        private readonly timerService: TimerServiceInterface<string, BattleId>,
        private readonly jobService: JobService,
        private readonly engineStreamContainer: EngineStreamContainer,
        private readonly battleOperationLogger: BattleOperationLogger,
        private readonly topicBattleStarted: string,
        private readonly topicBattleUpdated: string,
        private readonly topicBattleTerminated: string,
        private readonly battleTurnTimeLimit: number,
        private readonly battleStartTimeLimit: number,
    ) {
    }

    async timeout(battleId: BattleId): Promise<void> {
        const trackId = randomUUID();
        const request = BattleOperationLogger.battleIdRequest(battleId);

        const battleEntity = await this.battleTimeoutUseCase.execute(battleId);
        if (battleEntity) {
            const battleObject = BattleProtoMapper.toProto(battleEntity);

            this.jobService.enqueue(this.topicBattleUpdated, this.tracedBattle(trackId, battleObject));

            const resp = engineProto.BattleResponse.create({battle: battleObject, trackId})
            // logger.log(resp);

            try {
                this.engineStreamContainer.broadcast(resp);
            } catch (err) {
                logger.warn({err});
            }

            void this.battleOperationLogger.log(
                'timeout',
                trackId,
                request,
                BattleOperationLogger.success(battleEntity),
            );
        } else {
            this.jobService.enqueue(this.topicBattleTerminated, this.tracedBattleId(trackId, battleId));

            void this.battleOperationLogger.log(
                'timeout',
                trackId,
                request,
                BattleOperationLogger.failure('battle does not exist', null, true),
            );
        }

        this.timerService.stop(battleId.value);
    }

    async create(battleEntity: BattleEntity, trackId?: string): Promise<void> {

        // logger.log(battleEntity);

        const initedBattle = await this.battleCreateUseCase.execute(battleEntity);

        this.timerService.restart(
            initedBattle.id.value,
            initedBattle.id,
            this.battleStartTimeLimit
        );

        const battleObject = BattleProtoMapper.toProto(initedBattle);

        this.jobService.enqueue(this.topicBattleStarted, this.tracedBattle(trackId, battleObject));
        this.jobService.enqueue(this.topicBattleUpdated, this.tracedBattle(trackId, battleObject));

        const resp = engineProto.BattleResponse.create({battle: battleObject, trackId})
        // logger.log(resp);

        this.engineStreamContainer.broadcast(resp);

        void this.battleOperationLogger.log(
            'create',
            trackId,
            BattleOperationLogger.battleRequest(battleEntity),
            BattleOperationLogger.success(initedBattle),
        );
    }

    async move(battleMove: BattleMove, trackId?: string): Promise<void> {

        const request = BattleOperationLogger.moveRequest(battleMove);

        const battleEntity = await this.battleMoveUseCase.execute(battleMove);

        if (!battleEntity) {

            this.jobService.enqueue(this.topicBattleTerminated, this.tracedBattleId(trackId, battleMove.battleId));

            void this.battleOperationLogger.log(
                'move',
                trackId,
                request,
                BattleOperationLogger.failure('battle does not exist', null, true),
            );
            return;
        }

        this.timerService.restart(
            battleEntity.id.value,
            battleEntity.id,
            this.battleTurnTimeLimit
        );

        const battleObject = BattleProtoMapper.toProto(battleEntity);

        this.jobService.enqueue(this.topicBattleUpdated, this.tracedBattle(trackId, battleObject));

        const resp = engineProto.BattleResponse.create({battle: battleObject, trackId})

        this.engineStreamContainer.broadcast(resp);

        const finished = battleEntity.status.equals(BattleStatus.create(BattleStatusEnum.Finished));

        if (finished) {

            this.jobService.enqueue(this.topicBattleTerminated, this.tracedBattleId(trackId, battleEntity.id));

            this.timerService.stop(battleEntity.id.value);
        }

        void this.battleOperationLogger.log(
            'move',
            trackId,
            request,
            BattleOperationLogger.success(battleEntity, finished),
        );
    }

    async start(battleStart: BattleStart, trackId?: string): Promise<void> {
        const request = BattleOperationLogger.startRequest(battleStart);

        const battleEntity = await this.battleStartUseCase.execute(battleStart);

        if (!battleEntity) {

            this.jobService.enqueue(this.topicBattleTerminated, this.tracedBattleId(trackId, battleStart.battleId));

            void this.battleOperationLogger.log(
                'start',
                trackId,
                request,
                BattleOperationLogger.failure('battle does not exist', null, true),
            );
            return;
        }

        if (!battleEntity.status.equals(BattleStatus.create(BattleStatusEnum.Started))) {
            void this.battleOperationLogger.log(
                'start',
                trackId,
                request,
                BattleOperationLogger.failure('battle is not in Started status', battleEntity),
            );
            return;
        }

        this.timerService.restart(
            battleEntity.id.value,
            battleEntity.id,
            this.battleTurnTimeLimit,
        );

        const battleObject = BattleProtoMapper.toProto(battleEntity);

        this.jobService.enqueue(this.topicBattleUpdated, this.tracedBattle(trackId, battleObject));

        const resp = engineProto.BattleResponse.create({battle: battleObject, trackId})

        this.engineStreamContainer.broadcast(resp);

        void this.battleOperationLogger.log(
            'start',
            trackId,
            request,
            BattleOperationLogger.success(battleEntity),
        );
    }

    async leave(battleLeave: BattleLeave, trackId?: string): Promise<void> {
        // logger.log(battleLeave);

        const request = BattleOperationLogger.leaveRequest(battleLeave);

        const battleEntity = await this.battleLeaveUseCase.execute(battleLeave);
        logger.log(battleEntity);

        if (battleEntity) {

            const battleObject = BattleProtoMapper.toProto(battleEntity);

            this.jobService.enqueue(this.topicBattleUpdated, this.tracedBattle(trackId, battleObject));

            const resp = engineProto.BattleResponse.create({battle: battleObject, trackId})

            this.engineStreamContainer.broadcast(resp);

            void this.battleOperationLogger.log(
                'leave',
                trackId,
                request,
                BattleOperationLogger.success(battleEntity),
            );
        } else {
            this.jobService.enqueue(this.topicBattleTerminated, this.tracedBattleId(trackId, battleLeave.battleId));

            void this.battleOperationLogger.log(
                'leave',
                trackId,
                request,
                BattleOperationLogger.failure('battle does not exist', null, true),
            );
        }

        this.timerService.stop(battleLeave.battleId.value);
    }

    private tracedBattle(trackId: string | undefined, battle: battleProto.BattleObject): battleProto.TracedBattle {
        return battleProto.TracedBattle.create({trackId, battle});
    }

    private tracedBattleId(trackId: string | undefined, battleId: BattleId): battleProto.TracedBattleId {
        return battleProto.TracedBattleId.create({trackId, battleId: battleId.value});
    }

}

export default BattleService;
