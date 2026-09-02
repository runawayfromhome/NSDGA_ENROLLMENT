const AdditionalNotesCard = ({ children }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm transition-shadow">
      {children}
    </div>
  );
};

// This is the line you are likely missing:
export default AdditionalNotesCard;