import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { PiiScrubberService } from './pii-scrubber.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleGeminiProvider } from './providers/gemini.provider';
import { LocalOllamaProvider } from './providers/ollama.provider';
import { ILLMProvider } from './providers/llm-provider.interface';

@Injectable()
export class AiService {
  private readonly providers: Record<string, ILLMProvider>;

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private piiScrubber: PiiScrubberService,
    private openAiProvider: OpenAIProvider,
    private anthropicProvider: AnthropicProvider,
    private geminiProvider: GoogleGeminiProvider,
    private ollamaProvider: LocalOllamaProvider,
  ) {
    this.providers = {
      OPENAI: this.openAiProvider,
      ANTHROPIC: this.anthropicProvider,
      GEMINI: this.geminiProvider,
      OLLAMA: this.ollamaProvider,
    };
  }

  async configureTenantAI(params: {
    tenantId: string;
    provider: 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OLLAMA';
    model?: string;
    apiKey?: string;
    monthlyBudgetTokens?: number;
  }) {
    const { tenantId, provider, model = 'gpt-4o', apiKey, monthlyBudgetTokens = 500000 } = params;

    let encryptedApiKey: string | undefined = undefined;
    let iv: string | undefined = undefined;
    let authTag: string | undefined = undefined;

    if (apiKey) {
      const encryptedData = this.encryptionService.encryptApiKey(apiKey);
      encryptedApiKey = encryptedData.encrypted;
      iv = encryptedData.iv;
      authTag = encryptedData.authTag;
    }

    return this.prisma.aITenantConfig.upsert({
      where: { tenantId },
      update: {
        provider,
        model,
        ...(encryptedApiKey ? { encryptedApiKey, iv, authTag } : {}),
        monthlyBudgetTokens,
      },
      create: {
        tenantId,
        provider,
        model,
        encryptedApiKey,
        iv,
        authTag,
        monthlyBudgetTokens,
        usedTokensMonth: 0,
      },
    });
  }

  async processQuery(params: {
    tenantId: string;
    branchId?: string;
    userId?: string;
    userRole: string;
    query: string;
  }) {
    const { tenantId, branchId, userId, userRole, query } = params;

    // 1. Scrub PII from incoming prompt
    const scrubbedQuery = this.piiScrubber.scrub(query);

    // 2. Fetch or initialize Tenant AI Configuration & Budget
    let config = await this.prisma.aITenantConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.aITenantConfig.create({
        data: {
          tenantId,
          provider: 'OPENAI',
          model: 'gpt-4o',
          monthlyBudgetTokens: 500000,
          usedTokensMonth: 0,
        },
      });
    }

    // Circuit Breaker: Enforce monthly token budget
    if (config.usedTokensMonth >= config.monthlyBudgetTokens) {
      throw new ForbiddenException(
        `Monthly AI token limit reached (${config.usedTokensMonth}/${config.monthlyBudgetTokens}). Upgrade your subscription or increase token allowance.`,
      );
    }

    // 3. Gather Tenant Data with Strict Multi-Tenant Isolation
    const [sales, products, expenses] = await Promise.all([
      this.prisma.sale.findMany({
        where: { tenantId, status: 'COMPLETED' },
        include: { items: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.findMany({
        where: { tenantId, isActive: true },
        include: {
          inventoryBalances: branchId ? { where: { branchId } } : true,
          category: true,
        },
        take: 50,
      }),
      this.prisma.expense.findMany({
        where: { tenantId },
        take: 20,
      }),
    ]);

    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const lowStockProducts = products.filter((p) => {
      const stock = p.inventoryBalances.reduce((sum, b) => sum + b.currentStock, 0);
      return stock <= p.minStockLevel;
    });

    // 4. Construct System & Context Prompt with Zero PII
    const systemPrompt = `You are an AI Business Advisor for an enterprise retail Cash & Carry in Pakistan.
All currency figures are in PKR.
Tax rate is standard 18% GST.
Current tenant business has recorded PKR ${totalSalesRevenue.toLocaleString()} in recent sales across ${sales.length} orders.
Operational expenses are PKR ${totalExpensesAmount.toLocaleString()}.
There are ${lowStockProducts.length} items currently below safety threshold.`;

    // 5. Decrypt BYOK API Key if provided
    let rawApiKey: string | undefined = undefined;
    if (config.encryptedApiKey && config.iv && config.authTag) {
      try {
        rawApiKey = this.encryptionService.decryptApiKey(
          config.encryptedApiKey,
          config.iv,
          config.authTag,
        );
      } catch (err) {
        // Fallback gracefully if decryption key differs
      }
    }

    // 6. Invoke Selected Provider Adapter
    const providerKey = config.provider.toUpperCase();
    const provider = this.providers[providerKey] || this.openAiProvider;

    const completion = await provider.generateResponse(scrubbedQuery, systemPrompt, {
      temperature: config.temperature,
      apiKey: rawApiKey,
    });

    // 7. Record AI Usage Ledger atomically & increment token counter
    await this.prisma.$transaction(async (tx) => {
      await tx.aIUsageLedger.create({
        data: {
          tenantId,
          userId,
          promptTokens: completion.usage.promptTokens,
          completionTokens: completion.usage.completionTokens,
          totalTokens: completion.usage.totalTokens,
          costEstimate: (completion.usage.totalTokens / 1000) * 0.002, // ~$0.002 per 1k tokens
          provider: completion.provider,
          model: completion.model,
        },
      });

      await tx.aITenantConfig.update({
        where: { tenantId },
        data: {
          usedTokensMonth: { increment: completion.usage.totalTokens },
        },
      });
    });

    return {
      query: scrubbedQuery,
      answer: completion.text,
      provider: completion.provider,
      model: completion.model,
      usage: completion.usage,
      dataPoints: {
        totalSales: totalSalesRevenue,
        totalExpenses: totalExpensesAmount,
        lowStockCount: lowStockProducts.length,
      },
      suggestions: [
        'Recommend reorder quantities for next week',
        'Show gross profit margin breakdown',
        'Analyze top 5 best selling grocery items',
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  async getInventoryInsights(tenantId: string, branchId?: string) {
    return this.processQuery({
      tenantId,
      branchId,
      userRole: 'BUSINESS_OWNER',
      query: 'Analyze low stock items and provide inventory replenishment recommendations',
    });
  }
}
