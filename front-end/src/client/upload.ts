

const htmx = (window as any).htmx;
htmx.on('#upload-form', 'htmx:xhr:progress', function (evt: any) {
    htmx.find('#progress').setAttribute('value', evt.detail.loaded / evt.detail.total * 100)
});

const openDialog = (open: boolean = true) => () => {
    const dialog = document.getElementsByTagName("dialog")[0];
    console.log("OPEN dialog", dialog);

    if (dialog) {
        console.log("OPEN dialog", dialog);
        dialog.open = open;
    }
};
const dialogButton = document.getElementById("open-dialog-upload") as HTMLButtonElement;
if (dialogButton) {
    dialogButton.onclick = openDialog(true);
}
const dialogCloseButton = document.getElementById("close-dialog-upload") as HTMLButtonElement;
if (dialogCloseButton) {
    dialogCloseButton.onclick = openDialog(false);
}

const refreshPageButton = document.getElementById("refresh-page") as HTMLButtonElement;
if (refreshPageButton) {
    refreshPageButton.onclick = () => {
        window.location.reload();
    }
}