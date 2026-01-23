import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export interface SwaggerConfig {
    title: string;
    description: string;
    version: string;
    path?: string;
}

/**
 * Initializes Swagger with Zod compatibility.
 * This should be called in the main.ts of each application.
 */
export function setupSwagger(app: INestApplication, config: SwaggerConfig) {
    const options = new DocumentBuilder()
        .setTitle(config.title)
        .setDescription(config.description)
        .setVersion(config.version)
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, options);
    const path = config.path || 'api/docs';

    // Use cleanupOpenApiDoc instead of patchNestjsSwagger
    SwaggerModule.setup(path, app, cleanupOpenApiDoc(document));

    return path;
}
