import * as fs from 'fs';
import * as path from 'path';

const SQL_EXTNAME = '.sql';

const UP_FILE_REGEX = /\.01_up\.sql/;
const DOWN_FILE_REGEX = /\.02_down\.sql/;
const BASENAME_FILE_REGEX = /^[\w_]+/;

function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}

function isArray<T>(value: T[] | unknown): value is T[] {
  return typeof value === 'object' && value != null && value.constructor === Array;
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

  const sqlFileDict: {
    [fileName: string]: {
      up?: string;
      down?: string;
    };
  } = {};

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
          const pathFile = `${path.join(directory, baseName)}.js`;
          const scriptFileName = `./${file}`;
          if (isUPFile(file)) {
            sqlFileDict[pathFile] = sqlFileDict[pathFile] != null ? { ...sqlFileDict[pathFile], up: scriptFileName } : { up: scriptFileName };
          }
          if (isDOWNFile(file)) {
            sqlFileDict[pathFile] = sqlFileDict[pathFile] != null ? { ...sqlFileDict[pathFile], down: scriptFileName } : { down: scriptFileName };
          }
        }
      }
    }
  }

  for (const [fileName, { up, down }] of Object.entries(sqlFileDict)) {
    if (up) {
      createJsScriptFile(fileName, up, down);
      jsFiles.push(fileName);
    }
  }

  return jsFiles;
}
