import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageLoader from '@/components/common/PageLoader';

interface BootstrapGateProps {
  children: ReactNode;
}

export default function BootstrapGate({ children }: BootstrapGateProps) {
  const { bootstrap, bootstrapping } = useAuth();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (bootstrapping) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
