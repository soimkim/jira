# My Jira Skill

This project is a skill designed to handle Jira inquiries, specifically allowing users to list issues where they are the assignee. It utilizes a command-based interface to interact with the Jira API and retrieve relevant information.

## Project Structure

```
my-jira-skill
├── src
│   ├── app.ts                # Main entry point of the application
│   ├── index.ts              # Starting point for executing the application logic
│   ├── commands              # Contains command handlers
│   │   └── jira.ts           # Command handler for Jira inquiries
│   ├── handlers              # Contains inquiry handlers
│   │   ├── jiraInquiryHandler.ts # Handles Jira inquiries
│   │   └── index.ts          # Exports all handlers
│   ├── services              # Contains services for interacting with APIs
│   │   ├── jiraService.ts    # Service for Jira API interactions
│   │   └── index.ts          # Exports all services
│   ├── types                 # Contains TypeScript types and interfaces
│   │   ├── jira.ts           # Types related to Jira issues
│   │   └── index.ts          # Exports all types
│   └── utils                 # Utility functions
│       ├── logger.ts         # Logging utility
│       └── parser.ts         # Command parsing utility
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore file
├── package.json              # npm configuration file
├── tsconfig.json             # TypeScript configuration file
├── README.md                 # Project documentation
└── jest.config.js            # Jest configuration file
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd my-jira-skill
   ```

