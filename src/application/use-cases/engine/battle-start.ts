import BattleEntity from "../../../domain/battle/battle.entity";
import BattleDomain from "../../../domain/battle/battle.domain";
import CachedIdStateStoreInterface
    from "../../../infrastructure/state-store/interfaces/cached-id-state-store.interface";
import logger from "@shared/logger";
import BattleStart from "../../../domain/battle/value-objects/battle-start.vo";

export class BattleStartUseCase {
    constructor(
        private readonly battleStateStore: CachedIdStateStoreInterface<BattleEntity>,
    ) {
    }

    async execute(battleStart: BattleStart): Promise<BattleEntity | null> {
        const battleEntity = await this.battleStateStore.get(battleStart.battleId);

        if (!battleEntity) {
            logger.warn('battle does not exist')
            return null;
        }

        const battleDomain = BattleDomain.of(battleEntity);
        const resultBattle = battleDomain.start(battleStart);

        await this.battleStateStore.set(resultBattle);
        return resultBattle;
    }
}


export default BattleStartUseCase;
