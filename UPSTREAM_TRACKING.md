# 上游项目追踪与更新策略

本项目整合了两个上游项目的功能：
- **Repository A**: deep-research (通用研究平台)
- **Repository B**: DeepGeneResearch (专业基因研究平台)

本文档描述如何追踪上游更新并将其移植到本项目。

---

## 1. 上游项目信息

### Repository A: deep-research
- **GitHub**: https://github.com/[original-repo]/deep-research
- **集成内容**: 核心研究流程、UI 框架、通用搜索
- **集成方式**: 作为主代码库基础
- **集成范围**:
  - `src/hooks/useDeepResearch.ts` - 研究流程
  - `src/components/` - UI 组件
  - `src/utils/deep-research/` - 通用研究工具
  - `src/store/` - 状态管理

### Repository B: DeepGeneResearch
- **GitHub**: https://github.com/Scilence2022/DeepGeneResearch
- **集成内容**: 基因研究专业功能
- **集成方式**: 作为专业模式模块集成
- **集成范围**:
  - `src/utils/gene-research/` - 专业研究模块
  - `src/types/gene-research.ts` - 专业类型定义
  - `src/constants/gene-research-prompts.ts` - 专业提示词
  - `src/components/Professional/` - 专业模式 UI
  - `src/store/mode.ts` - 模式切换

---

## 2. 追踪策略

### 方案 A：Git Remote 追踪（推荐）⭐

**优点**：
- 自动化程度高
- 可以精确看到上游变更
- 支持选择性合并
- 保留完整的 git 历史

**实现步骤**：

```bash
# 1. 添加上游仓库为 remote
git remote add upstream-deep-research https://github.com/[original]/deep-research.git
git remote add upstream-gene-research https://github.com/Scilence2022/DeepGeneResearch.git

# 2. 获取上游更新（定期执行）
git fetch upstream-deep-research
git fetch upstream-gene-research

# 3. 查看上游变更
git log HEAD..upstream-deep-research/main --oneline
git log HEAD..upstream-gene-research/main --oneline

# 4. 对比上游变更的具体文件
git diff HEAD..upstream-deep-research/main -- src/hooks/
git diff HEAD..upstream-gene-research/main -- src/utils/

# 5. 选择性合并（推荐使用 cherry-pick）
# 先创建临时分支
git checkout -b merge-upstream-updates

# 查看要合并的提交
git log upstream-deep-research/main --oneline -10

# 选择性 cherry-pick 需要的提交
git cherry-pick <commit-hash>

# 或者合并整个分支（需要解决冲突）
git merge upstream-deep-research/main
```

**定期执行**（建议每周或每月）：
```bash
#!/bin/bash
# 文件: scripts/check-upstream-updates.sh

echo "=== Checking upstream updates ==="

# Fetch updates
git fetch upstream-deep-research
git fetch upstream-gene-research

# Check for new commits in deep-research
echo ""
echo "📦 deep-research updates:"
NEW_COMMITS_DR=$(git log HEAD..upstream-deep-research/main --oneline | wc -l)
if [ $NEW_COMMITS_DR -gt 0 ]; then
  echo "✨ $NEW_COMMITS_DR new commits found!"
  git log HEAD..upstream-deep-research/main --oneline -5
else
  echo "✅ No new commits"
fi

# Check for new commits in DeepGeneResearch
echo ""
echo "🧬 DeepGeneResearch updates:"
NEW_COMMITS_GR=$(git log HEAD..upstream-gene-research/main --oneline | wc -l)
if [ $NEW_COMMITS_GR -gt 0 ]; then
  echo "✨ $NEW_COMMITS_GR new commits found!"
  git log HEAD..upstream-gene-research/main --oneline -5
else
  echo "✅ No new commits"
fi

echo ""
echo "=== Summary ==="
echo "deep-research: $NEW_COMMITS_DR new commits"
echo "DeepGeneResearch: $NEW_COMMITS_GR new commits"
```

---

### 方案 B：GitHub Actions 自动监控

创建自动化工作流，当上游有更新时发送通知：

