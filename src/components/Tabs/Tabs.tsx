
import React, { useState } from 'react';

interface TabProps {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}

const Tab = ({ label, content }: TabProps) => {
  return {content};
};

const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <div>
      <div style={{ display: 'flex' }}>
        {React.Children.map(children, (child, index) => (
          <button key={index} onClick={() => handleClick(index)} style={{ fontWeight: index === activeTab ? 'bold' : 'normal' }}>
            {child.props.label}
          </button>
        ))}
      </div>
      <div>
        {children[activeTab].props.content}
      </div>
    </div>
  );
};

export { Tabs, Tab };
