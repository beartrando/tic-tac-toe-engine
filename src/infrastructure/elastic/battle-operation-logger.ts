import type {ElasticService} from '@shared/elastic';

import BattleEntity from '../../domain/battle/battle.entity';
import BattleId from '../../domain/battle/value-objects/battle-id.vo';
import BattleLeave from '../../domain/battle/value-objects/battle-leave.vo';
import BattleMove from '../../domain/battle/value-objects/battle-move.vo';
import BattleStart from '../../domain/battle/value-objects/battle-start.vo';

export type BattleOperation =
    | 'create'
    | 'start'
    | 'move'
    | 'leave'
    | 'timeout'
    | 'terminate';

export type BattleSnapshot = {
    id: string;
    board: string[];
    player_ids: string[];
    status: string;
    winner_id: string | null;
    last_move_at: string | null;
};

export type BattleOperationResponse = {
    success: boolean;
    terminated: boolean;
    battle: BattleSnapshot | null;
    error: string | null;
};

/**
 * Складывает операции по баттлу (то, что пришло — request, и как обработано — response)
 * в Elasticsearch одним документом на операцию.
 */
export class BattleOperationLogger {
    constructor(
        private readonly elastic: ElasticService,
    ) {
    }

    async log(
        operation: BattleOperation,
        trackId: string | undefined,
        request: Record<string, unknown>,
        response: BattleOperationResponse,
    ): Promise<void> {
        await this.elastic.index({
            '@timestamp': new Date().toISOString(),
            service: 'engine',
            operation,
            track_id: trackId ?? null,
            request,
            response,
        });
    }

    static snapshot(battle: BattleEntity): BattleSnapshot {
        return {
            id: battle.id.value,
            board: [...battle.board.cells],
            player_ids: battle.playerIds.value.map((profileId) => profileId.value),
            status: battle.status.value,
            winner_id: battle.winnerId?.value ?? null,
            last_move_at: battle.lastMoveAt ? battle.lastMoveAt.toISOString() : null,
        };
    }

    static battleRequest(battle: BattleEntity): Record<string, unknown> {
        return {...BattleOperationLogger.snapshot(battle)};
    }

    static moveRequest(move: BattleMove): Record<string, unknown> {
        return {
            battle_id: move.battleId.value,
            profile_id: move.profileId.value,
            cell_idx: move.cellIdx.value,
        };
    }

    static startRequest(start: BattleStart): Record<string, unknown> {
        return {
            battle_id: start.battleId.value,
            profile_id: start.profileId.value,
        };
    }

    static leaveRequest(leave: BattleLeave): Record<string, unknown> {
        return {
            battle_id: leave.battleId.value,
            profile_id: leave.profileId.value,
        };
    }

    static battleIdRequest(battleId: BattleId): Record<string, unknown> {
        return {
            battle_id: battleId.value,
        };
    }

    static success(
        battle: BattleEntity | null,
        terminated = false,
    ): BattleOperationResponse {
        return {
            success: true,
            terminated,
            battle: battle ? BattleOperationLogger.snapshot(battle) : null,
            error: null,
        };
    }

    static failure(
        error: string,
        battle: BattleEntity | null = null,
        terminated = false,
    ): BattleOperationResponse {
        return {
            success: false,
            terminated,
            battle: battle ? BattleOperationLogger.snapshot(battle) : null,
            error,
        };
    }
}

export default BattleOperationLogger;
