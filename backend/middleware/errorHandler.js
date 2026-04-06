// Centralized error-handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`❌  [${new Date().toISOString()}] ${err.stack || err.message}`);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: "Validation Error",
      details: messages,
    });
  }

  // Mongoose bad ObjectId (invalid :id param)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      error: "Duplicate entry",
      field: Object.keys(err.keyValue),
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
