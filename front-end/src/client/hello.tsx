import React from "react";
import { createRoot } from 'react-dom/client';

interface EntryData {
    id: number;
    lang: string;
    content: string;
}

export const Hello = (props: { id: string }) => {

    const externalStateRef = React.useRef(JSON.parse((document.getElementById(props.id) as HTMLTextAreaElement).value || '{}'));
    const setState = (value: any) => {
        (document.getElementById(props.id) as HTMLTextAreaElement).value = JSON.stringify(value, null, 4);
        externalStateRef.current = value;
    }
    const [entries, setEntries] = React.useState<EntryData[]>([{ id: 1, lang: 'en', content: '' }]);

    React.useEffect(() => {
        const initialData = externalStateRef.current;
        const initialEntries: EntryData[] = Object.entries(initialData).map(([key, value], index) => ({
            id: index + 1,
            lang: key,
            content: value as string,
        }));

        if (initialEntries.length > 0) {
            setEntries(initialEntries);
        }
    }, []);

    const handleChange = (id: number, field: keyof Omit<EntryData, 'id'>, value: string) => {
        setEntries(prevEntries =>
            prevEntries.map(entry =>
                entry.id === id ? { ...entry, [field]: value } : entry
            )
        );
    };

    const handleAddEntry = () => {
        const maxId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) : 0;
        const newId = maxId + 1;
        setEntries(prevEntries => [...prevEntries, { id: newId, lang: '', content: '' }]);
    };

    const handleRemoveEntry = (idToRemove: number) => {
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== idToRemove));
    };

    const handleSubmit = () => {
        const newExternalState: { [key: string]: string } = {};
        entries.forEach(entry => {
            if (entry.lang && entry.content) {
                newExternalState[entry.lang] = entry.content;
            }
        });
        setState(newExternalState);
    };

    return (
        <>
            {entries.map((entry) => (
                <div
                    key={entry.id}
                    className="input-wrapper"
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "end",
                        width: '100%',
                        border: "var(--pico-border-width) solid var(--pico-border-color)",
                        borderRadius: "5px",
                        padding: "10px",
                        marginBottom: "10px",
                        backgroundColor: "var(--pico-background-color)",
                    }}
                >
                    <div className="input-container" style={{ width: "120px" }}>
                        <label htmlFor={`lang-${entry.id}`}>Lang</label>
                        <input
                            name={`lang-${entry.id}`}
                            placeholder="en"
                            style={{ margin: "0" }}
                            value={entry.lang}
                            onChange={(e) => handleChange(entry.id, 'lang', e.target.value)}
                        />
                    </div>
                    <div className="input-container" style={{ width: "100%" }}>
                        <label htmlFor={`title-${entry.id}`}>{props.id}</label>
                        <input
                            name={`title-${entry.id}`}
                            style={{ margin: "0" }}
                            value={entry.content}
                            onChange={(e) => handleChange(entry.id, 'content', e.target.value)}
                        />
                    </div>
                    {entry.id > 1 ?
                        <button
                            onClick={() => handleRemoveEntry(entry.id)}
                            style={{ padding: "10px", cursor: "pointer" }}
                            title="Delete this entry"
                        >
                            X
                        </button>
                        : <></>
                    }
                </div>
            ))}
            <div style={{justifySelf: 'end'}}>
                <button
                    onClick={handleAddEntry}
                    style={{ padding: "10px", cursor: "pointer", marginRight: "10px" }}
                >
                    + Add Entry
                </button>
                <button
                    onClick={handleSubmit}
                    style={{ padding: "10px", cursor: "pointer" }}
                >
                    Submit & Update
                </button>
            </div>
        </>
    );
}


document.addEventListener("DOMContentLoaded", () => {
    console.log("LOADED");
    {
        const domNode = document.getElementById('__title_react_root_node') as HTMLElement;
        const root = createRoot(domNode);
        root.render(<Hello id={"title"} />);
    }
    {
        const domNode = document.getElementById('__desc_react_root_node') as HTMLElement;
        const root = createRoot(domNode);
        root.render(<Hello id={"description"} />);
    }
});
