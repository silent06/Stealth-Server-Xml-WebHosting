const http = require('http');
const fs = require('fs').promises; // Use promises for better async handling
const path = require('path');
const winston = require('winston'); // Logging library

// Define the port and the directory containing files
const PORT = 3000;
const FILE_DIR = path.join(__dirname, 'xmls'); 

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
            await fs.writeFile(file, '', 'utf8');
            console.log(`${file} created.`);
        }
    }
};

// Function to log warnings
const logWarning = (ip, userAgent, httpMethod, severity, message) => {
    const logMessage = `[Request] IP: ${ip}, Timestamp: ${new Date().toISOString()}, User-Agent: ${userAgent}, HTTP Method: ${httpMethod}, Severity: ${severity}, Message: ${message}`;
    logger.warn(logMessage);
    console.log(logMessage);
};

// Function to log access details
const logAccess = (ip, userAgent, httpMethod, severity, message) => {
    const logMessage = `[Request] IP: ${ip}, Timestamp: ${new Date().toISOString()}, User-Agent: ${userAgent}, HTTP Method: ${httpMethod}, Severity: ${severity}, Message: ${message}`;
    logger.info(logMessage);
    console.log(logMessage);
};

// Function to log errors
const logError = (ip, userAgent, httpMethod, severity, message) => {
    const logMessage = `[Request] IP: ${ip}, Timestamp: ${new Date().toISOString()}, User-Agent: ${userAgent}, HTTP Method: ${httpMethod}, Severity: ${severity}, Message: ${message}`;
    logger.error(logMessage);
    console.log(logMessage);
};

// Create the server
const server = http.createServer(async (req, res) => {
    const ip = req.socket.remoteAddress || 'Unknown IP';
    const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
    const httpMethod = req.method;
    const filePath = path.join(FILE_DIR, req.url === '/' ? 'index.html' : req.url);

    // Determine the content type based on file extension
    const extname = path.extname(filePath);
    let contentType = 'text/plain';

    switch (extname) {
        case '.html':
            contentType = 'text/html';
            break;
        case '.png':
            contentType = 'image/png';
            break;        
        case '.jpg': 
        case '.jpeg': 
        contentType = 'image/jpeg';
        break;
        case '.xml':
            contentType = 'application/xml';
            break;
        default:
            logWarning(ip, userAgent, httpMethod, 'WARN', `Unsupported file type requested: ${req.url}`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found: Only HTML, PNG, and XML files are supported.');
            return;
    }

    try {
        const startTime = process.hrtime();
        const data = await fs.readFile(filePath);
        const duration = process.hrtime(startTime);
        const responseTime = (duration[0] * 1e3 + duration[1] / 1e6).toFixed(3);

        logAccess(ip, userAgent, httpMethod, 'INFO', `200 OK: ${req.url} - Response Time: ${responseTime} ms`);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (err) {
        logError(ip, userAgent, httpMethod, 'ERROR', `500 Internal Server Error: Could not read the file ${filePath}`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error: Could not read the file.');
    }
});

// Ensure log files exist before starting the server
ensureLogFilesExist().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}).catch(err => {
    console.error('Error ensuring log files exist:', err);
});
