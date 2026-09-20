import React, { useState, useEffect, useRef } from "react";
import MainLayout from "../../components/layouts/MainLayout";
import { useAuth } from "../../contexts/AuthContext";
import AxiosInstance from "../../api/AxiosIntance";
import * as FaIcons from "react-icons/fa6";
import ComplaintDetailsModal from "./ComplaintDetailsModal";

interface ConversationItem {
  id: number;
  complaint_id: number | null;
  complaint_title: string;
  complaint_status: string;
  participant_name: string;
  participant_role: string;
  avatar: string | null;
  last_message: string;
  last_message_time: string | null;
  updated_at: string | null;
}

interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: "user" | "employee";
  sender_id: number | null;
  sender_name: string;
  sender_role: string;
  message_text: string;
  created_at: string;
  time_formatted: string;
}

const defaultStaffConversations: ConversationItem[] = [
  {
    id: 9001,
    complaint_id: null,
    complaint_title: "Internal Operations Dispatch",
    complaint_status: "active",
    participant_name: "TMU Agent Support",
    participant_role: "operator",
    avatar: null,
    last_message: "Station TMU-HQ standing by for shift coordination.",
    last_message_time: "Just now",
    updated_at: new Date().toISOString(),
  },
  {
    id: 9002,
    complaint_id: null,
    complaint_title: "Command & Control Unit",
    complaint_status: "active",
    participant_name: "Station Commander (TMU-HQ)",
    participant_role: "staff",
    avatar: null,
    last_message: "Sector 4 patrol units deployed. Report all status updates here.",
    last_message_time: "10m ago",
    updated_at: new Date().toISOString(),
  },
  {
    id: 9003,
    complaint_id: null,
    complaint_title: "Radio Dispatch Controller",
    complaint_status: "active",
    participant_name: "Dispatch Controller",
    participant_role: "operator",
    avatar: null,
    last_message: "Copy that. High-traffic alert logged for Central Highway.",
    last_message_time: "25m ago",
    updated_at: new Date().toISOString(),
  },
];

