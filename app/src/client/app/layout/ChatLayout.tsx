import { type Chat } from 'wasp/entities';

import { useAuth } from 'wasp/client/auth';
import { useState, ReactNode, FC, useRef, useEffect } from 'react';
import { Header } from '../BuildPage';
import ChatSidebar from '../../components/ChatSidebar';
import ChatForm from '../../components/ChatForm';
import { useHistory } from 'react-router-dom';

interface Props {
  children?: ReactNode;
  handleFormSubmit: any;
  currentChatDetails?: Chat | null;
  triggerChatFormSubmitMsg?: string | null;
  refetchAllChatDetails: boolean;
}

const ChatLayout: FC<Props> = ({
  children,
  handleFormSubmit,
  currentChatDetails,
  triggerChatFormSubmitMsg,
  refetchAllChatDetails,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  useEffect(() => {
    if (!user) {
      history.push('/login');
    } else {
      if (!user.hasPaid && user.isSignUpComplete) {
        history.push('/pricing');
      }
    }
  }, [user, history]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    });

    if (scrollRef.current) {
      observer.observe(scrollRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);
  // make call to api -> from action file access conversation entity and pass it to openai
  // get response from openai and save it against the conversation

  const wrapperClass = document.body.classList.contains('server-error')
    ? 'h-[calc(100vh-173px)]'
    : 'h-[calc(100vh-80px)]';

  return (
    <div className='dark:bg-boxdark-2 dark:text-bodydark'>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className={`flex ${wrapperClass} overflow-hidden`}>
        {/* <!-- ===== Sidebar Start ===== --> */}
        <ChatSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          refetchAllChatDetails={refetchAllChatDetails}
        />
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className='relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden'>
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main className='flex-auto overflow-y-auto' ref={scrollRef}>
            <div>{children}</div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
          {currentChatDetails && currentChatDetails.selectedTeam ? (
            <ChatForm
              handleFormSubmit={handleFormSubmit}
              currentChatDetails={currentChatDetails}
              triggerChatFormSubmitMsg={triggerChatFormSubmitMsg}
            />
          ) : (
            <></>
          )}
        </div>

        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default ChatLayout;
