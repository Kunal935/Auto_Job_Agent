export default function CharacterCard({ name, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer p-4 rounded bg-gray-900 text-white hover:bg-gray-800"
    >
      <h3 className="text-lg">{name}</h3>
      <p className="text-sm opacity-70">Tap to talk</p>
    </div>
  );
}
