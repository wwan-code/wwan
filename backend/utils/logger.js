// utils/logger.js
import winston from 'winston';

// Định nghĩa các cấp độ log
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Định nghĩa màu sắc cho từng cấp độ log
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Thêm màu sắc vào winston
winston.addColors(colors);

// Định dạng log
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Định nghĩa các transport (nơi log được ghi)
const transports = [
    new winston.transports.Console(), // Log ra console
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }), // Log lỗi vào file error.log
    new winston.transports.File({ filename: 'logs/all.log' }), // Log tất cả vào file all.log
];

// Tạo logger
const logger = winston.createLogger({
    level: 'debug', // Cấp độ log thấp nhất sẽ được ghi
    levels,
    format,
    transports,
});

export default logger;