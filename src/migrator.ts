import * as Knex from 'knex';
import * as fs from 'fs';

import * as path from 'path';
import { cleanSqlJsFiles, createTempJsFiles } from './utils';

export interface CustomKnexConfig extends Knex.MigratorConfig, Knex.Config {
  repeatableDirectory?: string;
}

export class Migrator {
  private knex: Knex;
  private jsFiles: string[] = [];
  public constructor(private config: CustomKnexConfig) {
    this.knex = Knex(config);
  }

  public async runMigrations() {
    try {
      await this.runLatestMigrations();
      await this.runRepeatableMigrations();
    } finally {
      await this.cleanup();
    }
  }

  private async runLatestMigrations() {
    const migrationDirectories = this.config && this.config.migrations && this.config.migrations.directory;

    this.jsFiles = createTempJsFiles(migrationDirectories);

    const logs = await this.knex.migrate.latest(this.config);

    console.log(logs);
  }

  private async runRepeatableMigrations() {
    const repeatableDirectory = this.config.repeatableDirectory;

    if (repeatableDirectory) {
      const files = fs.readdirSync(repeatableDirectory);

      const sortedFiles = files.sort();

      await this.knex.transaction(async trx => {
        for (const file of sortedFiles) {
          const filePath = path.join(repeatableDirectory, file);
          const fileStat = fs.statSync(filePath);
          if (fileStat.isFile()) {
            const fileContent = fs.readFileSync(filePath);
            await trx.raw(fileContent.toString());

            console.log(`${filePath}: completed`);
          }
        }
      });
    }
  }

  private async cleanup() {
    await this.knex.destroy();
    cleanSqlJsFiles(this.jsFiles);
  }
}
