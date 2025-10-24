const http = require('http');
const fs = require('fs').promises; // Use promises for better async handling
const path = require('path');
const winston = require('winston'); // Logging library

// Define the port and the directory containing XML files
const PORT = 3000;
const XML_DIR = path.join(__dirname, 'xmls');

// Configure logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'access.log' }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'warn.log', level: 'warn' }) // Add warn transport
    ]
});

// Method to ensure log files exist
const ensureLogFilesExist = async () => {
    const logFiles = ['access.log', 'error.log', 'warn.log'];
    for (const file of logFiles) {
        try {
            await fs.access(file);
        } catch (err) {
            // If the file does not exist, create it
            await fs.writeFile(file, '', 'utf8');
            console.log(`${file} created.`);
        }
    }
};

// Function to log warnings
const logWarning = (ip, userAgent, httpMethod, severity, message) => {
    const logMessage = `[Request] IP: ${ip}, Timestamp: ${new Date().toISOString()}, User-Agent: ${userAgent}, HTTP Method: ${httpMethod}, Severity: ${severity}, Message: ${message}`;
    logger.warn(logMessage); // Log warning
    console.log(logMessage); // Log to console
};

// Function to log access details
const logAccess = (ip, userAgent, httpMethod, severity, message) => {
    const logMessage = `[Request] IP: ${ip}, Timestamp: ${new Date().toISOString()}, User-Agent: ${userAgent}, HTTP Method: ${httpMethod}, Severity: ${severity}, Message: ${message}`;
    logger.info(logMessage);
    console.log(logMessage); // Log to console
};

// Function to log errors
const logError = (ip, userAgent, httpMethod, severity, message) => {
    const logMessage = `[Request] IP: ${ip}, Timestamp: ${new Date().toISOString()}, User-Agent: ${userAgent}, HTTP Method: ${httpMethod}, Severity: ${severity}, Message: ${message}`;
    logger.error(logMessage);
    console.log(logMessage); // Log to console
};

// Create the server
const server = http.createServer(async (req, res) => {
    const ip = req.socket.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
    const httpMethod = req.method; // Extracting the HTTP method
    const filePath = path.join(XML_DIR, req.url === '/' ? 'index.xml' : req.url);

    // Validate file extension
    if (path.extname(filePath) !== '.xml') {
        logWarning(ip, userAgent, httpMethod, 'WARN', `Unsupported file type requested: ${req.url}`);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: Only XML files are supported.');
        return;
    }

    try {
        const startTime = process.hrtime();
        const data = await fs.readFile(filePath, 'utf8');
        const duration = process.hrtime(startTime);
        const responseTime = (duration[0] * 1e3 + duration[1] / 1e6).toFixed(3); // in milliseconds

        logAccess(ip, userAgent, httpMethod, 'INFO', `200 OK: ${req.url} - Response Time: ${responseTime} ms`);
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end(data);
    } catch (err) {
        logError(ip, userAgent, httpMethod, 'ERROR', `500 Internal Server Error: Could not read the file ${filePath}`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error: Could not read the file.');
    }
});

// Ensure log files exist before starting the server
ensureLogFilesExist().then(() => {
    // Start the server
    server.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}).catch(err => {
    console.error('Error ensuring log files exist:', err);
});