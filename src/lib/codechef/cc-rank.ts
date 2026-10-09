export function ccRankColor(rating: number): string {
  if (rating >= 2500) return '#ef4444'; // 7★ Red
  if (rating >= 2200) return '#f97316'; // 6★ Orange
  if (rating >= 2000) return '#eab308'; // 5★ Yellow
  if (rating >= 1800) return '#a855f7'; // 4★ Purple
  if (rating >= 1600) return '#3b82f6'; // 3★ Blue
  if (rating >= 1400) return '#22c55e'; // 2★ Green
  return '#808080'; // 1★ Gray
}

export function ccRankStars(rating: number): string {
  if (rating >= 2500) return '7★';
  if (rating >= 2200) return '6★';
  if (rating >= 2000) return '5★';
  if (rating >= 1800) return '4★';
  if (rating >= 1600) return '3★';
  if (rating >= 1400) return '2★';
  return '1★';
}

export function ccRankName(rating: number): string {
  return ccRankStars(rating);
}

export function ccRankTitle(rating: number): string {
  if (rating >= 2500) return '7 Star';
  if (rating >= 2200) return '6 Star';
  if (rating >= 2000) return '5 Star';
  if (rating >= 1800) return '4 Star';
  if (rating >= 1600) return '3 Star';
  if (rating >= 1400) return '2 Star';
  return '1 Star';
}

export function ccDivision(rating: number): string {
  if (rating >= 2000) return 'Div 1';
  if (rating >= 1600) return 'Div 2';
  if (rating >= 1400) return 'Div 3';
  return 'Div 4';
}
