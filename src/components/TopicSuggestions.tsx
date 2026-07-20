import { TopicId, getTopicConfig } from "@/lib/topicContext";

interface TopicSuggestionsProps {
  currentTopic: TopicId | null;
  onSuggestionClick: (question: string) => void;
  isVisible: boolean;
}

const TopicSuggestions = ({ currentTopic, onSuggestionClick, isVisible }: TopicSuggestionsProps) => {
  if (!isVisible || !currentTopic) return null;

  const topicConfig = getTopicConfig(currentTopic);
  const suggestions = topicConfig.followUpQuestions.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4 animate-fade-in">
      {suggestions.map((question, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(question)}
          className="px-3 py-2 text-xs rounded-full glass hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all duration-200 text-muted-foreground hover:text-foreground"
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default TopicSuggestions;
