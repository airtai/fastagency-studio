import { useAuth } from 'wasp/client/auth';
import { useState, ReactNode, FC, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import CustomSidebar from '../../components/CustomSidebar';
import LoadingComponent from '../../components/LoadingComponent';
import { cn } from '../../../shared/utils';

interface Props {
  children?: ReactNode;
}

const CustomLayout: FC<Props> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: user, isError, isSuccess, isLoading } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  useEffect(() => {
    if (isSuccess) {
      if (!user) {
        history.push('/login');
      } else {
        if (!user.hasPaid && user.isSignUpComplete) {
          history.push('/pricing');
        }
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
    ? 'h-[calc(100vh-165px)]'
    : 'h-[calc(100vh-80px)]';

  return (
    <div className='dark:bg-boxdark-2 dark:text-bodydark bg-captn-light-blue'>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className={`flex ${wrapperClass} overflow-hidden`}>
        {/* <!-- ===== Sidebar Start ===== --> */}
        <CustomSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className='relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden'>
          {/* <!-- ===== Header Start ===== --> */}
          <header className='sticky top-0 z-999 flex w-full bg-airt-hero-gradient-start dark:bg-boxdark dark:drop-shadow-none lg:hidden'>
            <div className='flex flex-grow items-center justify-between sm:justify-end sm:gap-5 px-8 py-5 shadow '>
              <div className='flex items-center gap-2 sm:gap-4 lg:hidden'>
                {/* <!-- Hamburger Toggle BTN --> */}

                <button
                  aria-controls='sidebar'
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(!sidebarOpen);
                  }}
                  className='z-99999 block rounded-sm border border-stroke border-airt-hero-gradient-start bg-airt-hero-gradient-start p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden'
                >
                  <span className='relative block h-5.5 w-5.5 cursor-pointer'>
                    <span className='du-block absolute right-0 h-full w-full'>
                      <span
                        className={cn(
                          'relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-white delay-[0] duration-200 ease-in-out dark:bg-white',
                          {
                            '!w-full delay-300': !sidebarOpen,
                          }
                        )}
                      ></span>
                      <span
                        className={cn(
                          'relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-white delay-150 duration-200 ease-in-out dark:bg-white',
                          {
                            'delay-400 !w-full': !sidebarOpen,
                          }
                        )}
                      ></span>
                      <span
                        className={cn(
                          'relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-white delay-200 duration-200 ease-in-out dark:bg-white',
                          {
                            '!w-full delay-500': !sidebarOpen,
                          }
                        )}
                      ></span>
                    </span>
                    <span className='absolute right-0 h-full w-full rotate-45'>
                      <span
                        className={cn(
                          'absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-white delay-300 duration-200 ease-in-out dark:bg-white',
                          {
                            '!h-0 !delay-[0]': !sidebarOpen,
                          }
                        )}
                      ></span>
                      <span
                        className={cn(
                          'delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white',
                          {
                            '!h-0 !delay-200': !sidebarOpen,
                          }
                        )}
                      ></span>
                    </span>
                  </span>
                </button>

                {/* <!-- Hamburger Toggle BTN --> */}
              </div>
            </div>
          </header>
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main className='lg:mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10' ref={scrollRef}>
            <div className='w-full lg:min-w-[700px] 2xl:min-w-[1000px]'>{children}</div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
          <></>
        </div>

        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default CustomLayout;
