const metrics = {
  httpRequestsTotal: new Map(),
  httpRequestDurationMs: [],
  dbQuerySlowTotal: 0,
  cacheHitsTotal: 0,
  cacheMissesTotal: 0,
};

/**
 * Enterprise HTTP Prometheus Metrics Collector Middleware.
 */
export const metricsMiddleware = (req, res, next) => {
  const start = performance.now();
  const path = req.route?.path || req.path || 'unknown';
  const method = req.method;

  res.on('finish', () => {
    const duration = performance.now() - start;
    const statusCode = res.statusCode;
    const key = `${method}:${path}:${statusCode}`;

    const count = (metrics.httpRequestsTotal.get(key) || 0) + 1;
    metrics.httpRequestsTotal.set(key, count);

    metrics.httpRequestDurationMs.push(duration);
    if (metrics.httpRequestDurationMs.length > 1000) {
      metrics.httpRequestDurationMs.shift();
    }
  });

  next();
};

/**
 * Formats metrics in Prometheus exposition text format.
 */
export const getPrometheusMetrics = (req, res) => {
  const lines = [
    '# HELP http_requests_total Total number of HTTP requests processed',
    '# TYPE http_requests_total counter',
  ];

  for (const [key, count] of metrics.httpRequestsTotal.entries()) {
    const [method, route, code] = key.split(':');
    lines.push(`http_requests_total{method="${method}",route="${route}",status="${code}"} ${count}`);
  }

  const durations = metrics.httpRequestDurationMs;
  const p95 = durations.length > 0 ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)] || 0 : 0;

  lines.push('# HELP http_request_duration_p95_ms P95 HTTP request duration in milliseconds');
  lines.push('# TYPE http_request_duration_p95_ms gauge');
  lines.push(`http_request_duration_p95_ms ${p95.toFixed(2)}`);

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n'));
};

export default {
  metricsMiddleware,
  getPrometheusMetrics,
};
