# HTTP Endpoints

SecureClaw Gateway provides HTTP REST endpoints for chat completions, tool invocation, and health monitoring.

## OpenAPI Specification

Complete OpenAPI 3.1 specification: [openapi.yaml](./openapi.yaml)

**Validate**:

```bash
npx @redocly/cli lint docs/api/openapi.yaml
```

**Generate TypeScript types**:

```bash
npx openapi-typescript docs/api/openapi.yaml -o src/types/openapi.ts
```

**View documentation**:

```bash
npx @redocly/cli preview-docs docs/api/openapi.yaml
```

## Endpoints

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

**Status**: Disabled by default

**Enable**: Set `gateway.http.endpoints.chatCompletions.enabled = true` in config

See: [OpenAI HTTP API Documentation](../gateway/openai-http-api.md)

### POST /v1/responses

OpenResponses API endpoint for advanced agent interactions.

**Status**: Disabled by default

**Enable**: Set `gateway.http.endpoints.responses.enabled = true` in config

### POST /tools/invoke

Direct tool invocation endpoint.

**Status**: Always enabled (requires authentication)

### GET /health/live

Liveness probe for Kubernetes/Docker.

**Status**: Always enabled (no auth required)

### GET /health/ready

Readiness probe for Kubernetes/Docker.

**Status**: Always enabled (no auth required)

Query parameters:

- `probe=true` - Perform active channel probes
- `timeout=5000` - Timeout in milliseconds

See: [Health Endpoints Documentation](../gateway/health-endpoints.md)

## Authentication

All authenticated endpoints use Bearer token authentication:

```bash
Authorization: Bearer YOUR_TOKEN
```

The token value depends on your Gateway auth configuration:

- **Token mode**: Use `gateway.auth.token` or `SECURECLAW_GATEWAY_TOKEN`
- **Password mode**: Use `gateway.auth.password` or `SECURECLAW_GATEWAY_PASSWORD`

## Examples

### curl

**Chat completion**:

```bash
curl -X POST http://127.0.0.1:18789/v1/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "secureclaw",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**Tool invocation**:

```bash
curl -X POST http://127.0.0.1:18789/tools/invoke \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "bash",
    "args": {
      "command": "date"
    }
  }'
```

**Health check**:

```bash
curl http://127.0.0.1:18789/health/ready?probe=true
```

### TypeScript

**Using fetch**:

```typescript
const response = await fetch("http://127.0.0.1:18789/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_TOKEN",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "secureclaw",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### Python

**Using requests**:

```python
import requests

response = requests.post(
    'http://127.0.0.1:18789/v1/chat/completions',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json',
    },
    json={
        'model': 'secureclaw',
        'messages': [
            {'role': 'user', 'content': 'Hello!'}
        ],
    }
)

data = response.json()
print(data['choices'][0]['message']['content'])
```

## Configuration

Enable HTTP endpoints in `secureclaw.config.json`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
        },
        responses: {
          enabled: true,
          maxBodyBytes: 20971520, // 20 MB
          maxUrlParts: 8,
        },
      },
    },
    auth: {
      mode: "token",
      token: "your-secure-token-here",
    },
  },
}
```

## Security Considerations

1. **Always use authentication** for production deployments
2. **Enable TLS** when exposing the gateway over the network
3. **Use environment variables** for tokens/passwords, never commit them
4. **Configure rate limiting** to prevent abuse
5. **Review tool policies** before enabling tool invocation endpoint
6. **Enable Security Coach** for additional protection
7. **Monitor health endpoints** but don't expose them publicly

## Troubleshooting

**401 Unauthorized**:

- Check that the Bearer token matches your gateway auth configuration
- Verify `gateway.auth.mode` and corresponding token/password value

**404 Not Found**:

- Ensure the endpoint is enabled in configuration
- Check that the gateway is running on the expected port
- Verify the URL path is correct

**503 Service Unavailable** (tool invocation):

- Security Coach may be unavailable (fail-closed by design)
- Check Security Coach configuration and health
