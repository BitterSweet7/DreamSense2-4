// DreamSense.tsx
import { useState, useRef, useEffect } from 'react';
import './DreamSense.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

interface DreamSymbol {
  term: string;
  details: string;
  score?: number;
}

// Direct implementation of dream dictionary for reliable interpretation
const dreamDictionary = {
  "abandonment": "When we dream of being abandoned, it harbors feelings of insecurity, emotional support or unconscious fears. This dream symbol often relates to childhood experiences or current relationship anxieties. It may suggest you're working through feelings of rejection or fear of being left alone.",
  "abbey": "Dreaming of an abbey represents a desire for spiritual sanctuary and peace. It suggests you may be seeking refuge from the chaos of daily life or looking for a space for contemplation and inner growth. This symbol often appears during times when you need to reconnect with your deeper values.",
  "flying": "Dreams of flying typically symbolize freedom, liberation, and breaking free from limitations. This powerful symbol suggests you're rising above challenges or gaining a new perspective on your life. It often appears when you're experiencing success or personal growth.",
  "teeth falling out": "Dreams about teeth falling out commonly represent anxiety about appearance, communication, or power. This symbol may reflect fears about losing attractiveness or the ability to communicate effectively. It sometimes appears during major life transitions or periods of insecurity.",
  "water": "Water in dreams symbolizes emotions, the unconscious mind, and the flow of life. Clear water often represents clarity and emotional well-being, while murky water may suggest confusion or repressed feelings. This symbol frequently appears when you're processing deep emotions.",
  "falling": "Dreams of falling often reflect feelings of insecurity, loss of control, or failure. This common symbol may indicate anxiety about a situation in your waking life where you feel unsupported. It sometimes appears during periods of significant change or when you're taking risks."
};

function DreamSense() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm DreamSense, your personal dream interpreter. Share your dream with me, and I'll help you uncover its meaning. What did you dream about?",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const interpretationRef = useRef<HTMLDivElement>(null);

  // Function to find relevant dream symbols in the input
  const findRelevantSymbols = (dreamText: string): DreamSymbol[] => {
    const symbols: DreamSymbol[] = [];
    const dreamTextLower = dreamText.toLowerCase();
    
    // Check for direct matches in the dictionary
    Object.entries(dreamDictionary).forEach(([term, details]) => {
      // Convert term to different forms for better matching
      const termLower = term.toLowerCase();
      const termStem = termLower.endsWith('ing') ? termLower.slice(0, -3) : termLower;
      const termVariants = [
        termLower,                  // Original form: "abandonment"
        termStem,                   // Stemmed form: "abandon"
        termStem + 'ed',            // Past tense: "abandoned"
        termStem + 'ing',           // Present participle: "abandoning"
      ];
      
      // Check if any variant of the term is in the dream text
      const isMatch = termVariants.some(variant => 
        dreamTextLower.includes(variant)
      );
      
      if (isMatch) {
        symbols.push({ term, details });
      }
    });
    
    return symbols;
  };

  // Function to generate an interpretation based on the dream dictionary
  const generateDreamInterpretation = (dreamText: string): string => {
    const symbols = findRelevantSymbols(dreamText);
    
    if (symbols.length === 0) {
      return "Thank you for sharing your dream. While I don't have specific symbols in my dictionary that match your dream exactly, dreams are deeply personal experiences. Consider what elements of this dream feel most significant to you, as they often reflect your current emotional state or life circumstances. I'm here if you'd like to explore more dreams in the future.";
    }
    
    // Create an interpretation using the found symbols
    let interpretation = `Thank you for sharing your dream with me. I notice several important symbols in what you've described.\n\n`;
    
    symbols.forEach(symbol => {
      interpretation += `Regarding the "${symbol.term}" in your dream: ${symbol.details}\n\n`;
    });
    
    interpretation += "Remember that dreams are personal, and these interpretations are based on common symbolic meanings. Trust your own intuition about what resonates most with your experience.";
    
    return interpretation;
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    // Add user message
    const newUserMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user'
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInput('');
    setIsThinking(true);

    // Use the built-in dictionary for reliable interpretation
    console.log("Using dictionary-based interpretation");
    const interpretation = generateDreamInterpretation(input);
    const symbols = findRelevantSymbols(input);
    
    // Add the interpretation message
    const newBotMessage: Message = {
      id: messages.length + 2,
      text: interpretation,
      sender: 'bot'
    };
    
    setMessages(prevMessages => [...prevMessages, newBotMessage]);
    
    // If there are symbols, add them as a separate message
    if (symbols.length > 0) {
      const symbolsText = "Key symbols in your dream:\n" + 
        symbols.map(s => `• ${s.term}`).join('\n');
      
      const symbolsMessage: Message = {
        id: messages.length + 3,
        text: symbolsText,
        sender: 'bot'
      };
      
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, symbolsMessage]);
      }, 500);
    }
    
    setIsThinking(false);
    
    // Scroll to interpretation after it's set
    setTimeout(() => {
      interpretationRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Floating stars for dreamy effect */}
      <div className="star"></div>
      <div className="star"></div>
      <div className="star"></div>
      <div className="star"></div>
      <div className="star"></div>
      
      {/* Floating clouds */}
      <div className="cloud cloud-left"></div>
      <div className="cloud cloud-right"></div>
      <div className="cloud cloud-left-2"></div>
      <div className="cloud cloud-right-2"></div>
      
      <nav className="navbar">
        <div className="navbar-logo">
          <img src="/DreamSense.png" alt="DreamSense Logo" />
        </div>
        
        {/* Mockup user profile */}
        <div className="navbar-user">
          <div className="navbar-user-avatar">
            DS
          </div>
          <div className="navbar-user-info">
            <div className="navbar-user-name">Dream Explorer</div>
            <div className="navbar-user-status">Premium Member</div>
          </div>
        </div>
      </nav>
      
      <div className="dream-sense-container">
        <main>
          <div className="chat-container">
            <div className="messages">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender}-message`}
                >
                  {message.text}
                </div>
              ))}
              {isThinking && (
                <div className="message bot-message thinking">
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              <div ref={interpretationRef} />
            </div>
            
            <div className="input-section">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your dream..."
                disabled={isThinking}
              />
              <button 
                onClick={handleSend}
                disabled={isThinking || !input.trim()}
              >
                {isThinking ? 'Interpreting...' : 'Send'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default DreamSense;