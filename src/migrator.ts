import * as Knex from 'knex';
import * as fs from 'fs';

import * as path from 'path';
import { cleanSqlJsFiles, createTempJsFiles } from './utils';

export interface CustomKnexConfig extends Knex.MigratorConfig, Knex.Config {
  repeatableDirectory?: string;
  dryRun?: boolean;
}

export class Migrator {
  private knex: Knex;
  private jsFiles: string[] = [];
  private isDryRun: boolean;
  public constructor(private config: CustomKnexConfig) {
    this.knex = Knex(config);
    this.isDryRun = config.dryRun || false;
  }

  public async runMigrations() {
    let repeatebleScripts: string[] = [];
    let latestMigrations: [number, string[]] = [0, []];
    try {
      await this.prepareMigrationScripts();

      if (!this.isDryRun) {
        latestMigrations = await this.runLatestMigrations();
        repeatebleScripts = await this.runRepeatableMigrations();
      }
      return {
        repeatebleScripts,
        latestMigrations,
      };
    } finally {
      await this.cleanup();
    }
  }

  private async prepareMigrationScripts() {
    const migrationDirectories = this.config && this.config.migrations && this.config.migrations.directory;

    this.jsFiles = createTempJsFiles(migrationDirectories);
  }

  private async runLatestMigrations() {
    const logs: [number, string[]] = await this.knex.migrate.latest(this.config);

    console.log(logs);

    return logs;
  }

  private async runRepeatableMigrations() {
    const processedRepeatableScripts: string[] = [];
    const repeatableDirectory = this.config.repeatableDirectory;

    if (repeatableDirectory) {
      const files = fs.readdirSync(repeatableDirectory);

      const sortedFiles = files.sort();

      await this.knex.transaction(async (trx) => {
        for (const file of sortedFiles) {
          const filePath = path.join(repeatableDirectory, file);
          const fileStat = fs.statSync(filePath);
          if (fileStat.isFile()) {
            const fileContent = fs.readFileSync(filePath);
            await trx.raw(fileContent.toString());

            console.log(`${filePath}: completed`);
            processedRepeatableScripts.push(filePath);
          }
        }
      });
    }

    return processedRepeatableScripts;
  }

  private async cleanup() {
    await this.knex.destroy();
    cleanSqlJsFiles(this.jsFiles);
  }
}
