// Dashboard type definitions

export interface JurisdictionInfluence {
  jurisdictionId: string;
  name: string;
  level: string | null;
  supporterCount: number;
  estimatedTurnout: number | null;
  supporterShare: number | null; // percentage (0-100)
  activeSupporterCount: number;
  activeRate: number; // percentage (0-100)
  growth30d: number; // percentage change
}

export interface TimeSeriesDataPoint {
  date: string; // ISO date string
  period: string; // e.g., "2024-04" for monthly, "2024-W15" for weekly
  newSupporters: number;
  cumulativeSupporters: number;
  activeSupporters: number;
}

export interface TimeSeriesData {
  data: TimeSeriesDataPoint[];
  periodType: "weekly" | "monthly";
}

export interface ElectionInfluence {
  electionId: string;
  name: string;
  pollDate: string | null;
  description: string | null;
  supportersInScope: number;
  supporterShareInScope: number | null; // percentage
  influenceTargetCount: number; // races/measures aligned with viewpoint groups
  ballotItems: BallotItem[];
}

export interface BallotItem {
  ballotItemId: string;
  title: string | null;
  description: string | null;
  jurisdictionId: string;
  jurisdictionName: string | null;
  type: "race" | "measure";
  race?: RaceDetail;
  measure?: MeasureDetail;
  influenceScore: number; // 0-100
}

export interface RaceDetail {
  raceId: string;
  officeTermId: string | null;
  officeName: string | null;
  officeLevel: string | null;
  officeDistrict: string | null;
  candidates: Candidate[];
  partyId: string | null;
  partyName: string | null;
  isPartisan: boolean | null;
  isPrimary: boolean | null;
}

export interface Candidate {
  candidacyId: string;
  candidateId: string;
  candidateName: string | null;
  partyId: string | null;
  partyName: string | null;
  status: string | null;
  isWithdrawn: boolean | null;
  result: string | null;
}

export interface MeasureDetail {
  measureId: string;
  title: string | null;
  summary: string | null;
  fullText: string | null;
  fiscalImpact: string | null;
  proSnippet: string | null;
  conSnippet: string | null;
}

export interface SummaryMetrics {
  totalSupporters: number;
  activeSupporters: number;
  activeRate: number; // percentage (0-100)
  topJurisdiction: {
    jurisdictionId: string;
    name: string;
    supporterCount: number;
    supporterShare: number | null;
  } | null;
  highLeverageElectionsCount: number;
}

export interface InfluenceTarget {
  id: string;
  type: "race" | "measure";
  name: string;
  jurisdictionId: string;
  jurisdictionName: string | null;
  influenceScore: number; // 0-100
  supporterShare: number | null;
  alignmentWeight: number; // 0-1, based on viewpoint group alignment
}

export interface ViewpointGroupNetwork {
  primaryGroupId: string;
  subGroupIds: string[];
  allGroupIds: string[];
}

export interface ElectionDetail {
  electionId: string;
  name: string;
  pollDate: string | null;
  description: string | null;
  summary: {
    supportersInScope: number;
    supporterShareInScope: number | null;
    totalBallotItems: number;
  };
  ballotItems: BallotItem[];
  topRaces: BallotItem[]; // Top 3 races by influence score
  jurisdictionBreakdown: {
    jurisdictionId: string;
    jurisdictionName: string;
    supporterCount: number;
    supporterShare: number | null;
  }[];
}
