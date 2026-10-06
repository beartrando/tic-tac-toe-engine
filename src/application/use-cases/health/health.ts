import * as healthProto from "../../../contracts/proto/common/health";
import MessageService from "../../../infrastructure/message/service";
import JobService from "../../../infrastructure/job/service";
import appConfig from "../../../infrastructure/app/app.config";
import CacheService from "../../../infrastructure/cache/service";

export class HealthUseCase {
    constructor(
        private readonly messageService: MessageService,
        private readonly jobService: JobService,
        private readonly cacheService: CacheService,
    ) {
    }

    async execute(): Promise<healthProto.HealthReport> {
        const [messageOk, jobOk, cacheOk] = await Promise.all([
            this.messageService.check(),
            this.jobService.check(),
            this.cacheService.check()
        ]);

        const components = {
            message: messageOk,
            job: jobOk,
            cache: cacheOk,
        };

        return {
            service: appConfig.appName,
            status: this.toHealthStatus(
                Object.values(components).every(Boolean),
            ),
            components: Object.fromEntries(
                Object.entries(components).map(([name, ok]) => [
                    name,
                    this.toHealthStatus(ok),
                ]),
            ),
            timestamp: new Date(),
        };
    }

    private toHealthStatus(ok: boolean): healthProto.HealthStatus {
        return ok
            ? healthProto.HealthStatus.HEALTH_STATUS_OK
            : healthProto.HealthStatus.HEALTH_STATUS_FAIL;
    }
}

export default HealthUseCase;
