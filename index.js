const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Config
const PORT = 8080;
const TARGET = 'https://browser-intake-datadoghq.eu';

const app = express();

// Logging
app.use(morgan('tiny'));

// CORS
app.use(cors());

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Proxy Middleware
const proxy = createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // Forward the original host header
        proxyReq.setHeader('Host', new URL(TARGET).hostname);
        // Add custom headers if needed
        proxyReq.setHeader('X-Forwarded-For', req.ip);
    },
});

app.use('/', proxy);

app.listen(PORT, () => {
    console.log(`Node.js RUM proxy listening on port ${PORT}`);
    console.log(`Forwarding requests to ${TARGET}`);
}); 