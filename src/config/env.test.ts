import dotenv from 'dotenv';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { getJiraConfig, loadEnvironment } from './env';

describe('environment configuration', () => {
    const original = process.env;
    beforeEach(() => {
        process.env = {};
    });
    afterEach(() => { process.env = original; jest.restoreAllMocks(); });

    test.each([
        ['osc', 'JIRA_CLM_OSC', 'OSC'],
        ['osct', 'JIRA_CLM_OSCT', 'OSCT'],
        ['harmony', 'JIRA_HARMONY_OSC', 'OSC'],
    ] as const)('loads only the selected %s credentials', (alias, prefix, projectKey) => {
        process.env[`${prefix}_URL`] = 'https://jira.example/issue/';
        process.env[`${prefix}_TOKEN`] = 'fake-test-token';
        expect(getJiraConfig(alias)).toMatchObject({ alias, projectKey, baseUrl: 'https://jira.example/issue', authType: 'bearer' });
    });
    test('blocks HTTP until explicitly allowed', () => {
        process.env.JIRA_CLM_OSCT_URL = 'http://jira.example/issue';
        process.env.JIRA_CLM_OSCT_TOKEN = 'fake-test-token';
        expect(() => getJiraConfig('osct')).toThrow('ALLOW_HTTP=true');
        process.env.JIRA_CLM_OSCT_ALLOW_HTTP = 'true';
        expect(getJiraConfig('osct').baseUrl).toBe('http://jira.example/issue');
    });
    test('validates basic username, placeholders, and auth type', () => {
        process.env.JIRA_CLM_OSC_URL = 'https://jira.example/issue';
        process.env.JIRA_CLM_OSC_TOKEN = 'replace_with_your_token';
        expect(() => getJiraConfig('osc')).toThrow('TOKEN');
        process.env.JIRA_CLM_OSC_TOKEN = 'fake-test-token';
        process.env.JIRA_CLM_OSC_AUTH_TYPE = 'basic';
        expect(() => getJiraConfig('osc')).toThrow('USERNAME');
        process.env.JIRA_CLM_OSC_USERNAME = 'tester';
        expect(getJiraConfig('osc').username).toBe('tester');
        process.env.JIRA_CLM_OSC_AUTH_TYPE = 'invalid';
        expect(() => getJiraConfig('osc')).toThrow('AUTH_TYPE');
    });
    test.each(['https://jira.example/issue/projects/OSC', 'https://user:pass@jira.example/issue', 'file:///tmp/jira', 'https://jira.example/issue?token=x'])('rejects invalid base URL %s', url => {
        process.env.JIRA_CLM_OSC_URL = url;
        expect(() => getJiraConfig('osc')).toThrow();
    });
    test('defaults to home .env and supports explicit ~/ path', () => {
        const config = jest.spyOn(dotenv, 'config').mockReturnValue({ parsed: {} });
        loadEnvironment();
        expect(config).toHaveBeenLastCalledWith({ path: join(homedir(), '.env') });
        process.env.JIRA_ENV_FILE = '~/custom.env';
        loadEnvironment();
        expect(config).toHaveBeenLastCalledWith({ path: join(homedir(), 'custom.env') });
    });
    test('dotenv preserves process variables', () => {
        process.env.JIRA_CLM_OSC_TOKEN = 'process-token';
        const target = { JIRA_CLM_OSC_TOKEN: 'process-token' };
        dotenv.populate(target, { JIRA_CLM_OSC_TOKEN: 'file-token' });
        expect(target.JIRA_CLM_OSC_TOKEN).toBe('process-token');
    });
});