import { CanActivate, ExecutionContext, Injectable, Type } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationException } from 'nestjs-zod';

/**
 * Creates a NestJS Guard that validates the request body against a Zod schema.
 * Throws ZodValidationException if validation fails, which can be caught by ZodFilter.
 */
export function createZodGuard(schema: ZodSchema): Type<CanActivate> {
    @Injectable()
    class ZodGuardImpl implements CanActivate {
        canActivate(context: ExecutionContext): boolean {
            const request = context.switchToHttp().getRequest();
            const body = request.body;

            const result = schema.safeParse(body);
            if (!result.success) {
                throw new ZodValidationException(result.error);
            }

            (request as any).validatedBody = result.data;
            return true;
        }
    }

    return ZodGuardImpl;
}
