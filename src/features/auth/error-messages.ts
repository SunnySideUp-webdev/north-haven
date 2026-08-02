const defaultCreateAccountError =
  "We couldn't create the account. Review the details and try again.";

const createAccountErrorMessages: Record<string, string> = {
  email_address_invalid: "Use a valid email address that can receive messages.",
  over_email_send_rate_limit:
    "North Haven has temporarily reached its email limit. Please wait up to one hour and try again.",
  over_request_rate_limit:
    "Too many attempts were made. Wait a few minutes and try again.",
  signup_disabled: "Account creation is temporarily unavailable.",
  weak_password: "Choose a stronger password and try again.",
};

export function getCreateAccountErrorMessage(code?: string) {
  if (!code) {
    return defaultCreateAccountError;
  }

  return createAccountErrorMessages[code] ?? defaultCreateAccountError;
}
