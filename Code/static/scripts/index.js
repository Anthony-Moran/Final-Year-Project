var appHeight = function () {
    var doc = document.documentElement;
    doc.style.setProperty('--app-height', "".concat(window.innerHeight, "px"));
};
window.addEventListener('resize', appHeight);
appHeight();
