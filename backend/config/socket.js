// config/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance;

const verifySocketToken = (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication error: No token'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Socket Auth Error:", err.message);
            return next(new Error('Authentication error: Invalid token'));
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
        console.log(`User connected via socket: ${socket.id}, UserID: ${socket.userId}`);
        if (socket.userId) {
            const userRoom = `user_${socket.userId}`;
            socket.join(userRoom);
            console.log(`Socket ${socket.id} joined room ${userRoom}`);
        }

        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${socket.id}, UserID: ${socket.userId}, Reason: ${reason}`);
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