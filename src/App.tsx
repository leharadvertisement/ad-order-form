
import React from 'react';
import { Tabs, Tab } from './components/Tabs/Tabs';

function App() {
  return (
    <div className="App">
      <Tabs>
        <Tab label="Tab 1" content={<div>Content 1</div>} />
        <Tab label="Tab 2" content={<div>Content 2</div>} />
      </Tabs>
    </div>
  );
}

export default App;
