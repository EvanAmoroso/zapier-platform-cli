const promote = require('./promote');
const utils = require('../utils');

const maybePromote = (
  context,
  fromVersion,
  toVersion,
  optionalPercent,
  app
) => {
  let promoteFirst = false;
  if (
    optionalPercent === 100 &&
    app.public &&
    toVersion !== app.latest_version
  ) {
    context.line(
      `You're trying to migrate all the users to ${toVersion}, ` +
        'which is not the current production version.'
    );
    promoteFirst = utils.getYesNoInput(
      `Do you want to promote ${toVersion} to production first?`
    );
  }

  return Promise.all([app, promoteFirst]).then(([app, promoteFirst]) => {
    let promotePromise = null;
    if (promoteFirst) {
      promotePromise = promote(context, toVersion, false);
    }
    return Promise.all([app, promotePromise]);
  });
};

const migrate = (context, fromVersion, toVersion, optionalPercent = '100%') => {
  if (!toVersion) {
    context.line(
      'Must provide both old and new version like `zapier migrate 1.0.0 1.0.1`.'
    );
    return Promise.resolve();
  }
  optionalPercent = parseInt(optionalPercent, 10);

  return utils
    .getLinkedApp()
    .then(app => {
      return maybePromote(
        context,
        fromVersion,
        toVersion,
        optionalPercent,
        app
      );
    })
    .then(([app]) => {
      const body = {
        percent: optionalPercent
      };
      const user = global.argOpts.user;
      const updateMigrations = global.argOpts.updateMigrations;

      if (user) {
        if (optionalPercent !== 100) {
          throw new Error(
            'Cannot define percent and user. Use only one or the other.'
          );
        }

        body.user = user;

        context.line(
          `Getting ready to migrate "${user}" in your app "${
            app.title
          }" from ${fromVersion} to ${toVersion}.\n`
        );
        utils.startSpinner(
          `Starting migration from ${fromVersion} to ${toVersion} for ${user}`
        );
      } else {
        context.line(
          `Getting ready to migrate your app "${
            app.title
          }" from ${fromVersion} to ${toVersion}.\n`
        );
        utils.startSpinner(
          `Starting migration from ${fromVersion} to ${toVersion} for ${optionalPercent}%`
        );
      }

      let buildPromise = null;
      if (updateMigrations) {
        buildPromise = utils.build();
      } else {
        buildPromise = Promise.resolve(null);
      }

      return buildPromise.then(zipPath => {
        if (zipPath) {
          body.zip_file = utils.getBufferFromZipPath(zipPath);
        }

        return utils.callAPI(
          `/apps/${app.id}/versions/${fromVersion}/migrate-to/${toVersion}`,
          {
            method: 'POST',
            body
          }
        );
      });
    })
    .then(() => {
      utils.endSpinner();
      context.line(
        '\nMigration successfully queued, please check `zapier history` to track the status. Migrations usually take between 5-10 minutes.'
      );
    });
};

migrate.argsSpec = [
  {
    name: 'fromVersion',
    example: '1.0.0',
    required: true,
    help: 'the version **from** which to migrate users'
  },
  {
    name: 'toVersion',
    example: '1.0.1',
    required: true,
    help: 'the version **to** which to migrate users'
  },
  {
    name: 'percent',
    example: '100%',
    default: '100%',
    help: 'percent of users to migrate'
  }
];
migrate.argOptsSpec = {
  user: {
    help: 'migrate only this user',
    example: 'user@example.com'
  },
  updateMigrations: {
    help: 'Updates migration code with code from working directory'
  }
};
migrate.help = 'Migrate users from one version of your app to another.';
migrate.example = 'zapier migrate 1.0.0 1.0.1 [10%]';
migrate.docs = `
Starts a migration to move users between different versions of your app. You may also "revert" by simply swapping the from/to verion strings in the command line arguments (IE: \`zapier migrate 1.0.1 1.0.0\`).

Only migrate users between non-breaking versions, use \`zapier deprecate\` if you have breaking changes!

Migrations can take between 5-10 minutes, so be patient and check \`zapier history\` to track the status

Note: since a migration is only for non-breaking changes, users are not emailed about the update/migration. It will be a transparent process for them.

> Tip! We recommend migrating a small subset of users first, then watching error logs of the new version for any sort of odd behavior. When you feel confident there are no bugs, go ahead and migrate everyone. If you see unexpected errors, you can revert.

> Tip 2! You can migrate a single user by using \`--user\` (IE: \`zapier migrate 1.0.0 1.0.1 --user=user@example.com\`).

**Arguments**

${utils.argsFragment(migrate.argsSpec)}
${utils.argOptsFragment(migrate.argOptsSpec)}

${'```'}bash
$ zapier migrate 1.0.0 1.0.1 15%
# Getting ready to migrate your app "Example" from 1.0.0 to 1.0.1.
#
#   Starting migration from 1.0.0 to 1.0.1 for 15% - done!
#
# Migration successfully queued, please check \`zapier history\` to track the status. Normal migrations take between 5-10 minutes.
${'```'}
`;

module.exports = migrate;
