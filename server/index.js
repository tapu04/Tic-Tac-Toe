const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("✅ WebSocket Multiplayer Tic-Tac-Toe Server is Running...");
});

// Store game rooms
const rooms = {};

// Function to check for a winner
const checkWinner = (gameState) => {
    const winningPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (let pattern of winningPatterns) {
        const [a, b, c] = pattern;
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a]; // "X" or "O" is the winner
        }
    }

    return gameState.includes(null) ? null : "draw"; // Draw if no empty spaces
};

// Handle WebSocket connections
wss.on("connection", (ws) => {
    let playerRoom = null;
    let playerSymbol = null;

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        // Join or create a room
        if (data.type === "join") {
            let roomId = data.roomId || uuidv4();
            if (!rooms[roomId]) {
                rooms[roomId] = {
                    players: [],
                    gameState: Array(9).fill(null),
                    currentPlayer: "X",
                    winner: null,
                    chatMessages: [] // Store chat history
                };
            }

            if (rooms[roomId].players.length < 2) {
                playerSymbol = rooms[roomId].players.length === 0 ? "X" : "O";
                rooms[roomId].players.push(ws);
                playerRoom = roomId;

                ws.send(JSON.stringify({
                    type: "player",
                    symbol: playerSymbol,
                    roomId,
                    chatHistory: rooms[roomId].chatMessages // Send chat history to new player
                }));
            } else {
                ws.send(JSON.stringify({ type: "full", roomId }));
            }
        }

        // Handle moves
        if (data.type === "move" && rooms[playerRoom] && !rooms[playerRoom].winner) {
            let room = rooms[playerRoom];
            if (room.gameState[data.index] === null && data.symbol === room.currentPlayer) {
                room.gameState[data.index] = data.symbol;
                room.currentPlayer = room.currentPlayer === "X" ? "O" : "X";

                // Check for a winner
                const winner = checkWinner(room.gameState);
                if (winner) {
                    room.winner = winner;
                }

                room.players.forEach((player) => {
                    player.send(JSON.stringify({
                        type: "update",
                        gameState: room.gameState,
                        currentPlayer: room.currentPlayer,
                        winner: room.winner
                    }));
                });
            }
        }

        // Handle chat messages
        if (data.type === "chat" && rooms[playerRoom]) {
            const chatMessage = `${playerSymbol}: ${data.message}`; // Ensure only one symbol is added
            rooms[playerRoom].chatMessages.push(chatMessage); // Store chat history

            rooms[playerRoom].players.forEach((player) => {
                player.send(JSON.stringify({
                    type: "chat",
                    message: `${playerSymbol}: ${data.message}`
                }));
            });
        }

        // Reset game
        if (data.type === "reset" && rooms[playerRoom]) {
            rooms[playerRoom].gameState = Array(9).fill(null);
            rooms[playerRoom].currentPlayer = "X";
            rooms[playerRoom].winner = null;
            rooms[playerRoom].players.forEach((player) => {
                player.send(JSON.stringify({ type: "reset", gameState: rooms[playerRoom].gameState }));
            });
        }
    });

    // Handle disconnection
    ws.on("close", () => {
        if (playerRoom && rooms[playerRoom]) {
            rooms[playerRoom].players = rooms[playerRoom].players.filter((player) => player !== ws);
            if (rooms[playerRoom].players.length === 0) {
                delete rooms[playerRoom];
            }
        }
    });
});

// Start the server
server.listen(5000, "localhost", () => {
    console.log("✅ Server is running on http://localhost:5000/");
});
