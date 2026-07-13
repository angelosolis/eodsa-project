'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy combined History page — split into Archived + Logs. */
export default function BackendHistoryRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/backend/archived');
  }, [router]);
  return null;
}
