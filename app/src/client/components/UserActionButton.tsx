import { Link } from 'react-router-dom';
// import FreeTrialButton from './FreeTrialButton';

export type Theme = 'dark' | 'light';

interface UserActionButtonProps {
  user: any;
  renderGoToChat: boolean;
  theme?: Theme;
}

const UserActionButton: React.FC<UserActionButtonProps> = ({ user, renderGoToChat, theme = 'dark' }) => {
  const themeClass = theme === 'dark' ? 'bg-airt-secondary text-airt-primary' : 'bg-airt-secondary text-airt-primary';
  if (!user) {
    return (
      <Link
        to='/signup'
        className={`relative inline-block rounded-full hover:opacity-80 px-6 py-3 text-sm font-bold ${themeClass}  transition-all duration-200 ease-in-out`}
        style={{
          boxShadow: '5px 5px 0px 0px #0080FF',
        }}
      >
        CREATE ACCOUNT
      </Link>
    );
  }

  // if (!user.hasPaid) {
  //   return <FreeTrialButton theme={theme} />;
  // }

  return renderGoToChat ? (
    <a
      href='/build'
      className={`rounded-full font-bold hover:opacity-80 pl-3.5 pr-7 py-2.5 text-sm  ${themeClass}   hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
      style={{
        boxShadow: '5px 5px 0px 0px #0080FF',
      }}
    >
      BUILD TEAM{' '}
      <span aria-hidden='true' className='inline-block absolute mt-[1.4px] ml-1'>
        →
      </span>
    </a>
  ) : (
    <></>
  );
};

export default UserActionButton;
