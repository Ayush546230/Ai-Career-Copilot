import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { useAuthContext } from "../../context/AuthContext";
import Icon from "../../components/ui/Icon";
import axios from "axios";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getInitials(name = '') {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function timeAgo(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
function avatarColor(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ChatPage() {
    const { user } = useAuthContext();
    const { state } = useLocation();
    const navigate = useNavigate();

    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState(null);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [mobileView, setMobileView] = useState('inbox'); // 'inbox' | 'chat'

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const socketRef = useRef(null);

    const roomId = activeConv ? [user?.id, activeConv.id].sort().join("-") : null;

    // ── Responsive listener ───────────────────────────────────────
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    // ── Fetch conversation inbox ──────────────────────────────────
    const fetchConversations = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/chat/my-chats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data.conversations || []);
        } catch (_) {
            setConversations([]);
        } finally {
            setLoadingConvs(false);
        }
    }, []);

    // ── On mount: socket + auto-select from navigate state ────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('receive_message', (data) => {
            if (data.senderId !== user?.id) {
                setMessages(prev => [...prev, data]);
                fetchConversations();
            }
        });

        if (state?.recipient) {
            setActiveConv({ id: state.recipient.id, name: state.recipient.name });
            setMobileView('chat');
        }

        fetchConversations();
        return () => newSocket.disconnect();
    }, []); // eslint-disable-line

    // ── Load messages when active conv changes ────────────────────
    useEffect(() => {
        if (!roomId || !socketRef.current) return;
        setMessages([]);
        setLoadingMsgs(true);
        socketRef.current.emit('join_room', roomId);

        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/chat/history/${roomId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setMessages(res.data.messages || []))
            .catch(() => { })
            .finally(() => setLoadingMsgs(false));

        setTimeout(() => inputRef.current?.focus(), 100);
    }, [roomId]);

    // ── Auto scroll ───────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Send message ──────────────────────────────────────────────
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || !activeConv || sending) return;
        setSending(true);

        const msgData = {
            roomId,
            senderId: user?.id,
            senderName: user?.profile?.firstName || 'Me',
            text: input.trim(),
            timestamp: new Date().toISOString()
        };

        socket.emit("send_message", msgData);
        setMessages(prev => [...prev, msgData]);
        setInput("");

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/chat/send`, { roomId, text: msgData.text }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchConversations();
        } catch (_) { }
        finally { setSending(false); }
    };

    // ── Select conversation ───────────────────────────────────────
    const selectConversation = (conv) => {
        setActiveConv({ id: conv.recipientId, name: conv.recipientName });
        setMobileView('chat');
        navigate('/dashboard/chat', {
            state: { recipient: { id: conv.recipientId, name: conv.recipientName } },
            replace: true
        });
    };

    const goBackToInbox = () => {
        setMobileView('inbox');
        setActiveConv(null);
    };

    // ─────────────────────────────────────────────────────────────
    // STYLES
    // ─────────────────────────────────────────────────────────────
    const msgAreaBg = {
        backgroundImage: `linear-gradient(135deg, #0f0f1a 0%, #12101e 50%, #0d1117 100%), radial-gradient(circle, rgba(99,102,241,0.04) 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 28px 28px',
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────
    const showInbox = !isMobile || mobileView === 'inbox';
    const showChat = !isMobile || mobileView === 'chat';

    return (
        <>
            <style>{`
                .msgs-scroll::-webkit-scrollbar { width: 4px; }
                .msgs-scroll::-webkit-scrollbar-track { background: transparent; }
                .msgs-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
                .conv-item:hover { background: rgba(255,255,255,0.04) !important; }
                .chat-input::placeholder { color: #64748b !important; opacity: 1; }
            `}</style>

            <div style={{
                display: 'flex',
                height: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 80px)',
                borderRadius: isMobile ? 0 : 'var(--radius)',
                border: isMobile ? 'none' : '1px solid var(--border)',
                overflow: 'hidden',
                maxWidth: isMobile ? '100%' : 1100,
                margin: '0 auto',
            }}>

                {/* ════ LEFT: INBOX ════ */}
                {showInbox && (
                    <div style={{
                        width: isMobile ? '100%' : 300,
                        minWidth: isMobile ? 'unset' : 280,
                        borderRight: isMobile ? 'none' : '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--surface)',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: isMobile ? '16px 20px' : '16px 20px 14px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <h2 style={{ fontSize: isMobile ? 20 : 18, fontWeight: 700, margin: 0 }}>Messages</h2>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <div style={{
                                width: 36, height: 36,
                                background: 'rgba(99,102,241,0.12)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Icon name="mail" size={16} color="#6366f1" />
                            </div>
                        </div>

                        {/* Conversation list */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {loadingConvs ? (
                                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                    Loading conversations...
                                </div>
                            ) : conversations.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center' }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                                        No conversations yet
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                        Start chatting with your {user?.role === 'mentor' ? 'students' : 'mentor'}!
                                    </div>
                                </div>
                            ) : (
                                conversations.map((conv) => {
                                    const isActive = !isMobile && activeConv?.id === conv.recipientId;
                                    const color = avatarColor(conv.recipientName);
                                    return (
                                        <div
                                            key={conv.roomId}
                                            className="conv-item"
                                            onClick={() => selectConversation(conv)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 14,
                                                padding: isMobile ? '16px 20px' : '13px 16px',
                                                cursor: 'pointer',
                                                background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <div style={{
                                                width: isMobile ? 50 : 44,
                                                height: isMobile ? 50 : 44,
                                                borderRadius: '50%',
                                                background: color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 700,
                                                fontSize: isMobile ? 17 : 15,
                                                flexShrink: 0,
                                                boxShadow: isActive ? `0 0 0 3px ${color}33` : 'none',
                                            }}>
                                                {getInitials(conv.recipientName)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 600, fontSize: isMobile ? 15 : 14, color: isActive ? '#6366f1' : 'var(--text)' }}>
                                                        {conv.recipientName}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 6 }}>
                                                        {timeAgo(conv.lastMessageAt)}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    fontSize: 13, color: 'var(--text-muted)', marginTop: 3,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {conv.lastMessage}
                                                </div>
                                            </div>
                                            {!conv.isRead && !isActive && (
                                                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                                            )}
                                            {isMobile && (
                                                <Icon name="chevron-right" size={16} color="var(--text-muted)" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* ════ RIGHT: CHAT WINDOW ════ */}
                {showChat && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        {!activeConv ? (
                            /* Desktop empty state */
                            <div style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 16,
                                ...msgAreaBg,
                            }}>
                                <div style={{
                                    width: 80, height: 80,
                                    background: 'rgba(99,102,241,0.1)', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Icon name="mail" size={36} color="#6366f1" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                                        Select a conversation
                                    </div>
                                    <div style={{ fontSize: 13, color: '#64748b' }}>
                                        Choose from the left to start chatting
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat header */}
                                <div style={{
                                    padding: isMobile ? '13px 16px' : '14px 24px',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: 'var(--surface)',
                                    flexShrink: 0,
                                }}>
                                    {isMobile && (
                                        <button onClick={goBackToInbox} style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: '4px 10px 4px 0',
                                            display: 'flex', alignItems: 'center', color: '#6366f1',
                                        }}>
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </button>
                                    )}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        background: avatarColor(activeConv.name),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 700, fontSize: 15, flexShrink: 0,
                                    }}>
                                        {getInitials(activeConv.name)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: 700, fontSize: isMobile ? 15 : 16,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            color: 'var(--text)',
                                        }}>
                                            {activeConv.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                                            Online
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="msgs-scroll" style={{
                                    flex: 1, overflowY: 'auto',
                                    padding: isMobile ? '14px 12px' : '24px',
                                    display: 'flex', flexDirection: 'column', gap: 10,
                                    ...msgAreaBg,
                                }}>
                                    {loadingMsgs ? (
                                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 48 }}>
                                            Loading messages...
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 60 }}>
                                            No messages yet. Say hi! 👋
                                        </div>
                                    ) : (
                                        messages.map((m, i) => {
                                            const isMe = m.senderId === user?.id;
                                            return (
                                                <div key={i} style={{
                                                    display: 'flex', flexDirection: 'column',
                                                    alignItems: isMe ? 'flex-end' : 'flex-start',
                                                }}>
                                                    <div style={{
                                                        maxWidth: isMobile ? '82%' : '68%',
                                                        padding: '11px 16px',
                                                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                        background: isMe ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#2a2d3e',
                                                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                                        color: '#e2e8f0',
                                                        fontSize: isMobile ? 15 : 14,
                                                        lineHeight: 1.6,
                                                        wordBreak: 'break-word',
                                                        boxShadow: isMe ? '0 2px 12px rgba(99,102,241,0.3)' : '0 1px 4px rgba(0,0,0,0.3)',
                                                    }}>
                                                        {m.text}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 10, color: '#64748b', marginTop: 3,
                                                        paddingLeft: isMe ? 0 : 4,
                                                        paddingRight: isMe ? 4 : 0,
                                                    }}>
                                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input bar */}
                                <form onSubmit={handleSend} style={{
                                    padding: isMobile ? '10px 12px' : '14px 24px',
                                    borderTop: '1px solid var(--border)',
                                    display: 'flex', gap: 10, alignItems: 'center',
                                    background: 'var(--surface)',
                                    flexShrink: 0,
                                }}>
                                    <input
                                        ref={inputRef}
                                        className="chat-input"
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={`Message ${activeConv.name}...`}
                                        style={{
                                            flex: 1, minWidth: 0,
                                            background: '#f1f5f9',
                                            border: '1.5px solid #e2e8f0',
                                            borderRadius: '100px',
                                            padding: isMobile ? '11px 18px' : '12px 20px',
                                            color: '#0f172a',
                                            outline: 'none',
                                            fontSize: isMobile ? 15 : 14,
                                            caretColor: '#6366f1',
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    />
                                    <button type="submit" disabled={!input.trim() || sending} style={{
                                        width: 44, height: 44, borderRadius: '50%',
                                        background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)',
                                        border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                                        flexShrink: 0,
                                        boxShadow: input.trim() ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                                        transition: 'all 0.2s',
                                    }}>
                                        <Icon name="send" size={17} color="white" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
