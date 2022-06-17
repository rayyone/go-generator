// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

const debug = require('debug');

// debug.enable('*')

module.exports = function (scope) {
  return debug(`rayyone:cli${scope ? `:${scope}` : ''}`);
};
