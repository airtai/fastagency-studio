import { Link } from 'react-router-dom';
import FreeTrialButton from './FreeTrialButton';

interface UserActionButtonProps {
  user: any;
  renderGoToChat: boolean;
  theme?: string;
}

export type Theme = 'dark' | 'light';

const UserActionButton: React.FC<UserActionButtonProps> = ({ user, renderGoToChat, theme = 'dark' }) => {
  const themeClass = theme === 'dark' ? 'bg-airt-primary text-airt-font-base' : 'bg-airt-secondary text-airt-font-base';
  if (!user) {
    return (
      <Link
        to='/signup'
        className={`rounded-md px-3.5 pt-2 pb-2.5 text-sm  ${themeClass}   hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
      >
        Create an account
      </Link>
    );
  }

  if (!user.hasPaid) {
    return <FreeTrialButton />;
  }

  return renderGoToChat ? (
    <a
      href='/playground'
      className={`rounded-md px-3.5 py-2.5 text-sm  ${themeClass}   hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
    >
      Go to chat <span aria-hidden='true'>→</span>
    </a>
  ) : (
    <></>
  );
};

export default UserActionButton;
