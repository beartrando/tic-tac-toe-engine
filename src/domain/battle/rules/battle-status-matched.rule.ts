import BattleEntity from "../battle.entity";
import BattleStatusEnum from "../enums/battle-status.enum";
import BattleStatus from "../value-objects/battle-status.vo";
import logger from "@shared/logger";

export class BattleStatusMatchedRule {
    calculate(entity: BattleEntity): boolean {

        const readyStatus = BattleStatus.create(BattleStatusEnum.Matched);
        // logger.log(new Error().stack);
        // logger.log(readyStatus);
        // logger.log(entity.status);
        // logger.log(readyStatus.value === entity.status.value);
        // logger.log(typeof readyStatus.value);
        // logger.log(typeof entity.status.value);
        // logger.log('------------------------------------------------------------------------------------------------------');


        return entity.status.equals(readyStatus);
    }
}

export default BattleStatusMatchedRule;
