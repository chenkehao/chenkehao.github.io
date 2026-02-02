
export interface CareerNode {
  role: string;
  requirement: string;
  timeframe: string;
}

export interface SkillGap {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  resource: string;
}

export interface AgentFeedback {
  agentName: string;
  type: 'Technical' | 'SoftSkills' | 'Strategy';
  comment: string;
  score: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  icon?: any;
  color?: string;
}

export interface Award {
  name: string;
  org: string;
  year: string;
  description: string;
  icon?: any;
  color?: string;
}

export interface Credential {
  name: string;
  authority: string;
  validUntil?: string;
  icon?: any;
  color?: string;
}

export interface CandidateProfile {
  name: string;
  role: string;
  skills: string[];
  experienceYears: number;
  radarData: {
    subject: string;
    value: number;
  }[];
  summary: string;
  idealJobPersona?: string;
  interviewQuestions?: string[];
  optimizationSuggestions?: string[];
  careerPath?: CareerNode[];
  salaryRange?: string;
  marketDemand?: string;
  skillGaps?: SkillGap[];
  agentFeedbacks?: AgentFeedback[];
  certifications?: Certification[];
  awards?: Award[];
  credentials?: Credential[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  description: string;
  tags: string[];
}

export interface AnalysisResult {
  matchEfficiency: number; // Percentage improvement
  timeSaved: string;
  candidateRank: number;
}

// --- 新增设置相关接口 ---

export type AccountTier = 'Free' | 'Professional' | 'Enterprise';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Recruiter' | 'Viewer';
  status: 'Active' | 'Invited';
}

export interface CustomLLMConfig {
  task: string;
  modelName: string;
  provider: 'Google' | 'OpenAI' | 'Anthropic' | 'Custom';
}
