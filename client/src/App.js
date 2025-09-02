import React, { useState, useEffect } from "react";
import "./App.css";
import Home from "./components/Home";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import WaitingRoom from "./components/WaitingRoom";
import GameBoard from "./components/GameBoard";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [stage, setStage] = useState("home");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [playerNames, setPlayerNames] = useState({});
  const [gameState, setGameState] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState(null);
  const [winningPattern, setWinningPattern] = useState([]); // NEW
  const [chatMessages, setChatMessages] = useState([]);

  const opponentName = symbol === "X" ? playerNames["O"] : playerNames["X"];

  useEffect(() => {
    const wsUrl =
      process.env.REACT_APP_WS_URL ||
      (process.env.NODE_ENV === "production"
        ? window.location.origin.replace(/^http/, 'ws')
        : "ws://localhost:5000");

    try {
      const ws = new WebSocket(wsUrl);

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        alert("Connection error. Please try again later.");
      };

      setSocket(ws);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "player":
            setSymbol(data.symbol);
            setRoomId(data.roomId);
            setName(data.name);
            setPlayerNames(data.playerNames || {});
            console.log(`Player assigned: symbol=${data.symbol}, name=${data.name}`);
            setStage("waiting");
            break;
          case "start":
            setPlayerNames(data.playerNames);
            setCurrentPlayer(data.currentPlayer);
            setGameState(Array(9).fill(null)); // Ensure game state is reset
            setWinner(null);
            setWinningPattern([]);
            // Make sure symbol is correctly set for both players
            if (!symbol) {
              setSymbol(data.symbol || symbol);
            }
            setStage("game");
            break;
          case "update":
            setGameState(data.gameState);
            setCurrentPlayer(data.currentPlayer);
            setWinner(data.winner);
            setWinningPattern(data.winningPattern || []); // NEW
            break;
          case "chat":
            setChatMessages((prev) => [...prev, data.message]);
            break;
          case "reset":
            setGameState(data.gameState);
            setCurrentPlayer(data.currentPlayer);
            setPlayerNames(data.playerNames);
            setSymbol(data.symbol);
            setWinner(null);
            setWinningPattern([]); // NEW
            break;
          case "error":
            alert(data.message);
            console.error("Server error:", data.message);
            break;
          case "notification":
            // Handle notification messages (like player disconnects)
            console.log("Notification:", data.message);
            alert(data.message);
            break;
          default:
            console.log("Unknown message type:", data.type);
            break;
        }
      };

      return () => {
        if (ws) ws.close();
      };
    } catch (error) {
      console.error("WebSocket initialization error:", error);
      alert("Failed to connect to the game server. Please try again later.");
    }
  }, [symbol]); // Add symbol as a dependency

  const makeMove = (index) => {
    // Check if it's the player's turn and the cell is empty
    if (gameState[index] === null && !winner) {
      if (currentPlayer === symbol) {
        // Send the move to the server
        console.log(`Making move: index=${index}, symbol=${symbol}, currentPlayer=${currentPlayer}`);
        socket.send(JSON.stringify({ type: "move", index, symbol }));
      } else {
        console.log(`Not your turn: your symbol=${symbol}, currentPlayer=${currentPlayer}`);
      }
    } else if (gameState[index] !== null) {
      console.log("Cell already occupied");
    }
  };

  const sendChat = (message) => {
    if (!message.trim()) return;
    socket.send(JSON.stringify({ type: "chat", message }));
  };

  return (
    <div className="container">
      {stage === "home" && <Home setStage={setStage} />}
      {stage === "createName" && (
        <CreateRoom socket={socket} playerName={name} setPlayerName={setName} />
      )}
      {stage === "joinName" && (
        <JoinRoom
          socket={socket}
          playerName={name}
          setPlayerName={setName}
          roomId={roomId}
          setRoomId={setRoomId}
        />
      )}
      {stage === "waiting" && (
        <WaitingRoom
          roomId={roomId}
          name={name}
          symbol={symbol}
          opponentName={opponentName}
        />
      )}
      {stage === "game" && (
        <div className="game-container">
          <GameBoard
            socket={socket}
            gameState={gameState}
            makeMove={makeMove}
            symbol={symbol}
            playerNames={playerNames}
            winner={winner}
            currentPlayer={currentPlayer}
            winningPattern={winningPattern} // NEW
            chatMessages={chatMessages}
            sendChat={sendChat}
          />
        </div>
      )}
      {winner && (
        <div className="winner-overlay" onClick={() => setWinner(null)}>
          <div className="winner-message">
            {winner === "draw" ? (
              <>
                🤝 It's a Draw! 🤝
              </>
            ) : (
              <>
                🎉 Winner: {playerNames[winner]} 🎉
              </>
            )}
            <br />
            <small>(Click anywhere to close)</small>
          </div>
        </div>
      )}


    </div>
  );
}
