import { useState, useEffect } from 'react';

import { getAvailableModels } from '../services/modelService';

import { Schema } from '../interfaces/BuildPageInterfaces';

export const useBuildPage = () => {
  const [data, setData] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: Schema = await getAvailableModels();
      setData(response);
    } catch (error: any) {
      setError(error.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error };
};
