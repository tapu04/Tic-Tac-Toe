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
                console.log(`Creating new room with ID: ${roomId} for player: ${data.name}`);

                rooms[roomId] = {
                    players: [ws],
                    gameState: Array(9).fill(null),
                    currentPlayer: "X",
                    playerNames: { X: data.name, O: "" },
                    starter: "X", // Add the starter property
                    createdAt: new Date().toISOString()
                };
                ws.roomId = roomId;
                ws.symbol = "X";
                ws.playerName = data.name;

                console.log(`Room ${roomId} created. Active rooms: ${Object.keys(rooms).length}`);

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
                console.log(`Join request received for room: ${data.roomId} from player: ${data.name}`);

                // Check if room exists
                if (!rooms[data.roomId]) {
                    console.log(`Room ${data.roomId} does not exist`);
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Room does not exist. Please check the room ID.",
                        })
                    );
                    return;
                }

                // Check if room is full
                if (rooms[data.roomId].players.length >= 2) {
                    console.log(`Room ${data.roomId} is already full`);
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "This room is already full. Please create a new room or join a different one.",
                        })
                    );
                    return;
                }

                // Join the room
                const room = rooms[data.roomId];
                console.log(`Player ${data.name} joining room ${data.roomId}`);
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
                            gameState: room.gameState,
                            symbol: player.symbol, // Include the player's symbol in the start message
                        })
                    );
                });
                break;

            case "move":
                const moveRoom = rooms[ws.roomId];
                if (!moveRoom) return;

                // Check if it's the player's turn and if the cell is empty
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

                // Alternate starter each reset
                resetRoom.starter = resetRoom.starter === "X" ? "O" : "X";
                resetRoom.currentPlayer = resetRoom.starter;
                resetRoom.gameState = Array(9).fill(null);

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
            console.log(`Player ${ws.playerName} disconnected from room ${ws.roomId}`);

            // Remove the player from the room
            room.players = room.players.filter((p) => p !== ws);

            // Notify remaining players
            if (room.players.length > 0) {
                room.players.forEach(player => {
                    player.send(JSON.stringify({
                        type: "notification",
                        message: `${ws.playerName} has left the game.`
                    }));
                });
            }

            // Delete the room if empty
            if (room.players.length === 0) {
                console.log(`Room ${ws.roomId} is now empty. Deleting room.`);
                delete rooms[ws.roomId];
                console.log(`Remaining rooms: ${Object.keys(rooms).length}`);
            }
        }
    });
});

// --- Serve React Frontend ---
// --- Serve React Frontend ---
app.use(express.static(path.join(__dirname, "..", "client", "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});


// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
);
