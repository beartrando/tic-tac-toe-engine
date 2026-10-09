import {TimerCallbackInterface, TimerCallbackFactoryInterface} from "@shared/timer";
import BattleService from "../../battle/service";
import BattleId from "../../../domain/battle/value-objects/battle-id.vo";

export class BattleTimeoutCallbackFactory implements TimerCallbackFactoryInterface<BattleId> {

    constructor(
        private readonly battleService: BattleService,
    ) {
    }

    create(battleId: BattleId): TimerCallbackInterface {
        return async () => {
            await this.battleService.timeout(battleId);
        };
    }
}

export default BattleTimeoutCallbackFactory;
