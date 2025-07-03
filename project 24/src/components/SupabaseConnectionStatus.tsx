import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Test the connection by trying to fetch from a system table
      const { data, error } = await supabase
        .from('media_contexts')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Supabase connection error:', error);
        setError(error.message);
        setIsConnected(false);
      } else {
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    }
  };

  if (isConnected === null) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-300">Checking connection...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-300">Supabase Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2" title={error || 'Connection failed'}>
      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
      <span className="text-sm text-red-300">Supabase Disconnected</span>
    </div>
  );
};

export default SupabaseConnectionStatus;