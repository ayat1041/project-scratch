import React, { ElementType } from 'react';
import { twMerge } from 'tailwind-merge';

interface SectionContainerType {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
}

const SectionContainer = ({
  children,
  className,
  as: Component = 'div',
  id,
}: SectionContainerType) => {
  return (
    <Component
      id={id}
      className={twMerge(
        'mx-auto w-[94.666vw] py-5 md:w-[94.79vw] md:py-10 xl:w-[94.44vw] 2xl:w-[63.54vw] 2xl:max-w-[1220px]',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default SectionContainer;
