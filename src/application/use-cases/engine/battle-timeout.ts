import BattleEntity from "../../../domain/battle/battle.entity";
import BattleDomain from "../../../domain/battle/battle.domain";
import logger from "@shared/logger";
import CachedIdStateStoreInterface
    from "../../../infrastructure/state-store/interfaces/cached-id-state-store.interface";
import BattleLeave from "../../../domain/battle/value-objects/battle-leave.vo";
import BattleId from "../../../domain/battle/value-objects/battle-id.vo";
import BattleLeaveUseCase from "./battle-leave";
import BattleStatusStartedRule from "../../../domain/battle/rules/battle-status-started.rule";

export class BattleTimeoutUseCase {
    constructor(
        private readonly battleStateStore: CachedIdStateStoreInterface<BattleEntity>,
        private readonly battleLeaveUseCase: BattleLeaveUseCase,
        private readonly battleStatusStartedRule: BattleStatusStartedRule,
    ) {
    }

    async execute(battleId: BattleId): Promise<BattleEntity | null> {

        logger.log('battleTimeout');

        const battleEntity = await this.battleStateStore.get(battleId);

        if (!battleEntity) {
            return null;
        }

        if (this.battleStatusStartedRule.calculate(battleEntity) && !battleEntity.board.isEmpty()) {
            const profileId = BattleDomain.of(battleEntity).turn();

            const battleLeave = BattleLeave.create({battleId, profileId});

            const resultBattle = this.battleLeaveUseCase.execute(battleLeave);

            return resultBattle;
        }
        const battleDomain = BattleDomain.of(battleEntity);
        const resultBattle = battleDomain.cancel();
        await this.battleStateStore.delete(resultBattle.id);

        return resultBattle;
    }
}


export default BattleTimeoutUseCase;
