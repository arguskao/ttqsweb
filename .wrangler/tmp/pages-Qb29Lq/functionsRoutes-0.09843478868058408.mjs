import { onRequestGet as __api_v1_courses_ts_onRequestGet , onRequestOptions as __api_v1_courses_ts_onRequestOptions } from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/functions/api/v1/courses.ts'
import { onRequest as __api_v1___path___ts_onRequest } from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/functions/api/v1/[[path]].ts'
import { onRequest as __api_v1_index_ts_onRequest } from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/functions/api/v1/index.ts'
import { onRequestPost as __migrate_ts_onRequestPost } from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/functions/migrate.ts'
import { onRequest as ___middleware_ts_onRequest } from '/Users/user/Library/CloudStorage/Dropbox/Code/HTML/TTQS/functions/_middleware.ts'

export const routes = [
  {
    routePath: '/api/v1/courses',
    mountPath: '/api/v1',
    method: 'GET',
    middlewares: [],
    modules: [__api_v1_courses_ts_onRequestGet]
  },
  {
    routePath: '/api/v1/courses',
    mountPath: '/api/v1',
    method: 'OPTIONS',
    middlewares: [],
    modules: [__api_v1_courses_ts_onRequestOptions]
  },
  {
    routePath: '/api/v1/:path*',
    mountPath: '/api/v1',
    method: '',
    middlewares: [],
    modules: [__api_v1___path___ts_onRequest]
  },
  {
    routePath: '/api/v1',
    mountPath: '/api/v1',
    method: '',
    middlewares: [],
    modules: [__api_v1_index_ts_onRequest]
  },
  {
    routePath: '/migrate',
    mountPath: '/',
    method: 'POST',
    middlewares: [],
    modules: [__migrate_ts_onRequestPost]
  },
  {
    routePath: '/',
    mountPath: '/',
    method: '',
    middlewares: [___middleware_ts_onRequest],
    modules: []
  }
]
