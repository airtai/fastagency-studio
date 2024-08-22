import { useCallback, useMemo } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { UserProperties } from './buildPage/PropertySchemaParser';

interface BreadcrumbProps {
  pageName: string;
  propertiesInStack: string[];
  popFromStack: (userProperties: UserProperties[] | null, validateDataResponse?: any, index?: number) => void;
}
const CustomBreadcrumb: React.FC<BreadcrumbProps> = ({ pageName, propertiesInStack, popFromStack }) => {
  const lastIndex = useMemo(() => propertiesInStack.length - 1, [propertiesInStack]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, index: number) => {
      event.preventDefault();
      const isLastItem = index === lastIndex;
      if (isLastItem) return;
      popFromStack(null, null, index);
    },
    [lastIndex]
  );

  return (
    <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <h2 className='text-title-md2 font-semibold text-airt-primary dark:text-white'>{pageName}</h2>
      {propertiesInStack.length > 1 && (
        <Breadcrumb separator='>'>
          {propertiesInStack.map((property, index) => (
            <BreadcrumbItem
              key={index}
              isCurrentPage={index === lastIndex}
              className={`${index === lastIndex ? 'text-airt-primary' : 'text-airt-font-base'}`}
            >
              <BreadcrumbLink
                href='#'
                onClick={(event) => handleClick(event, index)}
                data-testid={`breadcrumb-link-${property}`}
              >
                {property}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      )}
    </div>
  );
};

export default CustomBreadcrumb;
