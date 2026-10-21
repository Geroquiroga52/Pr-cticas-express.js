const LoggerMiddleware = (req, res, next) => {
    const timeStamp = new Date().toISOString();

    console.log(`[${timeStamp} ${req.method} ${req.url} - IP: ${req.ip}]`);

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${timeStamp}] Response: ${res.statusCode} - ${duration}ms`)
    });

    next();
};

module.exports = LoggerMiddleware;