```yaml
# .github/workflows/upstream-monitor.yml
name: Monitor Upstream Updates

on:
  schedule:
    # 每天运行一次
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  check-upstream:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Add upstream remotes
        run: |
          git remote add upstream-dr https://github.com/[original]/deep-research.git || true
          git remote add upstream-gr https://github.com/Scilence2022/DeepGeneResearch.git || true

      - name: Fetch upstream updates
        run: |
          git fetch upstream-dr
          git fetch upstream-gr

      - name: Check for updates
        id: check
        run: |
          DR_COUNT=$(git log HEAD..upstream-dr/main --oneline | wc -l)
          GR_COUNT=$(git log HEAD..upstream-gr/main --oneline | wc -l)

          echo "dr_count=$DR_COUNT" >> $GITHUB_OUTPUT
          echo "gr_count=$GR_COUNT" >> $GITHUB_OUTPUT

          if [ $DR_COUNT -gt 0 ] || [ $GR_COUNT -gt 0 ]; then
            echo "has_updates=true" >> $GITHUB_OUTPUT
          fi

      - name: Create issue for updates
        if: steps.check.outputs.has_updates == 'true'
        uses: actions/github-script@v6
        with:
          script: |
            const drCount = '${{ steps.check.outputs.dr_count }}';
            const grCount = '${{ steps.check.outputs.gr_count }}';

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🔄 Upstream updates available`,
              body: `## Upstream Updates Detected

📦 **deep-research**: ${drCount} new commits
🧬 **DeepGeneResearch**: ${grCount} new commits

### Next Steps
1. Review upstream changes
2. Run \`git fetch upstream-dr && git fetch upstream-gr\`
3. Review commits: \`git log HEAD..upstream-dr/main\`
4. Cherry-pick or merge relevant updates

### Automated Check
This issue was created automatically by the upstream monitor workflow.`,
              labels: ['upstream-update', 'maintenance']
            });
```

---

### 方案 C：手动定期检查

**适用场景**：上游更新不频繁

**检查清单**（每月执行）：

```markdown
## 月度上游更新检查清单

### 1. deep-research 检查
- [ ] 访问 https://github.com/[original]/deep-research/commits/main
- [ ] 记录最后检查的 commit hash: `__________`
- [ ] 查看新的 commits，识别重要更新
- [ ] 特别关注的文件：
  - [ ] `src/hooks/useDeepResearch.ts`
  - [ ] `src/utils/deep-research/`
  - [ ] `package.json` (依赖更新)
  - [ ] `README.md` (功能说明)

### 2. DeepGeneResearch 检查
- [ ] 访问 https://github.com/Scilence2022/DeepGeneResearch/commits/main
- [ ] 记录最后检查的 commit hash: `__________`
- [ ] 查看新的 commits，识别重要更新
- [ ] 特别关注的文件：
  - [ ] `src/utils/gene-research/`
  - [ ] `src/types/gene-research.ts`
  - [ ] `src/constants/gene-research-prompts.ts`

### 3. 评估和移植
- [ ] 评估更新的重要性（bug 修复 > 新功能 > 优化）
- [ ] 创建移植分支：`git checkout -b upstream-merge-YYYY-MM`
- [ ] 应用更新
- [ ] 测试功能
- [ ] 提交并合并
```

---

## 3. 移植策略

### 3.1 文件映射表

了解上游文件在本项目中的位置：

| 上游项目 | 上游文件路径 | 本项目路径 | 备注 |
|---------|------------|-----------|------|
| deep-research | `src/hooks/useDeepResearch.ts` | `src/hooks/useDeepResearch.ts` | **已修改** - 添加了专业模式支持 |
| deep-research | `src/components/` | `src/components/` | 部分修改 - 添加了模式选择器 |
| deep-research | `src/utils/deep-research/` | `src/utils/deep-research/` | 未修改 - 可直接更新 |
| DeepGeneResearch | `src/utils/gene-research/` | `src/utils/gene-research/` | 未修改 - 可直接更新 |
| DeepGeneResearch | `src/types/gene-research.ts` | `src/types/gene-research.ts` | 未修改 - 可直接更新 |
| DeepGeneResearch | `src/constants/gene-research-prompts.ts` | `src/constants/gene-research-prompts.ts` | 未修改 - 可直接更新 |

### 3.2 冲突解决策略

**关键修改文件**（可能有冲突）：
1. `src/hooks/useDeepResearch.ts` - 添加了专业模式集成
2. `src/components/Research/Topic.tsx` - 添加了模式选择器和专业输入
3. `src/store/task.ts` - 可能添加了新字段

**冲突解决步骤**：
```bash
# 1. 合并时遇到冲突
git merge upstream-deep-research/main
# 输出: CONFLICT in src/hooks/useDeepResearch.ts

# 2. 查看冲突
git diff --name-only --diff-filter=U

