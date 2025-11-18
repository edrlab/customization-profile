

document.addEventListener("DOMContentLoaded", () => {

    console.log(window);
    console.log((window as any).htmx);
    (window as any).htmx.logAll();

    const htmx = (window as any).htmx;

    htmx.on('#upload-form', 'htmx:xhr:progress', function(evt: any) {
          htmx.find('#progress').setAttribute('value', evt.detail.loaded/evt.detail.total * 100)
        });
});