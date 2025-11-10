import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        try {
            // Determine status code
            const status =
                exception instanceof HttpException
                    ? exception.getStatus()
                    : HttpStatus.INTERNAL_SERVER_ERROR;

            // Extract message
            let message = 'Internal server error';
            if (exception instanceof HttpException) {
                const res = exception.getResponse();
                if (typeof res === 'string') message = res;
                else if (typeof res === 'object' && (res as any).message)
                    message = (res as any).message;
            } else if (exception?.message) {
                message = exception.message;
            }

            // Log error for debugging (but don't crash)
            console.error('🚨 [Exception Caught]:', {
                message: exception?.message,
                name: exception?.name,
                stack: exception?.stack,
                url: request.url,
                method: request.method,
                time: new Date().toISOString(),
            });

            // Send response safely
            response.status(status).json({
                statusCode: status,
                message,
            });
        } catch (err) {
            // Fallback: prevent crash even if logging fails
            console.error('🔥 [Error in ExceptionFilter]:', err);
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Critical server error',
            });
        }
    }
}
