declare module "@opentelemetry/api-logs" {
  // Used as type only (import type { SeverityNumber })
  export type SeverityNumber = any;
}

declare module "@opentelemetry/api" {
  // Used as values (metrics.getMeter, trace.getTracer, SpanStatusCode.ERROR)
  export const metrics: any;
  export const trace: any;
  export const SpanStatusCode: any;
}

declare module "@opentelemetry/exporter-logs-otlp-http" {
  // Used as value (new OTLPLogExporter(...))
  export const OTLPLogExporter: any;
}

declare module "@opentelemetry/exporter-metrics-otlp-http" {
  // Used as value (new OTLPMetricExporter(...))
  export const OTLPMetricExporter: any;
}

declare module "@opentelemetry/exporter-trace-otlp-http" {
  // Used as value (new OTLPTraceExporter(...))
  export const OTLPTraceExporter: any;
}

declare module "@opentelemetry/resources" {
  // Used as value (resourceFromAttributes({...}))
  export const resourceFromAttributes: any;
}

declare module "@opentelemetry/sdk-logs" {
  // Used as values (new BatchLogRecordProcessor(...), new LoggerProvider(...))
  // LoggerProvider also used as type (let logProvider: LoggerProvider | null)
  export const BatchLogRecordProcessor: any;
  export type LoggerProvider = any;
  export const LoggerProvider: any;
}

declare module "@opentelemetry/sdk-metrics" {
  // Used as value (new PeriodicExportingMetricReader(...))
  export const PeriodicExportingMetricReader: any;
}

declare module "@opentelemetry/sdk-node" {
  // Used as value (new NodeSDK(...)) and type (let sdk: NodeSDK | null)
  export type NodeSDK = any;
  export const NodeSDK: any;
}

declare module "@opentelemetry/sdk-trace-base" {
  // Used as values (new ParentBasedSampler(...), new TraceIdRatioBasedSampler(...))
  export const ParentBasedSampler: any;
  export const TraceIdRatioBasedSampler: any;
}

declare module "@opentelemetry/semantic-conventions" {
  // Used as value (SemanticResourceAttributes.SERVICE_NAME)
  export const SemanticResourceAttributes: any;
}
