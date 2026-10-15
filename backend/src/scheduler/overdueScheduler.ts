import cron from 'node-cron';
import { config } from '../config/index.js';
import { scanAndUpdateOverdueInvoices } from '../services/overdue.service.js';

let isSchedulerRunning = false;

export const initOverdueScheduler = (): void => {
  if (isSchedulerRunning) {
    console.log('[Overdue Scheduler] Scheduler is already initialized.');
    return;
  }

  const cronExpression = config.overdueCheckCron;
  if (!cron.validate(cronExpression)) {
    console.error(`[Overdue Scheduler] Invalid cron expression: "${cronExpression}". Scheduler not started.`);
    return;
  }

  console.log(`[Overdue Scheduler] Initializing background overdue detection cron ("${cronExpression}")...`);

  cron.schedule(cronExpression, async () => {
    console.log('[Overdue Scheduler] Running scheduled overdue detection scan...');
    try {
      await scanAndUpdateOverdueInvoices();
    } catch (err) {
      console.error('[Overdue Scheduler] Error executing overdue scan:', err);
    }
  });

  isSchedulerRunning = true;
};
