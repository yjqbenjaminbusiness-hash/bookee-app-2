import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ArrowLeft, 
  Info, 
  MoreVertical, 
  Smile, 
  Paperclip,
  Check,
  CheckCheck,
  Bot,
  User,
  Zap,
  Calendar,
  ShieldCheck,
  Users,
  Compass
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  actions?: { label: string; onClick: () => void; isSecondary?: boolean }[];
  isRich?: boolean;
  type?: 'template' | 'preview' | 'recommendation';
  data?: any;
}

export default function ChatDemo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get('role') as 'player' | 'organizer' | null;
  const initialAction = searchParams.get('action');
  const [role, setRole] = useState<'player' | 'organizer' | null>(initialRole);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role) {
      startDemo(role);
      if (initialAction === 'explore') {
        setTimeout(() => {
          handleFindActivities();
        }, 1500);
      }
    }
  }, [role, initialAction]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id' | 'time'>) => {
    const id = Math.random().toString(36).substring(7);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { ...msg, id, time }]);
  };

  const startDemo = (selectedRole: 'player' | 'organizer') => {
    setStep(0);
    setMessages([]);
    
    if (selectedRole === 'organizer') {
      addMessage({ sender: 'system', text: 'Alex joined the chat' });
      addMessage({ 
        sender: 'bot', 
        text: 'Hi Alex! Ready to host something new? Tap a button to begin:',
        actions: [
          { label: 'Host Activity', onClick: () => handleHostActivity() },
          { label: 'Check Activities', onClick: () => handleCheckActivities() },
          { label: 'Explore Activities', onClick: () => handleFindActivities() },
          { label: 'My Bookee', onClick: () => handleMyBookeeFlow() }
        ]
      });
    } else {
      addMessage({ sender: 'system', text: 'Ben joined the chat' });
      addMessage({ 
        sender: 'bot', 
        text: 'Hi Ben! Looking for sports activities today? Just ask me or tap below:',
        actions: [
          { label: 'Explore Activities', onClick: () => handleFindActivities() },
          { label: 'My Bookee', onClick: () => handleMyBookeeFlow() },
          { label: 'Special Request', onClick: () => navigate('/demo/player?tab=special-request') }
        ]
      });
    }
  };

  const handleHostActivity = () => {
    addMessage({ sender: 'user', text: 'Host Activity' });
    setTimeout(() => {
      addMessage({ 
        sender: 'bot', 
        text: 'Great! Please fill in this template:',
        type: 'template'
      });
      setTimeout(() => {
        addMessage({ 
          sender: 'user', 
          text: 'Activity: Badminton\nLocation: Jurong East\nDate: Sat\nTime: 7-9pm\nSlots: 8\nPrice: $8',
          isRich: true,
          status: 'read'
        });
        setTimeout(() => {
          addMessage({
            sender: 'bot',
            text: 'Previewing your activity...',
            type: 'preview',
            data: {
              title: '🏸 Badminton – Jurong East',
              subtitle: 'Sat 7–9pm',
              slots: 'Slots: 4 / 8'
            },
            actions: [
              { label: 'Confirm', onClick: () => handleConfirmActivity() },
              { label: 'Edit', onClick: () => toast.info('Edit mode simulated') }
            ]
          });
        }, 1000);
      }, 800);
    }, 500);
  };

  const handleConfirmActivity = () => {
    addMessage({ sender: 'user', text: 'Confirm' });
    setTimeout(() => {
      addMessage({ 
        sender: 'bot', 
        text: '✅ Activity created! Here is your shareable message:',
      });
      setTimeout(() => {
        addMessage({
          sender: 'bot',
          text: '🏸 *Badminton Session*\n📍 Jurong East\n📅 Sat 7-9pm\n💰 $8/slot\n\nJoin here: bookee.sg/join/demo-1',
          isRich: true,
          actions: [
            { label: 'Share to Group', onClick: () => { toast.success('Shared to Weekend Warriors'); } },
            { label: 'Post to Fill Slots', onClick: () => { toast.success('Posted to public discovery!'); } },
            { label: 'My Bookee', onClick: () => navigate('/demo/organizer?view=my-bookee') },
            { label: 'Explore Activities', onClick: () => handleFindActivities() }
          ]
        });
      }, 800);
    }, 500);
  };

  const handleCheckActivities = () => {
    addMessage({ sender: 'user', text: 'Check Activities' });
    setTimeout(() => {
      addMessage({ 
        sender: 'bot', 
        text: 'Showing your created activities:',
      });
      setTimeout(() => {
        addMessage({
          sender: 'bot',
          type: 'recommendation',
          text: '🏸 Badminton – Jurong East\n📅 Sat 7pm\n👥 Slots: 4 / 8\n💳 Status: 6 Paid\n⏳ Waitlist: 2 Players',
          actions: [
            { label: 'Manage Players', onClick: () => navigate('/demo/organizer') },
            { label: 'My Bookee', onClick: () => navigate('/demo/organizer?view=my-bookee') },
            { label: 'Explore Activities', onClick: () => handleFindActivities() }
          ]
        });
      }, 800);
    }, 500);
  };

  const handleFindActivities = () => {
    addMessage({ sender: 'user', text: 'Explore activities' });
    setTimeout(() => {
      addMessage({ 
        sender: 'bot', 
        text: 'I found 3 recommendations for you in Jurong East:',
      });
      setTimeout(() => {
        addMessage({
          sender: 'bot',
          type: 'recommendation',
          text: '🏸 Badminton – Jurong East\n📅 Sat 7pm\n👥 Slots: 4 / 8',
          data: { id: 'demo-1' },
          actions: [
            { label: 'View Activity', onClick: () => handleViewActivity('Badminton – Jurong East') },
            { label: 'Join Activity', onClick: () => handleJoinFromChat('Badminton') },
            { label: 'Special Request', onClick: () => navigate('/demo/player?tab=special-request') }
          ]
        });
      }, 800);
    }, 500);
  };

  const handleViewActivity = (title: string) => {
    addMessage({ sender: 'user', text: `View ${title}` });
    setTimeout(() => {
      addMessage({
        sender: 'bot',
        text: `🏸 *${title}*\n📅 Sat 7pm (2 hours)\n📍 Jurong East Sports Hall\n💰 $8.00 per slot\n\n*Organizer:* Alex\n*Level:* All levels welcome!`,
        isRich: true,
        actions: [
          { label: 'Join Activity', onClick: () => handleJoinFromChat('Badminton') },
          { label: 'Ask Questions', onClick: () => handleAskQuestions(), isSecondary: true },
          { label: 'Explore Activities', onClick: () => handleFindActivities() },
          { label: 'My Bookee', onClick: () => handleMyBookeeFlow() }
        ]
      });
    }, 500);
  };

  const handleAskQuestions = () => {
    addMessage({ sender: 'user', text: 'Ask Questions' });
    setTimeout(() => {
      addMessage({
        sender: 'bot',
        text: 'What would you like to know?',
        actions: [
          { label: 'Ask Organizer', onClick: () => toast.info('Organizer chat simulated') },
          { label: 'FAQ', onClick: () => handleFAQ() }
        ]
      });
    }, 500);
  };

  const handleFAQ = () => {
    addMessage({ sender: 'user', text: 'FAQ' });
    setTimeout(() => {
      addMessage({
        sender: 'bot',
        text: 'Here are some common questions:',
        actions: [
          { label: 'Do I need to pay first?', onClick: () => handleFAQAnswer('Yes, payment confirms your slot.') },
          { label: 'What level is this?', onClick: () => handleFAQAnswer('This session is for recreational level.') },
          { label: 'Can I cancel?', onClick: () => handleFAQAnswer('Cancellations are allowed 24h before.') }
        ]
      });
    }, 500);
  };

  const handleFAQAnswer = (answer: string) => {
    addMessage({ sender: 'bot', text: answer, actions: [{ label: 'Explore Activities', onClick: () => handleFindActivities() }] });
  };

  const handleJoinFromChat = (sport: string) => {
    addMessage({ sender: 'user', text: `Join ${sport}` });
    setTimeout(() => {
      addMessage({ 
        sender: 'bot', 
        text: 'You have been added to the activity! See you there! 🏅'
      });
      setTimeout(() => {
        addMessage({
          sender: 'bot',
          text: 'Slot confirmed. Check "My Bookee" for ticket details.',
          actions: [
            { label: 'View My Bookee', onClick: () => navigate('/demo/player') },
            { label: 'Explore Activities', onClick: () => handleFindActivities() }
          ]
        });
      }, 800);
    }, 500);
  };

  const handleMyBookeeFlow = () => {
    addMessage({ sender: 'user', text: 'My Bookee' });
    setTimeout(() => {
      addMessage({ 
        sender: 'bot', 
        text: 'Showing your activities:',
      });
      setTimeout(() => {
        addMessage({
          sender: 'bot',
          type: 'recommendation',
          text: '🏸 Badminton – Jurong East\n📅 Sat 7pm\n👥 Slots: 6 / 8',
          actions: [
            { label: 'View Activity', onClick: () => navigate('/demo/player') }
          ]
        });
      }, 800);
    }, 500);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    addMessage({ sender: 'user', text, status: 'sent' });

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.text === text ? { ...m, status: 'read' } : m));
      
      if (text.toLowerCase().includes('host')) handleHostActivity();
      else if (text.toLowerCase().includes('activities') || text.toLowerCase().includes('evening')) handleFindActivities();
      else {
        addMessage({ 
          sender: 'bot', 
          text: 'I am a demo bot. Try asking "Explore activities" or "Host activity".',
          actions: [{ label: 'Explore Activities', onClick: () => handleFindActivities() }]
        });
      }
    }, 1000);
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 space-y-8 text-center rounded-[2.5rem] border-none shadow-2xl">
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner">
            <Bot className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Chat Simulator</h1>
            <p className="text-muted-foreground font-medium">Experience automated coordination via Telegram.</p>
          </div>
          <div className="grid gap-4">
            <Button size="lg" className="rounded-2xl h-16 text-lg font-bold shadow-lg shadow-primary/20" onClick={() => setRole('organizer')}>
              Organizer Chat Demo
            </Button>
            <Button size="lg" variant="outline" className="rounded-2xl h-16 text-lg font-bold border-2" onClick={() => setRole('player')}>
              Player Chat Demo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#cfe1b9] flex flex-col items-center py-10">
      {/* Phone Frame Simulation */}
      <div className="w-full max-w-[380px] h-[720px] bg-[#e5e5e5] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[3rem] border-[8px] border-black flex flex-col overflow-hidden relative">
        {/* Status Bar */}
        <div className="h-6 bg-[#1A7A4A] flex justify-between items-center px-6 pt-1">
          <span className="text-[10px] text-white font-bold">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Telegram Header */}
        <div className="bg-[#1A7A4A] text-white p-4 flex items-center gap-3 shadow-md">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => setRole(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border border-white/30">
              B
            </div>
            <div>
              <p className="font-black text-sm leading-tight">Bookee Bot</p>
              <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">bot assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] scrollbar-none"
          style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}
        >
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
            >
              {msg.sender === 'system' ? (
                <span className="bg-black/10 backdrop-blur-sm text-[#555] text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-widest">
                  {msg.text}
                </span>
              ) : (
                <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative ${
                  msg.sender === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`}>
                  {msg.type === 'template' ? (
                    <div className="space-y-2">
                      <p className="text-sm font-bold">{msg.text}</p>
                      <div className="bg-muted/50 p-2 rounded-lg font-mono text-[10px] border border-dashed border-primary/20">
                        Activity: <br/>
                        Location: <br/>
                        Date: <br/>
                        Time: <br/>
                        Price: 
                      </div>
                    </div>
                  ) : msg.type === 'preview' ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase">{msg.text}</p>
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1">
                        <p className="font-bold text-sm text-primary">{msg.data.title}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{msg.data.subtitle}</p>
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] h-4">{msg.data.slots}</Badge>
                      </div>
                    </div>
                  ) : msg.type === 'recommendation' ? (
                    <div className="space-y-3">
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🏸</div>
                          <p className="font-bold text-sm text-primary leading-tight">Badminton – Jurong East</p>
                        </div>
                        <div className="flex gap-3 text-[9px] font-bold text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Sat 7pm</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 4 / 8 Slots</span>
                        </div>
                      </div>
                    </div>
                  ) : msg.isRich ? (
                    <div className="space-y-2 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {msg.text}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  )}
                  
                  {msg.actions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.actions.map((action, i) => (
                        <Button 
                          key={i} 
                          size="sm" 
                          variant={action.isSecondary ? "ghost" : "secondary"} 
                          className={`h-8 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            action.isSecondary 
                              ? "text-muted-foreground border-dashed border-muted-foreground/30 hover:bg-muted" 
                              : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 shadow-sm"
                          }`}
                          onClick={action.onClick}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1 opacity-40">
                    <span className="text-[8px] font-black uppercase">{msg.time}</span>
                    {msg.sender === 'user' && (
                      msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="bg-white p-3 border-t flex items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10">
            <Smile className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative">
            <Input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Message" 
              className="bg-muted/50 border-none rounded-2xl h-10 pr-10 text-sm" 
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={handleSend}
            size="icon" 
            className="rounded-full h-10 w-10 bg-[#1A7A4A] shadow-lg active:scale-90 transition-transform"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Demo Hints */}
      <div className="container max-w-md py-10 px-4 text-center">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-black px-4 py-1">DEMO TIP</Badge>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          {role === 'organizer' 
            ? 'Tap "Host Activity" to see the smart template flow. Our bot handles the formatting so you can just copy-paste to your groups.' 
            : 'Ask for recommendations to see how the bot personalizes discovery for players based on location and timing.'}
        </p>
      </div>
    </div>
  );
}
