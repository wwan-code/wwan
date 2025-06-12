// config/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance;

const verifySocketToken = (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Xác thực lỗi: Không có token'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Socket Auth Error:", err.message);
            return next(new Error('Xác thực lỗi: Token không hợp lệ'));
        }
        socket.userId = decoded.id;
        next();
    });
};

export const initSocket = (httpServer) => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3000", // URL Frontend
            methods: ["GET", "POST"]
        }
    });

    ioInstance.use(verifySocketToken);

    ioInstance.on('connection', (socket) => {
        console.log(`Người dùng kết nối qua socket: ${socket.id}, UserID: ${socket.userId}`);
        if (socket.userId) {
            const userRoom = `user_${socket.userId}`;
            socket.join(userRoom);
            console.log(`Socket ${socket.id} đã tham gia phòng ${userRoom}`);
        }

        socket.on('disconnect', (reason) => {
            console.log(`Người dùng ngắt kết nối: ${socket.id}, UserID: ${socket.userId}, Lý do: ${reason}`);
        });
    });

    console.log('Socket.IO initialized.');
    return ioInstance;
};

export const getIo = () => {
    if (!ioInstance) {
        throw new Error("Socket.io not initialized!");
    }
    return ioInstance;
};