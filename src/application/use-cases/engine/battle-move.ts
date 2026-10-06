import BattleEntity from "../../../domain/battle/battle.entity";
import BattleMove from "../../../domain/battle/value-objects/battle-move.vo";
import BattleDomain from "../../../domain/battle/battle.domain";
import logger from "@shared/logger";
import CachedIdStateStoreInterface
    from "../../../infrastructure/state-store/interfaces/cached-id-state-store.interface";
import BattleStatus from "../../../domain/battle/value-objects/battle-status.vo";
import BattleStatusEnum from "../../../domain/battle/enums/battle-status.enum";

export class BattleMoveUseCase {
    constructor(
        private readonly battleStateStore: CachedIdStateStoreInterface<BattleEntity>,
    ) {
    }

    async execute(battleMove: BattleMove): Promise<BattleEntity | null> {

        logger.log(battleMove);

        const battleEntity = await this.battleStateStore.get(battleMove.battleId);

        if (!battleEntity) {
            logger.warn('battle does not exist')
            return null;
        }

        const battleDomain = BattleDomain.of(battleEntity);
        const resultBattle = battleDomain.move(battleMove);

        if (resultBattle.status.equals(new BattleStatus(BattleStatusEnum.Finished))) {
            await this.battleStateStore.delete(resultBattle.id);
        } else {
            await this.battleStateStore.set(resultBattle);
        }

        return resultBattle;
    }
}


export default BattleMoveUseCase;
