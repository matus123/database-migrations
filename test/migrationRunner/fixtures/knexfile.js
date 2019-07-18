module.exports = {
  client: 'postgres',
  connection: {
    host: 'localhost',
    user: 'dbuser',
    password: 'dbpassword',
    database: 'dbtest',
    port: 6000,
  },
  migrations: {
    schemaName: process.env.DB_MIGRATION_SCHEMA,
    directory: './test/migrationRunner/fixtures/migrationFiles',
  },
  repeatableDirectory: './test/migrationRunner/fixtures/migrationFiles/repeatable',
};
