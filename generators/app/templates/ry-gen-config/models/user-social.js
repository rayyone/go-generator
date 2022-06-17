/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

const userSocial = {
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
      name: 'SocialID',
      goType: 'string',
      orgType: 'string',
      propKey: 'social_id',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
    {
      name: 'Provider',
      goType: 'string',
      orgType: 'string',
      propKey: 'provider',
      isRequired: true,
      filterable: true,
      filterType: '=',
    },
  ],
};
module.exports = userSocial;
