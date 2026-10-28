import { JiraInquiryHandler } from '../handlers/jiraInquiryHandler';
import { getJiraConfig } from '../config/env';
import { JiraService } from '../services/jiraService';
import { JiraAlias } from '../types/jira';
import { parseCommand, quoteJql } from '../utils/parser';

export async function jiraCommandHandler(command: string): Promise<string> {
    const parsed = parseCommand(command);
    const config = getJiraConfig(parsed.alias);
    return new JiraInquiryHandler(new JiraService(config), config).handleInquiry(command);
}

export async function jiraJqlHandler(alias: string, filter: string): Promise<string> {
    if (!['osc', 'osct', 'harmony'].includes(alias)) throw new Error('별칭은 osc, osct, harmony 중 하나여야 합니다.');
    if (!filter.trim() || /\border\s+by\b/i.test(filter)) throw new Error('--jql에는 ORDER BY 없이 필터 조건만 입력하세요. updated DESC가 자동 적용됩니다.');
    // Keep the filter inside its wrapper so an unmatched ')' cannot bypass project scoping.
    let depth = 0;
    let quote = '';
    let escaped = false;
    for (const character of filter) {
        if (/[\x00-\x1f\x7f]/.test(character)) throw new Error('JQL 필터에는 제어문자를 사용할 수 없습니다.');
        if (escaped) { escaped = false; continue; }
        if (quote) {
            if (character === '\\') escaped = true;
            else if (character === quote) quote = '';
        } else if (character === '"' || character === "'") quote = character;
        else if (character === '(') depth++;
        else if (character === ')' && --depth < 0) throw new Error('JQL 필터의 괄호가 맞지 않습니다.');
    }
    if (depth !== 0 || quote) throw new Error('JQL 필터의 괄호 또는 따옴표가 맞지 않습니다.');
    const config = getJiraConfig(alias as JiraAlias);
    const jql = `project = ${quoteJql(config.projectKey)} AND (${filter}) ORDER BY updated DESC`;
    return new JiraInquiryHandler(new JiraService(config), config).handleJql(jql);
}