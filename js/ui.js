// js/ui.js

let activeTypingInterval = null;

export function typeWriter(element, text, speed = 30) {
    if (activeTypingInterval) {
        clearInterval(activeTypingInterval);
    }
    element.innerHTML = '';
    let i = 0;
    const cursor = '<span class="cursor">|</span>';
    element.innerHTML = cursor;

    activeTypingInterval = setInterval(() => {
        if (i < text.length) {
            element.innerHTML = text.substring(0, i + 1) + cursor;
            i++;
        } else {
            element.innerHTML = text;
            clearInterval(activeTypingInterval);
        }
    }, speed);
}

export function showEchoText(echoContainer, echoTextElement, text) {
    echoTextElement.textContent = `"${text}"`;
    echoContainer.classList.add('visible');
    setTimeout(() => {
        echoContainer.classList.remove('visible');
    }, 3000);
}