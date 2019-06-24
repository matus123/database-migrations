import * as fs from 'fs';
import * as path from 'path';

const SQL_EXTNAME = '.sql';

const UP_FILE_REGEX = /\.01_up\.sql/;
const DOWN_FILE_REGEX = /\.02_down\.sql/;
const BASENAME_FILE_REGEX = /^[\w_]+/;

interface MigrationFile {
  jsMigrationFileName: string;
  upScriptName?: string;
  downScriptName?: string;
}

function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}

function isArray<T>(value: T[] | unknown): value is T[] {
  return typeof value === 'object' && value != null && value.constructor === Array;
}

function fileExists(path: string): boolean {
  try {
    const jsFileStat = fs.statSync(path);
    return jsFileStat.isFile();
  } catch (err) {
    return false;
  }
}

function isUPFile(filename: string) {
  return UP_FILE_REGEX.test(filename);
}

function isDOWNFile(filename: string) {
  return DOWN_FILE_REGEX.test(filename);
}

export function cleanSqlJsFiles(files: string[]) {
  for (const file of files) {
    fs.unlinkSync(file);
  }
}

export function createJsScriptFile(migrationFileName: string, upFile: string, downFile?: string) {
  const upFunction = upFile
    ? `
  up: function up(knex) {
    const filename = path.join(__dirname, '${upFile}')
    const sql = fs.readFileSync(filename).toString();
    return knex.raw(sql);
  },
  `
    : '';

  const downFunction = downFile
    ? `
  down: function up(knex) {
    const filename = path.join(__dirname, '${downFile}')
    const sql = fs.readFileSync(filename).toString();
    return knex.raw(sql);
  },
  `
    : '';

  const migrationContent = `
  const fs = require('fs');
  const path = require('path');

  module.exports = {
    ${upFunction}
    ${downFunction}
  }`;

  fs.writeFileSync(migrationFileName, migrationContent);
}

export function createTempJsFiles(migrationDirectory?: string | string[]): string[] {
  const jsFiles: string[] = [];

  const sqlFiles: MigrationFile[] = [];

  const directories = isString(migrationDirectory) ? [migrationDirectory] : isArray(migrationDirectory) ? migrationDirectory : undefined;

  if (!directories) {
    return jsFiles;
  }

  for (const directory of directories) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = fs.statSync(filePath);
      if (fileStat.isFile() && path.extname(file).toLowerCase() === SQL_EXTNAME) {
        const baseNameMatch = file.match(BASENAME_FILE_REGEX);
        if (baseNameMatch) {
          const baseName = baseNameMatch[0];
          const jsMigrationFilePath = `${path.join(directory, baseName)}.js`;
          const scriptFileName = `./${file}`;

          if (!fileExists(jsMigrationFilePath)) {
            const sqlFileObj: MigrationFile = {
              jsMigrationFileName: jsMigrationFilePath,
            };
            if (isUPFile(file)) {
              sqlFileObj.upScriptName = scriptFileName;
            }
            if (isDOWNFile(file)) {
              sqlFileObj.downScriptName = scriptFileName;
            }
            sqlFiles.push(sqlFileObj);
          }
        }
      }
    }
  }

  for (const { jsMigrationFileName, downScriptName, upScriptName } of sqlFiles) {
    if (upScriptName) {
      createJsScriptFile(jsMigrationFileName, upScriptName, downScriptName);
      jsFiles.push(jsMigrationFileName);
    }
  }

  return jsFiles;
}
