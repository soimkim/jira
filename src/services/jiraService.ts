import axios from 'axios';
import { JiraConfig, JiraSearchResponse, JiraSearchResult } from '../types/jira';

export class JiraService {
    constructor(private readonly config: JiraConfig) {}

    async searchIssues(jql: string): Promise<JiraSearchResult> {
        const { baseUrl, token, authType, username } = this.config;
        const authorization = authType === 'basic'
            ? `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}` : `Bearer ${token}`;
        const issues: JiraSearchResult['issues'] = [];
        const limit = 1000;
        let total = 0;
        do {
            let data: JiraSearchResponse;
            try {
                const response = await axios.get<JiraSearchResponse>(`${baseUrl}/rest/api/2/search`, {
                    headers: { Authorization: authorization, Accept: 'application/json' },
                    params: {
                        jql, startAt: issues.length, maxResults: Math.min(100, limit - issues.length),
                        fields: 'summary,status,assignee',
                    },
                    timeout: 30000,
                    maxRedirects: 0,
                });
                data = response.data;
            } catch (error: unknown) {
                // Raw Axios errors/configs can contain the Authorization header.
                const status = axios.isAxiosError(error) ? error.response?.status : undefined;
                if (status === 401 || status === 403) throw new Error(`Jira 인증/권한 오류 (${status}). 토큰, 인증 방식, 프로젝트 접근 권한을 확인하세요.`);
                throw new Error(status
                    ? `Jira 조회 실패 (HTTP ${status}). JQL, API 경로 및 서버 상태를 확인하세요.`
                    : 'Jira 연결 실패. 사내망/VPN, DNS 및 인증서 설정을 확인하세요.');
            }
            if (!data || !Array.isArray(data.issues) || !Number.isInteger(data.total) || data.total < 0 ||
                !data.issues.every(issue => issue && typeof issue.key === 'string' &&
                    issue.fields && typeof issue.fields.summary === 'string' &&
                    typeof issue.fields.status?.name === 'string')) {
                throw new Error('Jira 검색 API 응답 형식이 아닙니다. API 경로 또는 SSO 설정을 확인하세요.');
            }
            total = data.total;
            if (data.issues.length === 0 && issues.length < total) throw new Error('Jira 페이지 조회가 중단되었습니다. 다시 조회하거나 조건을 좁혀주세요.');
            issues.push(...data.issues.slice(0, limit - issues.length));
        } while (issues.length < total && issues.length < limit);
        return { issues, total, truncated: issues.length < total };
    }
}