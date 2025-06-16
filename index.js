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
        cdn: 'https://cdn.amplitude.com'
    }
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

// Amplitude CDN Proxy Middleware
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

// Route Datadog requests
app.use('/dd', datadogProxy);

// Route Amplitude requests
app.use('/ampli/api', amplitudeApiProxy);
app.use('/ampli/cdn', amplitudeCdnProxy);

app.listen(PORT, () => {
    console.log(`Analytics proxy listening on port ${PORT}`);
    console.log(`Datadog requests forwarded to ${TARGETS.datadog}`);
    console.log(`Amplitude API requests forwarded to ${TARGETS.amplitude.api}`);
    console.log(`Amplitude CDN requests forwarded to ${TARGETS.amplitude.cdn}`);
}); 