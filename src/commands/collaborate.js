const utils = require('../utils');

const makeAccess = require('./_access');

const collaborate = makeAccess('collaborate', 'collaborator');
collaborate.help =
  'Manage the admins on your project. Can optionally --remove.';
collaborate.example = 'zapier collaborate [user@example.com]';
collaborate.docs = `
Give any user registered on Zapier the ability to collaborate on your app. Commonly, this is useful for teammates, contractors, or other developers who might want to make changes on your app. Only admin access is supported. If you'd only like to provide read-only or testing access, try \`zapier invite\`.

**Arguments**

* _none_ -- print all admins
${utils.argsFragment(collaborate.argsSpec)}
${utils.argOptsFragment(collaborate.argOptsSpec)}
${utils.defaultArgOptsFragment()}

${'```'}bash
$ zapier collaborate
# The admins on your app "Example" listed below.
#
# ┌──────────────────┬───────┬──────────┐
# │ Email            │ Role  │ Status   │
# ├──────────────────┼───────┼──────────┤
# │ user@example.com │ admin │ accepted │
# └──────────────────┴───────┴──────────┘

$ zapier collaborate user@example.com
# Preparing to add admin user@example.com to your app "Example".
#
#   Adding user@example.com - done!
#
# Admins updated! Try viewing them with \`zapier collaborate\`.

$ zapier collaborate user@example.com --remove
# Preparing to remove admin user@example.com from your app "Example".
#
#   Removing user@example.com - done!
#
# Admins updated! Try viewing them with \`zapier collaborate\`.
${'```'}
`;

module.exports = collaborate;
