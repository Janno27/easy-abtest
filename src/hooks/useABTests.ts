import { useState, useEffect, useCallback } from 'react';
import { ABTest, ABTastyError } from '../types';
import { getTests } from '../services/ABTastyService';

interface UseABTestsResult {
  data: ABTest[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch AB Tasty tests
 * @param propertyId Property ID to filter tests
 * @param autoFetch Whether to fetch on mount (default: true)
 * @returns Object with data, loading state, error and refetch function
 */
export function useABTests(propertyId: string, autoFetch = true): UseABTestsResult {
  const [data, setData] = useState<ABTest[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchTests = useCallback(async () => {
    if (!propertyId) {
      setError(new Error('Property ID is required'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tests = await getTests(propertyId);
      setData(tests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      if (!(err instanceof ABTastyError) || err.status !== 401) {
        console.error('Error fetching AB tests:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  const refetch = useCallback(async () => {
    await fetchTests();
  }, [fetchTests]);

  // Fetch tests on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchTests();
    }
  }, [autoFetch, fetchTests]);

  return { data, isLoading, error, refetch };
}

export default useABTests;