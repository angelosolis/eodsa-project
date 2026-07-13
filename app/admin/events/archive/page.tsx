'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — History lives on the Backend dashboard now. */
export default function AdminEventsArchiveRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/backend/archived');
  }, [router]);
  return null;
}
