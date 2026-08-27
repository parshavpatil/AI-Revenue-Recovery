export const APP_NAME = 'RecoverAI Voice';

export type HealthStatus = {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  module: number;
};
