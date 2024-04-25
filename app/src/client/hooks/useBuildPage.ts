import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { getAvailableModels } from '../services/modelService';

export const useBuildPage = () => {
  const location = useLocation();
  const [componentToRender, setComponentToRender] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableModels();
      setData(response);
    } catch (error: any) {
      setError(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter((segment) => segment.trim() !== '');
    setComponentToRender(pathSegments[pathSegments.length - 1] || 'secrets');
  }, [location.pathname]);

  useEffect(() => {
    fetchData();
  }, []);

  return { componentToRender, data, loading, error };
};
