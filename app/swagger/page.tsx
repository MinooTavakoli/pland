/**
 * Swagger UI runs in an iframe (public/swagger-ui.html) so it is outside
 * Next.js React Strict Mode. The swagger-ui-react wrapper triggers
 * UNSAFE_componentWillReceiveProps warnings from internal ModelCollapse.
 */
export default function SwaggerPage() {
  return (
    <iframe
      title="Padimo Gold API Documentation"
      src="/swagger-ui.html"
      style={{
        display: "block",
        width: "100%",
        height: "100vh",
        border: 0,
      }}
    />
  );
}
