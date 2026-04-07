const errorHandler = (err, req, res, next) => {
  console.error(`❌  [${new Date().toISOString()}] ${err.stack || err.message}`);
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: "Validation Error",
      details: messages,
    });
  }
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      error: "Duplicate entry",
      field: Object.keys(err.keyValue),
    });
  }
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
