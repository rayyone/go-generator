/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const verificationCode = {
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
      name: 'Code',
      goType: 'string',
      orgType: 'string',
      propKey: 'code',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'Type',
      goType: 'string',
      orgType: 'string',
      propKey: 'type',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'ExpiredAt',
      goType: 'time.Time',
      orgType: 'time.Time',
      propKey: 'expired_at',
      isRequired: true,
      filterable: false,
      filterType: '',
    },
  ],
};
module.exports = verificationCode;
