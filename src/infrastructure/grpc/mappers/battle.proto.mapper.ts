import * as battleProto from "../../../contracts/proto/battle";
import BattleEntity, {BattleEntityProps} from "../../../domain/battle/battle.entity";
import BattleBoardProtoMapper from "./battle/battle-board.proto.mapper";
import BattleStatusProtoMapper from "./battle/battle-status.proto.mapper";
import BattleId from "../../../domain/battle/value-objects/battle-id.vo";
import BattlePlayerIds from "../../../domain/battle/value-objects/battle-player-ids.vo";
import ProfileId from "../../../domain/profile/value-objects/profile-id.vo";

export class BattleProtoMapper {
    static toProto(battle: BattleEntity): battleProto.BattleObject {

        return battleProto.BattleObject.create({
            id: battle.id.value,
            playerIds: battle.playerIds.value.map((id: BattleId) => id.value),
            board: BattleBoardProtoMapper.toProto(battle.board),
            status: BattleStatusProtoMapper.toProto(battle.status),
            winnerId: battle.winnerId?.value,
            lastMoveAt: battle.lastMoveAt ?? undefined,
        });
    }

    static toDomain(battle: battleProto.BattleObject): BattleEntity {
        const battleEntityProps: BattleEntityProps = {
            id: new BattleId(battle.id),
            playerIds: new BattlePlayerIds(battle.playerIds.map((id: string) => new ProfileId(id))),
            board: BattleBoardProtoMapper.toDomain(battle.board),
            status: BattleStatusProtoMapper.toDomain(battle.status),
            winnerId: battle.winnerId ? new ProfileId(battle.winnerId) : null,
            lastMoveAt: battle.lastMoveAt,
        };
        return BattleEntity.create(battleEntityProps);
    }
}

export default BattleProtoMapper;
