import * as Sentry from '@sentry/react-native';

const dsn = '';

if (dsn) {
  Sentry.init({
    dsn,
  });
}
