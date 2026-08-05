import { onRequest as __api___path___js_onRequest } from "G:\\LTD\\packages\\admin\\functions\\api\\[[path]].js"
import { onRequest as __uploads___path___js_onRequest } from "G:\\LTD\\packages\\admin\\functions\\uploads\\[[path]].js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/uploads/:path*",
      mountPath: "/uploads",
      method: "",
      middlewares: [],
      modules: [__uploads___path___js_onRequest],
    },
  ]