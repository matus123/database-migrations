#!/usr/bin/env node
import * as path from 'path';
import { CustomKnexConfig, Migrator } from '../migrator';

async function runMigration() {
  const KNEX_CONFIG = process.argv[2];

  const configFilePath = path.join(process.cwd(), KNEX_CONFIG);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: CustomKnexConfig = require(configFilePath);

  const migrator = new Migrator(config);

  await migrator.runMigrations();
}

runMigration()
  .then(() => {
    // tslint:disable-next-line:no-console
    console.log('Finished');
  })
  // tslint:disable-next-line:no-console
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
