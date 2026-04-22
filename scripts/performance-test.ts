/**
 * Script de Teste de Performance para FarmaCheck
 *
 * Executa testes automatizados de performance para medir o desempenho
 * das operações de banco de dados SQLite.
 *
 * Uso: npx ts-node scripts/performance-test.ts
 */

import { closeAppDatabase, openAppDatabase, withDatabase } from '../src/database/sqlite-client';
import { inventoryRepository } from '../src/modules/inventory/application/repositories/inventory.repository';
import { inventoryService } from '../src/modules/inventory/application/services/inventory.service';
import {
    generateTestProduct,
    measureTime,
    printPerformanceSummary,
    runPerformanceTests
} from '../src/utils/performance';

// Cliente SQLite compatível com a interface esperada
const sqliteClient = {
  initialize: openAppDatabase,
  close: closeAppDatabase,
  runAsync: async (query: string, ...params: any[]) => {
    return withDatabase(async (db) => {
      return db.runAsync(query, ...params);
    });
  },
  getAllAsync: async <T = unknown>(query: string, ...params: any[]): Promise<T[]> => {
    return withDatabase(async (db) => {
      return db.getAllAsync(query, ...params) as Promise<T[]>;
    });
  },
};

async function runPerformanceTest() {
  console.log('[PERFORMANCE] Inicializando teste de performance...\n');

  try {
    // Inicializar banco de dados
    await sqliteClient.initialize();

    // Criar instâncias do serviço e repository
    const repo = inventoryRepository(sqliteClient);
    const service = inventoryService(repo);

    // Wrapper functions para medir performance
    const createProductMeasured = async (input: any) => {
      return measureTime(`create_product_${input.nome}`, async () => {
        const result = await service.createProduct(input);
        if (!result.success) {
          throw new Error(result.error.message);
        }
        return result.data;
      });
    };

    const listProductsMeasured = async () => {
      return measureTime('list_all_products', async () => {
        return repo.listAll();
      });
    };

    // Executar testes de performance
    const results = await runPerformanceTests(
      createProductMeasured,
      listProductsMeasured
    );

    // Exibir resumo
    printPerformanceSummary(results);

    // Teste adicional: operações CRUD individuais
    console.log('\n[PERFORMANCE] === Teste de Operações CRUD Individuais ===');

    const testProduct = generateTestProduct(9999);

    // Criar produto
    const createdProduct = await measureTime('create_single_product', async () => {
      const result = await service.createProduct(testProduct);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    });

    // Atualizar produto
    await measureTime('update_single_product', async () => {
      const updateInput = {
        ...testProduct,
        id: createdProduct.id,
        nome: 'Produto Atualizado Teste',
      };
      const result = await service.updateProduct(updateInput);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    });

    // Listar produtos (deve incluir o criado)
    const allProducts = await measureTime('list_after_operations', async () => {
      return repo.listAll();
    });

    console.log(`[PERFORMANCE] Total de produtos no banco: ${allProducts.length}`);

    // Limpar dados de teste (opcional)
    console.log('\n[PERFORMANCE] Limpando dados de teste...');
    for (const product of allProducts) {
      if (product.nome.includes('Produto Teste') || product.nome.includes('Produto Atualizado Teste')) {
        await service.deleteProduct({
          id: product.id,
          colaborador: 'PerformanceTest',
        });
      }
    }

    console.log('[PERFORMANCE] ✅ Teste de performance concluído com sucesso!');

  } catch (error) {
    console.error('[PERFORMANCE] ❌ Erro durante teste de performance:', error);
    throw error;
  } finally {
    // Fechar conexão com banco
    await sqliteClient.close();
  }
}

// Executar teste se arquivo for chamado diretamente
if (require.main === module) {
  runPerformanceTest()
    .then(() => {
      console.log('\n[PERFORMANCE] Script finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[PERFORMANCE] Script falhou:', error);
      process.exit(1);
    });
}

export { runPerformanceTest };
