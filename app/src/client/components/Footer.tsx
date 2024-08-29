import React from 'react';

import { footerNavigation } from '../landing-page/contentSections';
import FooterMascot from '../static/robot-footer.svg';
import SocialMediaIcons from './SocialMediaIcons';

export default function Footer() {
  return (
    <div className='pt-30'>
      <section className='relative'>
        <div className='w-full'>
          <hr className='border border-t border-airt-font-base opacity-20' />
        </div>
      </section>
      <div className='px-6 lg:px-8 dark:bg-boxdark-2 pb-15'>
        <footer aria-labelledby='footer-heading' className='relative dark:border-gray-200/10'>
          <h2 id='footer-heading' className='sr-only'>
            Footer
          </h2>
          <div className='flex items-center justify-between mt-10 mx-auto max-w-7xl sm:px-6 lg:px-8'>
            {/* This container should be vertically centered and should be on the left cornor of the parent */}
            <div className='relative'>
              <div className='rounded-full bg-airt-blue flex items-center justify-end px-6 py-3'>
                <p className='text-xs text-center text-white ml-28 mr-10'>
                  <b>2024</b> © airt. All rights reserved.
                </p>
              </div>
              <img
                className='absolute left-[30px] bottom-0 h-[165%] w-auto'
                style={{ transform: 'translateY(20%)' }}
                src={FooterMascot}
                alt='Footer Mascot'
              />
            </div>
            {/* This container should be vertically centered and should be on the left cornor of the parent */}

            {/* This container should be vertically centered and should be on the right cornor of the parent */}
            <div className='flex items-end'>
              <div>
                <ul role='list' className='flex items-center'>
                  {footerNavigation.company.map((item, index) => (
                    <React.Fragment key={item.name}>
                      {index > 0 && <span className='mx-2 text-airt-font-base dark:text-white'>/</span>}
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className='text-xs text-bold underline leading-6 text-airt-font-base hover:underline dark:text-white'
                          target={`${item.name === 'airt' ? '_blank' : '_self'}`}
                        >
                          {item.name}
                        </a>
                      </li>
                    </React.Fragment>
                  ))}
                </ul>
              </div>
              <div className='ml-10'>
                {/* <h3 className='text-sm font-semibold leading-6 text-airt-font-base dark:text-white'>App</h3> */}
                <ul role='list' className=''>
                  <ul className='flex justify-center items-center gap-2 2xsm:gap-4'>
                    <SocialMediaIcons />
                  </ul>
                </ul>
              </div>
            </div>
            {/* This container should be vertically centered and should be on the right cornor of the parent */}
          </div>
        </footer>
      </div>
    </div>
  );
}
