/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const accessToken = {
  domain: 'auth',
  props: [
    // {{ry_placeholder:new_props}}
    {
      name: 'UserID',
      goType: 'string',
      orgType: 'string',
      propKey: 'user_id',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'AccessToken',
      goType: '*string',
      orgType: 'string',
      propKey: 'access_token',
      isRequired: false,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'TokenExpiredAt',
      goType: '*time.Time',
      orgType: 'time.Time',
      propKey: 'token_expired_at',
      isRequired: false,
      filterable: false,
      filterType: '',
    },
    {
      name: 'Revoke',
      goType: '*bool',
      orgType: 'bool',
      propKey: 'revoke',
      isRequired: false,
      filterable: false,
      filterType: '',
    },
  ],
};
module.exports = accessToken;
