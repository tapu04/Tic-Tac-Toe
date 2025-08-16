const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- Game Data ---
const rooms = {};

function checkWinner(gameState) {
    const patterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let pattern of patterns) {
        const [a, b, c] = pattern;
        if (
            gameState[a] &&
            gameState[a] === gameState[b] &&
            gameState[a] === gameState[c]
        ) {
            return { winner: gameState[a], pattern };
        }
    }

    if (gameState.every((cell) => cell !== null)) {
        return { winner: "draw", pattern: [] };
    }

    return { winner: null, pattern: [] };
}

// --- WebSocket Logic ---
wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case "create":
                const roomId = Math.random().toString(36).substr(2, 5);
                rooms[roomId] = {
                    players: [ws],
                    gameState: Array(9).fill(null),
                    currentPlayer: "X",
                    playerNames: { X: data.name, O: "" },
                };
                ws.roomId = roomId;
                ws.symbol = "X";
                ws.playerName = data.name;
                ws.send(
                    JSON.stringify({
                        type: "player",
                        symbol: "X",
                        roomId,
                        name: data.name,
                        playerNames: rooms[roomId].playerNames,
                    })
                );
                break;

            case "join":
                if (rooms[data.roomId] && rooms[data.roomId].players.length < 2) {
                    const room = rooms[data.roomId];
                    room.players.push(ws);
                    ws.roomId = data.roomId;
                    ws.symbol = "O";
                    ws.playerName = data.name;
                    room.playerNames.O = data.name;

                    room.players.forEach((player) => {
                        player.send(
                            JSON.stringify({
                                type: "start",
                                playerNames: room.playerNames,
                                currentPlayer: room.currentPlayer,
                            })
                        );
                    });
                } else {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Room is full or doesn't exist",
                        })
                    );
                }
                break;

            case "move":
                const moveRoom = rooms[ws.roomId];
                if (!moveRoom) return;

                if (
                    moveRoom.currentPlayer === data.symbol &&
                    moveRoom.gameState[data.index] === null
                ) {
                    moveRoom.gameState[data.index] = data.symbol;
                    const { winner, pattern } = checkWinner(moveRoom.gameState);

                    if (winner) {
                        moveRoom.players.forEach((player) => {
                            player.send(
                                JSON.stringify({
                                    type: "update",
                                    gameState: moveRoom.gameState,
                                    currentPlayer: moveRoom.currentPlayer,
                                    winner,
                                    winningPattern: pattern,
                                })
                            );
                        });
                    } else {
                        moveRoom.currentPlayer = data.symbol === "X" ? "O" : "X";
                        moveRoom.players.forEach((player) => {
                            player.send(
                                JSON.stringify({
                                    type: "update",
                                    gameState: moveRoom.gameState,
                                    currentPlayer: moveRoom.currentPlayer,
                                    winner: null,
                                    winningPattern: [],
                                })
                            );
                        });
                    }
                }
                break;

            case "chat":
                const chatRoom = rooms[ws.roomId];
                if (!chatRoom) return;
                chatRoom.players.forEach((player) => {
                    player.send(
                        JSON.stringify({
                            type: "chat",
                            message: `${ws.playerName}: ${data.message}`,
                        })
                    );
                });
                break;

            case "reset":
                const resetRoom = rooms[ws.roomId];
                if (!resetRoom) return;
                resetRoom.gameState = Array(9).fill(null);
                resetRoom.currentPlayer = "X";
                resetRoom.players.forEach((player) => {
                    player.send(
                        JSON.stringify({
                            type: "reset",
                            gameState: resetRoom.gameState,
                            currentPlayer: resetRoom.currentPlayer,
                            playerNames: resetRoom.playerNames,
                            symbol: player.symbol,
                        })
                    );
                });
                break;
        }
    });

    ws.on("close", () => {
        if (ws.roomId && rooms[ws.roomId]) {
            const room = rooms[ws.roomId];
            room.players = room.players.filter((p) => p !== ws);
            if (room.players.length === 0) {
                delete rooms[ws.roomId];
            }
        }
    });
});

// --- Serve React Frontend ---
app.use(express.static(path.join(__dirname, "client", "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
);
