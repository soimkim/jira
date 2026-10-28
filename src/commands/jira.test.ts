import axios from 'axios';
import { jiraCommandHandler, jiraJqlHandler } from './jira';
import { startApp } from '../app';

jest.mock('axios');
const get = jest.mocked(axios.get);
const original = process.env;
beforeEach(() => {
    process.env = {
        JIRA_CLM_OSCT_URL: 'https://jira.example/issue',
        JIRA_CLM_OSCT_TOKEN: 'test-token',
        JIRA_CLM_OSCT_ALLOW_HTTP: 'true',
    };
    jest.resetAllMocks();
});
afterEach(() => { process.env = original; });

test('formats actual issue fields and browse link', async () => {
    get.mockResolvedValue({ data: { total: 1, issues: [{
        id: '1', key: 'OSCT-1', fields: { summary: 'Test issue', status: { name: 'In Review' }, assignee: null },
    }] } });
    const result = await jiraCommandHandler('/osct 내가 assignee인 이슈 중 Reopen 또는 In Review');
    expect(result).toContain('[osct] 1건 중 1건');
    expect(result).toContain('In Review | Test issue | 미지정');
    expect(result).toContain('http://clm.lge.com/issue/browse/OSCT-1');
    expect(result).toContain('status IN ("Reopen", "In Review")');
});

test('advanced JQL scopes an OR filter and handles zero results', async () => {
    get.mockResolvedValue({ data: { total: 0, issues: [] } });
    const result = await jiraJqlHandler('osct', 'status = Open OR status = Closed');
    expect(result).toContain('project = "OSCT" AND (status = Open OR status = Closed) ORDER BY updated DESC');
    expect(result).toContain('조건에 맞는 이슈가 없습니다.');
});

test('help needs no credentials and performs no API call', async () => {
    expect(await startApp(['--help'])).toContain('조회 전용');
    expect(get).not.toHaveBeenCalled();
});

test('invalid advanced command fails before contacting API', async () => {
    await expect(jiraJqlHandler('unknown', 'x')).rejects.toThrow('별칭');
    await expect(jiraJqlHandler('osct', 'x ORDER BY updated')).rejects.toThrow('ORDER BY');
    expect(get).not.toHaveBeenCalled();
});

test.each(['status = Open) OR project = OTHER OR (status = Closed', 'status = (Open', 'summary ~ "unclosed', 'status = Open\n'])('rejects unbalanced or unsafe filter: %s', async filter => {
    await expect(jiraJqlHandler('osct', filter)).rejects.toThrow();
    expect(get).not.toHaveBeenCalled();
});

test('allows parentheses and escaped quotes inside a quoted literal', async () => {
    get.mockResolvedValue({ data: { total: 0, issues: [] } });
    await expect(jiraJqlHandler('osct', 'summary ~ "a) b\\"c" AND (status = Open)')).resolves.toContain('0건');
});