document.querySelectorAll('a[data-src]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const newSrc = this.getAttribute('data-src');
        const iframe = document.getElementById('contentIframe');
        iframe.src = newSrc;
    });
});

document.getElementById('better-minecraft').addEventListener('click', function () {
    const textToCopy = 'oddohome.asuscomm.com:25565';

    navigator.clipboard.writeText(textToCopy).then(function () {
        alert('oddohome.asuscomm.com:25565 copied to clipboard!');
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
});

document.getElementById('vanilla-enhanced').addEventListener('click', function () {
    const textToCopy = 'oddohome.asuscomm.com:25566';

    navigator.clipboard.writeText(textToCopy).then(function () {
        alert('oddohome.asuscomm.com:25566 copied to clipboard!');
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
});