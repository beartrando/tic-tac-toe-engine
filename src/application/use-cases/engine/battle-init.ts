import BattleEntity from "../../../domain/battle/battle.entity";
import BattleDomain from "../../../domain/battle/battle.domain";
import CachedIdStateStoreInterface
    from "../../../infrastructure/state-store/interfaces/cached-id-state-store.interface";
import logger from "@shared/logger";

export class BattleCreateUseCase {
    constructor(
        private readonly battleStateStore: CachedIdStateStoreInterface<BattleEntity>,
    ) {
    }

    async execute(battle: BattleEntity): Promise<BattleEntity> {


        const battleEntity = await this.battleStateStore.get(battle.id);

        if (battleEntity) {
            logger.log(battleEntity);
            return battleEntity;
        }

        const battleDomain = BattleDomain.of(battle);

        const resultBattle = battleDomain.init();

        await this.battleStateStore.set(resultBattle);

        logger.log(resultBattle);
        return resultBattle;
    }
}


export default BattleCreateUseCase;
