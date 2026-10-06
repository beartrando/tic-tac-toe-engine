import BattleDomain from "../../../domain/battle/battle.domain";
import BattleLeave from "../../../domain/battle/value-objects/battle-leave.vo";
import BattleEntity from "../../../domain/battle/battle.entity";
import CachedIdStateStoreInterface
    from "../../../infrastructure/state-store/interfaces/cached-id-state-store.interface";
import logger from "@shared/logger";

export class BattleLeaveUseCase {
    constructor(
        private readonly battleStateStore: CachedIdStateStoreInterface<BattleEntity>,
    ) {
    }

    async execute(battleLeave: BattleLeave): Promise<BattleEntity | null> {
        // logger.log(battleLeave);

        const battleEntity = await this.battleStateStore.get(battleLeave.battleId);
        if (!battleEntity) {
            return null;
        }
        logger.log('battle exists');

        const battleDomain = BattleDomain.of(battleEntity);
        const resultBattle = battleDomain.leave(battleLeave);
        await this.battleStateStore.delete(resultBattle.id);

        return resultBattle;
    }
}


export default BattleLeaveUseCase;
