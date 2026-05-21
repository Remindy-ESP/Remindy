import 'react-i18next';
import type { Resources } from './resources';
import type { Namespace } from './config';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
    returnNull: false;
  }
}

export type { Namespace };
