import BattleEntity from "../battle.entity";
import BattleStatusEnum from "../enums/battle-status.enum";
import BattleStatus from "../value-objects/battle-status.vo";
import BattleStart from "../value-objects/battle-start.vo";
import BattleStartApprovedRule from "../rules/battle-start-approved.rule";
import BattleStatusMatchedRule from "../rules/battle-status-matched.rule";
import logger from "@shared/logger";

export class BattleStartOperation {
    constructor(
        private readonly statusReadyRule: BattleStatusMatchedRule,
        private readonly startApprovedRule: BattleStartApprovedRule,
    ) {
    }

    execute(
        battleEntity: BattleEntity,
        battleStart: BattleStart,
    ): BattleEntity {

        if (!this.statusReadyRule.calculate(battleEntity)) {
            logger.log(battleEntity)
            throw new Error("Cannot start battle: battle is not ready");
        }

        // logger.log('here')

        battleEntity.approvals.approve(battleStart.profileId);
        if (this.startApprovedRule.calculate(battleEntity)) {
            // logger.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11')
            return battleEntity.start();
        }

        // logger.log(battleEntity)

        return battleEntity;

    }
}

export default BattleStartOperation;
