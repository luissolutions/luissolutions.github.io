document.querySelectorAll('a[data-src]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const newSrc = this.getAttribute('data-src');
        const iframe = document.getElementById('contentIframe');
        iframe.src = newSrc;
    });
});

function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(function () {
        alert(label + ' copied to clipboard!');
    }, function (err) {
        console.error('Could not copy text: ', err);
    });
}

document.getElementById('server-java')?.addEventListener('click', function () {
    copyToClipboard('wish-midwest.gl.joinmc.link', 'Java Edition — wish-midwest.gl.joinmc.link');
});

document.getElementById('server-bedrock')?.addEventListener('click', function () {
    copyToClipboard('wish-midwest.gl.at.ply.gg:27443', 'Bedrock Edition — wish-midwest.gl.at.ply.gg:27443');
});

document.getElementById('server-triforce1')?.addEventListener('click', function () {
    copyToClipboard('oddohome.asuscomm.com:25566', 'Triforce — oddohome.asuscomm.com:25566');
});

document.getElementById('server-triforce2')?.addEventListener('click', function () {
    copyToClipboard('oddohome.asuscomm.com:25565', 'Triforce 2 — oddohome.asuscomm.com:25565');
});
