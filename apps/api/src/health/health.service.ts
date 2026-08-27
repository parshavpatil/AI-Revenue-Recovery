import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
@Injectable()
export class HealthService {
 constructor(private readonly prisma:PrismaService){}
 getHealth(){ return {service:'recoverai-api',status:'ok',timestamp:new Date().toISOString(),module:3}; }
 async getDatabaseHealth(){ try{ await this.prisma.$queryRaw`SELECT 1`; return {service:'recoverai-api',dependency:'postgresql',status:'ok',timestamp:new Date().toISOString()}; } catch { throw new ServiceUnavailableException({service:'recoverai-api',dependency:'postgresql',status:'down'}); } }
}
