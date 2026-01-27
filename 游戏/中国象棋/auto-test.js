// 中国象棋自动化测试生成器
// 此脚本用于生成中国象棋的测试用例

import { 
  中国象棋, 
  默认棋子类型,
  默认棋盘布局,
  红方玩家id,
  黑方玩家id
} from './xiangqi.esm.js';

class XiangqiAutoTester {
  constructor() {
    this.game = null;
    this.testCases = [];
  }

  // 初始化游戏
  initGame(customBoard = null) {
    const config = {
      棋盘: customBoard || 默认棋盘布局,
      棋子类型: 默认棋子类型,
      玩家顺序: [红方玩家id, 黑方玩家id]
    };
    
    this.game = new 中国象棋(config);
    return this.game.newGaming();
  }

  // 生成基本移动测试用例
  generateMoveTestCases() {
    const testCases = [];
    const gaming = this.initGame();
    const battlefield = gaming.battlefield;
    
    // 遍历棋盘上的所有棋子
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 9; c++) {
        const position = battlefield.positions[r-1][c-1];
        const units = battlefield.getUnitsAt(position);
        
        if (units.length > 0) {
          const unit = units[0];
          // 获取该棋子的所有技能
          unit.skills.forEach(skill => {
            if (skill.availableTargets) {
              const targets = skill.availableTargets;
              if (targets && targets.length > 0) {
                testCases.push({
                  piece: unit.name,
                  position: { row: r, col: c },
                  skill: skill.name,
                  targets: targets.map(t => ({ row: t.rowNum, col: t.colNum }))
                });
              }
            }
          });
        }
      }
    }
    
    return testCases;
  }

  // 生成将军测试用例
  generateCheckTestCases() {
    // 这里可以添加一些典型的将军局面
    const checkScenarios = [
      // 示例：兵将军
      {
        name: "兵将军测试",
        board: `
          車馬象士将士象馬車
          空空空空空空空空空
          空砲空空空空空砲空
          卒空卒空卒空卒空卒
          空空空空空空空空空
          空空空空空空空空空
          兵空兵空兵空兵空兵
          空炮空空空空空炮空
          空空空空将空空空空
          车马相仕帅仕相马车
        `,
        expected: "红方兵可以将军"
      }
    ];
    
    return checkScenarios;
  }

  // 生成胜负判断测试用例
  generateWinLoseTestCases() {
    const winLoseScenarios = [
      // 将死局面
      {
        name: "将死测试",
        board: `
          車馬象士将士象馬車
          空空空空空空空空空
          空砲空空空空空砲空
          卒空卒空卒空卒空卒
          空空空空空空空空空
          空空空空空空空空空
          兵空兵空兵空兵空兵
          空炮空空空空空炮空
          空空空空空空空空车
          车马相仕将仕相马车
        `,
        move: { from: { row: 9, col: 9 }, to: { row: 10, col: 5 } },
        expected: "红方车移动后将死黑方"
      }
    ];
    
    return winLoseScenarios;
  }

  // 生成所有测试用例
  generateAllTestCases() {
    const allTests = {
      moveTests: this.generateMoveTestCases(),
      checkTests: this.generateCheckTestCases(),
      winLoseTests: this.generateWinLoseTestCases()
    };
    
    return allTests;
  }

  // 保存测试用例到文件
  saveTestCases(testCases, filename) {
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(testCases, null, 2));
    console.log(`测试用例已保存到: ${outputPath}`);
  }
}

// 如果直接运行此脚本
if (typeof window === 'undefined' && require.main === module) {
  const tester = new XiangqiAutoTester();
  const testCases = tester.generateAllTestCases();
  
  console.log("生成的测试用例:");
  console.log(JSON.stringify(testCases, null, 2));
  
  // 保存测试用例
  tester.saveTestCases(testCases, 'generated-test-cases.json');
}

export default XiangqiAutoTester;