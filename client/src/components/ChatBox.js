import React, { useRef, useEffect, useState } from "react";

export default function ChatBox({ chatMessages, sendChat, playerNames, symbol }) {
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendChat(input.trim());
        setInput("");
    };

    const handleEnter = (e) => {
        if (e.key === "Enter") handleSend();
    };

    return (
        <div className="chat-container">
            <div className="chatbox-header"><h3>Chat</h3></div>
            <div className="chat-box">
                {chatMessages.map((msg, i) => {
                    const isSelf = msg.startsWith(`${playerNames[symbol]}:`); // your messages
                    return (
                        <div
                            key={i}
                            className={`chat-message ${isSelf ? "self" : "opponent"}`}
                        >
                            {msg}
                        </div>
                    );
                })}
                <div ref={chatEndRef}></div>
            </div>
            <div className="chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleEnter}
                    placeholder="Type a message..."
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}
