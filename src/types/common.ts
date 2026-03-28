export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface GenerateRequest {
  transcript: string;
  previousCode?: string;
}

export interface GenerateResponse {
  code: string;
}

export interface ExampleImage {
  id: string;
  filename: string;
  html_code: string;
}

export interface Submission {
  id: string;
  nickname: string;
  html_code: string;
  transcript: string | null;
  user_prompts: string[];
  example_image_id: string | null;
  example_image_url?: string;
  vote_count: number;
  created_at: string;
  voted_by_me?: boolean;
}

export interface RankEntry {
  rank: number;
  id: string;
  nickname: string;
  vote_count: number;
  html_code: string;
  example_image_url?: string;
}
