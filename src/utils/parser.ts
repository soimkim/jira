import { ParsedCommand } from '../types/jira';

const statusPatterns: Array<[string, RegExp]> = [
    ['Reopen', /\bre-?open(?:ed)?\b/gi],
    ['In Review', /\bin[\s_-]+(?:review|reivew)\b/gi],
    ['Open', /\bopen\b/gi],
    ['In Progress', /\bin[\s_-]+progress\b/gi],
    ['Resolved', /\bresolved\b/gi], ['Closed', /\bclosed\b/gi],
    ['Done', /\bdone\b/gi], ['To Do', /\bto[\s_-]+do\b/gi],
];

/** Limited CLI parser; skills use --jql for richer queries. */
export function parseCommand(command: string): ParsedCommand {
    const match = command.trim().match(/^\/(osc|osct|harmony)(?:\s+([\s\S]+))?$/i);
    if (!match) throw new Error('지원 명령: /osc, /osct, /harmony 뒤에 조회 요청을 입력하세요.');
    const text = match[2]?.trim();
    if (!text) throw new Error('조회할 조건을 입력하세요. 예: 내가 assignee인 이슈 목록 보여줘');
    if (/변경|수정|삭제|생성|전환|\b(?:update|delete|create|transition)\b/i.test(text)) {
        throw new Error('조회 전용입니다. 이슈 생성·수정·삭제는 지원하지 않습니다.');
    }
    if (/제외|아닌|말고|않은|\b(?:not|except|exclude)\b/i.test(text)) {
        throw new Error('제외 조건은 자연어 CLI에서 지원하지 않습니다. Skill 또는 --jql을 사용하세요.');
    }
    const assigned = text.match(/\bassignee\s*[:=]\s*(?:"([^"\n]+)"|'([^'\n]+)'|([\w.@-]+))/i);
    const hasSelf = /내가|내게|나에게|내\s*(?:이슈|담당)|\b(?:my|me)\b/i.test(text);
    if (!assigned && !hasSelf) throw new Error('담당자를 명시하세요. 예: 내가 assignee인 이슈 또는 assignee:username. 복잡한 조건은 Skill/--jql을 사용하세요.');
    const statuses: string[] = [];
    let remainder = text;
    for (const [status, pattern] of statusPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(remainder)) {
            statuses.push(status);
            pattern.lastIndex = 0;
            remainder = remainder.replace(pattern, ' ');
        }
        pattern.lastIndex = 0;
    }
    if (/status|상태/i.test(text) && statuses.length === 0) {
        throw new Error('지원되지 않는 상태입니다. Skill 또는 --jql로 정확한 Jira 상태명을 지정하세요.');
    }
    return {
        alias: match[1].toLowerCase() as ParsedCommand['alias'],
        assignee: assigned ? assigned[1] || assigned[2] || assigned[3] : null,
        statuses,
    };
}

export function quoteJql(value: string): string {
    if (/[\r\n\x00-\x1f]/.test(value)) throw new Error('JQL 값에는 제어문자를 사용할 수 없습니다.');
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function buildJql(projectKey: string, command: ParsedCommand): string {
    const assignee = command.assignee === null ? 'currentUser()' : quoteJql(command.assignee);
    const statuses = command.statuses.length
        ? ` AND status IN (${command.statuses.map(quoteJql).join(', ')})` : '';
    return `project = ${quoteJql(projectKey)} AND assignee = ${assignee}${statuses} ORDER BY updated DESC`;
}