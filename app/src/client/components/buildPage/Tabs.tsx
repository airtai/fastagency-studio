import { useState } from 'react';

import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';

import { navLinkItems } from '../../components/CustomSidebar';

const BuildPageTabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    console.log(navLinkItems[index].componentName);
  };
  return (
    <Tabs size='lg' variant='unstyled' index={activeTab} onChange={setActiveTab}>
      <TabList>
        {navLinkItems.map((tab, index) => (
          <Tab
            key={index}
            onClick={() => handleTabClick(index)}
            bg={activeTab === index ? '#0080FF' : 'rgba(255, 255, 255, 0.2)'}
            color={activeTab === index ? '#FFF' : 'rgba(255, 255, 255, 1)'}
            _hover={{
              bg: '#0080FF',
              opacity: 0.8,
            }}
            transition='all 0.3s'
            borderTopRadius='xl'
            mr={3}
            px={4}
            py={2}
            fontWeight='bold'
            fontSize='sm'
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabPanels bg='#0080FF' borderRadius='0 20px 20px 20px'>
        {navLinkItems.map((tab, index) => (
          <TabPanel key={index}>
            <p>Content for {tab.label}</p>
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default BuildPageTabs;
