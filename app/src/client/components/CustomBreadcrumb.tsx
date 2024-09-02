import { useCallback, useMemo } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { UserProperties } from './buildPage/PropertySchemaParser';
import Button from './Button';

interface BreadcrumbProps {
  propertyName: string;
  addProperty: (e: React.MouseEvent<HTMLButtonElement>) => void;
  pageName: string;
  propertiesInStack: string[];
  popFromStack: (userProperties: UserProperties[] | null, validateDataResponse?: any, index?: number) => void;
}
const CustomBreadcrumb: React.FC<BreadcrumbProps> = ({
  propertyName,
  addProperty,
  pageName,
  propertiesInStack,
  popFromStack,
}) => {
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
    <div className='px-8 pt-3 pb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <h2 className='text-title-xl font-semibold text-airt-font-base dark:text-white py-3'>{pageName}</h2>
      {propertiesInStack.length > 1 && (
        <Breadcrumb separator='>'>
          {propertiesInStack.map((property, index) => (
            <BreadcrumbItem
              key={index}
              isCurrentPage={index === lastIndex}
              className={`${index === lastIndex ? 'text-airt-secondary' : 'text-airt-font-base'}`}
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
      {propertiesInStack.length === 0 && (
        <div className={`${false ? 'hidden' : ''} flex justify-end w-full`}>
          <Button onClick={addProperty} label={`Add ${propertyName}`} />
        </div>
      )}
    </div>
  );
};

export default CustomBreadcrumb;
