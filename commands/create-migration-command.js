var fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path');

module.exports = function (config, logger, migrationName, migrationProvider) {
    var up, down,
        ts = Date.now();

    if (config.sequence === 'increment') {
      var migrations = migrationProvider.getMigrationsList()
      migrations.sort()
      var last = migrations[migrations.length - 1]
      var lastCount = parseInt(last.substring(0, last.indexOf('_')))

      if (isNaN(lastCount)) {
        throw new Error('migration "' + last + "' sequence number could not be parsed. It must be an integer.");
      }

      ts = lastCount + 1
    }

    if (typeof config.migrationsDir !== 'string') {
        throw new Error('configuration "migrationsDir" is missing');
    }

    mkdirp.sync(config.migrationsDir);

    up = ts + '_up' + (migrationName ? '_' + migrationName : '') + '.sql';
    down = ts + '_down' + (migrationName ? '_' + migrationName : '') + '.sql';

    up = path.resolve(config.migrationsDir, up);
    down = path.resolve(config.migrationsDir, down);

    logger.log(up);
    logger.log(down);

    fs.openSync(up, 'w');
    fs.openSync(down, 'w');
};
