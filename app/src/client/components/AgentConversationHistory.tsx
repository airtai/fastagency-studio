import React, { useState } from 'react';
import TerminalDisplay from './TerminalDisplay';

interface AgentConversationHistoryProps {
  agentConversationHistory: string;
  initialState?: boolean;
  isAgentWindow?: boolean;
}

const AgentConversationHistory: React.FC<AgentConversationHistoryProps> = ({
  agentConversationHistory,
  initialState = false,
  isAgentWindow = false,
}) => {
  const [showHistory, setShowHistory] = useState(initialState);

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div data-testid='agent-loader' className={`flex items-center group  flex-col bg-airt-primary`}>
      <div
        style={{
          maxWidth: `${isAgentWindow ? '745px' : '800px'}`,
          left: `${isAgentWindow ? '15px' : '0px'}`,
          margin: '0 auto 20',
        }}
        className={`relative block w-full`}
      >
        <TerminalDisplay messages={agentConversationHistory} maxHeight={400} isOpenOnLoad={isAgentWindow} />
      </div>
    </div>
  );
};

export default AgentConversationHistory;
