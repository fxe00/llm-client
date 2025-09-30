#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取版本号
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../app/package.json'), 'utf8'));
const version = packageJson.version;

console.log(`🚀 准备发布版本 v${version}`);

// 检查是否有未提交的更改
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.error('❌ 有未提交的更改，请先提交所有更改');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 无法检查Git状态:', error.message);
  process.exit(1);
}

// 创建标签
try {
  console.log(`📝 创建标签 v${version}`);
  execSync(`git tag v${version}`, { stdio: 'inherit' });
  
  console.log(`📤 推送标签到远程仓库`);
  execSync(`git push origin v${version}`, { stdio: 'inherit' });
  
  console.log('✅ 标签创建成功！GitHub Actions 将自动开始构建和发布流程');
  console.log('🔗 查看构建进度: https://github.com/fxe00/llm-client/actions');
  
} catch (error) {
  console.error('❌ 创建标签失败:', error.message);
  process.exit(1);
}
