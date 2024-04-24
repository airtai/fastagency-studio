import { type User } from 'wasp/entities';
import CustomAuthRequiredLayout from './layout/CustomAuthRequiredLayout';

const PlayGroundPage = ({ user }: { user: User }) => {
  return (
    <p
      className='absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-6xl text-airt-font-base'
      style={{ lineHeight: 'normal' }}
    >
      Playground...
    </p>
  );
};

const PlayGroundPageWithCustomAuth = CustomAuthRequiredLayout(PlayGroundPage);
export default PlayGroundPageWithCustomAuth;
