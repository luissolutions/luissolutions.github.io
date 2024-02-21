
document.getElementById('toggleChat').addEventListener('click', function () {
    const chatModal = document.getElementById('chatModal');
    chatModal.classList.toggle('hidden');
    this.textContent = chatModal.classList.contains('hidden') ? 'Open Chat' : 'Close Chat';
});

document.addEventListener('click', function (e) {
    const chatModal = document.getElementById('chatModal');
    const toggleChatBtn = document.getElementById('toggleChat');
    if (!chatModal.contains(e.target) && !toggleChatBtn.contains(e.target) && !chatModal.classList.contains('hidden')) {
        chatModal.classList.add('hidden');
        toggleChatBtn.textContent = 'Open Chat';
    }
});