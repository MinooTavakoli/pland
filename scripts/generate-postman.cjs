#!/usr/bin/env node
/**
 * Convert OpenAPI 3 → Postman Collection v2.1 (with saved example responses)
 *
 * Usage:
 *   npm run openapi:export    # creates docs/openapi.json first
 *   npm run postman:export
 *
 * Or: node scripts/generate-postman.cjs path/to/openapi.json
 */
const fs = require("fs");
const path = require("path");

const INPUT =
  process.argv[2] || path.join(__dirname, "..", "docs", "openapi.json");
const OUT = path.join(__dirname, "..", "docs", "postman-collection.json");

const HTTP_STATUS_TEXT = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

const CONTENT_ORDER = [
  "application/json",
  "text/csv",
  "text/html",
  "multipart/form-data",
];

function postmanPath(openapiPath) {
  return openapiPath.replace(/\{([^}]+)\}/g, ":$1").replace(/:(\w+)/g, "{{$1}}");
}

function resolveRef(ref, spec) {
  if (!ref || !ref.startsWith("#/")) return null;
  const parts = ref.slice(2).split("/");
  let cur = spec;
  for (const part of parts) {
    cur = cur?.[part];
    if (cur === undefined) return null;
  }
  return cur;
}

function mergeResponse(resp, spec) {
  if (!resp) return null;
  if (resp.$ref) {
    const resolved = resolveRef(resp.$ref, spec);
    return resolved ? mergeResponse(resolved, spec) : null;
  }
  return resp;
}

function exampleFromContent(content) {
  if (!content) return { body: "", headers: [], language: "text" };
  const types = [
    ...CONTENT_ORDER.filter((t) => content[t]),
    ...Object.keys(content).filter((t) => !CONTENT_ORDER.includes(t)),
  ];
  const mediaType = types[0];
  if (!mediaType) return { body: "", headers: [], language: "text" };

  const block = content[mediaType];
  const example = block.example ?? block.examples?.default?.value;
  const header = [{ key: "Content-Type", value: mediaType }];

  if (mediaType === "application/json") {
    const body =
      example !== undefined
        ? JSON.stringify(example, null, 2)
        : block.schema
          ? JSON.stringify({}, null, 2)
          : "";
    return { body, headers: header, language: "json" };
  }
  if (mediaType === "text/csv") {
    return {
      body: typeof example === "string" ? example : "id,name\n1,example",
      headers: header,
      language: "text",
    };
  }
  if (mediaType === "text/html") {
    return {
      body: typeof example === "string" ? example : "<html></html>",
      headers: header,
      language: "html",
    };
  }
  return { body: example != null ? String(example) : "", headers: header, language: "text" };
}

function buildPostmanResponses(operation, spec, originalRequest) {
  const responses = operation.responses || {};
  const saved = [];

  for (const [code, raw] of Object.entries(responses).sort(
    ([a], [b]) => Number(a) - Number(b),
  )) {
    const resp = mergeResponse(raw, spec);
    if (!resp) continue;

    const { body, headers, language } = exampleFromContent(resp.content);
    const statusCode = Number(code);
    const statusText = HTTP_STATUS_TEXT[statusCode] || resp.description || code;
    const label = resp.description ? `${code} ${statusText} — ${resp.description}` : `${code} ${statusText}`;

    saved.push({
      name: label,
      originalRequest: JSON.parse(JSON.stringify(originalRequest)),
      status: statusText,
      code: statusCode,
      _postman_previewlanguage: language,
      header: headers,
      body,
    });
  }

  return saved;
}

function bodyFromRequestBody(rb) {
  if (!rb?.content) return undefined;
  const json = rb.content["application/json"];
  const multipart = rb.content["multipart/form-data"];
  if (json?.example) {
    return {
      mode: "raw",
      raw: JSON.stringify(json.example, null, 2),
      options: { raw: { language: "json" } },
    };
  }
  if (json?.schema) {
    return { mode: "raw", raw: "{}", options: { raw: { language: "json" } } };
  }
  if (multipart?.schema) {
    return { mode: "formdata", formdata: [] };
  }
  return undefined;
}

function securityToHeaders(security, components) {
  const headers = [];
  if (!security?.length || !components?.securitySchemes) return headers;
  for (const req of security) {
    for (const [name] of Object.entries(req)) {
      const scheme = components.securitySchemes[name];
      if (scheme?.type === "apiKey" && scheme.in === "cookie") {
        headers.push({
          key: "Cookie",
          value: `${scheme.name}=<paste-cookie-value>`,
          description: scheme.description || name,
        });
      }
    }
  }
  return headers;
}

function buildRequest(method, pathKey, operation, spec) {
  const headers = [{ key: "Content-Type", value: "application/json" }];
  headers.push(...securityToHeaders(operation.security, spec.components));

  const req = {
    method: method.toUpperCase(),
    header: headers,
    url: `{{baseUrl}}${postmanPath(pathKey)}`,
    description: [operation.summary, operation.description].filter(Boolean).join("\n\n"),
  };

  const body = bodyFromRequestBody(operation.requestBody);
  if (body) req.body = body;

  return req;
}

function convert(spec) {
  const tagFolders = new Map();

  for (const [pathKey, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!["get", "post", "put", "patch", "delete", "head", "options"].includes(method))
        continue;
      const tag = operation.tags?.[0] || "Other";
      if (!tagFolders.has(tag)) tagFolders.set(tag, []);

      const request = buildRequest(method, pathKey, operation, spec);
      const response = buildPostmanResponses(operation, spec, request);

      tagFolders.get(tag).push({
        name: `${method.toUpperCase()} ${pathKey}`,
        request,
        response,
      });
    }
  }

  const items = [...tagFolders.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, folderItems]) => ({ name: tag, item: folderItems }));

  const totalResponses = items.reduce(
    (n, f) => n + f.item.reduce((s, i) => s + (i.response?.length || 0), 0),
    0,
  );

  return {
    collection: {
      info: {
        name: spec.info?.title || "pland API",
        description: spec.info?.description || "",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [
        { key: "baseUrl", value: spec.servers?.[0]?.url || "http://localhost:3000" },
      ],
      item: items,
    },
    totalResponses,
  };
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Missing ${INPUT}`);
    console.error("Run: npm run openapi:export  (with dev server running)");
    process.exit(1);
  }

  const spec = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  const { collection, totalResponses } = convert(spec);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(collection, null, 2), "utf8");

  const folders = collection.item.length;
  const requests = collection.item.reduce((n, f) => n + f.item.length, 0);
  console.log(`✅ Wrote ${OUT}`);
  console.log(`   ${folders} folders, ${requests} requests, ${totalResponses} example responses`);
  console.log("\nImport in Postman: File → Import → postman-collection.json");
}

main();
