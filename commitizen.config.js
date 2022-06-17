const custom = require('@digitalroute/cz-conventional-changelog-for-jira/configurable');
const defaultTypes = require('@digitalroute/cz-conventional-changelog-for-jira/types');

module.exports = custom({
  types: {
    feat: defaultTypes.feat,
    fix: defaultTypes.fix,
    amend: {
      description: 'An amendment, update in your code / Fix code review',
      title: 'An amendment, update in your code / Fix code review',
    },
    refactor: defaultTypes.refactor,
    chore: defaultTypes.chore,
    build: defaultTypes.build,
  },
  jiraMode: true,
  jiraOptional: true,
  maxHeaderWidth: 130,
  maxLineWidth: 200,
  jiraPrefix: 'RY',
});
