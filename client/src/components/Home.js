import React from "react";

export default function Home({ setStage }) {
    const handleKeyPress = (e) => {
        if (e.key === "Enter") setStage("createName");
    };

    return (
        <>
            <div className="page-center">
                <h1>Multiplayer Tic-Tac-Toe</h1>
                <button onClick={() => setStage("createName")}>Create Room</button>
                <button onClick={() => setStage("joinName")}>Join Room</button>
            </div>
        </>
    );
}
