import { useEffect, useState } from 'react';

import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';

import { navLinkItems } from '../../components/CustomSidebar';
import { UserProperty } from './UserProperty';
import { PropertiesSchema } from '../../interfaces/BuildPageInterfaces';

interface Props {
  onSideNavItemClick: (selectedItem: string) => void;
  activeProperty: string;
  propertiesSchema: PropertiesSchema;
  sideNavItemClickCount: number;
  setActiveProperty: (activeProperty: string) => void;
}

const BuildPageTabs = ({
  activeProperty,
  onSideNavItemClick,
  propertiesSchema,
  sideNavItemClickCount,
  setActiveProperty,
}: Props) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    onSideNavItemClick(navLinkItems[index].componentName);
  };

  useEffect(() => {
    const index = navLinkItems.findIndex((item) => item.componentName === activeProperty);
    setActiveTab(index);
  }, [activeProperty]);
  return (
    <Tabs size='lg' variant='unstyled' index={activeTab} onChange={setActiveTab}>
      <TabList>
        {navLinkItems.map((tab, index) => (
          <Tab
            key={index}
            onClick={() => handleTabClick(index)}
            bg={activeTab === index ? '#0A58D6' : 'rgba(255, 255, 255, 0.2)'}
            color={activeTab === index ? '#FFF' : 'rgba(255, 255, 255, 1)'}
            _hover={{
              bg: '#0A58D6',
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

      <TabPanels bg='#0A58D6' borderRadius='0 20px 20px 20px'>
        {navLinkItems.map((tab, index) => (
          <TabPanel key={index} p={0}>
            <UserProperty
              activeProperty={activeProperty}
              propertiesSchema={propertiesSchema}
              sideNavItemClickCount={sideNavItemClickCount}
              setActiveProperty={setActiveProperty}
            />
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default BuildPageTabs;
