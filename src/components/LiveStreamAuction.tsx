import React, { useState, useEffect, useRef } from 'react';
import { Gift, Eye, Sparkles, Send, Users, Wifi, MessageSquare, Play, VideoOff, Gavel, Plus, Award, X, LogIn, CheckCircle, Video, Camera } from 'lucide-react';
import { playSuccessSound } from '../utils/audio';
import { User } from '../types';

interface StreamerChannel {
  id: string;
  name: string;
  phone: string;
  productTitle: string;
  productImage: string;
  productDesc: string;
  currentBid: number;
  viewers: number;
  category: string;
  isCustom?: boolean;
}

const DEFAULT_CHANNELS: StreamerChannel[] = [
  {
    id: 'ch-1',
    name: 'أبو أحمد الساعاتي',
    phone: '39442011',
    productTitle: 'ساعة رولكس صبمارين أصلية ٢٠٢٣',
    productImage: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400',
    productDesc: 'ساعة رولكس أصلية بحالة الوكالة مع كامل الملحقات والعلبة والضمان الدولي وبطاقة التوثيق.',
    currentBid: 4100,
    viewers: 284,
    category: 'ساعات فاخرة'
  },
  {
    id: 'ch-2',
    name: 'معرض البحرين المميز',
    phone: '36554433',
    productTitle: 'رقم سيارة بحريني سيادي رباعي ٢٢٨٠',
    productImage: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=400',
    productDesc: 'لوحة ملكية كلاسيكية فريدة جاهزة للتنازل الفوري والتحويل رسمي في إدارة المرور.',
    currentBid: 1650,
    viewers: 142,
    category: 'أرقام لوحات'
  },
  {
    id: 'ch-3',
    name: 'مكتب التميز للاتصالات',
    phone: '33119977',
    productTitle: 'رقم هاتف بلاتينيوم ثلاثي ٣٣١١٩٩٧٧',
    productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400',
    productDesc: 'رقم بلاتينيوم ملكي مميز وسهل جداً للحفظ والشركات الكبرى، التنازل فوري.',
    currentBid: 780,
    viewers: 94,
    category: 'هواتف وأرقام'
  }
];

const VIEWER_NAMES = ['جاسم جناحي', 'أحمد المحمود', 'فاطمة الدوسري', 'عبدالرحمن جناحي', 'علي البنعلي', 'مريم الكعبي', 'فيصل الشروقي', 'منى الأنصاري', 'مبارك بوعلي'];
const COMMENT_TEMPLATES = [
  'ما شاء الله تبارك الرحمن، السلعة جداً نظيفة وممتازة 💎',
  'كم حدك النهائي للتنازل يا غالي؟',
  'أنا جاد في الشراء وصامل على السومة الأخيرة 👍',
  'تقبل البدل برقم مميز آخر؟',
  'يستاهل السعر المعروض ونظيف جداً وفحص الوكالة يثبت',
  'طريقة تحويل لوحة الترخيص وكم رسومها؟',
  'الساعة أصلية ومعها ضمان الوكالة؟',
  'هل يمكنني معاينة السلعة مباشرة قبل دفع السوم؟'
];

interface LiveStreamAuctionProps {
  user: User | null;
  onRequestLogin: (reason: string) => void;
  verifiedPhones: string[];
}

