import { Injectable, ExecutionContext, UnauthorizedException, ForbiddenException, } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtRolesGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (info && info.message === 'No auth token') {
            throw new UnauthorizedException('Token is missing or invalid.');
        }

        if (err || !user) {
            throw err || new UnauthorizedException('Invalid or expired token.');
        }

        const request = context.switchToHttp().getRequest();
        request.user = user;

        if (!user.isNewUser && user.isVerified === false) {
            throw new ForbiddenException('User account is not verified.');
        }


        if (!user.status) {
            throw new ForbiddenException('User status not found.');
        }

        const allowedStatuses = ['ACTIVE'];
        if (!allowedStatuses.includes(user.status)) {
            switch (user.status) {
                case 'PENDING_VERIFICATION':
                    throw new ForbiddenException('Your account verification is still pending.');
                case 'INACTIVE':
                    throw new ForbiddenException('Your account is inactive. Please contact support.');
                default:
                    throw new ForbiddenException(`User status '${user.status}' is not allowed.`);
            }
        }

        const requiredRoles = this.reflector.getAllAndOverride<number[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return user;
        }

        if (!user.roles || user.roles.length === 0) {
            throw new ForbiddenException('User roles not found in token.');
        }

        const hasRole = user.roles.some((role: number) => requiredRoles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException('You do not have permission to access this resource.');
        }

        return user;
    }
}
