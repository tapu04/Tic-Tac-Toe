import React from "react";

export default function JoinRoom({ socket, playerName, setPlayerName, roomId, setRoomId }) {
    const joinRoom = () => {
        if (!playerName.trim() || !roomId.trim()) return alert("Enter both name and room ID");
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "join", name: playerName.trim(), roomId: roomId.trim() }));
        } else {
            socket.onopen = () => socket.send(JSON.stringify({ type: "join", name: playerName.trim(), roomId: roomId.trim() }));
        }
    };

    const handleEnter = (e) => { if (e.key === "Enter") joinRoom(); };

    return (
        <><div className="page-center">
            <h2>Enter Your Name</h2>
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyDown={handleEnter} />
            <h2>Enter Room ID</h2>
            <input value={roomId} onChange={(e) => setRoomId(e.target.value)} onKeyDown={handleEnter} />
            <button onClick={joinRoom}>Join</button>
        </div>

        </>
    );
}
