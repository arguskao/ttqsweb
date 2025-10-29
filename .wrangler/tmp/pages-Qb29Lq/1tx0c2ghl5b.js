// <define:__ROUTES__>
// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/.wrangler/tmp/pages-Qb29Lq/functionsWorker-0.9902443675079621.mjs'
import { isRoutingRuleMatch } from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/node_modules/wrangler/templates/pages-dev-util.ts'

const define_ROUTES_default = {
  version: 1,
  include: ['/api/*'],
  exclude: []
}
export * from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/.wrangler/tmp/pages-Qb29Lq/functionsWorker-0.9902443675079621.mjs'
const routes = define_ROUTES_default
const pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url)
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request)
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError('Entry point missing `fetch` handler')
        }
        return workerAsHandler.fetch(request, env, context)
      }
    }
    return env.ASSETS.fetch(request)
  }
}
export {
  pages_dev_pipeline_default as default
}
//# sourceMappingURL=1tx0c2ghl5b.js.map
