// Cookbook indexes contain user-owned prose and links; template upgrades only add missing entries.
export function mergeCookbookIndex(local, template) {
  const targets = new Set([...local.matchAll(/\]\(([^)\s]+\.md)\)/g)].map(m => m[1]))
  const missing = template.split('\n').filter(line => {
    const m = /^- \[[^\]]+\]\(([^)\s]+\.md)\)/.exec(line)
    return m && !targets.has(m[1])
  })
  return missing.length ? local.trimEnd() + '\n\n' + missing.join('\n') + '\n' : local
}
