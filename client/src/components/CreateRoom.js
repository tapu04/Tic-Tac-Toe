import React from "react";

export default function CreateRoom({ socket, playerName, setPlayerName }) {
    const createRoom = () => {
        if (!playerName.trim()) return alert("Enter your name");
        if (socket && socket.readyState === 1) { // WebSocket.OPEN is 1
            socket.send(JSON.stringify({ type: "create", name: playerName.trim() }));
        } else if (socket) {
            socket.onopen = () => socket.send(JSON.stringify({ type: "create", name: playerName.trim() }));
        }
    };

    const handleEnter = (e) => { if (e.key === "Enter") createRoom(); };

    return (
        <>
            <div className="page-center">
                <h2>Enter Your Name</h2>
                <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyDown={handleEnter} />
                <button onClick={createRoom}>Create</button>
            </div>

        </>
    );
}