# 3. 手动解决冲突
# 打开冲突文件，保留：
# - 上游的 bug 修复和优化
# - 本项目的专业模式集成代码

# 4. 标记为已解决
git add src/hooks/useDeepResearch.ts

# 5. 完成合并
git commit
```

### 3.3 安全移植流程

```bash
# 1. 创建专门的移植分支
git checkout -b upstream-merge-$(date +%Y%m%d)

# 2. 备份当前状态
git tag backup-before-merge-$(date +%Y%m%d)

# 3. 分步骤移植
# 3.1 先移植不会冲突的文件（DeepGeneResearch 模块）
git checkout upstream-gene-research/main -- src/utils/gene-research/
git checkout upstream-gene-research/main -- src/types/gene-research.ts

# 3.2 测试
npm run build
npm run test  # 如果有测试

# 3.3 提交
git commit -m "chore: Update gene-research modules from upstream"

# 3.4 再移植 deep-research 的更新（可能有冲突）
git merge upstream-deep-research/main
# 解决冲突...

# 4. 全面测试
npm run build
npm run dev  # 手动测试功能

# 5. 合并到主分支
git checkout main
git merge upstream-merge-$(date +%Y%m%d)
```

---

## 4. 自动化脚本

### 4.1 更新检查脚本

创建 `scripts/check-upstream.sh`:

```bash
#!/bin/bash
# 检查上游更新

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Upstream Update Checker ===${NC}\n"

# Check if remotes exist
if ! git remote | grep -q upstream-dr; then
    echo -e "${YELLOW}Adding upstream-dr remote...${NC}"
    git remote add upstream-dr https://github.com/[original]/deep-research.git
fi

if ! git remote | grep -q upstream-gr; then
    echo -e "${YELLOW}Adding upstream-gr remote...${NC}"
    git remote add upstream-gr https://github.com/Scilence2022/DeepGeneResearch.git
fi

# Fetch updates
echo -e "${GREEN}Fetching upstream updates...${NC}"
git fetch upstream-dr --quiet
git fetch upstream-gr --quiet

# Check deep-research
echo -e "\n${GREEN}📦 deep-research updates:${NC}"
DR_COMMITS=$(git log HEAD..upstream-dr/main --oneline)
DR_COUNT=$(echo "$DR_COMMITS" | grep -c . || echo 0)

