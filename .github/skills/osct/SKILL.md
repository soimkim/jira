---
name: osct
description: CLM Jira OSCT 프로젝트의 이슈를 읽기 전용으로 조회한다. 내 담당 이슈, Reopen 또는 In Review 상태 목록 요청에 사용한다.
argument-hint: 조회할 이슈 조건 (예: 내가 assignee인 Reopen 또는 In Review 이슈)
disable-model-invocation: false
---

# CLM OSCT 조회

- 별칭은 `osct`, 기본 프로젝트는 `OSCT`다. `osc`와 혼동하지 않는다.
- 프로젝트 UI: http://clm.lge.com/issue/projects/OSCT/
- 환경변수 접두사: `JIRA_CLM_OSCT`.
- [공통 조회 절차](../../../jira-workflow.md)를 읽고 수행한다.
- CLI 진입점: [src/index.ts](../../../src/index.ts).