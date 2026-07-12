# Agent skills

Installed via the [Skills CLI](https://skills.sh/) (`npx skills`) from two
official sources — `vercel-labs/agent-skills` and `anthropics/skills` — for
app-dev, UI/UX review, design, and marketing/writing work on this project.

`skills-lock.json` (repo root) records exactly what's installed. After a fresh
clone, restore the Claude Code integration (symlinks under `.claude/skills/`,
which is gitignored and machine-local) with:

```
npx skills experimental_install
```

To add more: `npx skills add <owner/repo> --skill <name> -y`. To see what's
installed: `npx skills list`.
