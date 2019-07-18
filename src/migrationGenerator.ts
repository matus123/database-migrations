#!/usr/bin/env node
import fs = require('fs');
import path = require('path');

const writeFile = (folder: string, file: string, data: string) => {
  fs.appendFileSync(path.resolve(folder, file), data);
};

const MIGRATION_FOLDER_NAME = process.argv[2];
const MIGRATION_NAME = process.argv[3] || 'unknown';

if (!MIGRATION_FOLDER_NAME) {
  throw new Error('Invalid arguments');
}

const DATE = new Date();
const YEAR = DATE.getFullYear();
const MONTH_NUMBER = DATE.getMonth() + 1;
const DAY_NUMBER = DATE.getDate() + 1;
const HOUR_NUMBER = DATE.getHours() + 1;
const MINUTE_NUMBER = DATE.getMinutes() + 1;
const SEC_NUMBER = DATE.getSeconds() + 1;

const MONTH = MONTH_NUMBER > 9 ? MONTH_NUMBER : '0' + MONTH_NUMBER;
const DAY = DAY_NUMBER > 9 ? DAY_NUMBER : '0' + DAY_NUMBER;
const HOUR = HOUR_NUMBER > 9 ? HOUR_NUMBER : '0' + HOUR_NUMBER;
const MINUTE = MINUTE_NUMBER > 9 ? MINUTE_NUMBER : '0' + MINUTE_NUMBER;
const SEC = SEC_NUMBER > 9 ? SEC_NUMBER : '0' + SEC_NUMBER;
const FILENAME = `${YEAR}${MONTH}${DAY}${HOUR}${MINUTE}${SEC}_${MIGRATION_NAME}`;

writeFile(MIGRATION_FOLDER_NAME, `${FILENAME}.01_up.sql`, `--${FILENAME}-up`);
writeFile(MIGRATION_FOLDER_NAME, `${FILENAME}.02_down.sql`, `--${FILENAME}-down`);
