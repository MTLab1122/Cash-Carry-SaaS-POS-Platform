import * as fs from 'fs';
import * as path from 'path';

export interface LocalSaleRecord {
  localId: string;
  payload: any;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  createdAt: string;
  errorMessage?: string;
}

export class LocalOfflineDatabase {
  private dbPath: string;
  private queue: LocalSaleRecord[] = [];
  private cachedProducts: any[] = [];

  constructor(storageDir?: string) {
    const dir = storageDir || path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.dbPath = path.join(dir, 'offline_queue.json');
    this.load();
  }

  private load() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const data = JSON.parse(raw);
        this.queue = data.queue || [];
        this.cachedProducts = data.cachedProducts || [];
      } catch (e) {
        this.queue = [];
        this.cachedProducts = [];
      }
    }
  }

  private save() {
    fs.writeFileSync(
      this.dbPath,
      JSON.stringify(
        {
          queue: this.queue,
          cachedProducts: this.cachedProducts,
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  }

  // Queue offline sale
  saveOfflineSale(localId: string, payload: any): LocalSaleRecord {
    const record: LocalSaleRecord = {
      localId,
      payload,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.queue.push(record);
    this.save();
    return record;
  }

  getPendingSales(): LocalSaleRecord[] {
    return this.queue.filter((s) => s.status === 'PENDING');
  }

  markSaleSynced(localId: string) {
    const match = this.queue.find((s) => s.localId === localId);
    if (match) {
      match.status = 'SYNCED';
      this.save();
    }
  }

  markSaleFailed(localId: string, error: string) {
    const match = this.queue.find((s) => s.localId === localId);
    if (match) {
      match.status = 'FAILED';
      match.errorMessage = error;
      this.save();
    }
  }

  setCachedProducts(products: any[]) {
    this.cachedProducts = products;
    this.save();
  }

  getCachedProducts(): any[] {
    return this.cachedProducts;
  }
}
