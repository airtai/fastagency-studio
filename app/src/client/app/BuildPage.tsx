import { type User } from 'wasp/entities';
import CustomAuthRequiredLayout from './layout/CustomAuthRequiredLayout';
import TypesManagerLayout from './layout/TypesManagerLayout';

interface BuildPageProps {
  user: User;
  activeComponent: string; // This is the new prop coming from the parent
}

const BuildPage = ({ user, activeComponent }: BuildPageProps) => {
  console.log('From build page: ', user);
  console.log('From build page: ', activeComponent);
  return (
    <TypesManagerLayout>
      <p
        className='absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-6xl text-airt-font-base'
        style={{ lineHeight: 'normal' }}
      >
        Build Page...
      </p>
    </TypesManagerLayout>
  );
};

const BuildPageWithCustomAuth = CustomAuthRequiredLayout(BuildPage);
export default BuildPageWithCustomAuth;
