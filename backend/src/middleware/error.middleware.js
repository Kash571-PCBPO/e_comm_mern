// Central error handler. Wire this as the LAST app.use() in app.js.
const errorMiddleware = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${err.message}`);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorMiddleware;
