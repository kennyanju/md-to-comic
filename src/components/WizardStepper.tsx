import React from 'react';
import { FileText, Cpu, LayoutGrid, Image as ImageIcon, Palette, Check } from 'lucide-react';

interface WizardStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReachedStep: number;
}

export const WIZARD_STEPS = [
  { id: 0, title: 'Document Ingest', icon: FileText, desc: 'Markdown & Style' },
  { id: 1, title: 'AI Scripting', icon: Cpu, desc: 'LLM & Characters' },
  { id: 2, title: 'Panel Editor', icon: LayoutGrid, desc: 'Review & Refine' },
  { id: 3, title: 'Visual Gen', icon: ImageIcon, desc: 'Generate Images' },
  { id: 4, title: 'Comic Studio', icon: Palette, desc: 'Layout & Bubbles' }
];

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  onStepClick,
  maxReachedStep
}) => {
  return (
    <nav className="stepper-container" aria-label="Creation Wizard Steps">
      <div className="stepper-track" role="list">
        {WIZARD_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = maxReachedStep > step.id && !isActive;
          const isAccessible = step.id <= maxReachedStep;

          return (
            <React.Fragment key={step.id}>
              <div role="listitem" style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => isAccessible && onStepClick(step.id)}
                  disabled={!isAccessible}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={!isAccessible}
                  aria-label={`Step ${idx + 1}: ${step.title}. ${isActive ? 'Current Step' : isCompleted ? 'Completed' : 'Locked'}`}
                  type="button"
                >
                  <div className="step-number" aria-hidden="true">
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : idx + 1}
                  </div>
                  <Icon size={16} aria-hidden="true" />
                  <span>{step.title}</span>
                  <span className="sr-only">
                    {isActive ? '(Current Step)' : isCompleted ? '(Completed)' : '(Locked)'}
                  </span>
                </button>
              </div>

              {idx < WIZARD_STEPS.length - 1 && (
                <div 
                  className={`step-connector ${maxReachedStep > idx ? 'completed' : ''}`} 
                  aria-hidden="true" 
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
