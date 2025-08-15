import React from "react";

export default function WaitingRoom({ roomId, name, symbol, opponentName }) {
    return (
        <>
            <div className="page-center">
                <h2>Room ID: {roomId}</h2>
                <p>You are: {symbol} ({name})</p>
                <p>
                    Waiting for opponent to join...
                    {opponentName ? ` Opponent: ${opponentName}` : ""}
                </p>
            </div>

        </>
    );
}
