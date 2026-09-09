export function cfRankColor(rating: number): string {
  if (rating >= 3000) return '#FF0000'; // Legendary Grandmaster
  if (rating >= 2600) return '#FF0000'; // International Grandmaster / Grandmaster
  if (rating >= 2400) return '#FF0000'; // Grandmaster
  if (rating >= 2300) return '#FF8C00'; // International Master
  if (rating >= 2100) return '#FF8C00'; // Master
  if (rating >= 1900) return '#AA00AA'; // Candidate Master
  if (rating >= 1600) return '#0000FF'; // Expert
  if (rating >= 1400) return '#00C0C0'; // Specialist
  if (rating >= 1200) return '#008000'; // Pupil
  return '#808080'; // Newbie
}

export function cfRankName(rating: number): string {
  if (rating >= 3000) return 'LGM';
  if (rating >= 2600) return 'IGM';
  if (rating >= 2400) return 'GM';
  if (rating >= 2300) return 'IM';
  if (rating >= 2100) return 'M';
  if (rating >= 1900) return 'CM';
  if (rating >= 1600) return 'EXP';
  if (rating >= 1400) return 'SP';
  if (rating >= 1200) return 'PPL';
  return 'NB';
}
