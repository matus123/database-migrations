import * as util from 'util';

import { Migrator } from '../../src';

const exec = util.promisify(require('child_process').exec);

describe('#Migration runner', () => {
  describe('#base', () => {
    test('call with only js files', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const knexfile = require('./fixtures/knexfile.js');
      const migrator = new Migrator(knexfile);
      const logs = await migrator.runMigrations();
      expect(logs).toBeDefined();
    });
  });

  describe('#exec spawn process', () => {
    test('call as external process', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { stdout, stderr } = await exec('ts-node -T ./src/bin/runMigration.ts test/migrationRunner/fixtures-process/knexfile.js');
      console.log(stdout, stderr);
      expect(stderr).toBe('');
    }, 120000);
  });
});
