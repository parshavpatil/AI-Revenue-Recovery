import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
 catch(exception:unknown, host:ArgumentsHost){
  const ctx=host.switchToHttp(); const response=ctx.getResponse<Response>(); const request=ctx.getRequest<Request>();
  const status=exception instanceof HttpException?exception.getStatus():HttpStatus.INTERNAL_SERVER_ERROR;
  const body=exception instanceof HttpException?exception.getResponse():null;
  const message=typeof body==='string'?body:(body&&typeof body==='object'&&'message' in body?(body as any).message:'Internal server error');
  response.status(status).json({statusCode:status,message,path:request.url,timestamp:new Date().toISOString()});
 }
}
