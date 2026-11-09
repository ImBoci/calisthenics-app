export function calculateExercisePoints(metricType: 'reps' | 'time', value: number, isAssisted: boolean): number {
  if (isAssisted) {
    // Assisted maxes out at 1.4 points so athletes must do unassisted to reach Level 2+
    if (value < 6) return 0.6;
    if (value < 12) return 1.0;
    return 1.4;
  }

  // Unassisted Scoring (Peak cap is 15)
  if (metricType === 'reps') {
    if (value <= 3) return 1.0;
    if (value <= 7) return 2.0;
    if (value <= 11) return 3.0;
    if (value <= 14) return 4.0;
    return 5.0; // 15+ reps is Level 5 Mastery
  } else {
    // Static hold time in seconds
    if (value <= 2) return 1.0;
    if (value <= 5) return 2.0;
    if (value <= 9) return 3.0;
    if (value <= 13) return 4.0;
    return 5.0; // 14-15s+ hold is Level 5 Mastery
  }
}

export interface SquadLevelInfo {
  level: number;
  title: string;
  badge: string;
}

export function getSquadLevel(avgScore: number, language: 'hu' | 'en' = 'hu'): SquadLevelInfo {
  if (avgScore < 1.5) {
    return { level: 1, title: language === 'hu' ? 'Kezdő' : 'Beginner', badge: 'Level 1' };
  }
  if (avgScore < 2.5) {
    return { level: 2, title: language === 'hu' ? 'Közép-Kezdő' : 'Novice', badge: 'Level 2' };
  }
  if (avgScore < 3.5) {
    return { level: 3, title: language === 'hu' ? 'Középhaladó' : 'Intermediate', badge: 'Level 3' };
  }
  if (avgScore < 4.5) {
    return { level: 4, title: language === 'hu' ? 'Haladó' : 'Advanced', badge: 'Level 4' };
  }
  return { level: 5, title: language === 'hu' ? 'Mester' : 'Elite', badge: 'Level 5' };
}

export interface PBScoreInput {
  best_value: number;
  is_assisted: boolean;
  metric_type?: 'reps' | 'time' | string;
  exercise?: {
    metric_type?: 'reps' | 'time' | string;
  };
}

export function calculateUserLevel(pbs: PBScoreInput[], language: 'hu' | 'en' = 'hu'): SquadLevelInfo {
  if (!pbs || pbs.length === 0) {
    return getSquadLevel(1.0, language);
  }
  const points = pbs.map(pb => {
    const rawType = pb.metric_type || pb.exercise?.metric_type || 'reps';
    const metricType: 'reps' | 'time' = rawType === 'time' ? 'time' : 'reps';
    return calculateExercisePoints(metricType, Number(pb.best_value) || 0, Boolean(pb.is_assisted));
  });
  const avg = points.reduce((sum, pt) => sum + pt, 0) / points.length;
  return getSquadLevel(avg, language);
}

