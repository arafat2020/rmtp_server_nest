import { Module, DynamicModule, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DatabaseModuleOptions } from './interfaces';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    const databaseProvider = {
      provide: options.token,
      useFactory: () => {
        const pool = new Pool({
          connectionString: options.url,
        });
        return drizzle(pool, { schema: options.schema });
      },
    };

    return {
      module: DatabaseModule,
      providers: [databaseProvider],
      exports: [options.token],
    };
  }
}
