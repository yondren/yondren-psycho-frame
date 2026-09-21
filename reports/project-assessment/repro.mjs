// Isolated assessment probes. All fixture files are temporary and removed on completion.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const { scaffold, doctor } = await import(path.join(repo, 'packages/psycho-frame/src/init.mjs'))
const { startTask, checkWorktrees, findTaskCard } = await import(path.join(repo, 'packages/psycho-frame/src/worktree.mjs'))
const { verifyDocs } = await import(path.join(repo, 'packages/psycho-frame/src/verify-docs.mjs'))
const { newCookbook } = await import(path.join(repo, 'packages/psycho-frame/src/cookbook.mjs'))
const { compareVersions } = await import(path.join(repo, 'packages/psycho-frame/src/self-update.mjs'))
const cli = path.join(repo, 'packages/psycho-frame/src/cli.mjs')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-assessment-'))
const quiet = () => {}
const results = []
function write(root, rel, data) { const f = path.join(root,rel); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,data) }
function git(root,...args) {
 const r = spawnSync('git',['-C',root,...args],{encoding:'utf8',env:{...process.env,GIT_CONFIG_GLOBAL:os.devNull,GIT_CONFIG_NOSYSTEM:'1'}})
 if(r.status!==0) throw new Error('git failed: '+args[0]+': '+r.stderr)
 return r.stdout.trim()
}
function command(root,...args) { return spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8',env:{...process.env,PSYCHO_FRAME_NO_UPDATE_CHECK:'1'}}) }
function init(name, asGit=false) {
 const root=path.join(temp,name);fs.mkdirSync(root)
 scaffold({target:root,mode:'init',stdout:quiet,stderr:quiet})
 if(asGit){git(root,'init','-q','-b','main');git(root,'config','user.name','Assessment');git(root,'config','user.email','assessment@example.invalid');git(root,'config','commit.gpgsign','false');git(root,'add','-A');git(root,'commit','-qm','baseline')}
 return root
}
const note='# Agent Note: Assessment\n\nStatus: implemented\n\n## Problem\n\nExample.\n\n## Decision\n\nExample.\n\n## Alternatives considered\n\n**Alternative**: excluded.\n\n## Consequences\n\nExample.\n'
function task(root,key) {
 startTask({root,key,date:'2026-09-21',stdout:quiet})
 const wt=path.join(root,'.worktrees',key)
 const cfg=JSON.parse(fs.readFileSync(path.join(wt,'.psycho-frame.json'),'utf8'))
 cfg.workMode.destroy='on';cfg.destroyChecks=[]
 write(wt,'.psycho-frame.json',JSON.stringify(cfg))
 return wt
}
try {
 // Synthetic marker only: no real credentials are created, read, or logged.
 {
 const root=init('staged-scan',true),wt=task(root,'staged-probe')
 write(wt,'decisions/implemented/testing/2026-09-21-probe.md',note)
 const marker=['-----BEGIN','PRIVATE KEY-----'].join(' ')
 write(wt,'example.txt',marker+'\n');git(wt,'add','example.txt');write(wt,'example.txt','safe\n')
 const r=command(wt,'verify','--json','--base','main')
 results.push({id:'R1',scenario:'staged marker, sanitized working file',indexContainsMarker:git(wt,'show',':example.txt').includes(marker),exit:r.status,result:JSON.parse(r.stdout)})
 }
 {
 const root=init('hooks',true),hooks=path.join(root,'.hooks')
 write(root,'.hooks/pre-commit','#!/bin/sh\nexit 1\n');fs.chmodSync(path.join(hooks,'pre-commit'),0o755);git(root,'config','core.hooksPath',hooks)
 const blocked=spawnSync('git',['-C',root,'-c','commit.gpgsign=false','commit','--allow-empty','-m','blocked'],{encoding:'utf8'})
 const wt=task(root,'hooks-probe')
 const accepted=spawnSync('git',['-C',wt,'-c','commit.gpgsign=false','commit','--allow-empty','-m','hooks-probe'],{encoding:'utf8'})
 results.push({id:'R2',scenario:'task start overrides existing rejecting pre-commit',beforeExit:blocked.status,afterExit:accepted.status,taskIssues:checkWorktrees(wt).issues})
 }
 {
 const root=init('symlink'),outside=path.join(temp,'external-docs')
 fs.renameSync(path.join(root,'docs'),outside);fs.symlinkSync(outside,path.join(root,'docs'),'dir')
 write(outside,'architecture.md','# External custom architecture\n')
 const r=command(root,'upgrade')
 results.push({id:'R3',scenario:'upgrade follows docs symlink outside target',exit:r.status,externalOverwritten:fs.readFileSync(path.join(outside,'architecture.md'),'utf8')!=='# External custom architecture\n'})
 }
 {
 const root=init('deleted-decision',true),rel='decisions/implemented/testing/2026-09-20-old.md'
 write(root,rel,note);git(root,'add','-A');git(root,'commit','-qm','baseline decision')
 const wt=task(root,'deletion-probe');fs.unlinkSync(path.join(wt,rel));write(wt,'code.js','export default 1\n')
 const r=command(wt,'verify','--json','--base','main')
 results.push({id:'R4',scenario:'deleting only existing decision satisfies add-or-update gate',exit:r.status,result:JSON.parse(r.stdout)})
 }
 {
 const root=init('cookbook-upgrade')
 newCookbook({root,slug:'custom-guide',title:'Custom guide',stdout:quiet})
 const idx=path.join(root,'docs/cookbook/README.md'),before=fs.readFileSync(idx,'utf8').includes('custom-guide.md')
 const r=command(root,'upgrade')
 results.push({id:'R5',scenario:'upgrade removes generated cookbook index entry',exit:r.status,indexBefore:before,indexAfter:fs.readFileSync(idx,'utf8').includes('custom-guide.md'),pageRetained:fs.existsSync(path.join(root,'docs/cookbook/custom-guide.md')),verificationErrors:verifyDocs(root).errors,doctorExit:doctor({target:root,stdout:quiet,stderr:quiet}).exitCode})
 }
 {
 const root=init('subdir-doctor',true)
 const r=command(path.join(root,'docs'),'doctor')
 results.push({id:'R6',scenario:'doctor from repository docs subdirectory',exit:r.status,message:r.stderr.trim()})
 }
 {
 const root=init('done-task',true)
 const card='# Complete\n\n- task_key: repeat-probe\n- status: DONE\n- created: 2026-09-20\n- updated: 2026-09-20\n- report: [report](../reports/repeat-probe.md)\n'
 write(root,'tasks/2026-09-20-repeat-probe.md',card);write(root,'reports/repeat-probe.md','# Done\n');git(root,'add','-A');git(root,'commit','-qm','complete task')
 const r=startTask({root,key:'repeat-probe',stdout:quiet})
 results.push({id:'R7',scenario:'task start reuses DONE card without reopening',ok:r.ok,status:findTaskCard(r.worktree,'repeat-probe').status,issues:checkWorktrees(r.worktree).issues})
 }
 {
 const root=init('absolute-link')
 write(root,'docs/probe.md','# Probe\n\n[missing](/definitely-not-existing-assessment-target.md)\n')
 results.push({id:'R8',scenario:'absolute POSIX link bypasses link checking',errors:verifyDocs(root).errors})
 }
 results.push({id:'R9',scenario:'release candidate is considered same version as stable',comparison:compareVersions('0.5.0','0.5.0-rc.1')})
 {
 const root=init('ci-destroy-mode',true)
 const cfg=JSON.parse(fs.readFileSync(path.join(root,'.psycho-frame.json'),'utf8'))
 cfg.workMode.destroy='on';cfg.destroyChecks=[];write(root,'.psycho-frame.json',JSON.stringify(cfg))
 git(root,'add','.psycho-frame.json');git(root,'commit','-qm','configure destroy mode')
 const r=command(root,'verify','--json')
 results.push({id:'R10',scenario:'CI verify invocation with committed destroy=on configuration',exit:r.status,result:JSON.parse(r.stdout)})
 }
 console.log(JSON.stringify({node:process.version,results},null,2))
} finally { fs.rmSync(temp,{recursive:true,force:true}) }
