import React from "react";
import ChatBox from "./ChatBox";

export default function GameBoard({
    socket,
    gameState,
    makeMove,
    symbol,
    playerNames,
    winner,
    currentPlayer,
    winningPattern, // NEW
    chatMessages,
    sendChat
}) {
    const handleReset = () => {
        socket.send(JSON.stringify({ type: "reset" }));
    };

    const isWinningCell = (index) => {
        return winningPattern.includes(index); // NEW
    };

    return (
        <div className="game-container">
            {/* HEADER */}
            <div className="header">
                <h2 className="match-title">
                    <span className="badge-x">
                        {playerNames.X} (X)
                    </span>
                    <span className="vs"> VS </span>
                    <span className="badge-o">
                        {playerNames.O} (O)
                    </span>
                </h2>

                <h3 className="you-label">
                    You: <span className={symbol === "X" ? "badge-x" : "badge-o"}>
                        {playerNames[symbol]} ({symbol})
                    </span>
                </h3>

                <h3 className="turn-label">
                    Current Turn: <span className={currentPlayer === "X" ? "badge-x" : "badge-o"}>
                        {playerNames[currentPlayer]} ({currentPlayer})
                    </span>
                </h3>
            </div>



            {/* BOARD + CHAT */}
            <div className="game-chat-wrapper">
                {/* GAME BOARD */}
                <div className="game-board-wrapper">
                    <div className="board">
                        {gameState.map((cell, idx) => (
                            <div
                                key={idx}
                                className={`cell ${cell ? cell : ""} ${isWinningCell(idx) ? "win-cell" : ""}`}
                                onClick={() => makeMove(idx)}
                                style={{ aspectRatio: "1 / 1" }}
                            >
                                {cell && <span className={cell}>{cell}</span>}
                            </div>
                        ))}
                    </div>

                    {(gameState.some(c => c !== null) || winner) && (
                        <button className="reset-btn" onClick={handleReset}>
                            Reset Game
                        </button>
                    )}
                </div>

                {/* CHAT BOX */}
                <ChatBox
                    chatMessages={chatMessages}
                    sendChat={sendChat}
                    playerNames={playerNames}
                    symbol={symbol}
                />
            </div>
        </div>
    );
}
