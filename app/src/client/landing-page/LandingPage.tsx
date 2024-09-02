import { useAuth } from 'wasp/client/auth';
import { useState } from 'react';
import logo from '../static/logo.svg';
import faMainLogo from '../static/fa-main-logo.svg';
import podLoga from '../static/pod-loga.svg';
import { features } from './contentSections';
import UserActionButton from '../components/UserActionButton';

import AppNavBar from '../components/AppNavBar';

export default function LandingPage() {
  const { data: user, isLoading: isUserLoading } = useAuth();

  return (
    <div className='dark:text-white dark:bg-boxdark-2'>
      {/* Header */}
      <AppNavBar position='absolute' />
      <div
        className='z-0 absolute inset-x-0 bottom-[0px] h-[50vh] dark:bg-boxdark-2 bg-no-repeat bg-center'
        style={{
          backgroundImage: `
      linear-gradient(to bottom,
        rgba(242, 92, 73, 0.9) 0%,
        rgba(242, 92, 73, 0.8) 20%,
        rgba(242, 92, 73, 0.5) 40%,
        rgba(227, 63, 42, 0.5) 60%,
        rgba(227, 63, 42, 0.5) 80%,
        rgba(227, 63, 42, 0.9) 95%,
        rgba(227, 63, 42, 0.9) 100%
      ),
      url(${podLoga})
    `,
          backgroundSize: 'cover',
          transform: 'scaleX(-1)',
        }}
      ></div>
      <main className='z-20 isolate dark:bg-boxdark-2 pb-40'>
        {/* Hero section */}
        <div className='relative pt-18 w-full '>
          <div className='py-24 sm:py-32'>
            <div className='mx-auto max-w-8xl px-6 lg:px-8'>
              <div className='lg:mb-18 mx-auto max-w-5xl text-center'>
                <img src={faMainLogo} className='w-3/4 mx-auto mb-10 mt-0' alt='FastAgency Studio Main Logo' />
                <h1 className='text-4xl font-rubik text-airt-font-base sm:text-5xl dark:text-white'>
                  FastAgency Studio: A Low-Code Platform for Building <span className='italic'>Multi-Agent </span> AI
                  Services.
                </h1>
                <p className='mt-6 mx-auto max-w-2xl text-lg leading-8 text-airt-font-base dark:text-white'>
                  Quickly build scalable SaaS solutions using our powerful, multi-agent AI framework that streamlines
                  complex processes.
                </p>
                <div className='mt-10 flex items-center justify-center gap-x-6'>
                  {/* <a
                    href={DOCS_URL}
                    className='rounded-md px-3.5 py-2.5 text-sm font-semibold text-airt-font-base ring-1 ring-inset ring-gray-200 hover:ring-2 hover:ring-airt-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-white'
                  >
                    Get Started <span aria-hidden='true'>→</span>
                  </a> */}
                  <UserActionButton user={user} renderGoToChat={true} />
                </div>
              </div>
              <div className='mt-40 flow-root sm:mt-40 '>
                <div className='-m-2 rounded-xl  lg:-m-4 lg:rounded-2xl lg:p-4'>
                  <div className='video-responsive'>
                    <iframe
                      className='aspect-video w-full rounded-lg shadow-lg shadow-yellow-800/70'
                      src='https://www.youtube.com/embed/9y4cDOkWIBw'
                      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div id='features' className='mx-auto mt-5 max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <p className='mt-2 text-4xl font-bold tracking-tight text-airt-font-base sm:text-5xl dark:text-airt-font-base'>
              <span className='text-airt-font-base'>Features</span>
            </p>
            {/* <p className='mt-6 text-lg leading-8 text-airt-font-base dark:text-airt-font-base'>
              Don't work harder.
              <br /> Work smarter.
            </p> */}
          </div>
          <div className='mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-7xl'>
            <dl className='grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16'>
              {features.map((feature) => (
                <div key={feature.name} className={`relative pl-16`}>
                  <dt className='text-base font-semibold leading-7 text-airt-font-base dark:text-airt-font-base'>
                    <div className='absolute left-0 top-0 flex h-10 w-10 items-center justify-center border border-airt-font-base bg-airt-font-base-100/50 dark:bg-boxdark rounded-lg'>
                      <div className='text-2xl'>{feature.icon}</div>
                    </div>
                    {feature.name}
                  </dt>
                  <dd className='mt-2 text-base leading-7 text-airt-font-base dark:text-airt-font-base'>
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Testimonial section */}
        {/* <div className='mx-auto mt-32 max-w-7xl sm:mt-56 sm:px-6 lg:px-8'>
          <div className='relative sm:left-5 -m-2 rounded-xl bg-airt-primary lg:ring-1 lg:ring-airt-primary lg:-m-4 '>
            <div className='relative sm:top-5 sm:right-5 bg-airt-font-base dark:bg-boxdark px-8 py-20 shadow-xl sm:rounded-xl sm:px-10 sm:py-16 md:px-12 lg:px-20'>
              <h2 className='text-left text-xl font-semibold tracking-wide leading-7 text-airt-primary dark:text-white'>
                What Our Users Say
              </h2>
              <div className='relative flex flex-wrap gap-6 w-full mt-6 z-10 justify-between lg:mx-0'>
                {testimonials.map((testimonial) => (
                  <figure className='w-full lg:w-1/4 box-content flex flex-col justify-between p-8 rounded-xl bg-airt-primary '>
                    <blockquote className='text-lg text-white sm:text-md sm:leading-8'>
                      <p>{testimonial.quote}</p>
                    </blockquote>
                    <figcaption className='mt-6 text-base text-white'>
                      <a href={testimonial.socialUrl} className='flex items-center gap-x-2'>
                        <img src={testimonial.avatarSrc} className='h-12 w-12 rounded-full' />
                        <div>
                          <div className='font-semibold hover:underline'>{testimonial.name}</div>
                          <div className='mt-1'>{testimonial.role}</div>
                        </div>
                      </a>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div> */}
      </main>
    </div>
  );
}
