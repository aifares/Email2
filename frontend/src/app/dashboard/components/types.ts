// Types for email data
export interface EmailData {
  threadId: string;
  messageCount?: number;
  subject: string;
  from: string | { name?: string; email: string };
  date: string;
  snippet?: string;
  sentiment?: string;
  classification?: string;
}

export interface PaginationData {
  total: number;
  totalPages: number;
  nextPageToken?: string | undefined;
  hasMore: boolean;
}

export interface EmailCacheItem {
  emails: EmailData[];
  pagination: PaginationData;
}

export type EmailCache = Record<string, EmailCacheItem>;

// Search params interface
export interface SearchParams {
  search: string;
  classification: string;
  sentiment: string;
  showUnreplied: boolean;
}
