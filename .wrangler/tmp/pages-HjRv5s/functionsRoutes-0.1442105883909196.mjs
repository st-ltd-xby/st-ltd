import { onRequest as __api___path___js_onRequest } from "G:\\LTD\\functions\\api\\[[path]].js"
import { onRequest as __t___path___js_onRequest } from "G:\\LTD\\functions\\t\\[[path]].js"
import { onRequest as __uploads___path___js_onRequest } from "G:\\LTD\\functions\\uploads\\[[path]].js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/t/:path*",
      mountPath: "/t",
      method: "",
      middlewares: [],
      modules: [__t___path___js_onRequest],
    },
  {
      routePath: "/uploads/:path*",
      mountPath: "/uploads",
      method: "",
      middlewares: [],
      modules: [__uploads___path___js_onRequest],
    },
  ]