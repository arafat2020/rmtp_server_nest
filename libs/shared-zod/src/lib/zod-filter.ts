import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

/**
 * Global filter to catch ZodValidationException and return a structured error response.
 */
@Catch(ZodValidationException)
export class ZodFilter implements ExceptionFilter {
    catch(exception: ZodValidationException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = HttpStatus.BAD_REQUEST;
        const zodError = exception.getZodError();

        if (zodError instanceof ZodError) {
            return response.status(status).json({
                statusCode: status,
                message: 'Validation failed',
                errors: zodError.issues.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                })),
            });
        }

        return response.status(status).json({
            statusCode: status,
            message: exception.message || 'Validation failed',
        });
    }
}
