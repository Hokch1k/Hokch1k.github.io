// Получение User-Agent
const userAgentElement = document.getElementById('user-agent');
userAgentElement.textContent = navigator.userAgent;

// Получение IP-адреса через API
const ipAddressElement = document.getElementById('ip-address');

fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
        ipAddressElement.textContent = data.ip;
    })
    .catch(error => {
        ipAddressElement.textContent = 'Не удалось получить IP-адрес';
        console.error('Ошибка при получении IP:', error);
    });
