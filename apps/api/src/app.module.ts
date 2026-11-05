import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ProductsModule } from './modules/products/products.module';
import { BarcodeModule } from './modules/barcode/barcode.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PosModule } from './modules/pos/pos.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CustomersModule } from './modules/customers/customers.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SyncModule } from './modules/sync/sync.module';
import { AiModule } from './modules/ai/ai.module';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    BranchesModule,
    ProductsModule,
    BarcodeModule,
    InventoryModule,
    PosModule,
    PurchasesModule,
    CustomersModule,
    FinanceModule,
    ReportsModule,
    SubscriptionsModule,
    SyncModule,
    AiModule,
    EventsModule,
  ],
})
export class AppModule {}
