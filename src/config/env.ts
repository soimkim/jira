import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { JiraAlias, JiraConfig } from '../types/jira';

const prefixes: Record<JiraAlias, string> = {
    osc: 'JIRA_CLM_OSC', osct: 'JIRA_CLM_OSCT', harmony: 'JIRA_HARMONY_OSC',
};

const skillFiles: Record<JiraAlias, string> = {
    osc: resolve(__dirname, '../../.github/skills/osc/SKILL.md'),
    osct: resolve(__dirname, '../../.github/skills/osct/SKILL.md'),
    harmony: resolve(__dirname, '../../.github/skills/harmony/SKILL.md'),
};

function getSkillBaseUrl(alias: JiraAlias): string {
    const skill = readFileSync(skillFiles[alias], 'utf8');
    const match = /^\s*-\s*(?:프로젝트 UI|사용자가 지정한 UI):\s*(https?:\/\/\S+)/m.exec(skill);
    if (!match) throw new Error(`${alias} Skill에 Jira UI URL이 없습니다.`);

    let url: URL;
    try { url = new URL(match[1]); }
    catch { throw new Error(`${alias} Skill의 Jira UI URL이 올바르지 않습니다.`); }
    if (url.username || url.password || url.search || url.hash) {
        throw new Error(`${alias} Skill의 Jira UI URL에는 인증정보나 쿼리를 넣을 수 없습니다.`);
    }

    const basePath = /^(.*)\/(?:projects|browse)\/[^/]+\/?$/i.exec(url.pathname)?.[1];
    if (!basePath) throw new Error(`${alias} Skill의 Jira UI URL에서 Jira base URL을 확인할 수 없습니다.`);
    url.pathname = basePath || '/';
    return url.toString().replace(/\/+$/, '');
}

export function loadEnvironment(): void {
    const file = process.env.JIRA_ENV_FILE;
    const path = file
        ? file.startsWith('~/') ? join(homedir(), file.slice(2)) : resolve(file)
        : join(homedir(), '.env');
    const result = dotenv.config({ path });
    if (result.error && (result.error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error('환경변수 파일을 읽을 수 없습니다. 경로와 접근 권한을 확인하세요.');
    }
}

export function getJiraConfig(alias: JiraAlias): JiraConfig {
    const prefix = prefixes[alias];
    const required = (suffix: string): string => {
        const key = `${prefix}_${suffix}`;
        const value = process.env[key]?.trim();
        if (!value || value.startsWith('replace_with_')) throw new Error(`환경변수를 설정하세요: ${key}`);
        return value;
    };
    const baseUrl = getSkillBaseUrl(alias);
    if (new URL(baseUrl).protocol === 'http:' && process.env[`${prefix}_ALLOW_HTTP`] !== 'true') {
        throw new Error(`HTTP는 토큰을 평문 전송합니다. HTTPS를 사용하거나 위험을 확인한 뒤 ${prefix}_ALLOW_HTTP=true를 설정하세요.`);
    }
    const authType = process.env[`${prefix}_AUTH_TYPE`]?.trim() || 'bearer';
    if (authType !== 'bearer' && authType !== 'basic') throw new Error(`${prefix}_AUTH_TYPE은 bearer 또는 basic이어야 합니다.`);
    return {
        alias, baseUrl,
        projectKey: process.env[`${prefix}_PROJECT_KEY`]?.trim() || (alias === 'osct' ? 'OSCT' : 'OSC'),
        authType, token: required('TOKEN'),
        username: authType === 'basic' ? required('USERNAME') : undefined,
    };
}