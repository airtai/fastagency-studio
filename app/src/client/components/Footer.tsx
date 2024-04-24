import { footerNavigation } from '../landing-page/contentSections';
import FooterMascot from '../static/robot-footer.svg';

export default function Footer() {
  return (
    <div className='bg-airt-primary px-6 lg:px-8 dark:bg-boxdark-2 pb-15 mt-30 sm:mt-40'>
      <section className='relative'>
        <div className='flex items-center justify-center'>
          <img className='absolute -top-17 left-1/2 transform -translate-x-1/2 h-auto w-28' src={FooterMascot} />
        </div>
      </section>
      <footer aria-labelledby='footer-heading' className='relative border-airt-font-base dark:border-gray-200/10'>
        <h2 id='footer-heading' className='sr-only'>
          Footer
        </h2>
        <div className='flex items-start justify-end mt-10 gap-20 mx-auto max-w-7xl sm:px-6 lg:px-8'>
          {/* <div>
            <h3 className='text-sm font-semibold leading-6 text-airt-font-base dark:text-white'>App</h3>
            <ul role='list' className='mt-6 space-y-4'>
              {footerNavigation.app.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className='text-sm leading-6 text-airt-font-base hover:text-airt-font-base dark:text-white'
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div> */}
          <div>
            {/* <h3 className='text-sm font-bold leading-6 text-airt-font-base dark:text-white'>Company</h3> */}
            <ul role='list' className='mt-6 space-y-4'>
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className='text-sm leading-6 text-airt-font-base hover:underline dark:text-white'
                    target={`${item.name === 'airt' ? '_blank' : '_self'}`}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
