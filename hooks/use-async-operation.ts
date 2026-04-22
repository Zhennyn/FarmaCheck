import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFeedback } from './feedback-message';

export type LoadingState = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
};

export const useLoadingState = (initialLoading = false): LoadingState => {
  const [isLoading, setIsLoading] = useState(initialLoading);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      return await fn();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
};

export type AsyncOperationState = LoadingState & {
  feedback: ReturnType<typeof useFeedback>;
  execute: <T>(
    operation: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      showAlertOnError?: boolean;
    }
  ) => Promise<T | null>;
};

export const useAsyncOperation = (initialLoading = false): AsyncOperationState => {
  const loading = useLoadingState(initialLoading);
  const feedback = useFeedback();

  const execute = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      showAlertOnError?: boolean;
    } = {}
  ): Promise<T | null> => {
    try {
      const result = await loading.withLoading(operation);

      if (options.successMessage) {
        feedback.success(options.successMessage);
      }

      return result;
    } catch (error) {
      const errorMessage = options.errorMessage ||
        (error instanceof Error ? error.message : 'Ocorreu um erro inesperado');

      feedback.error(errorMessage);

      if (options.showAlertOnError) {
        Alert.alert('Erro', errorMessage);
      }

      return null;
    }
  }, [loading, feedback]);

  return {
    ...loading,
    feedback,
    execute,
  };
};