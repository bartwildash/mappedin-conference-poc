import React from 'react';
import { Accessibility } from 'lucide-react';
import './Controls.css';

interface ControlsProps {
  accessibleMode: boolean;
  onAccessibleToggle: () => void;
}

const Controls: React.FC<ControlsProps> = ({ accessibleMode, onAccessibleToggle }) => {
  return (
    <div className="controls">
      <button
        className={`control-btn ${accessibleMode ? 'active' : ''}`}
        onClick={onAccessibleToggle}
        title="Toggle Accessible Mode"
      >
        <Accessibility size={18} />
        <span>Accessible</span>
      </button>
    </div>
  );
};

export default Controls;