2. **Install dependencies:**
   # Jira Inquiry Skills

   VS Code Copilot Agent 채팅에서 Jira 이슈를 조회하는 공유용 Skill + TypeScript CLI입니다. 이슈 생성·수정·삭제는 지원하지 않습니다.

   ## 조회 대상

   | 채팅 명령 | 서버 base URL | 기본 프로젝트 | 환경변수 접두사 |
   | --- | --- | --- | --- |
   | `/osc` | `http://clm.lge.com/issue` | `OSC` | `JIRA_CLM_OSC` |
   | `/osct` | `http://clm.lge.com/issue` | `OSCT` | `JIRA_CLM_OSCT` |
   | `/harmony` | `https://harmony.lge.com:8443/issue` | `OSC` | `JIRA_HARMONY_OSC` |

   CLM은 같은 서버의 서로 다른 두 프로젝트이고, Harmony는 별도 서버입니다. 세 별칭은 토큰/인증 방식을 각각 설정합니다. CLM 두 프로젝트에 같은 토큰을 쓸 수 있는지는 서버 권한에 달려 있습니다.

   원본 UI 주소:
   - http://clm.lge.com/issue/projects/OSCT/
   - http://clm.lge.com/issue/projects/OSC
   - https://harmony.lge.com:8443/issue/browse/OSC

   API에는 `/projects/OSCT`나 `/browse/OSC`가 아닌 base URL을 사용합니다. Jira Server/Data Center의 `/rest/api/2/search`를 가정하며, 실제 사내 서버의 API 및 인증 지원은 관리자가 확인해야 합니다. Harmony의 `/browse/OSC`는 개별 이슈 키가 아니므로 결과 링크는 `/browse/OSC-123` 형태로 만듭니다.

   ## 처음 사용하는 사용자

   1. Node.js 22 이상과 npm을 설치하고, 저장소 전체를 로컬로 받아 VS Code에서 엽니다.
   2. 저장소 루트에서 `npm ci`로 의존성을 설치합니다. lockfile을 새로 생성하는 개발 단계에서는 `npm install`을 사용합니다.
   3. `.env.example`에서 **사용할 별칭의 섹션만** `~/.env`에 병합하고 토큰을 입력합니다. 기존 `~/.env`를 덮어쓰지 마세요. 프로젝트의 `.env`는 자동으로 읽지 않습니다.
   4. `~/.env` 파일 권한은 소유자만 읽고 쓸 수 있도록 제한하세요(macOS/Linux: `chmod 600 ~/.env`). 실제 파일은 공유하지 않습니다.
   5. VS Code Copilot의 Agent 모드에서 `/`를 입력하고 `osc`, `osct`, `harmony` Skill을 선택합니다. Skill slash 명령을 지원하는 최신 VS Code/Copilot이 필요합니다. 표시되지 않으면 Chat의 사용자 지정/Skills 화면에서 검색 여부를 확인하고 창을 다시 로드하세요. 터미널 실행 도구와 필요한 실행 승인이 있어야 API를 호출할 수 있습니다.

   다른 환경 파일은 프로세스 환경변수 `JIRA_ENV_FILE`로 지정할 수 있습니다. 절대 경로 또는 `~/...`를 권장합니다. 이미 설정된 프로세스 환경변수가 파일보다 우선합니다. 예시 파일의 토큰 자리표시자는 실제 인증정보로 취급하지 않습니다.

   ### 인증 및 네트워크

   - 기본 `AUTH_TYPE=bearer`: Jira Server/Data Center PAT를 Authorization Bearer로 전송합니다.
   - `AUTH_TYPE=basic`: `USERNAME`(서버가 요구하는 사용자명 또는 이메일)과 `TOKEN`을 Basic 인증으로 전송합니다. 실제 허용 방식은 관리자에게 확인하세요. 이메일이 항상 필요한 것은 아닙니다.
   - **CLM의 제공 주소는 HTTP입니다.** 토큰이 평문으로 노출되므로 기본적으로 차단합니다. 관리자에게 HTTPS 주소를 확인해 URL을 바꾸는 것을 권장합니다. 신뢰할 수 있는 네트워크에서 위험을 명시적으로 수용하는 경우에만 해당 별칭의 `ALLOW_HTTP=true`를 설정하세요. Skill은 이를 자동 변경하지 않습니다.
   - 사내망/VPN과 Jira 프로젝트 조회 권한이 필요합니다. SSO 페이지 리다이렉트에는 토큰을 전달하지 않습니다. TLS 검증은 유지하며, 사내 CA는 `NODE_EXTRA_CA_CERTS`로 설정하세요.
   - 토큰은 `.env.example`, 채팅, 로그, Git에 넣지 않습니다. CLI는 원본 Axios 오류나 인증 헤더를 출력하지 않습니다.

   ## 채팅 문구 예시

   - `/osc 내가 assignee인 이슈 목록 보여줘`
   - `/osct 내가 어싸이니인 이슈 중 status: Reopen 또는 In Review인 것 리스트업해줘`
   - `/osct 내가 assignee인 이슈 중 reopen 또는 in reivew인 것 보여줘`
   - `/harmony 내가 담당자인 이슈 중 Open 또는 In Progress인 것 보여줘`
   - `/osc assignee:hong.gildong인 이슈 중 Reopen 상태 목록 보여줘`

   Skill이 자연어를 JQL로 해석하고 로컬 CLI를 실행합니다. “나”는 Jira 토큰으로 인증된 사용자(`currentUser()`)를 뜻합니다. 임의 상태명/복잡한 조건이 모호하면 먼저 확인합니다. 데이터는 실제 API 조회 결과만 표시합니다.

   ## CLI 사용

   일반 조회는 `npm start -- "/osc 내가 assignee인 이슈 목록 보여줘"`처럼 실행합니다. 도움말은 `npm start -- --help`입니다.

   고급 조회는 `npm start -- --jql osct 'assignee = currentUser() AND status IN ("Reopen", "In Review")'`를 사용합니다. 프로젝트와 정렬은 자동 추가됩니다. `--jql`에는 ORDER BY 없는 필터만 넣습니다. JQL은 신뢰할 수 있는 입력만 사용하세요.

   내장 자연어 파서는 담당자(“내가” 또는 명시적 `assignee:사용자`)와 일부 상태(Reopen, In Review, Open, In Progress, Resolved, Closed, Done, To Do) 목록만 지원합니다. 제외 조건은 거부합니다. 완전한 자연어 해석기는 아니므로 복잡한 조건은 Skill 또는 `--jql`을 사용하세요. 상태명은 Jira 워크플로의 실제 이름과 일치해야 합니다.

   검색은 페이지 단위로 최대 1000건까지 조회하며 전체/표시 건수를 출력합니다. API 요청 제한 시간은 페이지당 30초입니다. 잘린 목록에는 제한 안내를 표시합니다.

   ## 구조와 공유

   - `.github/skills/osc/SKILL.md`: `/osc` Skill
   - `.github/skills/osct/SKILL.md`: `/osct` Skill
   - `.github/skills/harmony/SKILL.md`: `/harmony` Skill
   - `jira-workflow.md`: 공통 Agent 실행/보안 절차
   - `src/config/env.ts`: 홈 환경변수 로딩과 별칭별 설정 검증
   - `src/utils/parser.ts`: 제한적 자연어 파서와 JQL 생성
   - `src/services/jiraService.ts`: 조회 전용 REST API, 인증, 페이지 처리
   - `.env.example`: 실제 비밀값이 없는 템플릿

   다른 사용자에게는 저장소 전체(숨김 폴더 `.github` 포함)를 전달하세요. **Skill 폴더만 복사하면 공통 문서와 CLI가 없어 동작하지 않습니다.** 각 사용자는 자신의 `~/.env`와 Jira 권한을 설정해야 합니다. 다른 저장소에서 쓰려면 전체 도구 설치 경로와 Skill의 상대 링크/CLI 실행 경로를 함께 조정해야 합니다.

   검증은 `npm run typecheck`, `npm test`, `npm run build`로 수행합니다. 빌드 후에는 `node dist/index.js --help`로 실행할 수 있습니다. 테스트는 Jira API를 모의 처리하며 실제 사내 서버나 토큰을 사용하지 않습니다.

   의존성 점검 시 운영 패키지(`npm audit --omit=dev`)에는 경고가 없었습니다. 테스트 도구 Jest의 하위 `deepmerge` 의존성에는 낮은 등급 경고가 남아 있습니다. 이를 이유로 `npm audit fix --force`로 구버전 Jest로 강제 변경하지 말고, 후속 패치와 조직 보안 정책을 확인하세요.