if [ "$DR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}✨ $DR_COUNT new commits:${NC}"
    echo "$DR_COMMITS" | head -5

    # Show changed files
    echo -e "\n${YELLOW}Changed files:${NC}"
    git diff --name-only HEAD..upstream-dr/main | head -10
else
    echo -e "${GREEN}✅ No new commits${NC}"
fi

# Check DeepGeneResearch
echo -e "\n${GREEN}🧬 DeepGeneResearch updates:${NC}"
GR_COMMITS=$(git log HEAD..upstream-gr/main --oneline)
GR_COUNT=$(echo "$GR_COMMITS" | grep -c . || echo 0)

if [ "$GR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}✨ $GR_COUNT new commits:${NC}"
    echo "$GR_COMMITS" | head -5

    # Show changed files
    echo -e "\n${YELLOW}Changed files:${NC}"
    git diff --name-only HEAD..upstream-gr/main | head -10
else
    echo -e "${GREEN}✅ No new commits${NC}"
fi

# Summary
echo -e "\n${GREEN}=== Summary ===${NC}"
echo -e "deep-research: ${YELLOW}$DR_COUNT${NC} new commits"
echo -e "DeepGeneResearch: ${YELLOW}$GR_COUNT${NC} new commits"

if [ "$DR_COUNT" -gt 0 ] || [ "$GR_COUNT" -gt 0 ]; then
    echo -e "\n${YELLOW}💡 To merge updates:${NC}"
    echo "  git checkout -b upstream-merge-$(date +%Y%m%d)"
    echo "  git merge upstream-dr/main  # or upstream-gr/main"
fi
```

### 4.2 半自动移植脚本

创建 `scripts/merge-upstream.sh`:

```bash
#!/bin/bash
# 半自动移植上游更新

set -e

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <deep-research|gene-research>"
    exit 1
fi

UPSTREAM=$1
BRANCH_NAME="upstream-merge-$(date +%Y%m%d)-$UPSTREAM"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Upstream Merge Tool ===${NC}\n"

# Create backup tag
BACKUP_TAG="backup-before-merge-$(date +%Y%m%d-%H%M%S)"
echo -e "${YELLOW}Creating backup tag: $BACKUP_TAG${NC}"
git tag $BACKUP_TAG

# Create merge branch
echo -e "${YELLOW}Creating branch: $BRANCH_NAME${NC}"
git checkout -b $BRANCH_NAME

# Fetch upstream
if [ "$UPSTREAM" = "deep-research" ]; then
    REMOTE="upstream-dr"
elif [ "$UPSTREAM" = "gene-research" ]; then
    REMOTE="upstream-gr"
else
    echo "Invalid upstream: $UPSTREAM"
    exit 1
fi

echo -e "${YELLOW}Fetching $REMOTE...${NC}"
git fetch $REMOTE

# Show what will be merged
echo -e "\n${GREEN}Changes to be merged:${NC}"
git log HEAD..$REMOTE/main --oneline -10

# Ask for confirmation
read -p "Continue with merge? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Merge cancelled"
    git checkout -
    git branch -D $BRANCH_NAME
    exit 0
fi

# Perform merge
echo -e "${YELLOW}Merging $REMOTE/main...${NC}"
if git merge $REMOTE/main; then
    echo -e "${GREEN}✅ Merge successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Conflicts detected. Please resolve manually.${NC}"
    echo -e "After resolving conflicts:"
    echo "  git add <resolved-files>"
    echo "  git commit"
    echo "  npm run build"
    echo "  git checkout main"
    echo "  git merge $BRANCH_NAME"
    exit 1
fi

# Test build
echo -e "\n${YELLOW}Testing build...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Build failed. Please fix issues.${NC}"
    exit 1
fi

echo -e "\n${GREEN}=== Merge Summary ===${NC}"
echo "Branch: $BRANCH_NAME"
echo "Backup tag: $BACKUP_TAG"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Test the application: npm run dev"
echo "2. If everything works:"
echo "   git checkout main"
echo "   git merge $BRANCH_NAME"
echo "   git push"
echo "3. If there are issues:"
echo "   git checkout main"
echo "   git branch -D $BRANCH_NAME"
echo "   git reset --hard $BACKUP_TAG"
```

---

## 5. 最佳实践

### 5.1 更新频率建议

- **每周检查**：运行 `scripts/check-upstream.sh`
- **每月移植**：如果有重要更新，执行移植
- **紧急修复**：上游有 critical bug fix 时立即移植

### 5.2 测试清单

移植更新后必须测试：

```markdown
## 移植后测试清单

### 基础功能
- [ ] 构建成功：`npm run build`
- [ ] 开发服务器启动：`npm run dev`
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告

### 通用模式
- [ ] 提交普通研究问题
- [ ] 生成研究问题
- [ ] 生成研究计划
- [ ] 执行搜索任务
- [ ] 生成最终报告

### 专业模式
- [ ] 切换到专业模式
- [ ] 提交基因研究请求
- [ ] 专业查询生成
- [ ] 生物数据库搜索
- [ ] 数据提取和质量评估
- [ ] 生成专业报告

### 集成功能
- [ ] Continue Research 只重试失败的任务
- [ ] 模式切换正常
- [ ] 数据持久化正常
```

### 5.3 版本标记

每次成功移植上游更新后，打标签：

```bash
# 格式: upstream-merge-YYYY-MM-DD
git tag -a upstream-merge-2025-01-07 -m "Merged updates from deep-research and DeepGeneResearch"
git push --tags
```

---

## 6. 应急回滚

如果移植导致问题：

```bash
# 1. 查看最近的备份标签
git tag | grep backup-before-merge

# 2. 回滚到备份点
git reset --hard backup-before-merge-20250107-143000

# 3. 或者只回滚到上一个 commit
git reset --hard HEAD~1

# 4. 强制推送（谨慎！）
git push --force origin main
```

---

## 7. 维护日志

记录每次上游更新：

| 日期 | 上游项目 | Commit Hash | 更新内容 | 移植状态 |
|------|---------|-------------|---------|---------|
| 2025-01-07 | - | - | 初始集成完成 | ✅ |
| | | | | |

---

## 总结

**推荐方案**：
1. **主要使用**：方案 A（Git Remote 追踪）+ 手动检查脚本
2. **辅助使用**：方案 B（GitHub Actions 自动通知）
3. **更新频率**：每周检查，每月移植
4. **关键原则**：
   - 总是先创建备份标签
   - 总是在新分支上移植
   - 总是先测试再合并
   - 保留详细的移植日志

这样可以确保及时获取上游更新，同时保持本项目的稳定性和定制化功能。
