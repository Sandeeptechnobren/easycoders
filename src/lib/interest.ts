export type InterestLabel =
  | 'Interested'
  | 'Not Interested'
  | 'Call Back Later'
  | 'Not Reachable'
  | 'Not Set'
  | 'Other';

export function normalizeInterestLabel(raw?: string | null): InterestLabel {
  const v = (raw || '').trim();
  if (!v) return 'Not Set';
  if (v === 'Interested') return 'Interested';
  if (v === 'Not Interested' || v === 'Not Interest') return 'Not Interested';
  if (v === 'Call Back Later') return 'Call Back Later';
  if (v === 'Not Reachable') return 'Not Reachable';
  return 'Other';
}

export function interestClass(label: InterestLabel) {
  switch (label) {
    case 'Interested':
      return 'interestInterested';
    case 'Not Interested':
      return 'interestNotInterested';
    case 'Call Back Later':
      return 'interestCallback';
    case 'Not Reachable':
      return 'interestNotReachable';
    case 'Not Set':
      return 'interestNotSet';
    default:
      return 'interestOther';
  }
}

export function computeInterestStats<T extends { interest?: any | null }>(rows: T[]) {
  const stats = {
    total: rows.length,
    Interested: 0,
    'Not Interested': 0,
    'Call Back Later': 0,
    'Not Reachable': 0,
    'Not Set': 0,
    Other: 0,
  };

  for (const s of rows) {
    const label = normalizeInterestLabel(s?.interest?.interest_status?.interest);
    (stats as any)[label] = ((stats as any)[label] || 0) + 1;
  }
  return stats;
}