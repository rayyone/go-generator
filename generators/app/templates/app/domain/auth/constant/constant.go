/*
 * Copyright Rayyone Ltd. 2022. All Rights Reserved
 * Node module: @rayyone/go-generator
 * This file is licensed under the MIT License.
 * License text available at https://opensource.org/licenses/MIT
 */

package constant

type VerificationType string

const (
	VerificationMethodOTP  = "OTP"
	VerificationMethodLink = "LINK"

	AccountActivationType VerificationType = "account-activation"
	ResetPasswordType     VerificationType = "reset-password"
)

type SocialProvider string

const (
	GoogleProvider   SocialProvider = "Google"
	AppleProvider    SocialProvider = "Apple"
	FacebookProvider SocialProvider = "Facebook"
	TwitterProvider  SocialProvider = "Twitter"
)
