import { startApp } from './app';

startApp().then(result => console.log(result)).catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : 'Jira 조회 중 오류가 발생했습니다.');
	process.exitCode = 1;
});