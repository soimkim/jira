import { buildJql, parseCommand, quoteJql } from './parser';

describe('natural-language parser', () => {
    test.each(['osc', 'osct', 'harmony'])('routes /%s exactly', alias => {
        expect(parseCommand(`/${alias} 내가 assignee인 이슈 목록 보여줘`).alias).toBe(alias);
    });
    test('keeps both statuses and does not add Open from Reopen', () => {
        const parsed = parseCommand('/osct 내가 어싸이니인 이슈 중 status: reopen 또는 in reivew 리스트업해줘');
        expect(parsed.statuses).toEqual(['Reopen', 'In Review']);
        expect(buildJql('OSCT', parsed)).toBe('project = "OSCT" AND assignee = currentUser() AND status IN ("Reopen", "In Review") ORDER BY updated DESC');
    });
    test('supports explicit username and optional statuses', () => {
        const parsed = parseCommand('/osc assignee:hong.gildong 이슈 목록');
        expect(buildJql('CUSTOM', parsed)).toBe('project = "CUSTOM" AND assignee = "hong.gildong" ORDER BY updated DESC');
    });
    test.each(['/oscx 내가 담당', '/osct', '/osc 전체 이슈', '/osc 내가 담당인 이슈 삭제', '/osc 내가 담당인 이슈 중 Open 제외', '/osc 내가 담당인 status: Unknown 이슈'])('rejects unsupported input: %s', input => {
        expect(() => parseCommand(input)).toThrow();
    });
    test('escapes JQL literals', () => {
        expect(quoteJql('a"b\\c')).toBe('"a\\"b\\\\c"');
        expect(() => quoteJql('a\nb')).toThrow();
    });
});