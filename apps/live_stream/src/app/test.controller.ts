import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodGuard, createZodDto, ZodValidationPipe } from '@live-stream/shared-zod';

const TestSchema = z.object({
    name: z.string().min(3),
    age: z.number().int().positive(),
});

class TestDto extends createZodDto(TestSchema) { }

@ApiTags('test')
@Controller('test')
export class TestController {
    @Post()
    @ApiBody({ type: TestDto })
    @UseGuards(createZodGuard(TestSchema))
    @UsePipes(ZodValidationPipe)
    test(@Body() body: TestDto) {
        return {
            message: 'Validated successfully',
            data: body,
        };
    }
}
