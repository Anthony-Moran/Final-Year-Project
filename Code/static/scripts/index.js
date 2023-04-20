function appHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', `${window.innerHeight}px`);
};

window.addEventListener('resize', appHeight);
appHeight();

const JOIN_CODE_INPUT = document.querySelector("join-input");
const JOIN_BUTTON = document.querySelector("join-button");