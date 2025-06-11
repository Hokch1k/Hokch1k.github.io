// Элементы страницы
const speakBtn = document.getElementById('speakBtn');
const listenBtn = document.getElementById('listenBtn');
const statusDiv = document.getElementById('status');
const audioElement = document.getElementById('audioElement');

// WebRTC переменные
let peerConnection;
let localStream;
let roomId = prompt("Введите ID комнаты:");

// Сигнальный сервер (используем простой WebSocket)
const socket = new WebSocket('wss://your-signaling-server.com');

socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'offer') {
        await handleOffer(message.offer);
    } else if (message.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.type === 'candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
};

// Обработчик кнопки "Говорить"
speakBtn.addEventListener('click', async () => {
    statusDiv.textContent = "Статус: Говоритель (подготовка...)";
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        createPeerConnection(true);
        
        statusDiv.textContent = "Статус: Вы говоритель. Говорите сейчас.";
    } catch (error) {
        console.error("Ошибка доступа к микрофону:", error);
        statusDiv.textContent = "Ошибка: " + error.message;
    }
});

// Обработчик кнопки "Слушать"
listenBtn.addEventListener('click', async () => {
    statusDiv.textContent = "Статус: Слушатель (подключение...)";
    createPeerConnection(false);
});

// Создание PeerConnection
function createPeerConnection(isInitiator) {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    peerConnection = new RTCPeerConnection(configuration);
    
    // Обработчики ICE кандидатов
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate,
                roomId: roomId
            }));
        }
    };
    
    // Для говорителя
    if (isInitiator) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Создание предложения
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                socket.send(JSON.stringify({
                    type: 'offer',
                    offer: peerConnection.localDescription,
                    roomId: roomId
                }));
            });
    } else {
        // Для слушателя
        peerConnection.ontrack = (event) => {
            audioElement.srcObject = event.streams[0];
            statusDiv.textContent = "Статус: Вы слушатель. Слушайте сейчас.";
        };
    }
}

// Обработка предложения (для слушателя)
async function handleOffer(offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.send(JSON.stringify({
        type: 'answer',
        answer: peerConnection.localDescription,
        roomId: roomId
    }));
}
