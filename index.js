const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Config
const PORT = 8080;
const TARGETS = {
    datadog: 'https://browser-intake-datadoghq.eu',
    amplitude: {
        api: 'https://api2.amplitude.com',
        cdn: 'https://cdn.amplitude.com',
        config: 'https://sr-client-cfg.amplitude.com'
    },
    customerio: 'https://cdp.customer.io' // US region CDP intake/assets
};

const app = express();

// Logging
app.use(morgan('tiny'));

// CORS
app.use(cors());

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Datadog Proxy Middleware
const datadogProxy = createProxyMiddleware({
    target: TARGETS.datadog,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
        '^/dd/': '/', // Remove /dd/ prefix when forwarding to Datadog
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Host', new URL(TARGETS.datadog).hostname);
        proxyReq.setHeader('X-Forwarded-For', req.ip);
    },
});

// Amplitude API Proxy Middleware
const amplitudeApiProxy = createProxyMiddleware({
    target: TARGETS.amplitude.api,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
        '^/ampli/api/': '/', // Remove /ampli/api/ prefix when forwarding to Amplitude
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Host', new URL(TARGETS.amplitude.api).hostname);
        proxyReq.setHeader('X-Forwarded-For', req.ip);
    },
});

// Amplitude CDN Proxy Middleware (handles ALL cdn.amplitude.com requests)
const amplitudeCdnProxy = createProxyMiddleware({
    target: TARGETS.amplitude.cdn,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
        '^/ampli/cdn/': '/', // Remove /ampli/cdn/ prefix when forwarding to Amplitude
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Host', new URL(TARGETS.amplitude.cdn).hostname);
        proxyReq.setHeader('X-Forwarded-For', req.ip);
    },
});

// Amplitude Config Proxy Middleware (handles sr-client-cfg.amplitude.com)
const amplitudeConfigProxy = createProxyMiddleware({
    target: TARGETS.amplitude.config,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
        '^/ampli/config/': '/', // Remove /ampli/config/ prefix when forwarding to Amplitude
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('Host', new URL(TARGETS.amplitude.config).hostname);
        proxyReq.setHeader('X-Forwarded-For', req.ip);
    },
});

// Customer.io CDP Proxy Middleware
// Strips the leading "/cio" and forwards the remaining path + query verbatim
// to cdp.customer.io (US region). Method, headers, and raw body are preserved.
const customerioProxy = createProxyMiddleware({
    target: TARGETS.customerio,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
        '^/cio/': '/', // Remove /cio/ prefix when forwarding to Customer.io
        '^/cio$': '/', // Handle bare /cio with no trailing slash
    },
    // http-proxy-middleware v3 expects lifecycle hooks under `on`.
    on: {
        proxyReq: (proxyReq, req, res) => {
            proxyReq.setHeader('Host', new URL(TARGETS.customerio).hostname);
            proxyReq.setHeader('X-Forwarded-For', req.ip);
        },
        proxyRes: (proxyRes, req, res) => {
            // Never cache event intake (POST /cio/v1/*). Allow a short cache
            // only for idempotent GET asset/settings responses.
            const reqPath = req.originalUrl || req.url;
            const isEventIntake = req.method === 'POST' && /^\/cio\/v1\//.test(reqPath);
            if (isEventIntake) {
                proxyRes.headers['cache-control'] = 'no-store';
            } else if (req.method === 'GET' && !proxyRes.headers['cache-control']) {
                proxyRes.headers['cache-control'] = 'public, max-age=60';
            }
        },
    },
});

// Route Datadog requests
app.use('/dd', datadogProxy);

// Route Amplitude requests
app.use('/ampli/api', amplitudeApiProxy);
app.use('/ampli/cdn', amplitudeCdnProxy);
app.use('/ampli/config', amplitudeConfigProxy);

// Route Customer.io requests
app.use('/cio', customerioProxy);

app.listen(PORT, () => {
    console.log(`Analytics proxy listening on port ${PORT}`);
    console.log(`Datadog requests forwarded to ${TARGETS.datadog}`);
    console.log(`Amplitude API requests forwarded to ${TARGETS.amplitude.api}`);
    console.log(`Amplitude CDN requests forwarded to ${TARGETS.amplitude.cdn}`);
    console.log(`Amplitude Config requests forwarded to ${TARGETS.amplitude.config}`);
    console.log(`Customer.io requests forwarded to ${TARGETS.customerio}`);
}); 