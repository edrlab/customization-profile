
export const Login = (props: { invalid: boolean}) => {
    return (
        <>
            <h1>Sign in</h1>
            <form action="/login/validate" method="post">
                <input
                    type="text"
                    name="username"
                    placeholder="username"
                    aria-label="username"
                    autoComplete="username"
                    required
                    aria-invalid={props.invalid ? true : undefined}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    aria-label="Password"
                    autoComplete="current-password"
                    required
                    aria-invalid={props.invalid ? true : undefined}
                />
                <fieldset>
                    <label htmlFor="remember">
                        <input type="checkbox" role="switch" id="remember" name="remember" />
                        Remember me
                    </label>
                </fieldset>
                <button type="submit">
                    Login
                </button>
            </form>
        </>
    );
}