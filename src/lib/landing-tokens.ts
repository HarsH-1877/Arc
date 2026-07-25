// ARC Landing Page Design Tokens
// All components should import from here — no inline magic values.

export const COLORS = {
  bgBase: '#0A0B0D',
  textPrimary: '#EDEAE4',
  textSecondary: '#8A8A85',
  borderHairline: '#242426',

  tierNewbie: '#8B8B8B',
  tierPupil: '#4CAF50',
  tierSpecialist: '#3DDBD9',
  tierExpert: '#3B7DDB',
  tierCandidateMaster: '#A35BE0',
  tierGrandmaster: '#E0473B',
} as const;

// Rank thresholds mapped to global scroll progress (0–1)
export const RANK_MILESTONES = [
  { progress: 0.20, rating: 1200, label: 'Newbie',           abbr: 'NB',  color: COLORS.tierNewbie },
  { progress: 0.32, rating: 1400, label: 'Pupil',            abbr: 'PPL', color: COLORS.tierPupil },
  { progress: 0.45, rating: 1600, label: 'Specialist',       abbr: 'SP',  color: COLORS.tierSpecialist },
  { progress: 0.58, rating: 1800, label: 'Expert',           abbr: 'EXP', color: COLORS.tierExpert },
  { progress: 0.72, rating: 2100, label: 'Candidate Master', abbr: 'CM',  color: COLORS.tierCandidateMaster },
  { progress: 0.85, rating: 2300, label: 'Grandmaster',      abbr: 'GM',  color: COLORS.tierGrandmaster },
] as const;

export const MOTION = {
  easeEntrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeHover: 'cubic-bezier(0.4, 0, 0.2, 1)',
  durationHover: 150,
  durationCard: 350,
  durationSection: 600,
} as const;
