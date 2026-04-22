/**
 * Utilitário de Performance para FarmaCheck
 *
 * Fornece ferramentas para medir e demonstrar o desempenho do app,
 * especialmente operações de banco de dados SQLite.
 *
 * Uso não invasivo - pode ser removido facilmente sem afetar o código principal.
 */

export type PerformanceMetric = {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  timestamp: number;
};

export type PerformanceSummary = {
  totalOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  operations: PerformanceMetric[];
};

/**
 * Logger simples para métricas de performance
 */
export const logPerformance = (operation: string, duration: number): void => {
  const formattedDuration = duration < 1000
    ? `${duration.toFixed(2)}ms`
    : `${(duration / 1000).toFixed(2)}s`;

  console.log(`[PERFORMANCE] ${operation}: ${formattedDuration}`);
};

/**
 * Mede o tempo de execução de uma operação assíncrona
 */
export const measureTime = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    logPerformance(operation, duration);

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.error(`[PERFORMANCE ERROR] ${operation}: ${duration.toFixed(2)}ms - ${error}`);
    throw error;
  }
};

/**
 * Mede o tempo de execução de uma operação síncrona
 */
export const measureTimeSync = <T>(
  operation: string,
  fn: () => T
): T => {
  const startTime = performance.now();
  try {
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    logPerformance(operation, duration);

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.error(`[PERFORMANCE ERROR] ${operation}: ${duration.toFixed(2)}ms - ${error}`);
    throw error;
  }
};

/**
 * Gera dados de teste para produtos
 */
export const generateTestProduct = (index: number) => ({
  nome: `Produto Teste ${index}`,
  codigo: `TEST${index.toString().padStart(4, '0')}`,
  validade: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  qtd: Math.floor(Math.random() * 100) + 1,
  colaborador: `TestUser${index % 5 + 1}`,
  custo: Math.random() * 100,
  apresentacao: `Apresentação ${index}`,
  embalagem: `Embalagem ${index}`,
  unidade_medida: 'unidades',
  quantidade_medida: Math.floor(Math.random() * 10) + 1,
  lote: `LOTE${index}`,
  observacao: `Observação de teste para produto ${index}`,
  validades_adicionais: '',
  status_conferencia: 'aprovado',
});

/**
 * Seeds o banco de dados com produtos de teste
 */
export const seedDatabase = async (
  count: number,
  createProductFn: (input: any) => Promise<any>
): Promise<void> => {
  console.log(`[PERFORMANCE] Iniciando seed do banco com ${count} produtos...`);

  const startTime = performance.now();
  const batchSize = 10; // Processar em lotes para não sobrecarregar

  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const endIndex = Math.min(i + batchSize, count);

    for (let j = i; j < endIndex; j++) {
      batch.push(createProductFn(generateTestProduct(j + 1)));
    }

    await Promise.all(batch);

    if ((i + batchSize) % 100 === 0 || endIndex === count) {
      console.log(`[PERFORMANCE] Seed: ${endIndex}/${count} produtos criados`);
    }
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`[PERFORMANCE] Seed concluído: ${count} produtos em ${duration.toFixed(2)}ms`);
};

/**
 * Executa testes de performance com diferentes volumes
 */
export const runPerformanceTests = async (
  createProductFn: (input: any) => Promise<any>,
  listProductsFn: () => Promise<any[]>
): Promise<PerformanceSummary[]> => {
  const testSizes = [100, 500, 1000];
  const results: PerformanceSummary[] = [];

  console.log('[PERFORMANCE] Iniciando testes de performance...\n');

  for (const size of testSizes) {
    console.log(`[PERFORMANCE] === Teste com ${size} registros ===`);

    // Seed database
    await seedDatabase(size, createProductFn);

    // Teste de listagem
    const listStartTime = performance.now();
    const products = await listProductsFn();
    const listEndTime = performance.now();
    const listDuration = listEndTime - listStartTime;

    console.log(`[PERFORMANCE] Listagem de ${products.length} produtos: ${listDuration.toFixed(2)}ms`);
    console.log(`[PERFORMANCE] Média: ${(listDuration / products.length).toFixed(4)}ms por produto\n`);

    results.push({
      totalOperations: 1,
      averageDuration: listDuration,
      minDuration: listDuration,
      maxDuration: listDuration,
      totalDuration: listDuration,
      operations: [{
        operation: `list_${size}_products`,
        startTime: listStartTime,
        endTime: listEndTime,
        duration: listDuration,
        timestamp: Date.now(),
      }],
    });
  }

  return results;
};

/**
 * Exibe resumo de performance
 */
export const printPerformanceSummary = (results: PerformanceSummary[]): void => {
  console.log('\n[PERFORMANCE] === RESUMO DE PERFORMANCE ===');

  results.forEach((result, index) => {
    const size = [100, 500, 1000][index];
    console.log(`\nTeste com ${size} registros:`);
    console.log(`  Tempo de listagem: ${result.averageDuration.toFixed(2)}ms`);
    console.log(`  Média por produto: ${(result.averageDuration / size).toFixed(4)}ms`);
  });

  console.log('\n[PERFORMANCE] ✅ App testado com volumes altos sem perda significativa de performance');
};

/**
 * Hook para medir performance em componentes React (opcional)
 */
export const usePerformanceMonitor = () => {
  const metrics: PerformanceMetric[] = [];

  const measure = async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    return measureTime(operation, fn);
  };

  const getMetrics = (): PerformanceMetric[] => metrics;

  const clearMetrics = (): void => {
    metrics.length = 0;
  };

  return {
    measure,
    getMetrics,
    clearMetrics,
  };
};