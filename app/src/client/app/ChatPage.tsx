import { type User } from 'wasp/entities';

import createAuthRequiredChatPage from '../auth/createAuthRequiredChatPage';

const ChatPage = ({ user }: { user: User }) => {
  return (
    <p
      className='absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-6xl text-airt-font-base'
      style={{ lineHeight: 'normal' }}
    >
      Coming soon...
    </p>
  );
};

export default createAuthRequiredChatPage(ChatPage);
