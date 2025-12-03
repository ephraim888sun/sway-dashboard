// Dashboard type definitions - simplified to real metrics only

export interface JurisdictionInfluence {
  jurisdictionId: string;
  name: string;
  level: string | null;
  supporterCount: number;
  upcomingElectionsCount: number;
  upcomingBallotItemsCount: number;
  upcomingRacesCount: number;
}

export interface TimeSeriesDataPoint {
  date: string; // ISO date string
  period: string; // e.g., "2024-04" for monthly, "2024-W15" for weekly, "2024-10-15" for daily
  newSupporters: number;
  cumulativeSupporters: number;
  activeSupporters?: number; // 30-day rolling window of active supporters
}

export interface TimeSeriesData {
  data: TimeSeriesDataPoint[];
  periodType: "daily" | "weekly" | "monthly";
}

export interface ElectionInfluence {
  electionId: string;
  name: string;
  pollDate: string | null;
  description: string | null;
  supportersInScope: number;
  ballotItemsCount: number;
  racesCount: number;
  measuresCount: number;
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
  topState: {
    state: string;
    supporterCount: number;
  } | null;
  electionsWithAccess: number;
  totalBallotItems: number;
}

export interface StateDistribution {
  state: string;
  supporterCount: number;
  jurisdictionCount: number;
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
    totalBallotItems: number;
    racesCount: number;
    measuresCount: number;
  };
  ballotItems: BallotItem[];
  topRaces: BallotItem[]; // Top 3 races by supporter count
  jurisdictionBreakdown: {
    jurisdictionId: string;
    jurisdictionName: string;
    supporterCount: number;
  }[];
}
