import React, { useState } from 'react';
import { LayoutProps } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutHubProps extends LayoutProps {
  headerNode: React.ReactNode;
}

export const LayoutHub: React.FC<LayoutHubProps> = ({
  currentView,
  setCurrentView,
  tabs,
  children,
  headerNode,
  lastSavedTime,
}) => {
  const [isNavOpen, setIsNavOpen] = useState(currentView === 'dashboard');

  return (
    <div className="relative w-screen h-screen overflow-hidden font-rajdhani bg-[var(--clr-bg-main)]">
      
      {/* Background Graphic Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--clr-primary)] via-transparent to-transparent scale-[2]"></div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-2">
        <div className="max-w-[1920px] mx-auto bg-[var(--clr-bg-card)]/50 backdrop-blur-xl border border-[var(--clr-border)] rounded-full px-6 py-2 shadow-xl flex justify-between items-center transition-all hover:bg-[var(--clr-bg-card)]/80">
          <div className="scale-75 origin-left -my-4 -ml-4 flex-grow pointer-events-auto">
             {headerNode}
          </div>
          {/* Hub Toggle */}
          <button 
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="pointer-events-auto ml-4 shrink-0 btn-primary rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-lg relative z-[60]"
          >
             <i className={`fas fa-${isNavOpen ? 'times' : 'compass'} transition-transform ${isNavOpen ? 'rotate-90' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`absolute inset-0 pt-24 pb-8 px-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
         ${isNavOpen ? 'blur-md scale-[0.98] opacity-40 pointer-events-none' : 'blur-0 scale-100 opacity-100'}
      `}>
          <div className="w-full h-full overflow-y-auto custom-scrollbar rounded-2xl bg-[var(--clr-bg-card)]/30 backdrop-blur-lg border border-[var(--clr-border)] shadow-2xl p-6 relative">
             <div className="max-w-[1400px] mx-auto">
                <AnimatePresence mode="wait">
                   <motion.div
                     key={currentView}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     transition={{ duration: 0.3 }}
                   >
                       {children}
                   </motion.div>
                </AnimatePresence>
             </div>
          </div>
      </div>

      {/* The Hub Overlay Navigation */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div 
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative w-[600px] h-[600px] pointer-events-auto">
              {/* Hub Rings */}
              <motion.div 
                className="absolute inset-0 rounded-full border border-[var(--clr-accent)]/20 shadow-[0_0_50px_rgba(var(--clr-accent-rgb),0.2)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-[40px] rounded-full border border-[var(--clr-primary)]/30 border-dashed"
                animate={{ rotate: -360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              />

              {/* Center Logo/Label */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                 <div className="text-center">
                    <i className="fas fa-satellite-dish text-6xl text-[var(--clr-accent)] opacity-80 animate-pulse"></i>
                    <h2 className="text-3xl font-bold mt-4 tracking-widest text-[var(--clr-text)]">COMMAND <span className="text-[var(--clr-primary)]">HUB</span></h2>
                 </div>
              </div>

              {/* Radial Items */}
              {tabs.map((tab, index) => {
                 const total = tabs.length;
                 const angle = (index / total) * Math.PI * 2 - Math.PI / 2; // Start from top
                 const radius = 220; // Distance from center
                 const x = Math.cos(angle) * radius;
                 const y = Math.sin(angle) * radius;

                 return (
                    <motion.button
                       key={tab.id}
                       onClick={() => {
                          setCurrentView(tab.id);
                          setIsNavOpen(false);
                       }}
                       initial={{ opacity: 0, scale: 0 }}
                       animate={{ opacity: 1, scale: 1, x, y }}
                       exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                       transition={{ type: "spring", stiffness: 200, damping: 20, delay: index * 0.05 }}
                       className={`absolute left-1/2 top-1/2 -ml-16 -mt-16 w-32 h-32 rounded-full border-2 bg-[var(--clr-bg-card)]/90 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center transition-all group hover:scale-110 hover:z-20
                          ${currentView === tab.id ? 'border-[var(--clr-accent)] shadow-[0_0_20px_var(--clr-accent)]' : 'border-[var(--clr-border)] hover:border-[var(--clr-primary)]'}
                       `}
                    >
                       <i className={`fas ${tab.icon} text-3xl mb-2 ${currentView === tab.id ? 'text-[var(--clr-accent)] scale-110' : 'text-[var(--clr-primary)] group-hover:scale-110 transition-transform'}`}></i>
                       <span className="text-xs font-bold text-center px-2 leading-tight">
                          {tab.name}
                       </span>
                       {currentView === tab.id && (
                          <div className="absolute -inset-2 rounded-full border border-[var(--clr-accent)] opacity-50 animate-ping"></div>
                       )}
                    </motion.button>
                 );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
