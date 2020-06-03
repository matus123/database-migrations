import * as fs from 'fs';
import * as path from 'path';

const SQL_EXTNAME = '.sql';

const UP_FILE_REGEX = /\.01_up\.sql/;
const DOWN_FILE_REGEX = /\.02_down\.sql/;
const BASENAME_FILE_REGEX = /^[\w_-]+/;

interface WorkingMigrationFile {
  baseName: string;
  jsMigrationFileName: string;
  upScriptName?: string;
  downScriptName?: string;
}

// type MigrationFile = Required<WorkingMigrationFile>;

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

function isValidFilePathForMigration(filePath: string): boolean {
  const fileStat = fs.statSync(filePath);
  return fileStat.isFile() && path.extname(filePath).toLowerCase() === SQL_EXTNAME;
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
  const upFunction = `
  up: function up(knex) {
    const filename = '${upFile}';
    const sql = fs.readFileSync(filename).toString();
    return knex.raw(sql);
  },
  `;

  const emptyDownFunction = `
  down: function down(knex) {
    return knex.raw();
  },
  `;

  const downFunction = `
  down: function down(knex) {
    const filename = '${downFile}';
    const sql = fs.readFileSync(filename).toString();
    return knex.raw(sql);
  },
  `;

  const dd = downFile ? downFunction : emptyDownFunction;

  const migrationContent = `
  const fs = require('fs');
  const path = require('path');

  module.exports = {
    ${upFunction}
    ${dd}
  }`;

  fs.writeFileSync(migrationFileName, migrationContent);
}

export function createTempJsFiles(migrationDirectory?: string | string[] | readonly string[]): string[] {
  const jsFiles: string[] = [];

  const workingSqlFiles = new Map<string, WorkingMigrationFile>();

  const directories = isString(migrationDirectory) ? [migrationDirectory] : isArray(migrationDirectory) ? migrationDirectory : undefined;

  if (!directories) {
    return jsFiles;
  }

  for (const directory of directories) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const absoluteFilePath = path.join(directory, file);
      if (isValidFilePathForMigration(absoluteFilePath)) {
        const baseNameMatch = file.match(BASENAME_FILE_REGEX);
        if (baseNameMatch) {
          const baseName = baseNameMatch[0];
          const sqlScriptFileName = absoluteFilePath;

          const absoluteJsMigrationFilePath = `${path.join(directory, baseName)}.js`;

          if (!fileExists(absoluteJsMigrationFilePath)) {
            const workingSqlFile = workingSqlFiles.get(absoluteJsMigrationFilePath);
            const workingFile = workingSqlFile || {
              baseName: baseName,
              jsMigrationFileName: absoluteJsMigrationFilePath,
            };
            if (isUPFile(file)) {
              workingFile.upScriptName = sqlScriptFileName;
            }
            if (isDOWNFile(file)) {
              workingFile.downScriptName = sqlScriptFileName;
            }
            workingSqlFiles.set(absoluteJsMigrationFilePath, workingFile);
          }
        }
      }
    }
  }

  // validate
  for (const [, workingFile] of workingSqlFiles) {
    if (!workingFile.upScriptName) {
      throw new Error(`missing upScript for '${workingFile.baseName}' migration file`);
    }
  }

  for (const [, workingFile] of workingSqlFiles) {
    if (workingFile.upScriptName) {
      createJsScriptFile(workingFile.jsMigrationFileName, workingFile.upScriptName, workingFile.downScriptName);
      jsFiles.push(workingFile.jsMigrationFileName);
    }
  }

  return jsFiles;
}
