import logger from "@shared/logger";
import type {ElasticService} from "@shared/elastic";
import GrpcService from "../infrastructure/grpc/service";
import JobService from "../infrastructure/job/service";
import MessageService from "../infrastructure/message/service";
import StateStoreService from "../infrastructure/state-store/service";
import CacheService from "../infrastructure/cache/service";

export class Application {
    constructor(
        private readonly grpcService: GrpcService,
        private readonly stateStoreService: StateStoreService,
        private readonly jobService: JobService,
        private readonly messageService: MessageService,
        private readonly cacheService: CacheService,
        private readonly elasticService: ElasticService,
    ) {
    }

    async start(): Promise<void> {
        const shutdown = async () => {
            logger.info("🛑 Shutting down...");

            await this.stop();

            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

        try {
            await this.messageService.start();
            await this.jobService.start();
            await this.cacheService.start();
            await this.stateStoreService.start();
            await this.grpcService.start();

            if (!await this.elasticService.check()) {
                logger.warn(
                    '⚠️ Elasticsearch is unavailable, battle operations will not be indexed',
                );
            }

            logger.info(
                '🚀 Engine service started',
            );
        } catch (err) {
            logger.error(
                {err},
                '💥 Failed to start Engine service',
            );
            process.exit(1);
        }
    }

    async stop() {
        await this.grpcService.stop();
        await this.stateStoreService.stop();
        await this.cacheService.stop();
        await this.jobService.stop();
        await this.messageService.stop();
        await this.elasticService.stop();
    }
}

export default Application;
