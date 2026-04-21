/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import './src/monitoring/sentry';

AppRegistry.registerComponent(appName, () => App);
