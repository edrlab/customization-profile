import React from "react";
import { createRoot } from 'react-dom/client';

export const Hello = (props: {id: string}) => {

    const [count, setCount] = React.useState(10);
    const state = JSON.parse((document.getElementById(props.id) as HTMLTextAreaElement).value);
    const setState = (value: any) => {
        (document.getElementById(props.id) as HTMLTextAreaElement).value = JSON.stringify(value, null, 4);
    }

    return (
        <>
            <h1>Hello World <span>{count}</span></h1><button onClick={() => {
                setCount((count) => count + 1); setState({ ...state, "fr": "1234" });
            }}>Add</button>
            <pre>{ }</pre>
        </>
    );


}


document.addEventListener("DOMContentLoaded", () => {
    console.log("LOADED");
    {
        const domNode = document.getElementById('__title_react_root_node') as HTMLElement;
        const root = createRoot(domNode);
        root.render(<Hello id={"title"}/>);
    }
    {
        const domNode = document.getElementById('__desc_react_root_node') as HTMLElement;
        const root = createRoot(domNode);
        root.render(<Hello id={"description"}/>);
    }
});
