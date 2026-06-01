import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Don't show toast for AbortError (e.g. fast unmounts/navigation)
      if (error.name === 'AbortError') return;
      toast.error(error.message || 'Помилка завантаження даних');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error.message || 'Помилка виконання операції');
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
