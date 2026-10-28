import axios from 'axios';
import { JiraConfig, JiraIssue } from '../types/jira';
import { JiraService } from './jiraService';

jest.mock('axios');
const get = jest.mocked(axios.get);
const config: JiraConfig = {
    alias: 'osct', projectKey: 'OSCT', baseUrl: 'https://jira.example/issue',
    authType: 'bearer', token: 'fake-test-token',
};
const issue = (id: number): JiraIssue => ({
    id: String(id), key: `OSCT-${id}`,
    fields: { summary: `Issue ${id}`, status: { name: 'Reopen' }, assignee: null },
});

beforeEach(() => jest.resetAllMocks());

test('uses bearer, correct context path, timeout and no redirects; paginates', async () => {
    get.mockResolvedValueOnce({ data: { issues: [issue(1)], total: 2 } });
    get.mockResolvedValueOnce({ data: { issues: [issue(2)], total: 2 } });
    const result = await new JiraService(config).searchIssues('project = OSCT');
    expect(result).toMatchObject({ total: 2, truncated: false });
    expect(result.issues).toHaveLength(2);
    expect(get).toHaveBeenNthCalledWith(1, 'https://jira.example/issue/rest/api/2/search', expect.objectContaining({
        headers: { Authorization: 'Bearer fake-test-token', Accept: 'application/json' },
        params: expect.objectContaining({ startAt: 0 }), timeout: 30000, maxRedirects: 0,
    }));
    expect(get).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({ params: expect.objectContaining({ startAt: 1 }) }));
});

test('uses basic auth when configured', async () => {
    get.mockResolvedValue({ data: { issues: [], total: 0 } });
    await new JiraService({ ...config, authType: 'basic', username: 'tester' }).searchIssues('x');
    expect(get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Basic ${Buffer.from('tester:fake-test-token').toString('base64')}` }),
    }));
});

test('caps retrieval and marks truncation', async () => {
    get.mockImplementation(async (_url, options) => {
        const start = (options?.params as { startAt: number }).startAt;
        return { data: { issues: Array.from({ length: 100 }, (_, i) => issue(start + i)), total: 1200 } };
    });
    const result = await new JiraService(config).searchIssues('x');
    expect(result.issues).toHaveLength(1000);
    expect(result.truncated).toBe(true);
    expect(get).toHaveBeenCalledTimes(10);
});

test('rejects HTML/invalid response and incomplete pagination', async () => {
    get.mockResolvedValueOnce({ data: '<html>SSO</html>' });
    await expect(new JiraService(config).searchIssues('x')).rejects.toThrow('응답 형식');
    get.mockResolvedValueOnce({ data: { issues: [], total: 2 } });
    await expect(new JiraService(config).searchIssues('x')).rejects.toThrow('페이지');
});

test.each([401, 403, 400, 302])('returns safe error for HTTP %s', async status => {
    jest.mocked(axios.isAxiosError).mockReturnValue(true);
    get.mockRejectedValue({ response: { status }, config: { headers: { Authorization: 'SECRET' } }, message: 'SECRET' });
    await expect(new JiraService(config).searchIssues('x')).rejects.toThrow(String(status));
    await expect(new JiraService(config).searchIssues('x')).rejects.not.toThrow('SECRET');
});

test('network failures do not expose raw error', async () => {
    get.mockRejectedValue(new Error('SECRET'));
    await expect(new JiraService(config).searchIssues('x')).rejects.toThrow('연결 실패');
});