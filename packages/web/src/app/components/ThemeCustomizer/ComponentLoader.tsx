// React Imports
import type { ComponentType } from 'react';

import { ComponentProps } from './types/components';

// Type Imports
type ComponentLoaderProps = {
  componentName: ComponentProps['name'];
  category: string;
};

const ComponentLoader = async <TProps extends object>({
  componentName,
  category,
  ...props
}: ComponentLoaderProps & TProps) => {
  if (!componentName) {
    return null;
  }

  try {
    const Component = (
      await import(`@/components/shadcn-studio/${category}/${componentName}`)
    ).default as ComponentType<TProps>;

    return <Component {...(props as TProps)} currentPage={1} totalPages={10} />;
  } catch (error) {
    console.error(`Failed to load component ${componentName}:`, error);

    return null;
  }
};

export default ComponentLoader;
