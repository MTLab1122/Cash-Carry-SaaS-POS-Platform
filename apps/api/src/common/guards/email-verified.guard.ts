import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let authentication guard handle 401
    }

    // Enforce email verification on operational routes
    if (user.emailVerified === false) {
      throw new ForbiddenException({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.3',
        title: 'Email Verification Required',
        status: 403,
        detail: 'You must verify your business email address before accessing POS or inventory ledger operations.',
      });
    }

    return true;
  }
}

