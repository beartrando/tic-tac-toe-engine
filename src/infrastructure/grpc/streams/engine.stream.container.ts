import EngineStream from "../types/engine.stream";
import * as engineProto from "../../../contracts/proto/engine";
import logger from "@shared/logger";

export class EngineStreamContainer {
    private readonly streams = new Set<EngineStream>();

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

        for (const stream of this.streams) {
            stream.write(resp);
        }
    }


    get size(): number {
        return this.streams.size;
    }
}

export default EngineStreamContainer;
