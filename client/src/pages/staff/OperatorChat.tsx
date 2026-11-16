import React, { useState, useEffect, useRef } from "react";
import MainLayout from "../../components/layouts/MainLayout";
import { useAuth } from "../../contexts/AuthContext";
import AxiosInstance from "../../api/AxiosIntance";
import * as FaIcons from "react-icons/fa6";
import ComplaintDetailsModal from "./ComplaintDetailsModal";
import CreateComplaintModal from "./CreateComplaintModal";
import ComplaintService from "../../services/ComplaintService";
import { notify } from "../../util/notify";

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
    id: 9013,
    complaint_id: 13,
    complaint_title: "Overtaking Violation in Sector 04",
    complaint_status: "unsettled",
    participant_name: "Hannah Jean Pacardo",
    participant_role: "citizen",
    avatar: null,
    last_message: "i would like to ask about my recent complain",
    last_message_time: "1m ago",
    updated_at: new Date().toISOString(),
  },
  {
    id: 9014,
    complaint_id: null,
    complaint_title: "Direct Mobile Inquiry",
    complaint_status: "active",
    participant_name: "Iris Tiffany",
    participant_role: "citizen",
    avatar: null,
    last_message: "yes?",
    last_message_time: "1m ago",
    updated_at: new Date().toISOString(),
  },
  {
    id: 9015,
    complaint_id: null,
    complaint_title: "Direct Mobile Inquiry",
    complaint_status: "active",
    participant_name: "Citizen User (Guest)",
    participant_role: "citizen",
    avatar: null,
    last_message: "hi",
    last_message_time: "1m ago",
    updated_at: new Date().toISOString(),
  },
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
    last_message: "Check Sector 2 camera feeds for traffic congestion.",
    last_message_time: "25m ago",
    updated_at: new Date().toISOString(),
  },
];

const getAvatarColors = (role: string, name?: string) => {
  const char = (name || "").charAt(0).toUpperCase();
  if (char === "H") return "border-teal-300 dark:border-teal-400/60 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40";
  if (char === "I") return "border-blue-300 dark:border-blue-400/60 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40";
  if (char === "C") return "border-cyan-300 dark:border-cyan-400/60 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40";
  if (char === "T") return "border-purple-300 dark:border-purple-400/60 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40";
  if (char === "S") return "border-emerald-300 dark:border-emerald-400/60 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40";
  if (char === "D") return "border-indigo-300 dark:border-indigo-400/60 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40";

  switch (role?.toLowerCase()) {
    case "citizen":
    case "user":
      return "border-cyan-300 dark:border-cyan-500/50 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40";
    case "operator":
      return "border-purple-300 dark:border-purple-500/50 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40";
    case "staff":
      return "border-teal-300 dark:border-teal-500/50 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40";
    case "admin":
      return "border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40";
    default:
      return "border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40";
  }
};

