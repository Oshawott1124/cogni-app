import { useCallback } from 'react'

interface NextStepSuggestionBubblesProps {
  suggestions: string[];
  isEditMode: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const NextStepSuggestionBubbles: React.FC<NextStepSuggestionBubblesProps> = ({
  suggestions,
  isEditMode,
  onSuggestionClick,
}) => {
  const handleSuggestionClick = useCallback((suggestion: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;
    onSuggestionClick(suggestion);
  }, [isEditMode, onSuggestionClick]);

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '10px',
    }}>
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          onClick={(e) => handleSuggestionClick(suggestion, e)}
          style={{
            padding: '4px 8px',
            background: 'rgba(47, 50, 56, 0.1))',
            borderRadius: '16px',
            fontSize: '11px',
            cursor: isEditMode ? 'inherit' : 'pointer',
            transition: 'all 0.2s ease',
            border: '1px solid transparent',
            pointerEvents: isEditMode ? 'none' : 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
};

export default NextStepSuggestionBubbles;