const OperatorChat: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isOperator = !isAdmin;

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "citizen" | "operator">("all");
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Linked Complaint Details Modal State
  const [activeComplaintId, setActiveComplaintId] = useState<number | null>(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

  // New Citizen Chat Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [allCitizenUsers, setAllCitizenUsers] = useState<Array<{ id: number; name: string; email?: string; phone?: string; address?: string }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [citizenSearchQuery, setCitizenSearchQuery] = useState("");

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await AxiosInstance.get("/chat/users");
      const usersList = res?.data?.data?.users || [];
      setAllCitizenUsers(usersList);
    } catch (err) {
      console.warn("Failed to fetch registered citizens:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleOpenNewChatModal = () => {
    setIsNewChatModalOpen(true);
    fetchAllUsers();
  };

  const handleSelectUserForChat = (userItem: { id: number; name: string }) => {
    const existing = conversations.find(
      (c) => c.participant_name.toLowerCase() === userItem.name.toLowerCase()
    );

    if (existing) {
      setSelectedConvId(existing.id);
    } else {
      const newConv: ConversationItem = {
        id: Date.now(),
        complaint_id: null,
        complaint_title: "Direct Citizen Chat",
        complaint_status: "new",
        participant_name: userItem.name,
        participant_role: "citizen",
        avatar: null,
        last_message: "New conversation initiated by staff.",
        last_message_time: "Just now",
        updated_at: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv.id);
    }
    setIsNewChatModalOpen(false);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef<boolean>(true);
  const selectedConvIdRef = useRef<number | null>(selectedConvId);

  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  // Auto-scroll chat window to bottom conditionally
  const scrollToBottom = (force = false) => {
    if (force || isUserAtBottomRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    const isAtBottom = distanceFromBottom < 80;
    isUserAtBottomRef.current = isAtBottom;
    setIsScrolledUp(!isAtBottom);
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  // Fetch Conversations List
  const fetchConversations = async (isInitial = false) => {
    if (isInitial) setIsLoadingConv(true);
    try {
      const res = await AxiosInstance.get("/chat/conversations");
      const list: ConversationItem[] = res?.data?.data?.conversations || [];
      
      const mergedList = [...list];
      defaultStaffConversations.forEach((staffConv) => {
        if (!mergedList.some((c) => c.id === staffConv.id || c.participant_name === staffConv.participant_name)) {
          mergedList.push(staffConv);
        }
      });

      // Preserve any active local temporary conversations created via New Chat modal
      setConversations((prev) => {
        const localTempConvs = prev.filter(
          (c) => c.id >= 1000000000 && !mergedList.some((m) => m.participant_name.toLowerCase() === c.participant_name.toLowerCase())
        );
        return [...localTempConvs, ...mergedList];
      });

      if (selectedConvIdRef.current === null && mergedList.length > 0) {
        setSelectedConvId(mergedList[0].id);
      }
    } catch {
      setConversations(defaultStaffConversations);
      if (selectedConvIdRef.current === null) {
        setSelectedConvId(defaultStaffConversations[0].id);
      }
    } finally {
      if (isInitial) setIsLoadingConv(false);
    }
  };
  // Fetch Messages for Selected Conversation
  const fetchMessages = async (convId: number, isInitial = false) => {
    if (isInitial) setIsLoadingMessages(true);

    if (convId >= 9000) {
      if (isInitial) {
        const selectedConvItem = conversations.find((c) => c.id === convId);
        setMessages([
          {
            id: convId * 10 + 1,
            conversation_id: convId,
            sender_type: "employee",
            sender_id: 99,
            sender_name: selectedConvItem?.participant_name || "TMU Agent",
            sender_role: "operator",
            message_text: selectedConvItem?.last_message || "Station TMU-HQ standing by for shift coordination.",
            created_at: new Date().toISOString(),
            time_formatted: "Just now",
          },
        ]);
      }
      if (isInitial) setIsLoadingMessages(false);
      return;
    }

    try {
      const res = await AxiosInstance.get(`/chat/conversations/${convId}/messages`);
      const msgList: ChatMessage[] = res?.data?.data?.messages || [];
      setMessages((prev) => {
        if (prev.length === msgList.length) {
          const isSame = prev.every(
            (m, idx) => m.id === msgList[idx]?.id && m.message_text === msgList[idx]?.message_text
          );
          if (isSame) return prev;
        }
        return msgList;
      });
    } catch {
      console.warn("Failed to fetch messages for conversation:", convId);
    } finally {
      if (isInitial) setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConvId !== null) {
      isUserAtBottomRef.current = true;
      setIsScrolledUp(false);
      fetchMessages(selectedConvId, true).then(() => {
        setTimeout(() => scrollToBottom(true), 100);
      });
      const interval = setInterval(() => {
        fetchMessages(selectedConvId, false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId]);

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || selectedConvId === null) return;

    setIsSending(true);
    const staffName = user?.first_name ? `${user.first_name} ${user.last_name}` : "TMU Staff Officer";
    const staffRole = user?.role || "staff";

    const tempMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: selectedConvId,
      sender_type: "employee",
      sender_id: user?.id || 1,
      sender_name: staffName,
      sender_role: staffRole,
      message_text: content,
      created_at: new Date().toISOString(),
      time_formatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText("");
    isUserAtBottomRef.current = true;
    setTimeout(() => scrollToBottom(true), 50);

    const targetConv = conversations.find((c) => c.id === selectedConvId);

    try {
      if (selectedConvId < 9000 || selectedConvId >= 1000000000) {
        const sendRes = await AxiosInstance.post("/chat/messages", {
          conversation_id: selectedConvId >= 1000000000 ? null : selectedConvId,
          recipient_name: targetConv?.participant_name,
          message_text: content,
          sender_name: staffName,
          sender_role: staffRole,
        });

        const newConvId = sendRes?.data?.data?.message?.conversation_id;
        if (newConvId && newConvId !== selectedConvId) {
          setSelectedConvId(newConvId);
          setTimeout(() => fetchConversations(false), 300);
        }
      } else {
        // Response simulation for internal TMU Agent / Staff channel
        setTimeout(() => {
          const botReply: ChatMessage = {
            id: Date.now() + 1,
            conversation_id: selectedConvId,
            sender_type: "employee",
            sender_id: 99,
            sender_name: targetConv?.participant_name || "TMU Agent",
            sender_role: "operator",
            message_text: `Acknowledged by ${targetConv?.participant_name || "TMU Agent"}. Status logged in sector dispatch channel.`,
            created_at: new Date().toISOString(),
            time_formatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, botReply]);
        }, 1000);
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? { ...c, last_message: content, last_message_time: "Just now" }
            : c
        )
      );
    } catch {
      console.warn("Message sent in preview mode.");
    } finally {
      setIsSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaint_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.last_message.toLowerCase().includes(searchQuery.toLowerCase());

    if (roleFilter === "citizen") return matchesSearch && (c.participant_role === "citizen" || c.participant_role === "user");
    if (roleFilter === "operator") return matchesSearch && (c.participant_role === "operator" || c.participant_role === "staff" || c.participant_role === "admin");
    return matchesSearch;
  });

  return (
    <>
      <MainLayout fullBleed={true} content={
        <div className="flex flex-col h-full w-full bg-white dark:bg-[#040c07] overflow-hidden transition-colors duration-300">
          
          {/* ─── MESSENGER TWO-COLUMN LAYOUT ─── */}
          <div className="flex flex-1 h-full overflow-hidden">

            {/* ════════════════════════════════════════════════
                LEFT SIDEBAR: CONVERSATION & CONTACT LIST
               ════════════════════════════════════════════════ */}
            <div className="w-80 sm:w-96 flex flex-col border-r border-slate-200 dark:border-emerald-500/15 bg-slate-50/70 dark:bg-emerald-500/[0.02]">
              
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-200 dark:border-emerald-500/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <FaIcons.FaComments className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                        Operator Dispatch Chat
                      </h2>
                      <p className="text-[10px] text-slate-500 dark:text-emerald-400/60 font-semibold tracking-wider uppercase">
                        TMU Helpdesk • Citizen & Staff Messenger
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenNewChatModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                      title="Start a new chat with any registered citizen"
                    >
                      <FaIcons.FaPlus className="w-2.5 h-2.5" />
                      <span>New Chat</span>
                    </button>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <FaIcons.FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-emerald-500/40" />
                  <input
                    type="text"
                    placeholder="Search citizen, complaint, or staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-emerald-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-emerald-500/40 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setRoleFilter("all")}
                    className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                      roleFilter === "all"
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#022c1a] border-emerald-600 dark:border-emerald-500"
                        : "bg-white dark:bg-black/30 text-slate-600 dark:text-emerald-300/70 border-slate-200 dark:border-emerald-500/20 hover:border-slate-300 dark:hover:border-emerald-500/40"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRoleFilter("citizen")}
                    className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                      roleFilter === "citizen"
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#022c1a] border-emerald-600 dark:border-emerald-500"
                        : "bg-white dark:bg-black/30 text-slate-600 dark:text-emerald-300/70 border-slate-200 dark:border-emerald-500/20 hover:border-slate-300 dark:hover:border-emerald-500/40"
                    }`}
                  >
                    Citizens
                  </button>
                  <button
                    onClick={() => setRoleFilter("operator")}
                    className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                      roleFilter === "operator"
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#022c1a] border-emerald-600 dark:border-emerald-500"
                        : "bg-white dark:bg-black/30 text-slate-600 dark:text-emerald-300/70 border-slate-200 dark:border-emerald-500/20 hover:border-slate-300 dark:hover:border-emerald-500/40"
                    }`}
                  >
                    Staff & Ops
                  </button>
                </div>
              </div>

              {/* Conversation Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {isLoadingConv ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-emerald-400/60 font-semibold tracking-wider">
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-emerald-400/40 italic">
                    No conversations match your search.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    const isCitizen = conv.participant_role === "citizen";

                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-start gap-3 border ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm"
                            : "bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-emerald-500/[0.04] hover:border-slate-300 dark:hover:border-emerald-500/15"
                        }`}
                      >
                        {/* Avatar Badge with Online Indicator */}
                        <div className="relative shrink-0 mt-0.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${
                              isCitizen
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
                            }`}
                          >
                            {conv.participant_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 border-2 border-white dark:border-[#040c07]" />
                        </div>

                        {/* Content Preview */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {conv.participant_name}
                            </h3>
                            <span className="text-[9px] font-semibold text-slate-400 dark:text-emerald-400/50 shrink-0">
                              {conv.last_message_time || "Now"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                isCitizen
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20"
                              }`}
                            >
                              {conv.participant_role}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-white/40 truncate italic">
                              {conv.complaint_title}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300/70 truncate line-clamp-1">
                            {conv.last_message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                RIGHT SIDEBAR: ACTIVE MESSENGER CHAT WINDOW
               ════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col h-full bg-slate-100/60 dark:bg-[#030905] min-w-0">
              {selectedConv && (
                <div className={`px-6 py-2 border-b text-xs font-semibold flex items-center justify-between shrink-0 ${
                  selectedConv.participant_role === "citizen"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
                }`}>
                  <div className="flex items-center gap-2">
                    {selectedConv.participant_role === "citizen" ? (
                      <FaIcons.FaComments className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <FaIcons.FaLock className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    <span>
                      {selectedConv.participant_role === "citizen"
                        ? "💬 Official Citizen Communication Channel: Live support & complaint follow-up with resident."
                        : "🔒 TMU Internal Dispatch: Operator & Staff communication channel."}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/60 dark:bg-black/30">
                    {selectedConv.participant_role === "citizen" ? "CITIZEN LIVE CHAT" : "STAFF DISPATCH"}
                  </span>
                </div>
              )}
              {selectedConv ? (
                <>
                  {/* Chat Top Header Bar */}
                  <div className="px-6 py-3 border-b border-slate-200 dark:border-emerald-500/15 bg-white dark:bg-emerald-500/[0.03] flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border shrink-0 ${
                          selectedConv.participant_role === "citizen"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
                        }`}
                      >
                        {selectedConv.participant_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {selectedConv.participant_name}
                          </h2>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              selectedConv.participant_role === "citizen"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20"
                            }`}
                          >
                            {selectedConv.participant_role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-emerald-400/60 font-semibold truncate">
                          Subject: {selectedConv.complaint_title}
                        </p>
                      </div>
                    </div>

                    {/* Header Status Indicator & Linked Complaint Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedConv.complaint_id && (
                        <button
                          onClick={() => {
                            setActiveComplaintId(selectedConv.complaint_id);
                            setIsComplaintModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-xs font-bold transition-all shadow-sm"
                        >
                          <FaIcons.FaFileLines className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>View Complaint #{selectedConv.complaint_id}</span>
                        </button>
                      )}
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-emerald-500/10 border border-slate-200 dark:border-emerald-500/20 text-[10px] font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider">
                        Status: {selectedConv.complaint_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Messages Exchange Thread Container */}
                  <div className="relative flex-1 flex flex-col min-h-0">
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleChatScroll}
                      className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
                    >
                      {isLoadingMessages ? (
                        <div className="p-8 text-center text-xs text-slate-500 dark:text-emerald-400/60 font-semibold">
                          Loading message exchange...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 dark:text-emerald-400/40 italic">
                          No messages yet. Send a message to start conversation.
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe =
                            msg.sender_type === "employee" ||
                            msg.sender_role === "staff" ||
                            msg.sender_role === "admin" ||
                            msg.sender_role === "operator" ||
                            (user && String(msg.sender_id) === String(user.id));

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              {/* Sender Label */}
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400/50 mb-1 px-1">
                                {isMe ? "You (TMU Staff)" : `${msg.sender_name} (${msg.sender_role.toUpperCase()})`}
                              </span>

                              {/* Message Bubble */}
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed border shadow-md ${
                                  isMe
                                    ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#022c1a] font-semibold border-emerald-600 dark:border-emerald-400 rounded-tr-none"
                                    : "bg-white dark:bg-emerald-500/[0.08] text-slate-900 dark:text-white border-slate-200 dark:border-emerald-500/25 rounded-tl-none shadow-sm"
                                }`}
                              >
                                <p>{msg.message_text}</p>
                              </div>

                              {/* Timestamp */}
                              <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-400/50 mt-1 px-1">
                                {msg.time_formatted || "Just now"}
                              </span>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Floating Jump to Bottom Button when backreading */}
                    {isScrolledUp && (
                      <button
                        onClick={() => {
                          isUserAtBottomRef.current = true;
                          setIsScrolledUp(false);
                          scrollToBottom(true);
                        }}
                        className="absolute bottom-4 right-6 px-3.5 py-2 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-[#022c1a] font-bold text-xs flex items-center gap-2 shadow-xl border border-emerald-500 dark:border-emerald-300 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all z-30 animate-bounce"
                      >
                        <FaIcons.FaArrowDown className="w-3 h-3" />
                        <span>Jump to Latest Messages</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Operator Response Presets */}
                  <div className="px-6 py-2 border-t border-slate-200 dark:border-emerald-500/10 bg-white dark:bg-black/30 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-emerald-400/50 uppercase tracking-wider self-center shrink-0">
                      Quick Reply:
                    </span>
                    {[
                      "Your complaint is currently under review by TMU inspectors.",
                      "Please provide driver plate number and exact location.",
                      "TMU Duty Patrol unit has been dispatched to sector.",
                      "Report resolved. Thank you for building safer streets!",
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(preset)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-500/10 hover:bg-slate-200 dark:hover:bg-emerald-500/20 border border-slate-200 dark:border-emerald-500/20 text-[10px] text-slate-700 dark:text-emerald-300 font-medium whitespace-nowrap transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Bottom Input Action Bar */}
                  <div className="p-4 border-t border-slate-200 dark:border-emerald-500/15 bg-white dark:bg-emerald-500/[0.02] flex items-center gap-3 shrink-0">
                    <input
                      type="text"
                      placeholder="Type a message to citizen or duty operator..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-emerald-500/25 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-emerald-500/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    />

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim() || isSending}
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-[#022c1a] font-bold px-5 py-3 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <span>Send</span>
                      <FaIcons.FaPaperPlane className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                    <FaIcons.FaComments className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Select a Conversation</h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-400/60 max-w-sm">
                    Choose a citizen inquiry or operator dispatch thread from the left menu to start messaging.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      } />

      {/* New Citizen Chat Selection Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#081810] border border-slate-200 dark:border-emerald-500/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-emerald-500/15 flex items-center justify-between bg-slate-50/50 dark:bg-emerald-500/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FaIcons.FaUserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Start Chat with Citizen
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-400/60 font-semibold">
                    Select a registered citizen to message directly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200/50 dark:hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 dark:text-emerald-400/60 transition-colors"
              >
                <FaIcons.FaXmark className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-slate-200 dark:border-emerald-500/15 bg-white dark:bg-[#081810]">
              <div className="relative">
                <FaIcons.FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-emerald-500/40" />
                <input
                  type="text"
                  placeholder="Search registered citizen by name, phone, or address..."
                  value={citizenSearchQuery}
                  onChange={(e) => setCitizenSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-emerald-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-emerald-500/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {isLoadingUsers ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-emerald-400/60 font-semibold">
                  Loading registered citizens...
                </div>
              ) : allCitizenUsers.filter(u => 
                  u.name.toLowerCase().includes(citizenSearchQuery.toLowerCase()) ||
                  (u.phone && u.phone.includes(citizenSearchQuery)) ||
                  (u.address && u.address.toLowerCase().includes(citizenSearchQuery.toLowerCase()))
                ).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-emerald-400/40 italic">
                  No registered citizens found matching search.
                </div>
              ) : (
                allCitizenUsers
                  .filter(u => 
                    u.name.toLowerCase().includes(citizenSearchQuery.toLowerCase()) ||
                    (u.phone && u.phone.includes(citizenSearchQuery)) ||
                    (u.address && u.address.toLowerCase().includes(citizenSearchQuery.toLowerCase()))
                  )
                  .map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUserForChat(u)}
                      className="p-3 rounded-xl border border-slate-200/60 dark:border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {u.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-emerald-400/60 font-semibold">
                            {u.address || u.phone || u.email || "Registered Citizen"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        Chat 💬
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Linked Complaint Details Modal */}
      <ComplaintDetailsModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        complaintId={activeComplaintId}
        onStatusUpdated={() => {
          fetchConversations(false);
          if (selectedConvId !== null) fetchMessages(selectedConvId, false);
        }}
      />
    </>
  );
};

export default OperatorChat;
