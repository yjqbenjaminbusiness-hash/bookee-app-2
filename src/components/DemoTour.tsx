import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft, Users, Star,
  CheckCircle2, MessageCircle, QrCode, Zap, Shield,
  BadgeCheck, Bot, TrendingUp, Link, AlertTriangle,
  Sparkles, ExternalLink, Bell, Dice5
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export type DemoType = 'player' | 'organizer' | 'chat';

// ─── Design tokens per demo type ─────────────────────────────────────────────
const THEME = {
  organizer: {
    dark:   '#0d5c35',
    mid:    '#1A7A4A',
    light:  '#E8F7EF',
    faint:  '#F4FAF7',
    border: 'rgba(26,122,74,0.22)',
    text:   '#0d4a2b',
    accent: '#7FFFC4',
  },
  player: {
    dark:   '#0c3a6b',
    mid:    '#1A6FA8',
    light:  '#E8F3FD',
    faint:  '#F0F7FD',
    border: 'rgba(26,111,168,0.22)',
    text:   '#0c3058',
    accent: '#93C5FD',
  },
  chat: {
    dark:   '#78350f',
    mid:    '#C47A00',
    light:  '#FEF9EC',
    faint:  '#FFFBF0',
    border: 'rgba(196,122,0,0.25)',
    text:   '#7c5300',
    accent: '#FCD34D',
  },
};

// ─── Mini PayNow QR ─────────────────────────────────────────────────────────
const QrSvg = ({ size = 88 }: { size?: number }) => (
  <svg viewBox="0 0 90 90" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <rect width="90" height="90" fill="white" />
    <rect x="6"  y="6"  width="24" height="24" fill="#111" rx="3" />
    <rect x="9"  y="9"  width="18" height="18" fill="white" rx="2" />
    <rect x="12" y="12" width="12" height="12" fill="#111" rx="1" />
    <rect x="60" y="6"  width="24" height="24" fill="#111" rx="3" />
    <rect x="63" y="9"  width="18" height="18" fill="white" rx="2" />
    <rect x="66" y="12" width="12" height="12" fill="#111" rx="1" />
    <rect x="6"  y="60" width="24" height="24" fill="#111" rx="3" />
    <rect x="9"  y="63" width="18" height="18" fill="white" rx="2" />
    <rect x="12" y="66" width="12" height="12" fill="#111" rx="1" />
    {[34,40,46,52,58].map(x => [34,40,46,52,58].map(y => (
      <rect key={`${x}${y}`} x={x} y={y} width="5" height="5"
        fill={(x*3+y*7)%13 < 7 ? '#111':'white'} rx="0.5" />
    )))}
    {[34,40,46].map(x => [6,12,18,60,66,72].map(y => (
      <rect key={`e${x}${y}`} x={x} y={y} width="5" height="5"
        fill={(x+y)%10 < 5 ? '#111':'white'} rx="0.5" />
    )))}
    <text x="45" y="47" textAnchor="middle" fill="#1A7A4A" fontSize="5" fontWeight="bold">PAYNOW</text>
    <text x="45" y="54" textAnchor="middle" fill="#1A7A4A" fontSize="4">$12</text>
  </svg>
);

// ─── Chat primitives ─────────────────────────────────────────────────────────
const WaBar = ({ name, color = '#075E54' }: { name: string; color?: string }) => (
  <div className="px-3 py-2 flex items-center gap-2" style={{ background: color }}>
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-white/20">
      {name[0]}
    </div>
    <span className="text-[10px] font-bold text-white flex-1 truncate">{name}</span>
    <MessageCircle className="h-3 w-3 text-white opacity-60" />
  </div>
);

const MsgRight = ({ sender, lines, sub }: { sender: string; lines: string[]; sub?: React.ReactNode }) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] px-2.5 py-2 rounded-2xl rounded-tr-sm shadow-sm" style={{ background: '#DCF8C6' }}>
      <p className="text-[10px] font-bold mb-0.5" style={{ color: '#1a5c0a' }}>{sender}</p>
      {lines.map((l, i) => <p key={i} className="text-[10px] leading-relaxed">{l}</p>)}
      {sub}
    </div>
  </div>
);

const MsgLeft = ({ sender, color = '#888', lines, sub }: { sender: string; color?: string; lines: string[]; sub?: React.ReactNode }) => (
  <div className="flex justify-start">
    <div className="max-w-[80%] px-2.5 py-2 rounded-2xl rounded-tl-sm shadow-sm bg-white">
      <p className="text-[10px] font-bold mb-0.5" style={{ color }}>{sender}</p>
      {lines.map((l, i) => <p key={i} className="text-[10px] leading-relaxed">{l}</p>)}
      {sub}
    </div>
  </div>
);

