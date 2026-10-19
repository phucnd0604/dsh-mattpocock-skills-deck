/**
 * src/shared/panel-repo-ref.ts — work out the repository reference a panel read path needs.
 *
 * Why this file exists: every panel read path (issue detail / comments / probe / page /
 * snapshot / refresh / label colours / handoff claim) used to take refId straight from
 * reg.describe({ cwd }). A tracker room only fills refId when the caller already handed it a
 * handle carrying a refId, so the GitLab room handed back an empty refId, the caller fell
 * back to using the workspace directory as the project path, and glab answered
 * "404 Project Not Found". The agent-tool path (deck/shell/call-shell) already did this step;
 * the panel did not.
 *
 * Why it lives in src/shared and not beside its callers: src/host leaf modules are forbidden
 * from importing each other (the wiring belongs to src/host/index.ts), so the host leaves
 * (commentThreads / sessionSnapshot / sessionRefresh / issuePage / workspaceLabelColors /
 * handoffClaim) cannot share a helper that lives in src/host. A self-contained pure module in
 * the shared layer is the place both the host leaves and any future caller can reach.
 *
 * Contract that must not change: all three backends expose getRepoKey(cwd, ctx) returning
 * { owner, name } or null (markdown returns null because describe already filled refId).
 * When the key cannot be resolved we still hand back an object whose refId is empty, so each
 * caller takes its own "cannot recognise this repository" branch instead of dereferencing
 * null — the old code fell back to refId = cwd, and that fallback was the 404.
 */
export async function resolvePanelRepoRef(reg: any, backendId: any, repoRef: any, cwd: any, ctx: any): Promise<any> {
  const cur: any = repoRef && typeof repoRef === 'object' ? repoRef : null
  if (cur && typeof cur.refId === 'string' && cur.refId) return cur
  try {
    const tr: any = reg && typeof reg.get === 'function' ? reg.get(backendId) : null
    const grk: any = tr && typeof tr.getRepoKey === 'function' ? tr.getRepoKey : null
    if (typeof grk === 'function') {
      const k: any = await grk(cwd, Object.assign({}, ctx, { cwd: cwd }))
      if (k && typeof k.owner === 'string' && k.owner && typeof k.name === 'string' && k.name) {
        const refId: string = k.owner + '/' + k.name
        const out: any = { backend: backendId, refId: refId, name: refId, url: (cur && cur.url) || '' }
        if (cur && cur.effortId !== undefined && cur.effortId !== null) out.effortId = String(cur.effortId)
        return out
      }
    }
  } catch (e) {}
  return cur || { backend: backendId, refId: '', name: String(cwd || '').split(/[\\/]/).pop() || backendId, url: '' }
}
