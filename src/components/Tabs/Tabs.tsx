
import React, { useState } from 'react';

interface TabProps {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}

// The Tab component itself doesn't render anything directly.
// Its props (label and content) are used by the parent Tabs component.
// It must return a valid ReactNode (e.g., null, JSX).
const Tab: React.FC<TabProps> = () => {
  return null;
};

const Tabs: React.FC<TabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <div>
      <div style={{ display: 'flex' }}>
        {React.Children.map(children, (child, index) => {
          // Ensure child and child.props are valid before accessing
          if (React.isValidElement(child) && child.props) {
            return (
              <button 
                key={index} 
                onClick={() => handleClick(index)} 
                style={{ fontWeight: index === activeTab ? 'bold' : 'normal', padding: '8px 16px', cursor: 'pointer', border: '1px solid #ccc', borderBottom: index === activeTab ? 'none' : '1px solid #ccc', background: index === activeTab ? 'white' : '#f0f0f0' }}
              >
                {child.props.label}
              </button>
            );
          }
          return null;
        })}
      </div>
      <div style={{ border: '1px solid #ccc', padding: '16px' }}>
        {/* Ensure children array is not empty and activeTab is within bounds */}
        {children && children.length > activeTab && React.isValidElement(children[activeTab]) && children[activeTab].props ? children[activeTab].props.content : null}
      </div>
    </div>
  );
};

export { Tabs, Tab };
