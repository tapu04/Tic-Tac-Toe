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
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "player") {
        setPlayerSymbol(data.symbol);
        setRoomId(data.roomId);
        setJoinedRoom(true);
        setMessage(`You are Player ${data.symbol} in Room ${data.roomId}`);
        setChatMessages(data.chatHistory || []);
      }

      if (data.type === "update") {
        setGameState(data.gameState);
        setCurrentTurn(data.currentPlayer);
        setWinner(data.winner);
      }

      if (data.type === "chat") {
        setChatMessages((prev) => [...prev, data.message]);
      }

      if (data.type === "reset") {
        setGameState(Array(9).fill(null));
        setCurrentTurn("X");
        setWinner(null);
      }
    };
  }, []);

  const joinRoom = () => {
    if (roomId.trim()) {
      socket.send(JSON.stringify({ type: "join", roomId }));
    }
  };

  const handleClick = (index) => {
    if (gameState[index] === null && currentTurn === playerSymbol && !winner) {
      socket.send(JSON.stringify({ type: "move", index, symbol: playerSymbol }));
    }
  };

  const handleReset = () => {
    socket.send(JSON.stringify({ type: "reset" }));
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      socket.send(JSON.stringify({ type: "chat", message: chatInput, playerSymbol }));
      setChatInput("");
    }
  };

  return (
    <div className="container">
      <h1>Multiplayer Tic-Tac-Toe</h1>
      {!joinedRoom ? (
        <div className="room-join">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
          />
          <button onClick={joinRoom}>Join / Create Room</button>
        </div>
      ) : (
        <div className="game-chat-wrapper">
          {/* Game Board Section */}
          <div className="game-container">
            <p>{message}</p>
            {winner && <p className="winner">🎉 {winner === "draw" ? "It's a Draw!" : `Winner: ${winner}`}</p>}
            <div className="board">
              {gameState.map((cell, index) => (
                <div
                  key={index}
                  className="cell"
                  data-value={cell}
                  onClick={() => handleClick(index)}
                >
                  {cell}
                </div>
              ))}
            </div>
            <p>Current Turn: {currentTurn}</p>
            <button onClick={handleReset}>Reset Game</button>
          </div>

          {/* Chat Section */}
          <div className="chat-container">
            <h2>Chat</h2>
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <p key={idx}>{msg}</p>
              ))}
            </div>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
