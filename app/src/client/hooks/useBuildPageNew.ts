import { useState, useEffect } from 'react';
import { Schema } from '../interfaces/BuildPageInterfacesNew';
import { getSchema } from 'wasp/client/operations';

export const useBuildPageNew = () => {
  const [data, setData] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: Schema = await getSchema();
      setData(response);
    } catch (error: any) {
      console.error('Failed to fetch schemas:', error);
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
