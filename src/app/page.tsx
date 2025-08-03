'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/portal');
    }
  }, [isAuthenticated, router]);

   return (
    <>
      <Navbar />
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Bine ai venit pe RoBio!</h1>
        <p>Explorează arborele tău genealogic alături de comunitatea RoBio.</p>
      </main>
    </>
  );
}
