module.exports = {
  up: function up(knex) {
    return knex.raw('select 1');
  },

  down: function down(knex) {
    return knex.raw('select 1');
  },
};
