import { Worker, Job } from 'bullmq';

import { getBullMQConnection } from '../config/redis';
import { logger } from '../config/logger';
import { Sale } from '../database/models/sale.model';
import { getSocketServer } from '../sockets/socket.server';
import { SOCKET_EVENTS } from '../shared/types';
import { afipService } from '../modules/afip/afip.service';

export function createAfipWorker(): Worker {
  const worker = new Worker(
    'afip-processing',
    async (job: Job) => {
      const { saleId } = job.data as { saleId: string };
      logger.info(`[AFIP Worker] Processing sale: ${saleId}, attempt: ${job.attemptsMade + 1}`);

      const sale = await Sale.findById(saleId);
      if (!sale || !sale.afip) {
        logger.warn(`[AFIP Worker] Sale ${saleId} not found or no AFIP data`);
        return;
      }

      // Mark as processing
      sale.afip.status = 'PROCESSING';
      await sale.save();

      try {
        const result = await afipService.emitVoucher(sale);

        sale.afip.status = 'APPROVED';
        sale.afip.cae = result.cae;
        sale.afip.caeDueDate = result.caeDueDate;
        sale.afip.voucherNumber = result.voucherNumber;
        sale.afip.processedAt = new Date();
        await sale.save();

        const io = getSocketServer();
        if (io) {
          io.to(`branch:${sale.branchId}`).emit(SOCKET_EVENTS.AFIP_STATUS_UPDATED, {
            saleId,
            status: 'APPROVED',
            cae: result.cae,
            caeDueDate: result.caeDueDate,
            voucherNumber: result.voucherNumber,
          });
        }

        logger.info(`[AFIP Worker] Sale ${saleId} approved. CAE: ${result.cae}`);
      } catch (err) {
        sale.afip.retryCount = (sale.afip.retryCount ?? 0) + 1;
        sale.afip.errorMessage = err instanceof Error ? err.message : 'Unknown AFIP error';

        if (job.attemptsMade + 1 >= (job.opts.attempts ?? 3)) {
          sale.afip.status = 'ERROR';
          logger.error(`[AFIP Worker] Sale ${saleId} failed after all retries: ${sale.afip.errorMessage}`);

          const io = getSocketServer();
          if (io) {
            io.to(`branch:${sale.branchId}`).emit(SOCKET_EVENTS.AFIP_STATUS_UPDATED, {
              saleId,
              status: 'ERROR',
              errorMessage: sale.afip.errorMessage,
            });
          }
        } else {
          sale.afip.status = 'PENDING';
          logger.warn(`[AFIP Worker] Sale ${saleId} attempt failed, will retry: ${sale.afip.errorMessage}`);
        }

        await sale.save();
        throw err; // Re-throw for BullMQ retry
      }
    },
    {
      connection: getBullMQConnection(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[AFIP Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[AFIP Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('[AFIP Worker] Worker error:', err);
  });

  return worker;
}
