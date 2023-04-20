function appHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', `${window.innerHeight}px`);
};

window.addEventListener('resize', appHeight);
appHeight();


const params = new URLSearchParams(window.location.search);
const not_existing_prompt = document.querySelector("#not-existing-prompt");

if (params.has("badRequest") && params.get("badRequest")=="true") {
    console.log("something")
    not_existing_prompt.style.display = "block";
}