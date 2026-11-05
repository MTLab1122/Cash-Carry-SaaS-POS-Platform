import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronPos', {
  saveOfflineSale: (localId: string, salePayload: any) =>
    ipcRenderer.invoke('pos:save-offline-sale', { localId, salePayload }),
  getPendingSyncCount: () => ipcRenderer.invoke('pos:get-pending-sync-count'),
  triggerSync: () => ipcRenderer.invoke('pos:trigger-sync'),
  printReceipt: (receiptHtml: string) => ipcRenderer.invoke('hardware:print-receipt', receiptHtml),
  kickCashDrawer: () => ipcRenderer.invoke('hardware:kick-cash-drawer'),
});
