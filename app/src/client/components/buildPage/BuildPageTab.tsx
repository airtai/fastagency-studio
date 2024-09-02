import { useEffect, useState } from 'react';

import { Tabs, TabList, TabPanels, Tab, TabPanel, Box, Flex } from '@chakra-ui/react';

import { navLinkItems } from '../CustomSidebar';
import { UserProperty } from './UserProperty';
import { PropertiesSchema } from '../../interfaces/BuildPageInterfaces';
import faLogoWithoutText from '../../static/fa-logo-without-text.svg';
import { useFormHandler } from './useFormHandler';

interface Props {
  onSideNavItemClick: (selectedItem: string) => void;
  activeProperty: string;
  propertiesSchema: PropertiesSchema;
  sideNavItemClickCount: number;
  setActiveProperty: (activeProperty: string) => void;
}

export const BuildPageTab = ({
  activeProperty,
  onSideNavItemClick,
  propertiesSchema,
  sideNavItemClickCount,
  setActiveProperty,
}: Props) => {
  const [activeTab, setActiveTab] = useState(0);
  const { parser, propertiesInStack, pushNewParser, popFromStack, clearStack } = useFormHandler(setActiveProperty);

  const handleTabClick = (index: number) => {
    onSideNavItemClick(navLinkItems[index].componentName);
  };

  useEffect(() => {
    const index = navLinkItems.findIndex((item) => item.componentName === activeProperty);
    setActiveTab(index);
  }, [activeProperty]);

  return (
    <Box position='relative' marginBottom='40px'>
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

        <TabPanels bg='#0A58D6' borderRadius='0 20px 20px 20px' position='relative'>
          {navLinkItems.map((tab, index) => (
            <TabPanel key={index} p={0} minHeight='300px' overflow='auto'>
              <UserProperty
                activeProperty={activeProperty}
                propertiesSchema={propertiesSchema}
                sideNavItemClickCount={sideNavItemClickCount}
                parser={parser}
                propertiesInStack={propertiesInStack}
                pushNewParser={pushNewParser}
                popFromStack={popFromStack}
                clearStack={clearStack}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
      <Box
        position='absolute'
        right='-52px'
        bottom='-40px' // Adjust this value to control how much of the logo is below the panel
        width='210px' // Adjust based on the actual size of your logo
        height='auto' // Adjust based on the actual size of your logo
        zIndex={1}
      >
        <img
          src={faLogoWithoutText}
          alt='FA Logo'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>
    </Box>
  );
};
