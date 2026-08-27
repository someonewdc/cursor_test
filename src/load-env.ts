import { config } from 'dotenv';

export function loadEnv(path?: string): void {
  config(path === undefined ? undefined : { path });
}
