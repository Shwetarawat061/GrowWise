import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Volume2,
  ArrowLeft,
  X,
  Compass,
  Bot,
  User,
  GraduationCap,
  Languages,
  Briefcase,
  Zap,
  HeartHandshake,
  ShieldCheck,
  Headphones,
  Wind,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, MentorMode } from '../../types';
import { api } from '../../services/apiClient';
import { MENTOR_MODES, MENTOR_MODE_LIST } from '../../data/mentorModes';
import { BreathingExerciseModal } from '../common/BreathingExerciseModal';

interface AICompanionViewProps {
  onClose?: () => void;
  initialPrompt?: string;
  initialMode?: string;
  initialVentMode?: boolean;
}

export const AICompanionView: React.FC<AICompanionViewProps> = ({
  onClose,
  initialPrompt,
  initialMode,
  initialVentMode = false,
}) => {
  const { user, setShowEmergencyModal } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState(initialPrompt || '');

  // Default to life or reflect if initialMode matches
  const validInitialMode = (initialMode && MENTOR_MODES[initialMode as MentorMode] ? initialMode : 'life') as MentorMode;
  const [selectedMode, setSelectedMode] = useState<MentorMode>(validInitialMode);
  const [ventMode, setVentMode] = useState<boolean>(initialVentMode);

  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [showFrameworkModal, setShowFrameworkModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);

  const isMentalFatigueOrBreathing = (text?: string) => {
    if (!text) return false;
    return /\b(mentally tired|tired|exhausted|burnout|burnt out|fatigued|drained|overwhelmed|brain is fried|can't think|cant think|mind is tired|so heavy|stress|stressed|headache|need a break|need to breathe|take a breath|breathing exercise|box breathing)\b/i.test(text);
  };

  // Framework inputs for Situation -> Thought -> Reality -> Action
  const [frameworkSituation, setFrameworkSituation] = useState('');
  const [frameworkThought, setFrameworkThought] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMentor = MENTOR_MODES[selectedMode] || MENTOR_MODES.life;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadSession = async () => {
    try {
      const session = await api.getChatSession();
      setMessages(session.messages || []);
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
  };

  const handleSend = async (customText?: string, modeOverride?: MentorMode, ventOverride?: boolean) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

    const activeMode = modeOverride || selectedMode;
    const isVenting = ventOverride !== undefined ? ventOverride : ventMode;

    // Optimistic temporary message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: 'active',
      sender: 'user',
      message: textToSend,
      timestamp: new Date().toISOString(),
      action_type: isVenting ? `${activeMode}-vent` : activeMode,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.sendChatMessage(textToSend, activeMode, activeMode, isVenting);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.userMessage,
        res.assistantMessage,
      ]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        session_id: 'active',
        sender: 'assistant',
        message:
          'I am having trouble connecting to the AI service right now. If you need immediate support, please reach out to someone you trust or check the Crisis Resources.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your conversation history with GrowWise?')) {
      await api.clearChatHistory();
      setMessages([]);
    }
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);
    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const submitFramework = () => {
    if (!frameworkSituation.trim() || !frameworkThought.trim()) return;
    const prompt = `Use the GrowWise 4-Step Framework (Situation → Thought → Reality → Action) for this experience:
• Situation: "${frameworkSituation}"
• Automatic Thought: "${frameworkThought}"
Please analyze the reality vs fear, and give me ONE concrete, achievable micro-action.`;
    setShowFrameworkModal(false);
    setFrameworkSituation('');
    setFrameworkThought('');
    handleSend(prompt, 'reflect', false);
  };

  const renderModeIcon = (modeId: MentorMode, sizeClass = 'w-4 h-4') => {
    switch (modeId) {
      case 'life':
        return <Compass className={sizeClass} />;
      case 'study':
        return <GraduationCap className={sizeClass} />;
      case 'english':
        return <Languages className={sizeClass} />;
      case 'career':
        return <Briefcase className={sizeClass} />;
      case 'motivation':
        return <Zap className={sizeClass} />;
      case 'reflect':
      default:
        return <HeartHandshake className={sizeClass} />;
    }
  };

  const preferredName = user?.nickname || user?.name?.split(' ')[0] || 'Friend';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-stone-50 border-x border-stone-200">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-sm font-bold text-stone-900">
                GrowWise AI Mentors
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Daily Safe Sanctuary
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Personalized for {preferredName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFrameworkModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
            title="4-Step Confidence Framework"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4-Step Framework</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Mentor Modes Selector Ribbon */}
      <div className="bg-white border-b border-stone-200 px-3 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-1">
            Modes:
          </span>
          {MENTOR_MODE_LIST.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? `${mode.pillBg} shadow-xs scale-102 ring-1 ring-stone-300`
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {renderModeIcon(mode.id, 'w-3.5 h-3.5')}
                <span>{mode.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Persona Banner & Safe Vent Toggle */}
      <div className="bg-stone-100/90 border-b border-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-900 flex items-center gap-1.5">
            {renderModeIcon(activeMentor.id, 'w-4 h-4 text-emerald-700')}
            {activeMentor.name}:
          </span>
          <span className="text-stone-600 text-[11px] hidden md:inline">
            {activeMentor.tagline}
          </span>
        </div>

        {/* Safe Vent Mode Toggle & Quick Breathing Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBreathingModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition-all shadow-2xs"
            title="Take a 1-minute mindful breathing reset"
          >
            <Wind className="w-3.5 h-3.5 text-teal-600" />
            <span>Breathe</span>
          </button>

          <button
            onClick={() => setVentMode(!ventMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              ventMode
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
            title="When active, AI listens with pure empathy and no unsolicited lectures"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{ventMode ? 'Safe Vent: Active (Just Listen)' : 'Safe Vent: Off'}</span>
          </button>

          <button
            onClick={() => setShowEmergencyModal(true)}
            className="text-[11px] text-stone-500 hover:text-rose-600 font-semibold underline shrink-0"
          >
            Crisis Info
          </button>
        </div>
      </div>

      {/* Vent Mode Notice when ON */}
      {ventMode && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Safe Vent Active:</strong> Your {activeMentor.name} is in pure listening & empathy mode. Speak freely without worrying about advice, judgment, or expectations.
            </span>
          </div>
          <button
            onClick={() => setVentMode(false)}
            className="text-[11px] text-rose-700 underline font-semibold ml-2 shrink-0 hover:text-rose-900"
          >
            Turn off
          </button>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="max-w-md mx-auto my-6 p-6 bg-white rounded-3xl border border-stone-200 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
              {renderModeIcon(activeMentor.id, 'w-6 h-6 text-emerald-800')}
            </div>
            <h3 className="font-heading text-base font-bold text-stone-900 mb-1">
              Welcome, {preferredName}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              I am your <strong>{activeMentor.name}</strong>. {activeMentor.description}
            </p>
            <div className="text-left space-y-1.5 text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Specialization in this mode:
              </p>
              <p className="text-stone-600">{activeMentor.safeVentFocus}</p>
              {user?.main_growth_goal && (
                <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                  Target goal: <em>{user.main_growth_goal}</em>
                </p>
              )}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showBreathingCard =
            !isUser &&
            (isMentalFatigueOrBreathing(msg.message) ||
              (prevMsg?.sender === 'user' && isMentalFatigueOrBreathing(prevMsg.message)));

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-emerald-700 text-white rounded-tr-xs'
                    : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.message}</div>

                {/* Inline Breathing Exercise Trigger when mentally tired / breathing mentioned */}
                {showBreathingCard && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Wind className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="text-left">
                        <p className="font-heading font-bold text-xs text-teal-950">
                          Mindful Breathing Exercise
                        </p>
                        <p className="text-[11px] text-teal-800 leading-snug">
                          Feeling mentally tired? Take 1 minute to release tension and ground yourself.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBreathingModal(true)}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Wind className="w-3.5 h-3.5" />
                      <span>Start Breathing</span>
                    </button>
                  </div>
                )}

                <div
                  className={`mt-2 pt-1.5 flex items-center justify-between text-[10px] border-t ${
                    isUser ? 'border-emerald-600/60 text-emerald-200' : 'border-stone-100 text-stone-400'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {!isUser && (
                    <button
                      onClick={() => handleSpeak(msg.message, msg.id)}
                      className="flex items-center gap-1 hover:text-emerald-700 transition-colors"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeakingId === msg.id ? 'Stop' : 'Listen'}</span>
                    </button>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-stone-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 border border-stone-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              <div
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
              <div
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: '0.4s' }}
              />
              <span className="text-xs text-stone-500 ml-1">
                {activeMentor.name} is listening & reflecting...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips for Current Mentor Mode */}
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-200/80 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0">
          Try:
        </span>
        <button
          onClick={() => handleSend("I'm feeling mentally tired and exhausted today. Everything feels a bit heavy.", activeMentor.id)}
          className="px-3 py-1.5 rounded-xl bg-teal-50/80 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-medium shrink-0 transition-colors shadow-2xs active:scale-95 text-left flex items-center gap-1.5"
        >
          <Wind className="w-3 h-3 text-teal-600 shrink-0" />
          <span>I'm feeling mentally tired today...</span>
        </button>
        {activeMentor.starters.map((starter, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(starter, activeMentor.id)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 text-xs font-medium shrink-0 transition-colors shadow-2xs active:scale-95 text-left max-w-xs truncate"
            title={starter}
          >
            {starter}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              ventMode
                ? `Safe vent to your ${activeMentor.name}: express anything, no judgment...`
                : `Talk to your ${activeMentor.name} (${preferredName})...`
            }
            className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 4-Step Confidence Framework Modal */}
      {showFrameworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-stone-200 relative">
            <button
              onClick={() => setShowFrameworkModal(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-emerald-800">
              <Compass className="w-6 h-6 text-emerald-700" />
              <h3 className="text-lg font-bold text-stone-900">4-Step Confidence Framework</h3>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              When facing self-doubt or speaking anxiety, we dismantle it together:
              <br />
              <strong>1. Situation → 2. Thought → 3. Reality → 4. Action</strong>
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  1. Situation (What happened or what are you anticipating?)
                </label>
                <textarea
                  rows={2}
                  value={frameworkSituation}
                  onChange={(e) => setFrameworkSituation(e.target.value)}
                  placeholder="e.g. My professor asked a question and I wanted to answer, but I stayed quiet."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  2. Thought (What automatic fear went through your mind?)
                </label>
                <textarea
                  rows={2}
                  value={frameworkThought}
                  onChange={(e) => setFrameworkThought(e.target.value)}
                  placeholder="e.g. If my English isn't perfect, everyone will laugh and think I'm unqualified."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFrameworkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitFramework}
                disabled={!frameworkSituation.trim() || !frameworkThought.trim()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl disabled:opacity-40 shadow-xs"
              >
                Dismantle Fear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Mindful Breathing Exercise Modal */}
      <BreathingExerciseModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
    </div>
  );
};
