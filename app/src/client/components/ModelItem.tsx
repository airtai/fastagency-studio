import React from 'react';
import { formatApiKey } from '../utils/buildPageUtils';

interface SvgIcons {
  [key: string]: JSX.Element;
}

export const svgIcons: SvgIcons = {
  secret: (
    <svg
      className='fill-current ml-1 mt-1'
      width='24'
      height='24'
      viewBox='0 0 34 34'
      xmlns='http://www.w3.org/2000/svg'
      stroke='#FFF'
    >
      <title>key</title>
      <path
        d='M27.339 8.365l0.63-1.011 1.513 0.942 1.065-1.555-2.683-1.838c-1.513 2.208-3.368 1.191-5.172-0.028l1.654-2.413-2.101-1.44-11.242 16.406-1.431-0.999c-1.527-1.065-3.411 1.592-1.864 2.671l1.454 1.015-0.21 0.307c-2.85-1.433-5.949-1.161-7.289 0.796h0c-1.518 2.215-0.209 5.752 2.903 7.885s6.858 2.059 8.376-0.156c1.345-1.962 0.49-4.949-1.886-7.088l0.196-0.286 1.238 0.864c1.42 0.991 3.319-1.656 1.864-2.671l-1.261-0.88 6.545-9.552c1.731 1.195 3.456 2.533 2.091 4.525l2.683 1.838 1.802-2.63-1.678-1.045 0.689-1.106 1.727 1.075 1.121-1.635-2.353-1.465 0.689-1.106 0.933 0.581zM6.183 28.027c-1.135 0-2.055-0.92-2.055-2.055s0.92-2.055 2.055-2.055 2.055 0.92 2.055 2.055c-0 1.135-0.92 2.055-2.055 2.055z'
        fill='none'
        strokeMiterlimit='10'
        strokeWidth='1'
      ></path>
    </svg>
  ),
  agent: (
    <svg
      fill='#FFFFFF'
      stroke='#FFFFFF'
      stroke-width='0.5'
      version='1.1'
      id='Layer_1'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      viewBox='0 0 32 32'
      xmlSpace='preserve'
      width='18'
      height='18'
      className='-mt-1'
    >
      <path
        id='machine--learning--04_1_'
        d='M23,30.36H9c-2.404,0-4.36-1.956-4.36-4.36V15c0-2.404,1.956-4.36,4.36-4.36h3.659
    c0.167-1.566,1.415-2.813,2.981-2.981V5.333c-1.131-0.174-2-1.154-2-2.333c0-1.301,1.059-2.36,2.36-2.36
    c1.302,0,2.36,1.059,2.36,2.36c0,1.179-0.869,2.159-2,2.333V7.66c1.566,0.167,2.814,1.415,2.981,2.981H23
    c2.404,0,4.36,1.956,4.36,4.36v11C27.36,28.404,25.404,30.36,23,30.36z M9,11.36c-2.007,0-3.64,1.633-3.64,3.64v11
    c0,2.007,1.633,3.64,3.64,3.64h14c2.007,0,3.64-1.633,3.64-3.64V15c0-2.007-1.633-3.64-3.64-3.64H9z M13.384,10.64h5.231
    C18.439,9.354,17.334,8.36,16,8.36C14.667,8.36,13.561,9.354,13.384,10.64z M16,1.36c-0.904,0-1.64,0.736-1.64,1.64
    S15.096,4.64,16,4.64c0.904,0,1.64-0.736,1.64-1.64S16.904,1.36,16,1.36z M20,27.36h-8c-1.301,0-2.36-1.059-2.36-2.36
    s1.059-2.36,2.36-2.36h8c1.302,0,2.36,1.059,2.36,2.36S21.302,27.36,20,27.36z M12,23.36c-0.904,0-1.64,0.735-1.64,1.64
    s0.736,1.64,1.64,1.64h8c0.904,0,1.64-0.735,1.64-1.64s-0.735-1.64-1.64-1.64H12z M31,23.86h-2c-0.199,0-0.36-0.161-0.36-0.36V15
    c0-0.199,0.161-0.36,0.36-0.36h2c0.199,0,0.36,0.161,0.36,0.36v8.5C31.36,23.699,31.199,23.86,31,23.86z M29.36,23.14h1.279v-7.78
    H29.36V23.14z M3,23.86H1c-0.199,0-0.36-0.161-0.36-0.36V15c0-0.199,0.161-0.36,0.36-0.36h2c0.199,0,0.36,0.161,0.36,0.36v8.5
    C3.36,23.699,3.199,23.86,3,23.86z M1.36,23.14h1.28v-7.78H1.36V23.14z M20,20.36c-1.302,0-2.36-1.059-2.36-2.36
    s1.059-2.36,2.36-2.36s2.36,1.059,2.36,2.36C22.36,19.302,21.302,20.36,20,20.36z M20,16.36c-0.904,0-1.64,0.736-1.64,1.64
    s0.735,1.64,1.64,1.64s1.64-0.735,1.64-1.64S20.904,16.36,20,16.36z M12,20.36c-1.301,0-2.36-1.059-2.36-2.36s1.059-2.36,2.36-2.36
    s2.36,1.059,2.36,2.36C14.36,19.302,13.301,20.36,12,20.36z M12,16.36c-0.904,0-1.64,0.736-1.64,1.64s0.736,1.64,1.64,1.64
    s1.64-0.735,1.64-1.64S12.904,16.36,12,16.36z'
      ></path>
    </svg>
  ),
};

export interface ItemProps {
  api_key: string;
  property_name: string;
  property_type: string;
  user_id: number;
  uuid: string;
}

interface ModelItemProps {
  model: ItemProps;
  onClick: () => void;
}

const ModelItem: React.FC<ModelItemProps> = ({ model, onClick }) => (
  <div
    className='group relative cursor-pointer overflow-hidden bg-airt-primary text-airt-font-base px-6 pt-10 pb-8 transition-all duration-300 hover:-translate-y-1 sm:max-w-sm sm:rounded-lg sm:pl-8 sm:pr-24'
    onClick={onClick}
  >
    <span className='absolute top-10 z-0 h-9 w-9 rounded-full bg-airt-hero-gradient-start transition-all duration-300 group-hover:scale-[30]'></span>
    <div className='relative z-10 mx-auto max-w-md'>
      <div className='flex items-center mb-3'>
        <div className='w-8 h-8 mr-3 inline-flex items-center justify-center rounded-full dark:bg-indigo-500 bg-airt-hero-gradient-start text-white flex-shrink-0'>
          {svgIcons[model.property_type]}
        </div>
        <h2 className='text-white dark:text-white text-lg font-medium'>{model.property_name}</h2>
      </div>
      <div className='flex flex-col gap-2 text-white py-4 sm:max-w-sm sm:rounded-lg'>
        <p>{formatApiKey(model.api_key)}</p>
      </div>
    </div>
  </div>
);

export default ModelItem;
