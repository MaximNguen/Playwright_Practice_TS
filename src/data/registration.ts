export interface RegistrationData {
  readonly firstName: string;
  readonly email: string;
  readonly password: string;
}

export const INVALID_EMAIL_REGISTRATION: RegistrationData = {
  firstName: 'Invalid User',
  email: 'invalid-email',
  password: 'Test1234',
};

export const INVALID_PASSWORD_REGISTRATION: RegistrationData = {
  firstName: 'Invalid User',
  email: 'invalid-password@example.com',
  password: 'short',
};
