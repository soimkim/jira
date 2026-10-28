import { jiraCommandHandler, jiraJqlHandler } from './commands/jira';
import { loadEnvironment } from './config/env';

export const usage = [
    'Jira 조회 전용 CLI',
    'npm start -- "/osct 내가 assignee인 이슈 중 status: Reopen 또는 In Review 리스트업해줘"',
    'npm start -- --jql osct \'assignee = currentUser() AND status IN ("Reopen", "In Review")\'',
    '환경변수: 기본 ~/.env, 다른 경로는 JIRA_ENV_FILE로 지정',
].join('\n');

export async function startApp(args: string[] = process.argv.slice(2)): Promise<string> {
    if (!args.length || args[0] === '--help' || args[0] === '-h') return usage;
    loadEnvironment();
    if (args[0] === '--jql') {
        if (args.length !== 3) throw new Error('사용법: --jql <osc|osct|harmony> <따옴표로 감싼 필터>');
        return jiraJqlHandler(args[1], args[2]);
    }
    return jiraCommandHandler(args.join(' '));
}