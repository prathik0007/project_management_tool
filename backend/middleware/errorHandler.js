export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path || 'resource'} ID format`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with that value already exists';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Not authorized';
  }

  if (status >= 500) {
    console.error('Unhandled server error:', err.message);
    message = 'Internal server error';
  }

  res.status(status).json({ success: false, message });
};
