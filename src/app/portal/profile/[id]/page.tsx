// app/portal/profile/[id]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function RedirectToAbout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(`${pathname}/about`);
  }, [pathname, router]);

  return null;
}
