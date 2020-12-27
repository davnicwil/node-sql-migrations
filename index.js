var MigrationProvider = require('./migration-provider');
var createMigrationCommand = require('./commands/create-migration-command');
var runMigrationsCommand = require('./commands/run-migrations-command');
var rollbackMigrationCommand = require('./commands/rollback-migration-command');

var LOGGER = console;

function getAdapter(config) {
  config.adapter = config.adapter || 'pg';
  var Adapter = require('./adapters/' + config.adapter);

  return Adapter(config, LOGGER);
}

function migrate(config, adapter) {
    if (adapter === undefined) {
      adapter = getAdapter(config)
    }

    var migrationProvider = MigrationProvider(config);
    return runMigrationsCommand(migrationProvider, adapter, config.minMigrationTime, LOGGER).then(function () {
        return adapter.dispose();
    }, function (error) {
        function rethrowOriginalError() {
            throw error;
        }
        return adapter.dispose().then(rethrowOriginalError, rethrowOriginalError);
    });
}

function rollback(config, adapter) {
    if (adapter === undefined) {
      adapter = getAdapter(config)
    }

    var migrationProvider = MigrationProvider(config);
    return rollbackMigrationCommand(migrationProvider, adapter, LOGGER).then(function () {
        return adapter.dispose();
    }, function (error) {
        function rethrowOriginalError() {
            throw error;
        }
        return adapter.dispose().then(rethrowOriginalError, rethrowOriginalError);
    });
}

function create(config, migrationName) {
  var migrationProvider = MigrationProvider(config);
  return createMigrationCommand(config, LOGGER, migrationName, migrationProvider)
}

module.exports = {
    setLogger: function (logger) {
        LOGGER = logger;
    },
    migrate: migrate,
    rollback: rollback,
    run: function (config) {
        var adapter = getAdapter(config)
        var args = process.argv.slice(2);

        switch (args[0]) {
            case 'create':
                create(config, args[1]);
                break;
            case 'migrate':
                migrate(config, adapter).then(onCliSuccess, onCliError);
                break;
            case 'rollback':
                rollback(config, adapter).then(onCliSuccess, onCliError);
                break;
            default:
                LOGGER.log('exit');
        }

        function onCliSuccess() {
            LOGGER.log('done');
            process.exit();
        }

        function onCliError(error) {
            LOGGER.error('ERROR:', error);
            process.exit(1);
        }
    }
};
