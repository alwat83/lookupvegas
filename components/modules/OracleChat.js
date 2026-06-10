"use client";
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../app/contexts/AuthContext';
import styles from './OracleChat.module.css';

export default function OracleChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Terminal Oracle initialized. Ask me about flight velocities, event multipliers, or historical CVI compression.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (user) {
                const token = await user.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch('/api/oracle', {
                method: 'POST',
                headers,
                body: JSON.stringify({ query: userMsg })
            });
            const data = await res.json();
            
            setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Error connecting to Oracle mainframe.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={styles.oracleContainer + ' glass-panel'}>
            <div className={styles.oracleHeader}>
                <div className="live-indicator" style={{ marginRight: '8px' }}></div>
                <h3 className="glow-text" style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-compression)' }}>The Oracle</h3>
            </div>
            
            <div className={styles.chatWindow}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userMsg : styles.assistantMsg}`}>
                        <div className={styles.messageBubble}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className={`${styles.messageWrapper} ${styles.assistantMsg}`}>
                        <div className={styles.messageBubble + ' ' + styles.typingIndicator}>
                            Processing telemetry...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className={styles.inputForm}>
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask about F1 impact, current CVI, or live flights..."
                    className={styles.chatInput}
                />
                <button type="submit" className={styles.sendBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
}
