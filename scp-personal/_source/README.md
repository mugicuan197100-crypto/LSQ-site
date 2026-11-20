# 个人 SCP 维基 · 源文件说明

最终交付物只有一个文件：

```
..\scp-personal-wiki.html      ← 直接双击打开即可使用
```

本目录只是便于二次修改的源文件，日常使用与分发都不需要它们。

## 目录

| 文件 | 说明 |
| --- | --- |
| `index.template.html` | 模板：完整的 HTML + CSS + JS，图片位置写成 `__BODY_BG__` 之类的占位符 |
| `assets/` | Sigma-9 主题素材：页面顶部底纹、SCP 标志、侧栏小图标 |
| `build.ps1` | 把 `assets` 里的图片转成 base64，替换占位符，输出单文件 HTML |
| `build.cmd` | 双击运行的批处理封装（绕过 PowerShell 执行策略） |

## 重新构建

```powershell
# 方式一：双击 build.cmd
# 方式二：
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

输出会写到上一级的 `scp-personal-wiki.html`，并覆盖同名文件。

## 数据说明

页面内容保存在浏览器的 `localStorage`（键名 `scp-personal-wiki-v1`）里，
不依赖本目录中的任何文件。换电脑或清理浏览器数据前，请用页面里的
「工具 → 导出备份」保存 JSON 备份。

## 素材版权

版式来自 SCP 基金会中文分部使用的 **Sigma-9** 主题
（Aelanna 设计，Dr Devan、MScarlet、Sekai_s 等维护），
遵循 CC BY-SA 3.0。SCP 标志与侧栏图标版权归 SCP 基金会及其作者所有，
此处仅用于个人学习与致敬。

## 发布到 GitHub Pages

`..\github-pages\` 是可直接上传的发布包：

- `index.html`：与根目录的单文件相同
- `content.json`：线上发布内容，新访客首次打开时自动载入
- `.nojekyll`：禁用 Jekyll
- `README.md`：部署步骤与更新流程

日常更新流程：在站内编辑 → 工具 → 导出备份 → 把 JSON 重命名为
`content.json` → 在 GitHub 覆盖上传。老访客可用「工具 → 从线上内容刷新」同步。