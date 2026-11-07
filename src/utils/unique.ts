import { randomUUID } from 'node:crypto';

const uuid = (): string => randomUUID().replace(/-/g, '');

export const uniqueEmail = (prefix = 'ui'): string => `${prefix}_${uuid().slice(0, 10)}@example.com`;

export const uniqueName = (prefix: string): string => `${prefix} ${uuid().slice(0, 6)}`;
