import EngineStream from "../types/engine.stream";
import * as engineProto from "../../../contracts/proto/engine";
import logger from "@shared/logger";

export class EngineStreamContainer {
    private stream: EngineStream | null = null;

    get current(): EngineStream | null {
        return this.stream;
    }

    connect(stream: EngineStream): void {
        logger.log('ENGINE STREAM CONNECT', stream);
        this.stream = stream;
    }

    disconnect(stream: EngineStream): void {
        logger.log(
            'ENGINE STREAM DISCONNECT',
            stream,
            'current === stream:',
            this.stream === stream,
        );

        if (this.stream === stream) {
            this.stream = null;
        }
    }

    write(resp: engineProto.BattleResponse): void {
        if (!this.stream) {
            throw new Error("Engine stream is not connected");
        }

        this.stream.write(resp);
    }
}

export default EngineStreamContainer;
