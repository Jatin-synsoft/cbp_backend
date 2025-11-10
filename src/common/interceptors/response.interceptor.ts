import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SKIP_RESPONSE_KEY } from '../decorators/skip-response.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (skip) return next.handle();

        return next.handle().pipe(
            map((data) => {
                const response = context.switchToHttp().getResponse();
                const statusCode =
                    data?.statusCode ??
                    response.statusCode ??
                    200;

                const baseResponse: any = {
                    statusCode,
                    message: data?.message || 'Request successful',
                };

                if (data && typeof data === 'object' && ('total' in data || 'page' in data || 'limit' in data)) {
                    baseResponse.total = data.total ?? 0;
                    baseResponse.page = data.page ?? 1;
                    baseResponse.limit = data.limit ?? 10;
                    baseResponse.totalPages =
                        data.totalPages ??
                        Math.ceil((data.total ?? 0) / (data.limit ?? 10));
                    baseResponse.data = data.data ?? [];
                }
                else if (data && 'data' in data) {
                    baseResponse.data = data.data;
                }
                else if (data && typeof data === 'object') {
                    baseResponse.data = data;
                }
                else {
                    baseResponse.data = data;
                }

                return baseResponse;
            }),
        );
    }
}
