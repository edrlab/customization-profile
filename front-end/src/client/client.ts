

document.addEventListener("DOMContentLoaded", () => {

    console.log(window);
    console.log((window as any).htmx);
    (window as any).htmx.logAll();

    // const htmx = (window as any).htmx;

});