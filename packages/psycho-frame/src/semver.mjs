// Strict SemVer precedence, shared by update notices and release preparation.
export function parseSemver(value) {
  if (typeof value !== 'string') return null
  const m = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value)
  if (!m || m[0] !== value || m.slice(1, 4).some(n => !Number.isSafeInteger(Number(n)))) return null
  const pre = m[4] ?? ''
  if (pre.split('.').some(n => /^0\d+$/.test(n))) return null
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), pre, build: m[5] ?? '' }
}
export function compareSemver(a, b) {
  const x = parseSemver(a), y = parseSemver(b)
  if (!x || !y) throw new TypeError('非法 SemVer 版本')
  for (const key of ['major', 'minor', 'patch']) if (x[key] !== y[key]) return x[key] < y[key] ? -1 : 1
  if (x.pre === y.pre) return 0
  if (!x.pre) return 1
  if (!y.pre) return -1
  const aa = x.pre.split('.'), bb = y.pre.split('.')
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    if (aa[i] === undefined) return -1
    if (bb[i] === undefined) return 1
    if (aa[i] === bb[i]) continue
    const an = /^\d+$/.test(aa[i]), bn = /^\d+$/.test(bb[i])
    if (an && bn) return BigInt(aa[i]) < BigInt(bb[i]) ? -1 : 1
    if (an !== bn) return an ? -1 : 1
    return aa[i] < bb[i] ? -1 : 1
  }
  return 0
}
export function bumpVersion(current, type) {
  const cur = parseSemver(current)
  if (!cur) throw new TypeError('当前版本不是合法 SemVer')
  let { major, minor, patch, pre } = cur
  switch (type) {
    case 'major': if (!pre || minor || patch) major++; minor = patch = 0; pre = ''; break
    case 'minor': if (!pre || patch) minor++; patch = 0; pre = ''; break
    case 'patch': if (!pre) patch++; pre = ''; break
    case 'premajor': major++; minor = patch = 0; pre = '0'; break
    case 'preminor': minor++; patch = 0; pre = '0'; break
    case 'prepatch': patch++; pre = '0'; break
    case 'prerelease': {
      if (!pre) { patch++; pre = '0'; break }
      const parts = pre.split('.')
      const i = parts.findLastIndex ? parts.findLastIndex(p => /^\d+$/.test(p)) : parts.map(p => /^\d+$/.test(p)).lastIndexOf(true)
      if (i < 0) parts.push('0'); else parts[i] = String(BigInt(parts[i]) + 1n)
      pre = parts.join('.')
      break
    }
    default: throw new TypeError('未知 bump 类型')
  }
  const next = `${major}.${minor}.${patch}${pre ? '-' + pre : ''}`
  if (!parseSemver(next) || compareSemver(next, current) <= 0) throw new TypeError('bump 未产生更高的合法版本')
  return next
}
