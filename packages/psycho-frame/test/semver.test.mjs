import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSemver, compareSemver, bumpVersion } from '../src/semver.mjs'

test('SemVer precedence follows numeric prereleases, stable and metadata', () => {
  const ordered = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0']
  for (let i = 1; i < ordered.length; i++) {
    assert.equal(compareSemver(ordered[i - 1], ordered[i]), -1)
    assert.equal(compareSemver(ordered[i], ordered[i - 1]), 1)
  }
  assert.equal(compareSemver('1.0.0+01', '1.0.0+other'), 0)
  assert.equal(compareSemver('1.0.0-rc.9999999999999999999', '1.0.0-rc.9999999999999999998'), 1)
})
test('SemVer rejects malformed versions without silent normalization', () => {
  for (const v of ['1.2', '01.2.3', 'v1.2.3', '1.2.3-', '1.2.3-a..b', '1.2.3-01', '1.2.3+','1.2.3-rc.01', '1.2.3\n']) {
    assert.equal(parseSemver(v), null, v)
    assert.throws(() => compareSemver(v, '1.0.0'))
  }
})
test('SemVer bump promotes prereleases and increments numeric identifiers', () => {
  assert.equal(bumpVersion('1.0.0-rc.9', 'prerelease'), '1.0.0-rc.10')
  assert.equal(bumpVersion('1.0.0-alpha', 'prerelease'), '1.0.0-alpha.0')
  assert.equal(bumpVersion('1.0.0-rc.1', 'patch'), '1.0.0')
  assert.equal(bumpVersion('1.2.3+build', 'minor'), '1.3.0')
})
