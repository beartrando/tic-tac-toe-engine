import BattleEntity from "../battle.entity";
import BattleBoard from "../value-objects/battle-board.vo";
import BattleStatusMatchedRule from "../rules/battle-status-matched.rule";
import BattleStatusEnum from "../enums/battle-status.enum";
import BattleStatus from "../value-objects/battle-status.vo";

export class BattleInitOperation {
    constructor(
        private readonly statusMatchedRule: BattleStatusMatchedRule,
    ) {
    }

    execute(
        entity: BattleEntity,
    ): BattleEntity {

        if (!this.statusMatchedRule.calculate(entity)) {
            throw new Error("Cannot init battle: battle is not matched status");
        }

        // logger.log('New engine started', engine)
        entity.board = BattleBoard.empty();
        entity.status = new BattleStatus(BattleStatusEnum.Ready);
        entity.winnerId = null;

        return entity;

    }
}

export default BattleInitOperation;
