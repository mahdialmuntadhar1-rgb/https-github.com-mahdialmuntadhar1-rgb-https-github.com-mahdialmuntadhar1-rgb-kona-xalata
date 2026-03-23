import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Business } from '../types';

interface Filters {
  governorate?: string;
  category?: string;
  minRating?: number;
}

export const useBusinesses = (filters: Filters = {}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('businesses')
        .select('*')
        .order('rating', { ascending: false })
        .limit(50);

      if (filters.governorate && filters.governorate !== 'all') {
        query = query.ilike('governorate', filters.governorate);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
      } else {
        setBusinesses(data as Business[]);
      }
      setLoading(false);
    };

    fetchBusinesses();
  }, [filters.governorate, filters.category, filters.minRating]);

  return { businesses, loading, error };
};
