// constants
const constants = {
  // 401
  UNAUTHORIZED: 'unauthorized',

  // 403
  FORBIDDEN: 'permission denied',

  // 404
  NOT_FOUND: 'not found',

  // 500
  SERVER_ERROR: 'internal server error',

  // custom
  INVALID_ARGUMENT: 'invalid argument',
  INVALID_APP_KEY: 'invalid app key',
  INVALID_USERNAME: 'invalid username',
  UNAUTHORIZED_APP: 'unauthorized app',
  USERNAME_EXISTS: 'username already exists',
  EMAIL_EXISTS: 'email already exists',
  EMAIL_NOT_CONFIRMED: 'email not confirmed',
  ACCOUNT_IS_LOCKED: 'account is locked',
  INVALID_LOGIN_OR_PASSWORD: 'invalid login or password',
  INCORRECT_CURRENT_PASSWORD: 'incorrect current password',
  UNABLE_TO_LOGIN_BY_PASSWORD: 'unable to login by password',
  NOT_ALLOWED_TO_CREATE_USER: 'not allowed to create user',
  NOT_ALLOWED_TO_REGISTER: 'not allowed to register',
  NOT_BIND_TO_APP: 'not bind to current app',
  BIND_TO_APP: 'already bind to current app',
};

export default constants;
