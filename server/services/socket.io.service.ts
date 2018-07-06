export default class SocketIoService {

    fnConnect = (io) => {
        io.on('connection', (socket) => {
            const rooms = io.sockets.adapter.rooms;

            console.log('CONNECTION ROOM :: ', rooms);
            // Call onConnect.
            this.onConnect(socket, rooms);

            // Call onDisconnect.
            socket.on('disconnect', () => {
                this.onDisconnect(socket, rooms);
            });
        });
    }

    /**
     * When the socket connects.. perform this
     * @param {any} socket
     * @param {any} rooms
     * */
    onConnect = (socket, rooms) => {

    }

    /**
     * When the socket disconnects.. perform this
     * @param {any} socket
     * @param {any} rooms
     */
    onDisconnect = (socket, rooms) => {

    }
}