// Bookee assistant — always LEFT
const BookeeMsg = ({ lines, sub, mid = '#1A7A4A', light = '#E8F7EF', border = 'rgba(26,122,74,0.22)' }: {
  lines: string[]; sub?: React.ReactNode; mid?: string; light?: string; border?: string;
}) => (
  <div className="flex justify-start gap-1.5">
    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: mid }}>
      <Bot className="h-2.5 w-2.5 text-white" />
    </div>
    <div className="max-w-[82%] px-2.5 py-2 rounded-2xl rounded-tl-sm shadow-sm" style={{ background: light, border: `1px solid ${border}` }}>
      <p className="text-[10px] font-bold mb-0.5" style={{ color: mid }}>Bookee</p>
      {lines.map((l, i) => <p key={i} className="text-[10px] leading-relaxed">{l}</p>)}
      {sub}
    </div>
  </div>
);

const ChatWrap = ({ name, children, barColor }: { name: string; children: React.ReactNode; barColor?: string }) => (
  <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
    <WaBar name={name} color={barColor} />
    <div className="p-2.5 space-y-1.5" style={{ background: '#ECE5DD' }}>
      {children}
    </div>
  </div>
);

// ─── Activity card preview ──────────────────────────────────────────────────
const ActivityCard = ({ title, venue, time, slots, price, pct, mid = '#1A7A4A', dark = '#0d5c35', light = '#E8F7EF' }: {
  title: string; venue: string; time: string; slots: string; price: string; pct?: number;
  mid?: string; dark?: string; light?: string;
}) => (
  <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
    <div className="px-3 py-2" style={{ background: dark }}>
      <p className="text-[10px] font-bold text-white">{title}</p>
    </div>
    <div className="px-3 py-2 space-y-1">
      {[['📍', venue],['📅', time],['💰', price],['🪑', slots]].map(([icon, val]) => (
        <div key={icon} className="flex items-center gap-1.5">
          <span className="text-[10px]">{icon}</span>
          <span className="text-[10px] font-medium" style={{ color: '#111' }}>{val}</span>
        </div>
      ))}
      {pct !== undefined && (
        <div className="pt-1">
          <div className="flex justify-between mb-0.5">
            <span className="text-[9px] text-muted-foreground">Slots filled</span>
            <span className="text-[9px] font-bold" style={{ color: mid }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: mid }} />
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── Action button row ────────────────────────────────────────────────────────
const ActionBtns = ({ labels, mid = '#1A7A4A' }: { labels: string[]; mid?: string }) => (
  <div className="flex gap-1.5 flex-wrap mt-1.5">
    {labels.map(l => (
      <span key={l} className="px-2 py-0.5 rounded-full text-[9px] font-bold border" style={{ borderColor: mid, color: mid, background: '#fff' }}>{l}</span>
    ))}
  </div>
);

// ─── ORGANIZER STEPS (green theme) ──────────────────────────────────────────
const G = THEME.organizer;
const ORG_STEPS = [
  {
    title: 'The Organiser Struggle Is Real',
    icon: <AlertTriangle className="h-6 w-6 text-white" />,
    tip: 'Organisers spend hours coordinating activities manually through chat groups.',
    content: (
      <div className="space-y-3">
        <div className="p-3 rounded-xl space-y-2" style={{ background: '#FEF9EC', border: '1.5px solid rgba(196,122,0,0.3)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7c5300' }}>Common pain points</p>
          {[
            ['😤', 'Hard to fill activities consistently'],
            ['🔁', 'Repeatedly posting details across Telegram / WhatsApp / Facebook'],
            ['🤷', 'Players asking the same questions over and over'],
            ['💸', 'Tracking players and payments manually via screenshots'],
            ['🚨', 'Last-minute cancellations with no easy replacement system'],
          ].map(([e, t], i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0">{e}</span>
              <span className="text-[10px] font-medium" style={{ color: '#7c5300' }}>{t}</span>
            </div>
          ))}
        </div>
        <ChatWrap name="SBH Badminton Group · 12 members">
          <MsgRight sender="James (Organiser)" lines={['Badminton next Tue SBH 7–9pm! Need 4 players. Who\'s in? 🏸']} />
          <MsgLeft sender="Player A" color="#1A6FA8" lines={['What level?']} />
          <MsgLeft sender="Player B" color="#8B5CF6" lines={['Still got slots?']} />
          <MsgLeft sender="Player C" color="#ef4444" lines={['How much is it?']} />
          <MsgLeft sender="Player D" color="#C47A00" lines={['Can bring friend?']} />
          <MsgRight sender="James (Organiser)" lines={['😩🤦 answering the same questions again...']} />
        </ChatWrap>
      </div>
    ),
  },
  {
    title: 'Bookee Turns Chaos Into Coordination',
    icon: <Sparkles className="h-6 w-6 text-white" />,
    tip: '"Bookee turns messy chat coordination into structured activity pages."',
    content: (
      <div className="space-y-3">
        <div className="p-4 rounded-xl text-center space-y-1.5" style={{ background: G.light, border: `2px solid ${G.border}` }}>
          <p className="text-base font-bold" style={{ color: G.dark }}>BOOKEE</p>
          <p className="text-xs font-medium" style={{ color: G.text }}>Turns messy chat coordination<br />into structured activity pages.</p>
        </div>
        <div className="rounded-xl border overflow-hidden bg-white">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: G.light, color: G.mid }}>What Bookee Does</div>
          {[
            ['⚡', 'Host activities faster', 'From a single chat message — no forms, no fuss'],
            ['🤐', 'Reduce repetitive admin', 'Activity page answers FAQs automatically'],
            ['📊', 'Track players and payments clearly', 'Paid / pending / waitlist at a glance'],
            ['🔗', 'Share structured activity links', 'Drop one link into Telegram or WhatsApp — done'],
          ].map(([icon, label, sub], i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 border-b last:border-0">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <div>
                <p className="text-[11px] font-bold" style={{ color: '#111' }}>{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: G.light }}>
          <Zap className="h-4 w-4 flex-shrink-0" style={{ color: G.mid }} />
          <p className="text-[11px] font-bold" style={{ color: G.text }}>Keep using Telegram & WhatsApp — Bookee handles the rest.</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Host an Activity Directly From Chat',
    icon: <Bot className="h-6 w-6 text-white" />,
    tip: 'One message creates the activity. Share the link into any group instantly.',
    content: (
      <div className="space-y-3">
        <ChatWrap name="Weekend Warriors · WhatsApp">
          <MsgRight sender="James (Organiser)" lines={['Bookee, host badminton next week', 'Tuesday 7–9pm', 'Singapore Badminton Hall', '$12 per player · 6 slots']} />
          <BookeeMsg
            lines={['✅ Activity created successfully on the Bookee platform.']}
            sub={
              <div className="mt-2 space-y-1.5">
                <ActivityCard title="🏸 Badminton" venue="Singapore Badminton Hall (SBH)" time="Next Tuesday 7–9pm" slots="6 slots" price="$12 / person" />
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl" style={{ background: 'rgba(26,122,74,0.1)' }}>
                  <Link className="h-3 w-3 flex-shrink-0" style={{ color: G.mid }} />
                  <span className="text-[10px] font-bold" style={{ color: G.mid }}>bookee.sg.sites.blink.new/activity/123</span>
                </div>
                <ActionBtns labels={['Advertise Publicly', 'Share to Badminton Group']} />
              </div>
            }
          />
        </ChatWrap>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: G.light }}>
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: G.mid }} />
          <p className="text-[11px] font-bold" style={{ color: G.text }}>One message. One link. Zero repeated typing.</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Bookee Coordination Dashboard',
    icon: <TrendingUp className="h-6 w-6 text-white" />,
    tip: 'Bookee organises participants and payments — no more manual tracking in chat.',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl border overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between" style={{ background: G.dark, color: '#7FFFC4' }}>
            <span>🏸 Badminton · SBH Tue 7–9pm</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(127,255,196,0.15)', color: '#7FFFC4' }}>Live</span>
          </div>
          <div className="px-3 py-2 border-b bg-white">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold">Remaining Slots</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF9EC', color: '#C47A00' }}>2 left</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-gray-100">
              <div className="h-2 rounded-full" style={{ width: '67%', background: G.mid }} />
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5">4 of 6 slots filled</p>
          </div>
          {[{ name: 'Alex Tan', status: 'paid' }, { name: 'Sarah Lim', status: 'paid' }, { name: 'Mike Chen', status: 'pending' }, { name: 'Priya K', status: 'pending' }].map((p, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 border-b last:border-0 bg-white">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: G.mid }}>{p.name[0]}</div>
              <span className="text-[10px] font-medium flex-1">{p.name}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={p.status === 'paid' ? { background: G.light, color: G.mid } : { background: '#fef2f2', color: '#ef4444' }}>
                {p.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
              </span>
            </div>
          ))}
          <div className="px-3 py-1.5 bg-gray-50 border-t">
            <p className="text-[9px] text-muted-foreground">⬆️ Waitlist appears automatically only when all slots are full</p>
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl text-center" style={{ background: G.dark }}>
          <p className="text-[11px] font-bold" style={{ color: '#7FFFC4' }}>Player list · payment status · waitlist — all automatic.</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Stop Answering the Same Questions',
    icon: <Bell className="h-6 w-6 text-white" />,
    tip: 'Bookee reduces repetitive questions by showing clear information on the activity page.',
    content: (
      <div className="space-y-3">
        <ChatWrap name="SBH Badminton Group · 12 members">
          <MsgRight sender="James (Organiser)" lines={['Check the activity page for all info 👇', 'bookee.sg.sites.blink.new/activity/123']} />
          <MsgLeft sender="Player A" color="#1A6FA8" lines={['How many slots still available? 🤔']} />
          <MsgLeft sender="Player B" color="#8B5CF6" lines={['How many players can I bring?']} />
          <MsgLeft sender="Player C" color="#ef4444" lines={['By when must payment be confirmed?']} />
          <MsgLeft sender="Player D" color="#C47A00" lines={['Can you reserve a slot for me first?']} />
          <MsgLeft sender="Player E" color="#059669" lines={['Can I back out if I\'m busy?']} />
          <MsgRight sender="James (Organiser)" lines={['🤕🤦 everything is already on the Bookee page...']} />
        </ChatWrap>
        <div className="rounded-xl border overflow-hidden bg-white">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: G.light, color: G.mid }}>Bookee Activity Page Answers These</div>
          {[
            ['🪑', 'Slots left', 'Live slot counter always visible'],
            ['👥', 'Guest policy', 'Max players per booking shown upfront'],
            ['⏰', 'Payment deadline', 'Deadline date displayed clearly'],
            ['🔒', 'Slot reservation', 'Slot held on booking confirmation'],
            ['↩️', 'Cancellation policy', 'Policy shown before player books'],
          ].map(([icon, q, a], i) => (
            <div key={i} className="px-3 py-2 border-b last:border-0">
              <p className="text-[10px] font-bold">{icon} {q}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">→ {a}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// ─── PLAYER STEPS (blue theme) ───────────────────────────────────────────────
const P = THEME.player;
const PLAYER_STEPS = [
  // Slide 1 – Multiple Chat Groups
  {
    title: 'Games Are Scattered Across Many Groups',
    icon: <AlertTriangle className="h-6 w-6 text-white" />,
    tip: 'Players scroll through multiple chat groups trying to find suitable activities.',
    content: (
      <div className="space-y-2">
        <p className="text-[10px] font-bold px-1" style={{ color: P.text }}>Your messaging apps right now 📱</p>
        {[
          { group: 'Badminton SG Group', bar: '#1A6FA8', msgs: [
            { s: 'Organiser A', c: '#1A6FA8', l: 'Badminton SBH Tuesday 7–9pm\nNeed 3 players' },
            { s: 'Organiser A', c: '#1A6FA8', l: 'Still need 2 more players' },
          ]},
          { group: 'Bukit Panjang Sports', bar: '#059669', msgs: [
            { s: 'Organiser B', c: '#059669', l: 'Senja Cashew CC tonight\n2 slots left 🏸' },
          ]},
          { group: 'West Side Badminton', bar: '#7C3AED', msgs: [
            { s: 'Organiser C', c: '#7C3AED', l: 'SBH Friday 8–10pm\nLooking for players' },
          ]},
          { group: 'Weekend Sports Group', bar: '#C47A00', msgs: [
            { s: 'Organiser A', c: '#C47A00', l: 'SBH Tue still 2 slots!\nWho\'s joining?' },
          ]},
        ].map(({ group, bar, msgs }) => (
          <div key={group} className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <WaBar name={group} color={bar} />
            <div className="px-2 py-1.5 space-y-1" style={{ background: '#ECE5DD' }}>
              {msgs.map((m, i) => (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] px-2.5 py-1.5 rounded-2xl rounded-tl-sm shadow-sm bg-white">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: m.c }}>{m.s}</p>
                    {m.l.split('\n').map((line, j) => <p key={j} className="text-[10px] leading-relaxed">{line}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="px-3 py-2 rounded-xl" style={{ background: '#FEF2F2', border: '1.5px solid rgba(239,68,68,0.25)' }}>
          <p className="text-[10px] font-medium text-center" style={{ color: '#ef4444' }}>😩 Scrolling through 4 groups to find one suitable game</p>
        </div>
      </div>
    ),
  },

  // Slide 2 – Discover Activities Through Chat
  {
    title: 'Discover Activities Through Chat',
    icon: <Bot className="h-6 w-6 text-white" />,
    tip: 'Ask Bookee what is on this week — get structured answers instantly.',
    content: (
      <div className="space-y-3">
        <ChatWrap name="Bookee · WhatsApp" barColor={P.dark}>
          <MsgRight sender="Alex" lines={['Find me interesting activities happening this week']} />
          <BookeeMsg
            mid={P.mid} light={P.light} border={P.border}
            lines={['Here are the top activities for you this week 👇']}
            sub={
              <div className="mt-2 space-y-1.5">
                {[
                  { n: '1️⃣', sport: 'Badminton',  venue: 'Singapore Badminton Hall (SBH)', time: 'Tue 7–9pm',  level: 'Intermediate',    slots: '2 slots left',  c: '#ef4444' },
                  { n: '2️⃣', sport: 'Pickleball', venue: 'Senja Cashew CC',                time: 'Sat 5–7pm',  level: 'Beginner friendly', slots: '3 slots left',  c: '#C47A00' },
                  { n: '3️⃣', sport: 'Kayaking',   venue: 'Marina Bay',                    time: 'Sun Sunset By The River', level: 'Beginner friendly', slots: '5 slots left', c: P.mid },
                ].map((a, i) => (
                  <div key={i} className="p-1.5 rounded-xl" style={{ background: '#fff', border: `1px solid ${P.border}` }}>
                    <p className="text-[10px] font-bold">{a.n} {a.sport} — {a.venue}</p>
                    <p className="text-[9px] text-muted-foreground">{a.time} · {a.level}</p>
                    <span className="text-[9px] font-bold" style={{ color: a.c }}>{a.slots}</span>
                  </div>
                ))}
                <ActionBtns labels={['Browse by Location', 'Browse by Sport', 'Browse by Interest']} mid={P.mid} />
              </div>
            }
          />
        </ChatWrap>
      </div>
    ),
  },

  // Slide 3 – Verified Organisers
  {
    title: 'Verified Organisers You Can Trust',
    icon: <Shield className="h-6 w-6 text-white" />,
    tip: 'Organisers are verified before hosting — building trust and reducing scam concerns.',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: P.light, border: `2px solid ${P.border}` }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: P.mid }}>
            <BadgeCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold" style={{ color: P.dark }}>✔️ Verified Organisers</p>
            <p className="text-[9px] text-muted-foreground">Payments processed through MAS-regulated payment providers.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border-2 bg-white space-y-3" style={{ borderColor: P.border }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: P.mid }}>J</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm" style={{ color: '#111' }}>James Koh</p>
                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: P.light, color: P.mid }}>
                  <BadgeCheck className="h-2.5 w-2.5" /> Verified Organiser
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-2.5 w-2.5" style={{ color: '#C47A00', fill: '#C47A00' }} />)}
                <span className="text-[9px] text-muted-foreground ml-1">4.9 · 47 sessions hosted</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: 'Sessions', value: '47', icon: '🏸' }, { label: 'Rating', value: '4.9★', icon: '⭐' }, { label: 'Players', value: '210', icon: '👥' }].map(({ label, value, icon }) => (
              <div key={label} className="flex flex-col items-center p-2 rounded-xl" style={{ background: P.faint }}>
                <span>{icon}</span>
                <span className="text-xs font-bold" style={{ color: P.mid }}>{value}</span>
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden bg-white">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: P.faint, color: P.mid }}>Why Verification Matters</div>
          {[
            ['✅', 'Identity verified — not an anonymous poster'],
            ['📊', 'Session history publicly visible'],
            ['⭐', 'Participant ratings and reviews'],
            ['🔒', 'Payments processed through MAS-regulated payment providers.'],
          ].map(([icon, label], i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 border-b last:border-0">
              <span className="text-sm">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // Slide 4 – Booking Activity From Chat
  {
    title: 'Book an Activity From Chat',
    icon: <Users className="h-6 w-6 text-white" />,
    tip: 'Players can see who has already joined before committing.',
    content: (
      <div className="space-y-3">
        <ChatWrap name="Weekend Warriors · WhatsApp" barColor={P.dark}>
          <MsgRight sender="James (Organiser)" lines={['Badminton Sat — 2 slots left! 👇', 'bookee.sg.sites.blink.new/activity/123']} />
          <BookeeMsg
            mid={P.mid} light={P.light} border={P.border}
            lines={['Tap to view full activity page:']}
            sub={
              <div className="mt-2 space-y-2">
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="px-2.5 py-1.5" style={{ background: P.dark }}>
                    <p className="text-[10px] font-bold text-white">🏸 Badminton · SBH · Sat 5–7pm</p>
                  </div>
                  <div className="px-2.5 py-2 space-y-1">
                    <p className="text-[9px] font-bold" style={{ color: P.mid }}>Players joined:</p>
                    {['Alex Tan', 'Sarah Lim', 'David Wong'].map(n => (
                      <div key={n} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: P.mid }}>{n[0]}</div>
                        <span className="text-[9px]">{n}</span>
                        <span className="text-[8px] ml-auto" style={{ color: P.mid }}>✅</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#FEF9EC', color: '#C47A00' }}>⏳ Pending Payment: 1</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#F0F9FF', color: P.mid }}>⏳ Pending Approval: 1</span>
                    </div>
                    <p className="text-[9px] font-bold pt-0.5" style={{ color: '#C47A00' }}>2 slots remaining</p>
                  </div>
                </div>
                <ActionBtns labels={['View Full Activity Page']} mid={P.mid} />
              </div>
            }
          />
        </ChatWrap>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: P.light }}>
          <ExternalLink className="h-4 w-4 flex-shrink-0" style={{ color: P.mid }} />
          <p className="text-[11px] font-bold" style={{ color: P.text }}>One tap opens the full Bookee activity page.</p>
        </div>
      </div>
    ),
  },

  // Slide 5 – Payment Confirmation
  {
    title: 'Payment Confirmation & Security',
    icon: <QrCode className="h-6 w-6 text-white" />,
    tip: 'Payments processed through MAS-regulated payment providers.',
    content: (
      <div className="space-y-3">
        <div className="p-3 rounded-xl border-2 bg-white space-y-3" style={{ borderColor: P.border }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Your Booking</p>
              <p className="font-bold text-sm" style={{ color: '#111' }}>Badminton · SBH Tue 7–9pm</p>
              <p className="text-[9px] text-muted-foreground">Ref: SBH-TUE-7PM-A01</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF9EC', color: '#C47A00' }}>⏳ Pending</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: '#f8fafb' }}>
            <QrSvg size={80} />
            <p className="text-[10px] font-bold text-muted-foreground">Scan to pay</p>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: P.light }}>
            <span className="text-xs text-muted-foreground">Amount due</span>
            <span className="text-xl font-bold" style={{ color: P.dark }}>$12</span>
          </div>
        </div>
        <div className="rounded-xl border overflow-hidden bg-white">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-muted/40">Your Participation is Confirmed</div>
          {[
            ['🪑', 'Slot reservation confirmed', 'Your spot is secured on payment'],
            ['🧾', 'Payment confirmation receipt', 'Sent with booking reference'],
            ['🛡️', 'Payments processed through MAS-regulated payment providers.', 'Secure and regulated'],
          ].map(([icon, label, sub], i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 border-b last:border-0">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <div>
                <p className="text-[10px] font-bold" style={{ color: '#111' }}>{label}</p>
                <p className="text-[9px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 rounded-xl text-center" style={{ background: P.dark }}>
          <p className="text-[11px] font-bold" style={{ color: P.accent }}>Players know their participation is confirmed and secure.</p>
        </div>
      </div>
    ),
  },
];

// ─── CHAT COORDINATION STEPS (yellow theme, 5 slides) ───────────────────────
const C = THEME.chat;
const CHAT_STEPS = [

  // Slide 1 – Random Chance Coordination
  {
    title: 'Filling Games Is a Game of Chance',
    icon: <Dice5 className="h-6 w-6 text-white" />,
    tip: 'Organisers post repeatedly and hope players join — coordination by random chance.',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.light, border: `1.5px solid ${C.border}` }}>
          <Dice5 className="h-4 w-4 flex-shrink-0" style={{ color: C.mid }} />
          <p className="text-[10px] font-bold" style={{ color: C.text }}>Same messages posted across Telegram · WhatsApp · Facebook</p>
        </div>
        {[
          { group: 'Badminton SBH · Telegram · 340 members', bar: '#1A6FA8', msgs: [
            { s: 'Organiser A', c: '#1A6FA8', l: 'Badminton SBH Tuesday\nNeed players 🏸' },
          ]},
          { group: 'Weekend Sports · WhatsApp', bar: '#059669', msgs: [
            { s: 'Organiser B', c: '#059669', l: 'Pickleball Senja Cashew\n2 slots left' },
          ]},
          { group: 'SG Sports Network · Facebook', bar: '#1877F2', msgs: [
            { s: 'Organiser C', c: '#1877F2', l: 'Badminton Friday SBH\nLooking for 3 players' },
          ]},
        ].map(({ group, bar, msgs }) => (
          <div key={group} className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <WaBar name={group} color={bar} />
            <div className="px-2 py-1.5 space-y-1" style={{ background: '#ECE5DD' }}>
              {msgs.map((m, i) => (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] px-2.5 py-1.5 rounded-2xl rounded-tl-sm shadow-sm bg-white">
                    <p className="text-[10px] font-bold mb-0.5" style={{ color: m.c }}>{m.s}</p>
                    {m.l.split('\n').map((line, j) => <p key={j} className="text-[10px] leading-relaxed">{line}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="p-2 rounded-xl text-center" style={{ background: C.light, border: `1px solid ${C.border}` }}>
          <p className="text-[10px] font-medium" style={{ color: C.text }}>🎲 Post and hope. Then post again. Coordination by chance.</p>
        </div>
      </div>
    ),
  },

  // Slide 2 – Organiser Admin Exhaustion
  {
    title: 'Repetitive Questions Drain Organisers',
    icon: <AlertTriangle className="h-6 w-6 text-white" />,
    tip: 'Organisers get exhausted answering the same questions before every game.',
    content: (
      <div className="space-y-3">
        <ChatWrap name="SBH Badminton Group · Telegram" barColor={C.dark}>
          <MsgRight sender="James (Organiser)" lines={['Badminton next week', 'SBH Tuesday 7–9pm', 'Need 4 players 🏸']} />
          <MsgLeft sender="Player A" color="#1A6FA8" lines={['How many slots left?']} />
          <MsgLeft sender="Player B" color="#8B5CF6" lines={['Can I bring a friend?']} />
          <MsgLeft sender="Player C" color="#ef4444" lines={['Can reserve first?']} />
          <MsgLeft sender="Player D" color="#C47A00" lines={['Where exactly in SBH?']} />
          <MsgLeft sender="Player E" color="#059669" lines={['What level is this?']} />
        </ChatWrap>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: C.light, border: `1.5px solid ${C.border}` }}>
          <span className="text-2xl">😓</span>
          <div>
            <p className="text-[11px] font-bold" style={{ color: C.dark }}>Organiser reaction</p>
            <p className="text-[10px]" style={{ color: C.text }}>Exhausted from answering the same questions before every single game.</p>
          </div>
        </div>
      </div>
    ),
  },

  // Slide 3 – Bookee Assistant Helps
  {
    title: 'Bookee Assistant Steps In',
    icon: <Bot className="h-6 w-6 text-white" />,
    tip: 'Bookee assistant helps organise admin tasks — from inside your chat.',
    content: (
      <div className="space-y-3">
        <ChatWrap name="Weekend Warriors · WhatsApp" barColor={C.dark}>
          <MsgRight sender="James (Organiser)" lines={['Bookee, host badminton next week', 'Tuesday 7–9pm · SBH · $12 · 6 slots']} />
          <BookeeMsg
            mid={C.mid} light={C.light} border={C.border}
            lines={['✅ Activity created! Here\'s your listing preview:']}
            sub={
              <div className="mt-2">
                <ActivityCard title="🏸 Badminton" venue="Singapore Badminton Hall (SBH)" time="Next Tuesday 7–9pm" slots="4 / 6 slots filled" price="$12 / person" pct={60} mid={C.mid} dark={C.dark} light={C.light} />
                <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded-xl" style={{ background: `rgba(196,122,0,0.1)` }}>
                  <Link className="h-3 w-3 flex-shrink-0" style={{ color: C.mid }} />
                  <span className="text-[9px] font-bold" style={{ color: C.mid }}>bookee.sg.sites.blink.new/activity/sbh-tue-7pm</span>
                </div>
              </div>
            }
          />
        </ChatWrap>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.light }}>
          <Zap className="h-4 w-4 flex-shrink-0" style={{ color: C.mid }} />
          <p className="text-[11px] font-bold" style={{ color: C.text }}>Bookee assistant organises admin tasks automatically.</p>
        </div>
      </div>
    ),
  },

  // Slide 4 – Activity Status Updates
  {
    title: 'Automatic Activity Status Updates',
    icon: <Bell className="h-6 w-6 text-white" />,
    tip: 'Bookee sends live updates so organisers always know what is happening.',
    content: (
      <div className="space-y-3">
        <ChatWrap name="Weekend Warriors · WhatsApp" barColor={C.dark}>
          <BookeeMsg
            mid={C.mid} light={C.light} border={C.border}
            lines={['📊 Activity update for SBH Tue 7–9pm:']}
            sub={
              <div className="mt-2 space-y-2">
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ background: C.dark, color: C.accent }}>Timeslot Status</div>
                  <div className="px-2.5 py-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold">Slots filled</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.light, color: C.mid }}>4 of 6</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                      <div className="h-2 rounded-full" style={{ width: '67%', background: C.mid }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="p-1.5 rounded-lg text-center" style={{ background: C.light }}>
                        <p className="text-[10px] font-bold" style={{ color: C.mid }}>4 of 6</p>
                        <p className="text-[9px] text-muted-foreground">Slots filled</p>
                      </div>
                      <div className="p-1.5 rounded-lg text-center" style={{ background: '#fef2f2' }}>
                        <p className="text-[10px] font-bold" style={{ color: '#ef4444' }}>2 pending</p>
                        <p className="text-[9px] text-muted-foreground">Payments</p>
                      </div>
                    </div>
                  </div>
                </div>
                <ActionBtns labels={['Keep Posting to Fill Slots', 'Send Reminder', 'Share Activity']} mid={C.mid} />
              </div>
            }
          />
        </ChatWrap>
      </div>
    ),
  },

  // Slide 5 – Manage Activity on Bookee Platform
  {
    title: 'Full Control on Bookee Platform',
    icon: <Sparkles className="h-6 w-6 text-white" />,
    tip: 'Chat assistant handles coordination while the platform provides full management control.',
    content: (
      <div className="space-y-3">
        <div className="rounded-xl border overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ background: C.dark, color: C.accent }}>
            Bookee Platform — Organiser View
          </div>
          {[
            { icon: '✅', action: 'Approve players',         sub: 'Full control over who joins your activity' },
            { icon: '❌', action: 'Reject players',          sub: 'Remove unconfirmed or unsuitable players' },
            { icon: '💳', action: 'Track payments',          sub: 'See paid / pending / overdue at a glance' },
            { icon: '📋', action: 'Manage waitlist',         sub: 'Auto-fill slots from waitlist on cancellation' },
            { icon: '✏️', action: 'Edit activity',           sub: 'Update time, venue, or price at any time' },
          ].map(({ icon, action, sub }, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 border-b last:border-0 bg-white">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <div>
                <p className="text-[11px] font-bold" style={{ color: '#111' }}>{action}</p>
                <p className="text-[9px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl" style={{ background: C.light }}>
            <Bot className="h-4 w-4 mb-1" style={{ color: C.mid }} />
            <p className="text-[10px] font-bold" style={{ color: C.mid }}>Chat Assistant</p>
            <p className="text-[9px] text-muted-foreground">Quick updates and replies inside chat</p>
          </div>
          <div className="p-2.5 rounded-xl" style={{ background: C.faint, border: `1px solid ${C.border}` }}>
            <TrendingUp className="h-4 w-4 mb-1" style={{ color: C.mid }} />
            <p className="text-[10px] font-bold" style={{ color: C.mid }}>Bookee Platform</p>
            <p className="text-[9px] text-muted-foreground">Full management controls</p>
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl text-center" style={{ background: C.dark }}>
          <p className="text-[11px] font-bold" style={{ color: C.accent }}>Chat for quick tasks. Platform for full control.</p>
        </div>
      </div>
    ),
  },
];

// ─── Config maps ──────────────────────────────────────────────────────────────
const STEPS_MAP: Record<DemoType, typeof ORG_STEPS> = {
  organizer: ORG_STEPS,
  player:    PLAYER_STEPS,
  chat:      CHAT_STEPS,
};
const HEADER_BG: Record<DemoType, string> = {
  organizer: THEME.organizer.dark,
  player:    THEME.player.dark,
  chat:      THEME.chat.dark,
};
const BTN_BG: Record<DemoType, string> = {
  organizer: THEME.organizer.mid,
  player:    THEME.player.mid,
  chat:      THEME.chat.mid,
};
const LABEL: Record<DemoType, string> = {
  organizer: '🎯 Organiser Demo',
  player:    '🏸 Player Demo',
  chat:      '💬 Chat Coordination',
};
const END_EMOJI: Record<DemoType, string> = { organizer: '🎯', player: '🏸', chat: '💬' };
const END_TITLE: Record<DemoType, string> = {
  organizer: 'Ready to Host Activities?',
  player:    'Ready to Find Your Activity?',
  chat:      'Replace Chat Chaos Today',
};
const END_BODY: Record<DemoType, string> = {
  organizer: 'Host activities faster. Reduce repetitive admin. Track participation and payments clearly — all in one place.',
  player:    'Find suitable activities near you. Join trusted organisers. Book with confidence — payments processed through MAS-regulated payment providers.',
  chat:      'One Bookee link replaces dozens of chat messages. Let Bookee handle coordination while you focus on playing.',
};
const END_CTA: Record<DemoType, string> = {
  organizer: 'Sign Up as Organiser — Free',
  player:    'Sign Up Free — Find Activities',
  chat:      "Get Started — It's Free",
};
const END_ROUTE: Record<DemoType, string> = {
  organizer: '/signup/organizer',
  player:    '/signup/player',
  chat:      '/signup/player',
};
const END_ACCENT: Record<DemoType, string> = {
  organizer: '#7FFFC4',
  player:    '#93C5FD',
  chat:      '#FCD34D',
};

// ─── Shell ────────────────────────────────────────────────────────────────────
interface DemoTourProps { type: DemoType; onClose: () => void; }

export default function DemoTour({ type, onClose }: DemoTourProps) {
  const navigate = useNavigate();
  const steps = STEPS_MAP[type];

  const [step, setStep]       = useState(0);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    const t = setTimeout(onClose, 5 * 60 * 1000);
    return () => clearTimeout(t);
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => { setStep(0); setShowEnd(false); }, [type]);

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else setShowEnd(true);
  }, [step, steps.length]);

  const handlePrev = useCallback(() => {
    if (showEnd) { setShowEnd(false); return; }
    if (step > 0) setStep(s => s - 1);
  }, [step, showEnd]);

  const cur = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="relative w-full max-w-md flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: '#fff', maxHeight: '92vh' }}
        >
          {/* ── Header ── */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4" style={{ background: HEADER_BG[type] }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {LABEL[type]}
              </span>
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}
              >
                <X className="h-3 w-3" /> Exit
              </button>
            </div>

            {!showEnd && (
              <>
                <div className="flex gap-1 mb-3">
                  {steps.map((_, i) => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    {cur.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Step {step + 1} of {steps.length}
                    </p>
                    <h3 className="font-bold text-white leading-snug text-[0.92rem]">{cur.title}</h3>
                  </div>
                </div>
              </>
            )}

            {showEnd && (
              <div className="text-center py-1">
                <div className="text-3xl mb-1">{END_EMOJI[type]}</div>
                <h3 className="text-lg font-bold text-white">{END_TITLE[type]}</h3>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <AnimatePresence mode="wait">
              {!showEnd ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3"
                >
                  <div className="px-3 py-2 rounded-xl text-[10px] font-medium" style={{ background: THEME[type].light, color: THEME[type].text }}>
                    💡 {cur.tip}
                  </div>
                  {cur.content}
                </motion.div>
              ) : (
                <motion.div
                  key="end"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="text-center space-y-4 py-6"
                >
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">{END_BODY[type]}</p>
                  <Button
                    className="w-full h-12 rounded-xl font-bold text-white"
                    style={{ background: BTN_BG[type] }}
                    onClick={() => navigate(END_ROUTE[type])}
                  >
                    {END_CTA[type]}
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-xl font-bold"
                    onClick={() => navigate('/login')}>
                    I Already Have an Account
                  </Button>
                  <button onClick={onClose} className="text-sm text-muted-foreground underline underline-offset-2">
                    Maybe later
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer Nav ── */}
          {!showEnd && (
            <div className="flex-shrink-0 px-5 py-3 border-t flex items-center justify-between bg-white">
              <Button variant="ghost" size="sm" onClick={handlePrev} disabled={step === 0} className="rounded-xl">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <span className="text-[10px] font-bold text-muted-foreground">{step + 1}/{steps.length}</span>
              <Button size="sm" onClick={handleNext} className="rounded-xl font-bold text-white" style={{ background: BTN_BG[type] }}>
                {step === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
