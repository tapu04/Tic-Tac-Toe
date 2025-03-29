import React, { useState, useEffect } from "react";
import "./App.css";

const socket = new WebSocket("ws://localhost:5000");

const App = () => {
  const [gameState, setGameState] = useState(Array(9).fill(null));
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [currentTurn, setCurrentTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "player") {
        setPlayerSymbol(data.symbol);
        setRoomId(data.roomId);
        setJoinedRoom(true);
        setMessage(`You are Player ${data.symbol} in Room ${data.roomId}`);
      }

      if (data.type === "update") {
        setGameState(data.gameState);
        setCurrentTurn(data.currentPlayer);
        setWinner(data.winner);
      }

      if (data.type === "reset") {
        setGameState(Array(9).fill(null));
        setCurrentTurn("X");
        setWinner(null);
      }
    };
  }, []);

  const joinRoom = () => {
    const newRoomId = roomId || Math.random().toString(36).substr(2, 5);
    socket.send(JSON.stringify({ type: "join", roomId: newRoomId }));
  };

  const handleClick = (index) => {
    if (!winner && gameState[index] === null && playerSymbol === currentTurn) {
      socket.send(JSON.stringify({ type: "move", index, symbol: playerSymbol }));
    }
  };

  const handleReset = () => {
    socket.send(JSON.stringify({ type: "reset" }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="container">
      <h1>Multiplayer Tic-Tac-Toe</h1>
      {!joinedRoom ? (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={joinRoom}>Join / Create Room</button>
        </div>
      ) : (
        <>
          <p>{message}</p>
          {winner && <p className="winner">🎉 {winner === "draw" ? "It's a Draw!" : `Winner: ${winner}`}</p>}
          <div className="board">
            {gameState.map((cell, index) => (
              <div key={index} className="cell" onClick={() => handleClick(index)}>
                {cell}
              </div>
            ))}
          </div>
          <div className="current-turn">
            <p>Current Turn: {currentTurn}</p>
          </div>
          <button onClick={handleReset}>Reset Game</button>
        </>
      )}
    </div>
  );
};

export default App;


//made by Bhabani Shankar Jena