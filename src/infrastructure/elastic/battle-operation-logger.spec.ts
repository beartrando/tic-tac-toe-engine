import type {ElasticService} from '@shared/elastic';

import {BattleOperationLogger} from './battle-operation-logger';
import BattleEntity from '../../domain/battle/battle.entity';
import BattleId from '../../domain/battle/value-objects/battle-id.vo';
import BattlePlayerIds from '../../domain/battle/value-objects/battle-player-ids.vo';
import ProfileId from '../../domain/profile/value-objects/profile-id.vo';

jest.mock('@shared/logger', () => ({
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe('BattleOperationLogger', () => {
    const createElastic = (): jest.Mocked<Pick<ElasticService, 'index'>> => ({
        index: jest.fn().mockResolvedValue(undefined),
    });

    it('пишет документ с реквестом и респонсом', async () => {
        const elastic = createElastic();
        const operationLogger = new BattleOperationLogger(elastic as unknown as ElasticService);

        await operationLogger.log(
            'move',
            'track-1',
            {battle_id: 'battle-1', profile_id: 'player-1', cell_idx: 3},
            {success: true, terminated: false, battle: null, error: null},
        );

        expect(elastic.index).toHaveBeenCalledTimes(1);

        const document = elastic.index.mock.calls[0][0] as Record<string, unknown>;

        expect(document).toMatchObject({
            service: 'engine',
            operation: 'move',
            track_id: 'track-1',
            request: {battle_id: 'battle-1', profile_id: 'player-1', cell_idx: 3},
            response: {success: true, terminated: false, battle: null, error: null},
        });
        expect(typeof document['@timestamp']).toBe('string');
    });

    it('проставляет track_id = null, если он не задан', async () => {
        const elastic = createElastic();
        const operationLogger = new BattleOperationLogger(elastic as unknown as ElasticService);

        await operationLogger.log('timeout', undefined, {}, BattleOperationLogger.failure('battle does not exist'));

        const document = elastic.index.mock.calls[0][0] as Record<string, unknown>;

        expect(document.track_id).toBeNull();
        expect(document.response).toMatchObject({
            success: false,
            terminated: false,
            battle: null,
            error: 'battle does not exist',
        });
    });

    it('формирует снапшот баттла со всеми полями', () => {
        const battle = BattleEntity.create({
            id: new BattleId('battle-1'),
            playerIds: new BattlePlayerIds([new ProfileId('player-1')]),
        });

        const snapshot = BattleOperationLogger.snapshot(battle);

        expect(snapshot).toEqual({
            id: battle.id.value,
            board: Array(9).fill('EMPTY'),
            player_ids: ['player-1'],
            status: 'Created',
            winner_id: null,
            last_move_at: null,
        });
    });
});
