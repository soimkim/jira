---
name: harmony
description: Harmony Jira OSC 프로젝트 이슈를 읽기 전용으로 조회한다. CLM OSC와 별도 서버와 토큰을 사용하는 요청에 사용한다.
argument-hint: 조회할 이슈 조건 (예: 내가 assignee인 Open 이슈)
disable-model-invocation: true
---

# Harmony OSC 조회

- 별칭은 `harmony`, 기본 프로젝트는 `OSC`다.
- 사용자가 지정한 UI: https://harmony.lge.com:8443/issue/browse/OSC
- 위 URL의 `OSC`는 프로젝트 키로 취급한다. 개별 이슈 링크는 `/browse/OSC-123` 형태다.
- 환경변수 접두사: `JIRA_HARMONY_OSC`.
- [공통 조회 절차](../../../jira-workflow.md)를 읽고 수행한다.
- CLI 진입점: [src/index.ts](../../../src/index.ts).