import EngineStream from "../types/engine.stream";
import * as engineProto from "../../../contracts/proto/engine";
import logger from "@shared/logger";
import type {MessageLogger} from "@shared/elastic";
import {BATTLE_CHANNEL_PATH} from "../grpc.constants";

export class EngineStreamContainer {

    private readonly streams = new Set<EngineStream>();

    constructor(
        private readonly messageLogger?: MessageLogger,
    ) {
    }

    add(stream: EngineStream): void {
        logger.log('ENGINE STREAM CONNECT');
        this.streams.add(stream);
    }

    remove(stream: EngineStream): void {
        logger.log('ENGINE STREAM DISCONNECT');
        this.streams.delete(stream);
    }

    broadcast(resp: engineProto.BattleResponse): void {
        if (!this.size) {
            throw new Error("Engine stream is not connected");
        }

        if (resp.battle) {
            void this.messageLogger?.logOut(
                'grpc',
                BATTLE_CHANNEL_PATH,
                resp,
                resp.trackId,
            );
        }

        for (const stream of this.streams) {
            stream.write(resp);
        }
    }


    get size(): number {
        return this.streams.size;
    }
}

export default EngineStreamContainer;
