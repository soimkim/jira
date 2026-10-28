import { JiraService } from '../services/jiraService';
import { JiraConfig } from '../types/jira';
import { buildJql, parseCommand } from '../utils/parser';

export class JiraInquiryHandler {
    constructor(private readonly jiraService: JiraService, private readonly config: JiraConfig) {}

    async handleInquiry(command: string): Promise<string> {
        return this.handleJql(buildJql(this.config.projectKey, parseCommand(command)));
    }

    async handleJql(jql: string): Promise<string> {
        const result = await this.jiraService.searchIssues(jql);
        const clean = (value: string): string => value.replace(/[\r\n\t\x00-\x1f]/g, ' ');
        const header = `[${this.config.alias}] ${result.total}건 중 ${result.issues.length}건\nJQL: ${jql}`;
        if (!result.issues.length) return `${header}\n조건에 맞는 이슈가 없습니다.`;
        const lines = result.issues.map(issue =>
            `- ${clean(issue.key)} | ${clean(issue.fields.status.name)} | ${clean(issue.fields.summary)} | ${clean(issue.fields.assignee?.displayName ?? '미지정')}\n  ${this.config.baseUrl}/browse/${encodeURIComponent(issue.key)}`);
        return [header, ...lines, ...(result.truncated ? ['최대 1000건까지 표시했습니다. 조회 조건을 좁혀주세요.'] : [])].join('\n');
    }
}