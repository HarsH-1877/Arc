import { syncPlatform } from '@/workers/syncWorker';

/** Run platform sync in the background without blocking the HTTP response. */
export function queueBackgroundSync(connectionId: string, quick = true) {
  void (async () => {
    try {
      await syncPlatform(connectionId, { quick });
      if (quick) {
        await syncPlatform(connectionId);
      }
    } catch (error) {
      console.error('[background-sync]', connectionId, error);
    }
  })();
}

export function queueBackgroundSyncAll(connectionIds: string[]) {
  for (const connectionId of connectionIds) {
    queueBackgroundSync(connectionId, true);
  }
}
