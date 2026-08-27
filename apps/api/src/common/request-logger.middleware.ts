import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
 private readonly logger=new Logger(RequestLoggerMiddleware.name);
 use(req:Request,res:Response,next:NextFunction){ const requestId=req.header('x-request-id')??randomUUID(); const started=Date.now(); res.setHeader('x-request-id',requestId); res.on('finish',()=>this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now()-started}ms requestId=${requestId}`)); next(); }
}
