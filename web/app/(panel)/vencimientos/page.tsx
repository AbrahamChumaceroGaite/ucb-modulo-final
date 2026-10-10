import type { Metadata } from 'next';
import { ExpiryRiskView } from '@/features/expiry-risk';

export const metadata: Metadata = { title: 'Lotes por vencer' };

export default function ExpiryRiskPage() {
  return <ExpiryRiskView />;
}
