// 中国象棋完整自动化测试运行脚本
// 此脚本整合测试生成、执行和分析功能

import {spawn} from 'child_process';
import fs from 'fs';
import path from 'path';

// 运行测试的函数
function runPlaywrightTest(testPath) {
	return new Promise((resolve, reject) => {
		console.log(`开始运行测试: ${testPath}`);

		const testProcess = spawn('node', [
			path.join(process.cwd(), 'scripts/run-qunit-playwright.js'),
			testPath,
		], {
			cwd: process.cwd(),
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		testProcess.stdout.on('data', data => {
			stdout += data.toString();
			process.stdout.write(data);
		});

		testProcess.stderr.on('data', data => {
			stderr += data.toString();
			process.stderr.write(data);
		});

		testProcess.on('close', code => {
			console.log(`测试进程退出，退出码: ${code}`);
			resolve({code, stdout, stderr});
		});

		testProcess.on('error', error => {
			console.error('运行测试时出错:', error);
			reject(error);
		});
	});
}

// 主函数
async function main() {
	try {
		// 确保在项目根目录运行
		const projectRoot = path.resolve('d:/工具兽/静态页面工具');
		process.chdir(projectRoot);

		console.log("开始中国象棋自动化测试流程");

		// 运行中国象棋测试
		const testPath = '游戏/中国象棋/xiangqi-test.html';
		const result = await runPlaywrightTest(testPath);

		// 分析结果
		if (result.code === 0) {
			console.log("所有测试通过!");
		} else {
			console.log("测试失败，开始分析结果...");

			// 查找生成的测试结果文件
			const testResultsDir = path.join(projectRoot, '测试结果');
			const testResultFiles = fs.readdirSync(testResultsDir)
																.filter(file => file.includes('xiangqi') && file.endsWith('-test-result.json'))
																.sort((a, b) => {
																	// 按修改时间排序，获取最新的
																	const aStat = fs.statSync(path.join(testResultsDir, a));
																	const bStat = fs.statSync(path.join(testResultsDir, b));
																	return bStat.mtime - aStat.mtime;
																});

			if (testResultFiles.length > 0) {
				const latestResultFile = path.join(testResultsDir, testResultFiles[0]);
				console.log(`最新测试结果文件: ${latestResultFile}`);

				// 运行自动修复工具
				console.log("启动自动修复流程...");
				const {default: XiangqiAutoFixer} = await import('./auto-fix.js');
				const fixer = new XiangqiAutoFixer();
				await fixer.runAutoFix(latestResultFile);
			} else {
				console.log("未找到测试结果文件");
			}
		}

		process.exit(result.code || 0);
	} catch (error) {
		console.error("运行自动化测试时出错:", error);
		process.exit(1);
	}
}

// 如果直接运行此脚本
if (typeof window === 'undefined' && require.main === module) {
	main();
}

export default main;