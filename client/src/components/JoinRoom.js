import React from "react";

export default function JoinRoom({ socket, playerName, setPlayerName, roomId, setRoomId }) {
    const joinRoom = () => {
        if (!playerName.trim() || !roomId.trim()) return alert("Enter both name and room ID");

        // Check if socket exists
        if (!socket) {
            return alert("Connection to server not established. Please refresh the page.");
        }

        // Check if socket is open
        if (socket.readyState === 1) { // WebSocket.OPEN is 1
            console.log(`Attempting to join room: ${roomId.trim()} as ${playerName.trim()}`);
            socket.send(JSON.stringify({ type: "join", name: playerName.trim(), roomId: roomId.trim() }));
        } else {
            console.log(`Socket not ready. Current state: ${socket.readyState}`);
            alert("Connection to server not ready. Please wait a moment and try again.");
            socket.onopen = () => {
                console.log("Socket opened. Now sending join request.");
                socket.send(JSON.stringify({ type: "join", name: playerName.trim(), roomId: roomId.trim() }));
            };
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
