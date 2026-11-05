import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { LocalOfflineDatabase } from './db';

const db = new LocalOfflineDatabase();
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Cash & Carry Enterprise Desktop POS',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const webUrl = process.env.WEB_URL || 'http://localhost:3000/pos';
  mainWindow.loadURL(webUrl).catch(() => {
    // If web server not started, load local fallback
    mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Background sync worker: checks pending sales every 30s
  setInterval(async () => {
    await performBackgroundSync();
  }, 30000);
});

async function performBackgroundSync() {
  const pending = db.getPendingSales();
  if (pending.length === 0) return;

  console.log(`[SyncWorker] Attempting sync of ${pending.length} offline transactions...`);

  try {
    const apiUrl = process.env.API_URL || 'http://localhost:4000/api/v1';
    const payload = {
      deviceId: 'ELECTRON-POS-WIN-01',
      transactions: pending.map((p) => ({
        ...p.payload,
        localId: p.localId,
      })),
    };

    const response = await fetch(`${apiUrl}/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result: any = await response.json();
      for (const id of result.syncedIds || []) {
        db.markSaleSynced(id);
      }
      console.log(`[SyncWorker] Successfully synced ${result.synced} transactions.`);
    }
  } catch (err: any) {
    console.warn(`[SyncWorker] Backend offline or unreachable: ${err.message}`);
  }
}

// IPC Handlers
ipcMain.handle('pos:save-offline-sale', async (_, { localId, salePayload }) => {
  return db.saveOfflineSale(localId, salePayload);
});

ipcMain.handle('pos:get-pending-sync-count', async () => {
  return db.getPendingSales().length;
});

ipcMain.handle('pos:trigger-sync', async () => {
  await performBackgroundSync();
  return { pending: db.getPendingSales().length };
});

ipcMain.handle('hardware:print-receipt', async (_, receiptHtml) => {
  console.log('[Printer] Printing receipt payload to 80mm ESC/POS printer...');
  return { success: true };
});

ipcMain.handle('hardware:kick-cash-drawer', async () => {
  console.log('[Hardware] Sending 24V pulse to RJ11 Cash Drawer...');
  return { success: true };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
