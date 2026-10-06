import * as grpc from "@grpc/grpc-js";
import * as healthProto from '../../contracts/proto/common/health';
import * as engineProto from '../../contracts/proto/engine';
import logger from "@shared/logger";
import EngineHandler from "./handlers/engine.handler";
import HealthHandler from "./handlers/health.handler";

export class GrpcService {
    private readonly server: grpc.Server;

    constructor(
        private readonly port: number,
        private readonly engineHandler: EngineHandler,
        private readonly healthHandler: HealthHandler,
    ) {
        this.server = new grpc.Server();
    }

    async start(): Promise<void> {
        return new Promise<void>(
            (resolve, reject) => {
                this.addServices();
                this.server.bindAsync(
                    `0.0.0.0:${this.port}`,
                    grpc.ServerCredentials.createInsecure(),
                    (err, port) => {
                        if (err) {
                            logger.error(
                                {err},
                                '❌ Failed to start gRPC',
                            );

                            return reject(err);
                        }

                        logger.info(
                            `🟢 gRPC server started on port ${port}`,
                        );
                        resolve();
                    },
                );
            },
        );
    }

    stop() {
        this.server.forceShutdown();
    }

    private registerEngineService() {
        this.server.addService(engineProto.EngineService, {
            battleChannel: this.engineHandler.battleChannel.bind(this.engineHandler),
        });
    }

    private registerHealthService() {
        this.server.addService(healthProto.HealthService, {
            check: this.healthHandler.check.bind(this.healthHandler),
            status: this.healthHandler.status.bind(this.healthHandler),
            livez: this.healthHandler.livez.bind(this.healthHandler),
            readyz: this.healthHandler.readyz.bind(this.healthHandler),
        });
    }

    private addServices() {
        this.registerEngineService();
        this.registerHealthService();
    }
}

export default GrpcService;
