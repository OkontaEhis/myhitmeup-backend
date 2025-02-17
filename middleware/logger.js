// middleware/logger.js
const logger = (req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next(); // Call the next middleware or route handler
  };
  
  export default logger;