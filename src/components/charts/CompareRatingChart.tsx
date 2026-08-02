'use client';

import { RatingChart, type RatingPoint } from '@/components/charts/RatingChart';

interface CompareRatingChartProps {
  data: RatingPoint[];
  userName?: string;
  friendName?: string;
  loading?: boolean;
}

export function CompareRatingChart({ data, loading, userName, friendName }: CompareRatingChartProps) {
  return <RatingChart data={data} loading={loading} compareMode={true} userName={userName} friendName={friendName} />;
}
