// eslint-disable-next-line notice/notice
import { Logger } from 'winston';
import { Config } from '@backstage/config';
import {
  PluginCacheManager,
  PluginDatabaseManager,
  PluginEndpointDiscovery,
  UrlReader,
} from '@backstage/backend-common';
import { PermissionAuthorizer } from '@backstage/plugin-permission-common';

export type PluginEnvironment = {
  logger: Logger;
  database: PluginDatabaseManager;
  cache: PluginCacheManager;
  config: Config;
  reader: UrlReader;
  discovery: PluginEndpointDiscovery;
  permissions: PermissionAuthorizer;
};
