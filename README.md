Database migrations based on [knex.js](http://knexjs.org)

- can use .sql files for migrations
- generate .sql files with tool
- can use repeatable scripts for database updates

# Install
`npm install database-migrations`


# Usage
Run migrations
```
  - node -r ts-node/register ./node_modules/.bin/migration:run knexfile.ts
  - migration:run knexfile.js
```
Generate migrations
```
  - migration:generate <folder> <migration-name>
  - migration:generate migrations/migrations/v0.2.0
```