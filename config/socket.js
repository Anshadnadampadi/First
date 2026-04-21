let io;

export const initSocket = async (httpServer) => {
    const { Server } = await import('socket.io');
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    console.log('Socket.io Initialized');
    
    io.on("connection", (socket) => {
        socket.on("join_room", (room) => {
            socket.join(room.toString());
            console.log(`Socket ${socket.id} joined room: ${room}`);
        });
    });

    return io;
};

export const getIO = () => io;
