import { Queue } from 'bullmq';
import { getBullMQConnection } from '../config/redis';

export const afipQueue = new Queue('afip-processing', {
  connection: getBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
