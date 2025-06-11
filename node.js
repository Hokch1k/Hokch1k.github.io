const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (!rooms[data.roomId]) {
            rooms[data.roomId] = [];
        }
        
        // Сохраняем соединение в комнате
        if (!rooms[data.roomId].includes(ws)) {
            rooms[data.roomId].push(ws);
        }
        
        // Пересылаем сообщение другим участникам комнаты
        rooms[data.roomId].forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    
    ws.on('close', () => {
        // Удаляем соединение из всех комнат
        Object.keys(rooms).forEach(roomId => {
            rooms[roomId] = rooms[roomId].filter(client => client !== ws);
        });
    });
});

console.log('Signaling server running on ws://localhost:8080');
