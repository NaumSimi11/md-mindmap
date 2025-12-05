# System Architecture — Overview & Deployment

## Layers
- Presentation (Next.js) + CDN
- API (Node/Express + GraphQL)
- AI microservices (Python/fastAPI or Node)
- Data layer (Postgres + Redis + Elasticsearch)
- Media store (S3)
- Realtime (WebSocket cluster + Redis pub/sub)

## Deployment
- Use EKS (Kubernetes) or ECS for services
- Separate GPU cluster for image generation
- Autoscale AI workers with queue length
- Use CloudFront in front of static assets

## Observability
- Traces: OpenTelemetry
- Logs: ELK or Datadog
- Metrics: Prometheus + Grafana
