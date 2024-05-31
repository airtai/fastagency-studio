import { PropertyDependencyMapProps } from '../interfaces/BuildPageInterfaces';

function deepFreeze(object: any) {
  // Retrieve the property names defined on object
  var propNames = Object.getOwnPropertyNames(object);

  // Freeze properties before freezing self
  for (let name of propNames) {
    let value = object[name];

    object[name] = value && typeof value === 'object' ? deepFreeze(value) : value;
  }

  return Object.freeze(object);
}

export const propertyDependencyMap: PropertyDependencyMapProps = deepFreeze({
  secret: [''],
  llm: ['secret'],
  agent: ['secret', 'llm'],
  team: ['secret', 'llm', 'agent'],
  application: ['secret', 'llm', 'agent', 'team'],
});
