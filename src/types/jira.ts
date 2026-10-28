export type JiraAlias = 'osc' | 'osct' | 'harmony';

export interface JiraConfig {
    alias: JiraAlias;
    baseUrl: string;
    projectKey: string;
    authType: 'bearer' | 'basic';
    token: string;
    username?: string;
}

export interface JiraIssue {
    id: string;
    key: string;
    fields: {
        summary: string;
        status: { name: string };
        assignee: { displayName: string } | null;
    };
}

export interface JiraSearchResponse {
    issues: JiraIssue[];
    startAt: number;
    maxResults: number;
    total: number;
}

export interface JiraSearchResult {
    issues: JiraIssue[];
    total: number;
    truncated: boolean;
}

export interface ParsedCommand {
    alias: JiraAlias;
    assignee: string | null;
    statuses: string[];
}