export default function DocsPage() {
  return (
    <div>
      <div className='mx-auto max-w-7xl pl-10 pr-10 text-airt-font-base pt-10 pb-24 sm:pb-32 lg:gap-x-8 lg:py-5 lg:px-8'>
        <div className='container mx-auto py-8'>
          <h1 className='text-xl sm:text-3xl font-semibold mb-4 underline hover:opacity-80'>Tutorial</h1>
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
  );
}