const getRoleBadgeColors = (role: string) => {
  switch (role?.toLowerCase()) {
    case "citizen":
    case "user":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/50";
    case "operator":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700/50";
    case "staff":
      return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700/50";
    case "admin":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/50";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
};

const OperatorChat: React.FC = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>(defaultStaffConversations);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(9013);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("Your complaint is currently under review by TMU inspectors.");
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "citizen" | "operator">("all");
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Linked Complaint Details Modal State
  const [activeComplaintId, setActiveComplaintId] = useState<number | null>(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

  // Citizen Multi-Complaints Inspector Modal State
  const [isCitizenComplaintsModalOpen, setIsCitizenComplaintsModalOpen] = useState(false);
  const [citizenComplaintsList, setCitizenComplaintsList] = useState<any[]>([]);
  const [activeCitizenName, setActiveCitizenName] = useState("");
  const [isLoadingCitizenComplaints, setIsLoadingCitizenComplaints] = useState(false);
  const [isCreateComplaintModalOpen, setIsCreateComplaintModalOpen] = useState(false);

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

  // View Complaints Feature for ANY Citizen
  const handleOpenCitizenComplaints = async (conv: ConversationItem) => {
    setActiveCitizenName(conv.participant_name);

    if (conv.complaint_id) {
      setActiveComplaintId(conv.complaint_id);
      setIsComplaintModalOpen(true);
      return;
    }

    // Query complaints for this citizen if no direct ID attached
    setIsCitizenComplaintsModalOpen(true);
    setIsLoadingCitizenComplaints(true);
    try {
      const res = await ComplaintService.getAll({
        search: conv.participant_name,
        limit: 20,
      });
      const list = res?.data?.complaints || [];
      setCitizenComplaintsList(list);

      if (list.length === 1) {
        setIsCitizenComplaintsModalOpen(false);
        setActiveComplaintId(list[0].id);
        setIsComplaintModalOpen(true);
      }
    } catch {
      setCitizenComplaintsList([]);
    } finally {
      setIsLoadingCitizenComplaints(false);
    }
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
        if (convId === 9013) {
          setMessages([
            {
              id: 1,
              conversation_id: 9013,
              sender_type: "user",
              sender_id: 13,
              sender_name: "Hannah Jean Pacardo",
              sender_role: "citizen",
              message_text: "he",
              created_at: new Date(Date.now() - 3600000).toISOString(),
              time_formatted: "2:17 PM",
            },
            {
              id: 2,
              conversation_id: 9013,
              sender_type: "user",
              sender_id: 13,
              sender_name: "Hannah Jean Pacardo",
              sender_role: "citizen",
              message_text: "y",
              created_at: new Date(Date.now() - 3500000).toISOString(),
              time_formatted: "2:17 PM",
            },
            {
              id: 3,
              conversation_id: 9013,
              sender_type: "employee",
              sender_id: 1,
              sender_name: "TMU Staff",
              sender_role: "staff",
              message_text: "hi",
              created_at: new Date(Date.now() - 1800000).toISOString(),
              time_formatted: "3:08 PM",
            },
            {
              id: 4,
              conversation_id: 9013,
              sender_type: "employee",
              sender_id: 1,
              sender_name: "TMU Staff",
              sender_role: "staff",
              message_text: "how can i help you?",
              created_at: new Date(Date.now() - 600000).toISOString(),
              time_formatted: "3:17 PM",
            },
            {
              id: 5,
              conversation_id: 9013,
              sender_type: "user",
              sender_id: 13,
              sender_name: "Hannah Jean Pacardo",
              sender_role: "citizen",
              message_text: "i would like to ask about my recent complain",
              created_at: new Date(Date.now() - 60000).toISOString(),
              time_formatted: "3:17 PM",
            },
          ]);
        } else {
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
    }, 4000);
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
      }, 4000);
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
        // Simulation reply for demonstration
        setTimeout(() => {
          const botReply: ChatMessage = {
            id: Date.now() + 1,
            conversation_id: selectedConvId,
            sender_type: "user",
            sender_id: 13,
            sender_name: targetConv?.participant_name || "Citizen User",
            sender_role: targetConv?.participant_role || "citizen",
            message_text: `Understood, thank you for the update!`,
            created_at: new Date().toISOString(),
            time_formatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, botReply]);
        }, 1200);
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
        <div className="flex flex-col h-full w-full bg-slate-200/80 dark:bg-[#080f1d] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none pt-4 pl-4 sm:pt-5 sm:pl-6 pb-3 pr-3 transition-colors">
          
          {/* ─── MESSENGER TWO-COLUMN LAYOUT ─── */}
          <div className="flex flex-1 h-full overflow-hidden rounded-2xl border border-slate-300 dark:border-blue-900/30 shadow-lg dark:shadow-2xl bg-slate-100 dark:bg-[#091122] transition-colors">

            {/* ════════════════════════════════════════════════
                LEFT SIDEBAR: CONVERSATION & CONTACT LIST
               ════════════════════════════════════════════════ */}
            <div className="w-80 sm:w-96 flex flex-col border-r border-slate-300 dark:border-blue-900/30 bg-slate-200/50 dark:bg-[#091122] shrink-0 transition-colors">
              
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-400/80 dark:border-blue-900/30 flex flex-col gap-3 bg-slate-100/90 dark:bg-transparent transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
                      <FaIcons.FaComments className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        Operator Dispatch Chat
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
                        TMU Helpdesk • Citizen & Staff Live Response Console
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      Active Dispatch
                    </span>
                  </div>
                </div>

                {/* Search Bar & New Chat Button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <FaIcons.FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search citizen, complaint, or staff..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c162c] border border-slate-300 dark:border-blue-900/40 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 placeholder:text-xs sm:placeholder:text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
                    />
                  </div>
                  <button
                    onClick={handleOpenNewChatModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/30 shrink-0 cursor-pointer"
                    title="Start a new chat with any registered citizen"
                  >
                    <FaIcons.FaPlus className="w-3.5 h-3.5" />
                    <span>New Chat</span>
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setRoleFilter("all")}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      roleFilter === "all"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 dark:bg-[#0c162c] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300/80 dark:border-blue-900/30 shadow-2xs"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRoleFilter("citizen")}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      roleFilter === "citizen"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 dark:bg-[#0c162c] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300/80 dark:border-blue-900/30 shadow-2xs"
                    }`}
                  >
                    Citizens
                  </button>
                  <button
                    onClick={() => setRoleFilter("operator")}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                      roleFilter === "operator"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 dark:bg-[#0c162c] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300/80 dark:border-blue-900/30 shadow-2xs"
                    }`}
                  >
                    Staff & Ops
                  </button>
                </div>
              </div>

              {/* Conversation Items List */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
                {isLoadingConv ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 italic">
                    No conversations match your search.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = conv.id === selectedConvId;
                    const isCitizen = conv.participant_role === "citizen" || conv.participant_role === "user";

                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col gap-2 border ${
                          isSelected
                            ? "bg-blue-100/90 dark:bg-blue-950/50 border-blue-400 dark:border-blue-500/50 shadow-sm dark:shadow-md"
                            : "bg-slate-100/90 dark:bg-transparent border-slate-300/70 dark:border-transparent hover:bg-white dark:hover:bg-blue-950/20 hover:border-slate-400 dark:hover:border-blue-900/30 shadow-2xs dark:shadow-none"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar Badge with Online Indicator */}
                          <div className="relative shrink-0 mt-0.5">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${
                                getAvatarColors(conv.participant_role, conv.participant_name)
                              }`}
                            >
                              {conv.participant_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 border-2 border-slate-200 dark:border-[#091122]" />
                          </div>

                          {/* Content Preview */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {conv.participant_name}
                              </h3>
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                                {conv.last_message_time || "Now"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                  getRoleBadgeColors(conv.participant_role)
                                }`}
                              >
                                {conv.participant_role}
                              </span>
                              {conv.complaint_id ? (
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                                  Ticket #{conv.complaint_id}: {conv.complaint_title}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                  {conv.complaint_title || "Direct Mobile Inquiry"}
                                </span>
                              )}
                            </div>

                            <p className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 truncate line-clamp-1">
                              {conv.last_message}
                            </p>
                          </div>
                        </div>

                        {/* Direct View Complaint Feature (Only if citizen already has a complaint) */}
                        {Boolean(isCitizen && conv.complaint_id) && (
                          <div className="pt-2 border-t border-slate-300/70 dark:border-blue-900/30 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCitizenComplaints(conv);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-600 text-blue-800 hover:text-white border border-blue-300 hover:border-transparent dark:bg-blue-600/20 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white dark:border-blue-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                              title={`View complaint #${conv.complaint_id}`}
                            >
                              <FaIcons.FaFileLines className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>View Complaint #{conv.complaint_id}</span>
                            </button>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Citizen ID: #CZ-{String(conv.id >= 9000 ? (conv.id - 9000 + 900) : conv.id).padStart(4, "0")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                RIGHT MAIN AREA: ACTIVE MESSENGER CHAT WINDOW
               ════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col h-full bg-slate-200/40 dark:bg-[#080f1d] min-w-0 transition-colors">
              
              {/* Top Informational Notification Bar */}
              <div className="bg-blue-100/90 dark:bg-[#0c1833] border-b border-blue-300 dark:border-blue-900/30 px-6 py-2.5 text-xs sm:text-sm font-semibold text-blue-950 dark:text-blue-300/90 flex items-center gap-2 shrink-0">
                <FaIcons.FaCircleInfo className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  Official Citizen Communication Channel: Real-time incident response & complaint follow-up with verified residents.
                </span>
              </div>

              {selectedConv ? (
                <>
                  {/* Chat Top Header Bar */}
                  <div className="px-6 py-4 border-b border-slate-400/80 dark:border-blue-900/30 bg-slate-100 dark:bg-[#081226] flex items-center justify-between gap-4 shrink-0 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border ${
                            getAvatarColors(selectedConv.participant_role, selectedConv.participant_name)
                          }`}
                        >
                          {selectedConv.participant_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 dark:bg-emerald-400 border-2 border-slate-200 dark:border-[#081226]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                            {selectedConv.participant_name}
                          </h2>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              getRoleBadgeColors(selectedConv.participant_role)
                            }`}
                          >
                            {selectedConv.participant_role}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                            Active on Mobile App
                          </span>
                          <span className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400">
                            | Citizen ID: #CZ-{String(selectedConv.id >= 9000 ? (selectedConv.id - 9000 + 900) : selectedConv.id).padStart(4, "0")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-300 truncate">
                            {selectedConv.complaint_title}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Header Action Buttons (Only shown if citizen already has a complaint) */}
                    {Boolean(selectedConv.complaint_id) && (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleOpenCitizenComplaints(selectedConv)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer whitespace-nowrap"
                          title={`View complaint #${selectedConv.complaint_id} details`}
                        >
                          <FaIcons.FaFileLines className="w-4 h-4" />
                          <span>View Complaint #{selectedConv.complaint_id}</span>
                        </button>

                        <span className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-400 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                          STATUS: {(selectedConv.complaint_status || "UNSETTLED").toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Messages Thread Canvas */}
                  <div className="relative flex-1 flex flex-col min-h-0 bg-slate-200/50 dark:bg-[#070e1b] transition-colors">
                    <div
                      ref={messagesContainerRef}
                      onScroll={handleChatScroll}
                      className="flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar"
                    >
                      {/* Date / Incident Divider */}
                      <div className="flex items-center justify-center my-2">
                        <span className="text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase font-bold">
                          {selectedConv.complaint_id
                            ? `TODAY, INCIDENT LOGGED #TMU-${selectedConv.complaint_id}`
                            : "TODAY, DIRECT INQUIRY"}
                        </span>
                      </div>

                      {/* Security Pill */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-100 dark:bg-blue-950/30 border border-slate-300 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium shadow-xs">
                          <FaIcons.FaShieldHalved className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Operator {user?.last_name || "Mendoza"} joined dispatch room. Communication channel encrypted.</span>
                        </div>
                      </div>

                      {/* Messages Exchange */}
                      {isLoadingMessages ? (
                        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 font-semibold">
                          Loading message exchange...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500 italic">
                          No messages yet. Send a message to start conversation.
                        </div>
                      ) : (
                        messages.map((msg, idx) => {
                          const isMe =
                            msg.sender_type === "employee" ||
                            msg.sender_role === "staff" ||
                            msg.sender_role === "admin" ||
                            msg.sender_role === "operator" ||
                            (user && String(msg.sender_id) === String(user.id));

                          return (
                            <div
                              key={msg.id || idx}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              {/* Sender Header */}
                              <div
                                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 px-1 ${
                                  isMe ? "flex-row-reverse" : "flex-row"
                                }`}
                              >
                                <span>{isMe ? "YOU (TMU STAFF)" : `${msg.sender_name.toUpperCase()} (${msg.sender_role.toUpperCase()})`}</span>
                                <span className="text-xs font-semibold text-slate-500 font-mono">{msg.time_formatted || "3:08 PM"}</span>
                              </div>

                              {/* Bubble */}
                              <div className={`flex items-end gap-2.5 max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                {!isMe && (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#111e3b] border border-blue-300 dark:border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-800 dark:text-blue-300 shrink-0 mb-1">
                                    {msg.sender_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div
                                  className={`rounded-2xl px-5 py-3 text-sm sm:text-base leading-relaxed ${
                                    isMe
                                      ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30 rounded-tr-xs"
                                      : "bg-white border border-slate-300 text-slate-900 rounded-tl-xs shadow-xs dark:bg-[#0e172b] dark:border-blue-900/50 dark:text-slate-200 dark:shadow-sm"
                                  }`}
                                >
                                  <p>{msg.message_text}</p>
                                </div>
                              </div>

                              {/* Delivery & Read Indicators */}
                              {isMe && (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 px-1">
                                  <span>{idx === messages.length - 1 ? "Read by citizen" : "Delivered"}</span>
                                  <FaIcons.FaCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Floating Jump to Bottom Button */}
                    {isScrolledUp && (
                      <button
                        onClick={() => {
                          isUserAtBottomRef.current = true;
                          setIsScrolledUp(false);
                          scrollToBottom(true);
                        }}
                        className="absolute bottom-4 right-6 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl border border-blue-500 hover:border-blue-400 transition-all z-30 animate-bounce cursor-pointer"
                      >
                        <FaIcons.FaArrowDown className="w-3.5 h-3.5" />
                        <span>Jump to Latest Messages</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Operator Response Presets */}
                  <div className="px-6 py-2.5 border-t border-slate-300 dark:border-blue-900/30 bg-slate-100/90 dark:bg-[#081226] flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 shrink-0">
                      <FaIcons.FaBolt className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>QUICK REPLY:</span>
                    </div>
                    {[
                      "Your complaint is currently under review by TMU inspectors.",
                      "Please provide driver plate number and exact location.",
                      "TMU Duty Patrol unit has been dispatched to sector.",
                      "Report resolved. Thank you for building safer streets!",
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputText(preset)}
                        className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                          inputText === preset
                            ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                            : "bg-white hover:bg-blue-50/80 border-slate-300 hover:border-blue-400 text-slate-800 hover:text-blue-800 shadow-2xs dark:bg-[#0c162c] dark:hover:bg-blue-900/30 dark:border-blue-900/40 dark:hover:border-blue-500/40 dark:text-slate-300 dark:hover:text-white"
                        }`}
                      >
                        "{preset}"
                      </button>
                    ))}
                  </div>

                  {/* Bottom Input Action Bar */}
                  <div className="p-4 border-t border-slate-300 dark:border-blue-900/30 bg-slate-100 dark:bg-[#081226] flex items-center gap-3 shrink-0 transition-colors">
                    {/* Left Action Icons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="p-2.5 rounded-xl hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white transition-colors cursor-pointer text-slate-600 dark:text-slate-400"
                        title="Attach Document / Photo"
                      >
                        <FaIcons.FaPaperclip className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="p-2.5 rounded-xl hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white transition-colors cursor-pointer text-slate-600 dark:text-slate-400"
                        title="Voice Message"
                      >
                        <FaIcons.FaMicrophone className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Main Input with Return Hint */}
                    <div className="flex-1 relative flex items-center">
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
                        className="w-full bg-white dark:bg-[#0c162c] border border-slate-300 dark:border-blue-900/40 focus:border-blue-500 rounded-2xl pl-5 pr-20 py-3.5 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-500 placeholder:text-sm focus:outline-none transition-colors shadow-2xs"
                      />
                      <span className="absolute right-4 text-xs font-mono text-slate-500 pointer-events-none flex items-center gap-1">
                        <span>Return</span>
                        <span>↵</span>
                      </span>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim() || isSending}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-6 py-3.5 rounded-2xl flex items-center gap-2 text-sm uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 cursor-pointer shrink-0 active:scale-95 whitespace-nowrap"
                    >
                      <span>SEND</span>
                      <FaIcons.FaPaperPlane className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-transparent">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm dark:shadow-none">
                    <FaIcons.FaComments className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Select a Conversation</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Choose a citizen inquiry or operator dispatch thread from the left menu to start messaging.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      } />

      {/* Citizen Multi-Complaints Inspector Modal */}
      {isCitizenComplaintsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-100 dark:bg-[#0a1224] border border-slate-300 dark:border-blue-900/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-900 dark:text-white transition-colors">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-400/80 dark:border-blue-900/30 flex items-center justify-between bg-slate-200/80 dark:bg-[#0e172e] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 border border-blue-300 dark:bg-blue-600/20 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
                  <FaIcons.FaFolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Citizen Complaint Records • {activeCitizenName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                    All formal incident tickets and reports filed by or associated with this resident
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCitizenComplaintsModalOpen(false)}
                className="w-9 h-9 rounded-xl hover:bg-slate-300 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <FaIcons.FaXmark className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-slate-200/40 dark:bg-transparent">
              {isLoadingCitizenComplaints ? (
                <div className="p-12 text-center text-sm text-slate-600 dark:text-slate-400 font-semibold flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Retrieving citizen case files...</span>
                </div>
              ) : citizenComplaintsList.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center bg-white dark:bg-[#070e1b] rounded-2xl border border-slate-300 dark:border-blue-900/30 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-400 mb-3">
                    <FaIcons.FaFileCircleCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    No Complaints on File
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-4">
                    There are currently no recorded incident complaints filed under "{activeCitizenName}".
                  </p>
                  <button
                    onClick={() => {
                      setIsCitizenComplaintsModalOpen(false);
                      setIsCreateComplaintModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    <FaIcons.FaPlus className="w-3.5 h-3.5" />
                    <span>File Incident Complaint for Citizen</span>
                  </button>
                </div>
              ) : (
                citizenComplaintsList.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-300 hover:border-blue-400 dark:bg-[#0c162c] dark:border-blue-900/40 dark:hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs dark:shadow-none"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-mono text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400">
                          #CR-2026-{String(comp.id).padStart(4, "0")}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            comp.status === "settled"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                              : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                          }`}
                        >
                          {comp.status?.toUpperCase() || "UNSETTLED"}
                        </span>
                        {comp.category?.category_name && (
                          <span className="text-xs text-slate-700 bg-slate-200/80 dark:text-slate-400 dark:bg-white/5 px-2.5 py-0.5 rounded-md font-semibold">
                            {comp.category.category_name}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate mb-1">
                        {comp.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                        {comp.incident_location || "Location not specified"} • {comp.incident_date_time || "Recent"}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsCitizenComplaintsModalOpen(false);
                        setActiveComplaintId(comp.id);
                        setIsComplaintModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      <FaIcons.FaEye className="w-3.5 h-3.5" />
                      <span>Inspect Case</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-300 dark:border-blue-900/30 bg-slate-200/80 dark:bg-[#0e172e] flex items-center justify-between gap-3 transition-colors">
              <button
                onClick={() => {
                  setIsCitizenComplaintsModalOpen(false);
                  setIsCreateComplaintModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
              >
                <FaIcons.FaPlus className="w-3.5 h-3.5" />
                <span>File New Complaint</span>
              </button>

              <button
                onClick={() => setIsCitizenComplaintsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-300 hover:bg-slate-400 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Citizen Chat Selection Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-100 dark:bg-[#0a1224] border border-slate-300 dark:border-blue-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh] text-slate-900 dark:text-white transition-colors">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-400/80 dark:border-blue-900/30 flex items-center justify-between bg-slate-200/80 dark:bg-[#0e172e] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
                  <FaIcons.FaUserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    Start Chat with Citizen
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    Select a registered citizen to message directly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-300 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <FaIcons.FaXmark className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-slate-300 dark:border-blue-900/30 bg-slate-200/50 dark:bg-[#0c162c] transition-colors">
              <div className="relative">
                <FaIcons.FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search registered citizen by name, phone, or address..."
                  value={citizenSearchQuery}
                  onChange={(e) => setCitizenSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#081122] border border-slate-300 dark:border-blue-900/40 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar bg-slate-200/30 dark:bg-transparent">
              {isLoadingUsers ? (
                <div className="p-8 text-center text-sm text-slate-600 dark:text-slate-400 font-semibold">
                  Loading registered citizens...
                </div>
              ) : allCitizenUsers.filter(u => 
                  u.name.toLowerCase().includes(citizenSearchQuery.toLowerCase()) ||
                  (u.phone && u.phone.includes(citizenSearchQuery)) ||
                  (u.address && u.address.toLowerCase().includes(citizenSearchQuery.toLowerCase()))
                ).length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 italic">
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
                      className="p-3 rounded-xl border border-slate-300 hover:border-blue-400 hover:bg-blue-50/70 bg-white dark:bg-transparent dark:border-blue-900/30 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/40 cursor-pointer transition-all flex items-center justify-between shadow-2xs dark:shadow-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-300 text-blue-800 dark:bg-blue-950/50 dark:border-blue-500/30 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {u.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            {u.address || u.phone || u.email || "Registered Citizen"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-300 dark:border-blue-500/30">
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

      {/* Create Complaint Modal */}
      {isCreateComplaintModalOpen && (
        <CreateComplaintModal
          isOpen={isCreateComplaintModalOpen}
          onClose={() => setIsCreateComplaintModalOpen(false)}
          onSuccess={() => {
            setIsCreateComplaintModalOpen(false);
            notify.success("Complaint successfully created!");
            fetchConversations(false);
          }}
        />
      )}
    </>
  );
};

export default OperatorChat;
