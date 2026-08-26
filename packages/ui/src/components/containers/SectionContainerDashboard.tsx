import React, { ElementType } from 'react';
import { twMerge } from 'tailwind-merge';

interface SectionContainerDashboardType {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
}

const SectionContainerDashboard = ({
  children,
  className,
  as: Component = 'div',
  id,
}: SectionContainerDashboardType) => {
  return (
    <Component id={id} className={twMerge('mx-auto w-full', className)}>
      {children}
    </Component>
  );
};

export default SectionContainerDashboard;
