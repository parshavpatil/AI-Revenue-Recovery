import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
@Controller('health')
export class HealthController {
 constructor(private readonly health:HealthService){}
 @Get() get(){ return this.health.getHealth(); }
 @Get('db') db(){ return this.health.getDatabaseHealth(); }
}
