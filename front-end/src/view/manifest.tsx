
export const Manifest = (props: {version: { value: string, error: boolean, msg: string}}) => {

    return (
        <form method="post">
            <fieldset>
                <label for="version">Version</label>
                <input
                    id="version"
                    name="version"
                    placeholder="1.0.0"
                    value={props.version.value}
                    aria-invalid={props.version.error ? true : undefined}
                />
                { props.version.error && props.version.msg ? <pre class="pico-background-red-500">{props.version.msg}</pre> : <></>} 
            </fieldset>

            <input
                type="submit"
                value="commit"
            />
        </form>
    );
}