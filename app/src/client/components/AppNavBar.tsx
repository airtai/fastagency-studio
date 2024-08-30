import { Link } from 'wasp/client/router';
import { useAuth } from 'wasp/client/auth';
import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { BiLogIn } from 'react-icons/bi';
import { AiFillCloseCircle } from 'react-icons/ai';
import { HiBars3 } from 'react-icons/hi2';
import logo from '../static/logo.svg';
import DropdownUser from './DropdownUser';
import { DOCS_URL, BLOG_URL } from '../../shared/constants';
import UserActionButton from '../components/UserActionButton';
import { UserMenuItems } from '../components/UserMenuItems';
import { navigation } from '../landing-page/contentSections';
import SocialMediaIcons from './SocialMediaIcons';

const NavLogo = () => <img src={logo} style={{ width: '200px' }} alt='FastAgency Studio' />;

interface Props {
  position?: string;
}

export default function AppNavBar({ position = 'sticky' }: Props): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerPosition, setHeaderPosition] = useState('sticky');

  const { data: user, isLoading: isUserLoading } = useAuth();

  useEffect(() => {
    setHeaderPosition(position);
  }, [position]);
  return (
    <header className={`bg-airt-primary ${headerPosition} inset-x-0 top-0 z-50 dark:bg-boxdark-2`}>
      <nav className='flex items-center justify-between p-6 lg:px-8' aria-label='Global'>
        <div className='flex items-center lg:flex-1'>
          <a
            href='/'
            className='flex items-center -m-1.5 py-1 sm:py-0 md:py-0 text-airt-font-base duration-300 ease-in-out hover:text-airt-secondary'
          >
            <NavLogo />
            {/* <span className='ml-1 mt-[6px] xl:mt-[7px] xl:mt-0 text-lg sm:text-2xl md:text-2xl min-[1024px]:text-sm min-[1100px]:text-lg xl:text-2xl font-rubik text-airt-font-base dark:text-white'>
                FastAgency Studio
              </span>
              <span className='ml-1 text-xs font-semibold leading-6 '>
                <sup className='text-xs text-airt-font-base'>αlpha</sup>
              </span> */}
          </a>
        </div>
        <div className='flex lg:hidden'>
          <button
            type='button'
            className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-airt-font-base dark:text-white'
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className='sr-only'>Open main menu</span>
            <HiBars3 className='h-6 w-6' aria-hidden='true' />
          </button>
        </div>
        <div className='hidden lg:flex lg:gap-x-12'>
          {navigation.map((item, index) => {
            const windowLocation = window.location.pathname.split('/')[1] || 'home';
            const isCurrentPage = windowLocation === item.name.toLowerCase();
            return (
              <a
                key={item.name}
                href={item.href}
                className={`text-sm font-semibold leading-6 duration-300 ease-in-out hover:text-airt-secondary dark:text-white ${
                  isCurrentPage ? 'text-airt-secondary' : 'text-airt-font-base'
                }`}
              >
                {item.name}
              </a>
            );
          })}
        </div>
        <div className='hidden lg:flex lg:flex-1 lg:justify-end lg:align-end'>
          {/* <!-- Dark Mode Toggler --> */}
          <div className='flex items-center gap-3 2xsm:gap-7'>
            <ul className='flex justify-center items-center gap-2 2xsm:gap-4'>
              <SocialMediaIcons />
            </ul>
            <UserActionButton user={user} renderGoToChat={false} theme='light' />
            {isUserLoading ? null : !user ? (
              <Link to='/login'>
                <div className='text-sm flex justify-end items-center duration-300 ease-in-out text-airt-font-base hover:text-airt-secondary dark:text-white'>
                  Log in <BiLogIn size='1.1rem' className='ml-1' />
                </div>
              </Link>
            ) : (
              <DropdownUser user={user} />
            )}
          </div>
        </div>
      </nav>
      <Dialog as='div' className='lg:hidden' open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className='fixed inset-0 z-50' />
        <Dialog.Panel className='fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-airt-font-base dark:bg-boxdark dark:text-white'>
          <div className='flex items-center justify-between'>
            <a href='/' className='-m-1.5 p-1.5'>
              <span className='sr-only'>Your SaaS</span>
              <NavLogo />
            </a>
            <button
              type='button'
              className='-m-2.5 rounded-md p-2.5 text-airt-font-base dark:text-gray-50'
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className='sr-only'>Close menu</span>
              <AiFillCloseCircle className='h-6 w-6' aria-hidden='true' />
            </button>
          </div>
          <div className='mt-6 flow-root'>
            <div className='-my-6 divide-y divide-airt-font-base'>
              <div className='space-y-2 py-6'>
                {navigation.map((item, index) => {
                  const windowLocation = window.location.pathname.split('/')[1] || 'home';
                  const isCurrentPage = windowLocation === item.name.toLowerCase();
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${
                        isCurrentPage ? 'text-airt-secondary' : 'text-airt-font-base'
                      } -mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-airt-primary hover:bg-gray-50 dark:text-white dark:hover:bg-boxdark-2`}
                    >
                      {item.name}
                    </a>
                  );
                })}
              </div>
              <div className='py-6'>
                {isUserLoading ? null : !user ? (
                  <Link to='/login'>
                    <div className='text-sm flex justify-start items-center duration-300 ease-in-out text-airt-font-base hover:text-airt-secondary dark:text-white'>
                      Log in <BiLogIn size='1.1rem' className='ml-1' />
                    </div>
                  </Link>
                ) : (
                  <UserMenuItems user={user} />
                )}
              </div>
              <div className='py-6'>
                <SocialMediaIcons />
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