export default function LiveStreamAuction({ user, onRequestLogin, verifiedPhones }: LiveStreamAuctionProps) {
  // Custom states for channels and current streaming state
  const [channels, setChannels] = useState<StreamerChannel[]>(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState<StreamerChannel | null>(DEFAULT_CHANNELS[0]);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);
  
  // Custom Live Form state
  const [showStreamForm, setShowStreamForm] = useState(false);
  const [newStreamTitle, setNewStreamTitle] = useState('');
  const [newStreamPrice, setNewStreamPrice] = useState('');
  const [newStreamCategory, setNewStreamCategory] = useState('ساعات فاخرة');
  const [newStreamDesc, setNewStreamDesc] = useState('');

  // Chat Engine state
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; isSystem?: boolean; time: string; isVerified?: boolean }[]>([
    { id: 'msg-ini-1', sender: 'نظام 7BH 🇧🇭', text: 'مرحباً بالجميع في البث المباشر التفاعلي للأعضاء. يرجى المزايدة بجدية ومسؤولية.', isSystem: true, time: '19:30' },
    { id: 'msg-ini-2', sender: 'أحمد المحمود', text: 'السلام عليكم، كم وصل السوم الحالي؟', time: '19:31' },
    { id: 'msg-ini-3', sender: 'جاسم جناحي', text: 'أنا زايدت بـ 4100 على الرولكس ويستاهل الصراحة.', time: '19:32' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [customBidVal, setCustomBidVal] = useState('');
  
  // Chat Container reference and Camera webcam stream state
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Robust double-binding callback ref to immediately apply stream on DOM mount
  const videoRefCallback = (node: HTMLVideoElement | null) => {
    (videoRef as any).current = node;
    if (node && cameraStream) {
      node.srcObject = cameraStream;
    }
  };

  // Auto scroll chat to bottom safely inside container WITHOUT pulling the window scroll state down
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const [isMockCameraActive, setIsMockCameraActive] = useState(false);

  // Handle actual local camera stream capture
  const startCamera = async () => {
    setIsMockCameraActive(false);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false // audio false to prevent echo screeching loops in local test
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Local camera capture activation failed. Activating Simulated Studio Streaming fall-back:", err);
      // Fallback beautifully and seamlessly to Premium Interactive Interactive Video Simulator
      setIsMockCameraActive(true);
      setIsCameraActive(true);
      setCameraStream(null);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsMockCameraActive(false);
  };

  // Close camera if active channel switches to clean up
  useEffect(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsMockCameraActive(false);
  }, [activeChannel]);

  // Assign stream to video node whenever streaming updates
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Is active channel streamer verified?
  const isStreamerVerified = activeChannel ? verifiedPhones.includes(activeChannel.phone) : false;

  // Simulate incoming live viewer messages
  useEffect(() => {
    if (!activeChannel || !isLiveStreamActive) return;

    const chatTimer = setInterval(() => {
      // Pick a random viewer name
      const randomSender = VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)];
      // Pick a random comment template
      const randomText = COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];
      
      const isViewerMouthaq = Math.random() > 0.6; // random verified badge for fun simulation

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-sim-${Date.now()}-${Math.random()}`,
          sender: randomSender,
          text: randomText,
          time: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' }),
          isVerified: isViewerMouthaq
        }
      ]);
    }, 15000); // every 15 seconds a comment

    return () => {
      clearInterval(chatTimer);
    };
  }, [activeChannel, isLiveStreamActive]);

  // Sync activeChannel current bid when channels update
  useEffect(() => {
    if (activeChannel) {
      const match = channels.find(c => c.id === activeChannel.id);
      if (match && match.currentBid !== activeChannel.currentBid) {
        setActiveChannel(match);
      }
    }
  }, [channels, activeChannel]);

  const handlePlaceLiveBid = (increment: number) => {
    if (!activeChannel) return;
    
    if (!user) {
      onRequestLogin('لتقديم السومات والمزايدة السريعة في البث التفاعلي المباشر، يرجى تسجيل الدخول أولاً للتوثيق المجاني وحماية المزاد.');
      return;
    }
    
    // Play sound effect
    try { playSuccessSound(); } catch (e) {}

    const updatedBid = activeChannel.currentBid + increment;

    // Update state local list
    setChannels(prev => prev.map(ch => {
      if (ch.id === activeChannel.id) {
        return { ...ch, currentBid: updatedBid };
      }
      return ch;
    }));

    // Inject system message in chat
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg-ubid-${Date.now()}`,
        sender: 'نظام المزايدات 7BH',
        text: `🤝 قام المزايد الموثق (${user.name}) بتقديم سومة أعلى بقيمة +${increment} د.ب! المجموع الحالي: ${updatedBid} د.ب`,
        isSystem: true,
        time: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !customBidVal) return;
    
    if (!user) {
      onRequestLogin('لتقديم السومات والمزايدة المباشرة بأسعار مخصصة، يرجى تسجيل الدخول أولاً للتوثيق المجاني وحماية المزايدات.');
      return;
    }
    
    const bidNum = parseFloat(customBidVal);
    if (isNaN(bidNum) || bidNum <= activeChannel.currentBid) {
      alert(`يرجى إدخال سومة تزيد عن السومة الحالية (${activeChannel.currentBid.toLocaleString()} د.ب)`);
      return;
    }
    
    // Play sound
    try { playSuccessSound(); } catch (e) {}

    setChannels(prev => prev.map(ch => {
      if (ch.id === activeChannel.id) {
        return { ...ch, currentBid: bidNum };
      }
      return ch;
    }));

    setChatMessages(prev => [
      ...prev,
      {
        id: `msg-custombid-${Date.now()}`,
        sender: 'نظام المزايدات 7BH',
        text: `💎 قدم المزايد الموثق (${user.name}) سومة جديدة استثنائية بقيمة: ${bidNum.toLocaleString()} د.ب!`,
        isSystem: true,
        time: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setCustomBidVal('');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChannel) return;

    if (!user) {
      onRequestLogin('للمشاركة بالدردشة والتعليق في غرف البث التفاعلية الحية، يرجى تسجيل الدخول أولاً للتوثيق.');
      return;
    }

    const userMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'أنت (مزايد موثق)',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' }),
      isVerified: verifiedPhones.includes(user.phone)
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
  };

  const handleStartBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newStreamTitle.trim() || !newStreamPrice) return;

    const basePrice = parseFloat(newStreamPrice);
    if (isNaN(basePrice)) return;

    // Build custom streaming channel
    const customChan: StreamerChannel = {
      id: `ch-custom-${Date.now()}`,
      name: user.name,
      phone: user.phone,
      productTitle: newStreamTitle.trim(),
      productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', // vibrant red item placeholder
      productDesc: newStreamDesc.trim() || 'لا توجد تفاصيل إضافية عن السلعة المبثوثة.',
      currentBid: basePrice,
      viewers: 12, // start with moderate viewers
      category: newStreamCategory,
      isCustom: true
    };

    const updatedChannels = [customChan, ...channels.filter(c => !c.isCustom)];
    setChannels(updatedChannels);
    setActiveChannel(customChan);
    setIsLiveStreamActive(true);
    setShowStreamForm(false);

    // Reset fields
    setNewStreamTitle('');
    setNewStreamPrice('');
    setNewStreamDesc('');

    // Clear and restart Chat
    setChatMessages([
      { id: `msg-custom-0-${Date.now()}`, sender: 'بثّ 7BH المباشر 🔴', text: 'قمت ببدء بـث مـباـشر جديد لعرض منتجك! انضم المتابعون الآن لتلقي السومات والمزايدات مباشرة.', isSystem: true, time: 'الآن' }
    ]);

    // Automatically trigger camera stream on custom host channel
    startCamera();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right font-sans">
      
      {/* Right Core Panel (2/3 columns): Personal Live stream Showcase & Chat Next to it */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Stream title and selection area */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-red-600 font-extrabold text-xs uppercase tracking-widest block mb-1">
              • بث حي ومباشر تفاعلي
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>🔴 حراج البث المباشر الفوري</span>
              </h2>
              {isStreamerVerified && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  👑 بائع موثق بـ 7BH
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 self-stretch sm:self-auto flex-wrap sm:flex-nowrap justify-end">
            {activeChannel && (
              <button
                onClick={() => {
                  const isOwnerOrAdmin = user && (user.isAdmin || user.phone === activeChannel.phone);
                  if (isOwnerOrAdmin) {
                    if (window.confirm('هل تريد إنهاء غرفتك المباشرة وإزالتها نهائياً من الموقع؟')) {
                      stopCamera();
                      setIsLiveStreamActive(false);
                      const remaining = channels.filter(c => c.id !== activeChannel.id);
                      setChannels(remaining);
                      setActiveChannel(remaining[0] || null);
                    }
                  } else {
                    stopCamera();
                    setIsLiveStreamActive(false);
                    setActiveChannel(null); // Leave room entirely for standard viewer
                  }
                }}
                className="bg-slate-105 hover:bg-slate-200 text-slate-750 font-extrabold py-2.5 px-4 rounded-xl text-xs sm:text-sm border border-slate-250 transition flex items-center gap-1.5 cursor-pointer transform active:scale-95 shrink-0"
              >
                <X size={15} className="text-red-500" />
                <span>إغلاق ومغادرة البث 🚪</span>
              </button>
            )}

            {/* Create dynamic streaming broadcast */}
            <button
              onClick={() => {
                if (!user) {
                  onRequestLogin('لإطلاق بثك المباشر وعرض سلعك الخاصة واستقبال السومات المباشرة، يرجى تسجيل الدخول أولاً للتوثيق.');
                } else {
                  setShowStreamForm(true);
                }
              }}
              className="bg-red-650 hover:bg-red-700 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer transform active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>بث مباشر جديد 📹</span>
            </button>
          </div>
        </div>

        {/* Directory of streams */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 overflow-x-auto scrollbar-none flex gap-3 h-20 items-center">
          <span className="text-xs font-black text-slate-400 shrink-0 whitespace-nowrap pl-2 border-l border-slate-200">
            الغرف النشطة:
          </span>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch);
                setIsLiveStreamActive(true);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2 select-none shadow-3xs transition whitespace-nowrap cursor-pointer ${
                activeChannel?.id === ch.id
                  ? 'bg-slate-900 border border-slate-850 text-white'
                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeChannel?.id === ch.id ? 'bg-red-500 animate-ping' : 'bg-slate-300'}`}></span>
              <span>{ch.name}</span>
              {verifiedPhones.includes(ch.phone) && <span className="text-[10px] text-amber-500">🛡️</span>}
              <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-bold font-mono">
                {ch.viewers} مـشاهد
              </span>
            </button>
          ))}
        </div>

        {/* Main Live Broadcast and Chat Console Layout Grid */}
        {activeChannel ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* 1. Video Canvas & controls - Spans 7 cols, order 1 */}
            <div className="md:col-span-7 order-1 flex flex-col gap-4">
              
              {/* Camera Frame Frame simulation player wrapper */}
              <div className="bg-slate-950 text-white aspect-video md:h-[320px] rounded-3xl border-2 border-slate-800 shadow-lg overflow-hidden relative group">
                
                {/* Simulated Live Capture Controls & Statuses */}
                {isLiveStreamActive ? (
                  <>
                    {/* Interactive overlay toolbar for Camera & Closure (Z-30 for click capture, pointer-events-auto) */}
                    <div className="absolute top-14 left-4 right-4 z-30 flex justify-between items-center gap-1.5 pointer-events-auto">
                      {/* Left Side: Exit / Stop Streaming Room Buttons */}
                      {activeChannel.isCustom ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('هل تريد إنهاء بثك المباشر وإغلاق هذه الغرفة نهائياً؟')) {
                              stopCamera();
                              const remaining = channels.filter(c => c.id !== activeChannel.id);
                              setChannels(remaining);
                              setActiveChannel(remaining[0] || null);
                            }
                          }}
                          className="bg-red-650 hover:bg-red-700 hover:scale-105 text-white font-black py-1.5 px-3 rounded-xl text-[10px] transition duration-200 select-none flex items-center gap-1 cursor-pointer shadow-md"
                        >
                          <VideoOff size={11} />
                          <span>إنهاء بثي 🛑</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('هل تريد إنهاء البث وإزالة هذه الغرفة نهائياً من القائمة؟')) {
                              stopCamera();
                              setIsLiveStreamActive(false);
                              const remaining = channels.filter(c => c.id !== activeChannel.id);
                              setChannels(remaining);
                              setActiveChannel(remaining[0] || null);
                            }
                          }}
                          className="bg-black/80 hover:bg-rose-700 hover:scale-105 text-white font-black py-1.5 px-3 rounded-xl text-[10px] transition duration-200 border border-white/10 select-none flex items-center gap-1 cursor-pointer shadow-md"
                        >
                          <X size={11} className="text-rose-500" />
                          <span>إغلاق وإنهاء البث 🛑</span>
                        </button>
                      )}

                      {/* Right Side: Toggle Local Webcam Stream Controls - Live Camera Toggle for Client */}
                      {isCameraActive ? (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-rose-650 hover:bg-rose-700 hover:scale-105 text-white font-black py-1.5 px-3 rounded-xl text-[10px] transition duration-200 select-none flex items-center gap-1 shadow-md border border-rose-500/20 pointer-events-auto"
                        >
                          <VideoOff size={11} />
                          <span>إيقاف كاميرتك 🚫</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) {
                              onRequestLogin('لتشغيل بث الكاميرا الخاص بك ومشاركة الفيديو، يرجى تسجيل الدخول أولاً للتوثيق المجاني.');
                            } else {
                              startCamera();
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 text-white font-black py-1.5 px-3 rounded-xl text-[10px] transition duration-200 select-none flex items-center gap-1 animate-pulse shadow-md border border-emerald-500/20 pointer-events-auto"
                        >
                          <Camera size={11} />
                          <span>بث كامتك بالفيديو 📹</span>
                        </button>
                      )}
                    </div>

                    {/* Stats HUD overlay info with pointer-events-none */}
                    <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-4 z-10 pointer-events-none select-none">
                      {/* Top Stats Bar */}
                      <div className="flex justify-between items-center w-full">
                        {/* Red Blinking status with count */}
                        <div className="flex items-center gap-1.5 bg-red-650 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                          <span>مباشر • LIVE</span>
                        </div>

                        {/* Viewers counter */}
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-white/10">
                          <Users size={11} className="text-red-400" />
                          <span>{activeChannel.viewers + chatMessages.length} مشاهدين</span>
                        </div>
                      </div>

                      {/* Bottom overlay with Channel and Stream Title */}
                      <div className="bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 rounded-2xl -mx-4 -mb-4 w-[calc(100%+2rem)] flex items-end justify-between">
                        <div className="space-y-1">
                          <span className="bg-[#c5a059] text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md block w-fit">
                            {activeChannel.category}
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                            {activeChannel.productTitle}
                          </h3>
                          <p className="text-[10px] text-slate-350 leading-tight">
                            البث بواسطة: {activeChannel.name} {verifiedPhones.includes(activeChannel.phone) ? '🛡️ (شريك موثق)' : ''}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 text-[9px] bg-red-650 px-2 py-1 rounded-lg font-black border border-red-500/30">
                          <Wifi size={11} className="animate-pulse" />
                          <span>بث ممتاز (1080p)</span>
                        </div>
                      </div>

                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-10 p-4">
                    <VideoOff size={36} className="text-slate-600 animate-pulse" />
                    <p className="text-slate-400 font-bold text-sm">تم إيقاف المتابعة الفورية للبث الحالي</p>
                    <button
                      type="button"
                      onClick={() => setIsLiveStreamActive(true)}
                      className="bg-red-600 text-white font-black py-2 px-4 rounded-xl text-xs hover:bg-red-700 transition cursor-pointer"
                    >
                      إعادة تفعيل البث الحَي
                    </button>
                  </div>
                )}

                {/* Simulated Stream Image/Camera Feed with grid canvas scan */}
                {isLiveStreamActive && (
                  <div className="absolute inset-0 w-full h-full select-none overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/[0.02] to-transparent bg-[size:100%_4px] pointer-events-none z-10"></div>
                    
                    {isCameraActive ? (
                      isMockCameraActive ? (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-900 to-black overflow-hidden animate-in fade-in duration-300">
                          {/* Moving atmospheric spotlights */}
                          <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-red-600/10 rounded-full blur-3xl animate-bounce duration-10000"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl animate-pulse duration-7000"></div>
                          
                          {/* Main virtual display */}
                          <div className="z-10 text-center space-y-4 px-6 max-w-sm">
                            <div className="relative inline-block mt-4 sm:mt-6">
                              {/* Pulsing ring around product picture or avatar */}
                              <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-25"></div>
                              <div className="relative bg-neutral-950 p-1.5 rounded-full border border-red-500/40">
                                <img
                                  src={activeChannel.productImage}
                                  alt={activeChannel.productTitle}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/10"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <span className="absolute -bottom-1 -right-1 bg-red-650 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md border border-white/20 animate-pulse">
                                REC 🔴
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-black text-rose-500 text-[11px] sm:text-xs">المستضيف: {activeChannel.name}</h4>
                              <p className="font-extrabold text-white text-[11px] sm:text-xs leading-relaxed max-w-[280px] mx-auto truncate">
                                عرض حي: {activeChannel.productTitle}
                              </p>
                              <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                                <span className="bg-emerald-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>
                                <span>قناة البث الممتاز (إطار الحماية مفعل)</span>
                              </div>
                            </div>

                            {/* Simulated moving audio bars */}
                            <div className="flex gap-1 justify-center items-center h-4 pt-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <span 
                                  key={i} 
                                  className="bg-rose-500 w-[3px] rounded-full transform origin-bottom animate-pulse"
                                  style={{
                                    height: `${30 + Math.random() * 70}%`,
                                    animationDuration: `${0.4 + i * 0.15}s`
                                  }}
                                ></span>
                              ))}
                            </div>

                            {/* Alert note inside the video display */}
                            <div className="bg-black/60 border border-white/5 p-2 rounded-xl text-[9px] text-yellow-500 font-semibold leading-relaxed text-right max-w-[300px] mx-auto">
                              ⚠️ تم تفعيل <b>وضع الكاميرا الافتراضي</b> بنجاح لمنع تعطل البث بسبب رفض أو حظر إذن الكاميرا الحقيقية بمتصفحك الحالي. بثك آمن ويعمل بشكل رائع!
                            </div>
                          </div>
                        </div>
                      ) : (
                        <video
                          ref={videoRefCallback}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-100 transform duration-700"
                        />
                      )
                    ) : (
                      <img
                        src={activeChannel.productImage}
                        alt={activeChannel.productTitle}
                        className="w-full h-full object-cover grayscale-[10%] brightness-90 saturate-[110%] scale-100 group-hover:scale-105 duration-700 ease-out"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Camera simulation indicators */}
                    <div className="absolute left-4 top-16 border-t-2 border-l-2 border-white/20 w-4 h-4 pointer-events-none"></div>
                    <div className="absolute right-4 top-16 border-t-2 border-r-2 border-white/20 w-4 h-4 pointer-events-none"></div>
                    <div className="absolute left-4 bottom-16 border-b-2 border-l-2 border-white/20 w-4 h-4 pointer-events-none"></div>
                    <div className="absolute right-4 bottom-16 border-b-2 border-r-2 border-white/20 w-4 h-4 pointer-events-none"></div>
                  </div>
                )}

              </div>

            </div>

            {/* 2. Chat and Message box - Spans 5 cols, stays at Row 1 on desktop using span grid, but order 2 on mobile (directly below Video) */}
            <div className="md:col-span-5 order-2 md:row-span-2 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm h-[320px] md:h-[530px] overflow-hidden">
              
              {/* Chat room Header */}
              <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  <span className="font-black text-slate-700 text-xs">دردشة البث المباشر</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  حماية 7BH 🛡️
                </div>
              </div>

              {/* Chat Scroll container */}
              <div ref={chatContainerRef} className="flex-1 w-full p-3 overflow-y-auto space-y-2.5 select-text bg-gradient-to-b from-white to-slate-50/30">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                      msg.isSystem
                        ? 'bg-amber-50 text-amber-900 border-r-4 border-amber-500 font-bold text-[11px]'
                        : msg.sender.includes('أنت')
                        ? 'bg-red-50 text-slate-800 border-r-4 border-red-500 mr-auto text-left'
                        : 'bg-slate-100 text-slate-850 border-r-2 border-slate-300 ml-auto'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3 mb-1">
                      <span className="font-extrabold text-[#da291c] flex items-center gap-1">
                        {msg.sender}
                        {msg.isVerified && <span className="text-[10px]" title="حساب بحريني موثق">🛡️</span>}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">{msg.time}</span>
                    </div>
                    <p className="text-[11px] font-medium leading-normal text-right">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Sender Form */}
              <form onSubmit={handleSendChatMessage} className="p-2 border-t border-slate-200 bg-white shrink-0 flex gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={user ? "اكتب رسالة أو استفسار للمالك..." : "سجل الدخول للمشاركة بالدردشة 👤"}
                  disabled={!user}
                  className="w-full text-right p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white text-slate-800 font-bold"
                />
                
                {user ? (
                  <button
                    type="submit"
                    className="bg-[#da291c] hover:bg-black text-white p-2 rounded-xl cursor-pointer transition shrink-0"
                  >
                    <Send size={15} className="rotate-180" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestLogin('للمشاركة بالتفاعل المباشر ودردشة غرف البث الحية، يرجى تسجيل الدخول مجاناً للتوثيق.')}
                    className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl cursor-pointer whitespace-nowrap transition"
                  >
                    دخول
                  </button>
                )}
              </form>

            </div>

            {/* 3. Stream Controller & Direct Connection Panel (Replaces old bidding inputs) - Spans 7 cols, order 3 */}
            <div className="md:col-span-7 order-3">
              
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-white space-y-5 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="text-right">
                    <span className="text-red-500 font-black text-[10px] uppercase block mb-0.5 animate-pulse">
                      • حالة البث التفاعلي الآن
                    </span>
                    <div className="text-sm font-black text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>البث متصل ومتاح للمشاهدة فوراً 🌐</span>
                    </div>
                  </div>

                  <div className="bg-slate-850 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Video size={13} className="text-red-500" />
                    <span>بث تفاعلي 7BH</span>
                  </div>
                </div>

                {/* Direct Webcam Activation for Any User */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
                      <span>بث كامتك بالفيديو المباشر 📹</span>
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-medium">
                      هل تريد عرض سلعة أو التحدث للمتابعين؟ اسمح للكاميرا بالعمل وافتح البث المباشر فوراً من جهازك.
                    </p>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    {isCameraActive ? (
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="w-full sm:w-auto bg-red-650 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition duration-200 select-none flex items-center justify-center gap-1.5 shadow-md border border-red-500/20 active:scale-95 cursor-pointer"
                      >
                        <VideoOff size={14} />
                        <span>إيقاف كاميرتك 🚫</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            onRequestLogin('لتفعيل كاميرتك وبدء البث المباشر المباشر، يرجى تسجيل الدخول أولاً للتوثيق.');
                          } else {
                            startCamera();
                          }
                        }}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition duration-200 select-none flex items-center justify-center gap-1.5 shadow-md border border-emerald-500/20 active:scale-95 cursor-pointer animate-pulse"
                      >
                        <Camera size={14} />
                        <span>تشغيل بث الفيديو المباشر 📹</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Call & Direct Message actions to contact the current streamer */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 block mr-1 text-right">تواصل فوري مع البائع / مستضيف البث والمالك المباشر:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/973${activeChannel.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
                    >
                      <span className="text-xl">💬</span>
                      <span className="text-slate-950 font-black">واتساب سريع</span>
                    </a>
                    <a
                      href={`tel:${activeChannel.phone}`}
                      className="bg-white hover:bg-slate-200 text-slate-950 p-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
                    >
                      <span className="text-xl">📞</span>
                      <span className="text-slate-950 font-black">اتصال هاتفي</span>
                    </a>
                  </div>
                </div>

                {/* Nice helper message indicating bids are turned off */}
                <div className="text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 text-center font-medium">
                  💡 تم تعطيل نظام المزايدة النصي واستبداله بالتواصل المباشر والدردشة مع البث التفاعلي الفوري لتجربة تداول سلسة وموثوقة.
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 flex flex-col items-center justify-center">
            <VideoOff size={48} className="text-slate-350" />
            <div>
              <p className="text-slate-700 font-black text-sm sm:text-base">عذراً، لا توجد قنوات بث نشطة في هذا القسم حالياً.</p>
              <p className="text-slate-400 text-xs mt-1">كن أول من يطلق قناة بث لعرض منتجاتك واستقبل مزايدات الأعضاء فورا!</p>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  onRequestLogin('لإطلاق بثك المباشر وعرض سلعك الخاصة واستقبال السومات المباشرة، يرجى تسجيل الدخول أولاً للتوثيق.');
                } else {
                  setShowStreamForm(true);
                }
              }}
              className="bg-[#da291c] hover:bg-neutral-900 text-white font-black py-3 px-6 rounded-2xl text-xs sm:text-sm shadow-md transition transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Plus size={16} />
              <span>إطلاق بث مباشر جديد 📹</span>
            </button>
          </div>
        )}

      </div>

      {/* Left Column (1/3 columns): Seller Information guidelines & rules of engagement */}
      <div className="space-y-6">
        
        {/* Active streaming product specs detail widget */}
        {activeChannel && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-slate-800 border-b border-slate-100 pb-3 text-sm flex items-center gap-1.5">
              <Award size={16} className="text-amber-500" />
              <span>تفاصيل السلعة المعروضة بالبث</span>
            </h3>

            <div className="space-y-3">
              <div className="aspect-square h-24 rounded-2xl overflow-hidden border border-slate-200">
                <img src={activeChannel.productImage} alt={activeChannel.productTitle} className="w-full h-full object-cover" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block">العنوان التجاري:</span>
                <span className="font-extrabold text-slate-800 text-xs">{activeChannel.productTitle}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block">وصف السلعة الحصري:</span>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{activeChannel.productDesc}</p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100/50 space-y-1 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">اسم المعلن:</span>
                  <span className="font-bold text-slate-800">{activeChannel.name}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>رقم الاتصال:</span>
                  <span className="font-mono">{activeChannel.phone}</span>
                </div>
                {verifiedPhones.includes(activeChannel.phone) && (
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-[#c5a059] font-black border-t border-slate-200/50 pt-1">
                    <CheckCircle size={10} className="fill-amber-500 stroke-white" />
                    <span>توثيق رسمي مفعل من الإدارة 👑</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security and bidding agreement widget */}
        <div className="bg-gradient-to-tr from-slate-900 to-slate-950 p-5 rounded-3xl text-white border border-slate-800 shadow-md space-y-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base mb-2 select-none">
            🛡️
          </div>
          <h4 className="font-extrabold text-sm text-white">وثيقة الأمان وإرشادات البث والتواصل</h4>
          <p className="text-[10.5px] text-slate-350 leading-relaxed text-right">
            منصة 7BH حريصة على تقديم أفضل سبل التواصل الفوري. يرجى التفاعل بأدب في غرف الدردشة والتأكد التام أثناء التفاوض المباشر للاتفاق مع البائع البحريني بصورة قانونية وآمنة.
          </p>
        </div>

      </div>

      {/* Create New Stream Form Modal Overlay */}
      {showStreamForm && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-250">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <span className="font-black text-slate-800 text-sm">🎥 إطلاق غرفة بث مباشر حية جديدة</span>
              <button
                onClick={() => setShowStreamForm(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-lg transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Form inputs */}
            <form onSubmit={handleStartBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">اسم السلعة / السكراب / الرقم المميز:</label>
                <input
                  type="text"
                  required
                  value={newStreamTitle}
                  onChange={(e) => setNewStreamTitle(e.target.value)}
                  placeholder="مثال: لوحة درام مميزة ٥٥٢٢١"
                  className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">السعر الابتدائي (د.ب):</label>
                  <input
                    type="number"
                    required
                    value={newStreamPrice}
                    onChange={(e) => setNewStreamPrice(e.target.value)}
                    placeholder="مثال: 50"
                    className="w-full text-left p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-red-500 focus:text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">التصنيف الرئيسي:</label>
                  <select
                    value={newStreamCategory}
                    onChange={(e) => setNewStreamCategory(e.target.value)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer focus:bg-white"
                  >
                    <option value="ساعات فاخرة">ساعات فاخرة ⌚</option>
                    <option value="أرقام لوحات">أرقام لوحات بحرينية 🚗</option>
                    <option value="هواتف وأرقام">هواتف وأرقام بلاتينية 📱</option>
                    <option value="عقارات وأراضي">عقارات وأراضي 🏠</option>
                    <option value="أخرى">سلع أخرى متنوعة 📦</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">نبذة قصيرة وتفاصيل حالة السلعة:</label>
                <textarea
                  rows={3}
                  value={newStreamDesc}
                  onChange={(e) => setNewStreamDesc(e.target.value)}
                  placeholder="مثال: رقم وتساب بلاتيني مميز جاهز للاستخدام الفوري مع التنازل لمشتركي زين..."
                  className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              {/* Verified Seller notification banner */}
              {user && verifiedPhones.includes(user.phone) ? (
                <div className="bg-amber-55 text-amber-900 p-3 rounded-xl text-[10.5px] font-bold border border-amber-200 flex items-start gap-2">
                  <span>💡</span>
                  <p className="text-right leading-snug">
                    نظراً لأن رقم هاتفك ({user.phone}) شريك موثق رسمي من قبل المسؤول، سيتم عرض شارة الجدارة الذهبية 👑 بجانب اسمك تلقائياً لجذب مزايدات عالية.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-500 p-3 rounded-xl text-[9.5px] leading-relaxed border border-slate-200/50">
                  سيتم بث سلعتك كـ بائع عادي. إذا كنت تريد الحصول على رمز التوثيق الخاص بالموقع وعرض شارات ذهبية مع سومات مميزة، يرجى التواصل مع إدارة الموقع لتفعيل التوثيق الحسابي.
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#da291c] hover:bg-slate-900 text-white font-black py-3 rounded-xl transition shadow-md active:scale-95 cursor-pointer text-xs"
              >
                بث مباشر السلعة فوراً 🔴
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
