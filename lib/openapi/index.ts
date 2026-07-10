import { openApiComponents, openApiTags } from "./components";
import { enrichOpenApiPaths } from "./enrich-examples";
import { componentResponses } from "./responses";
import { openApiPaths } from "./paths";

const serverUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "pland API",
    version: "1.0.0",
    description: [
      "REST API for pland — online gold jewelry store",
      "",
      "**Authentication:**",
      "- Customer: `POST /api/auth/send-otp`, then `POST /api/auth/verify-otp` → `site-auth` cookie",
      "- Admin: `POST /api/admin/login` → `admin-auth` cookie",
      "",
      "In Swagger UI, click **Authorize** and enter the cookie value (or use a browser session where you are already logged in).",
    ].join("\n"),
    contact: { name: "pland" },
  },
  servers: [{ url: serverUrl, description: "Current server" }],
  tags: openApiTags,
  paths: enrichOpenApiPaths(openApiPaths),
  components: {
    ...openApiComponents,
    responses: componentResponses,
  },
};

export type OpenApiSpec = typeof openApiSpec;
