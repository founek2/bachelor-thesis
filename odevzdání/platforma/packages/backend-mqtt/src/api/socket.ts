import { JwtService } from 'common/lib/services/jwtService';
import express from 'express';
import { Server as serverIO, Socket } from 'socket.io';

type socketWithUser = {
    request: { user?: { id: string } };
} & Socket;

/**
 * Handle for SocketIO
 */
export default (io: serverIO) => {
    /* Login middleware to authenticate using JWT token */
    io.use((socket: socketWithUser, next) => {
        let token = socket.handshake.query.token as string;
        console.log('middleware loging io');
        JwtService.verify(token)
            .then((payload) => {
                socket.request.user = payload;
                next();
            })
            .catch(() => next());
    });

    io.on('connection', (socket: socketWithUser) => {
        console.log('New client connected', socket.request.user?.id || 'unknown');
        if (socket.request.user) {
            // if authenticated, then join the appropriate group
            console.log('user joined group');
            socket.join(socket.request.user.id);
        }

        // default public group
        socket.join('public');

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return express.Router();
};
