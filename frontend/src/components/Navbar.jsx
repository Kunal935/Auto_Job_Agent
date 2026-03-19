import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="flex gap-4 p-4 bg-white shadow">
      <button onClick={() => navigate("/")}>Home</button>
      <button onClick={() => navigate("/autojob/resume")}>AutoJob</button>
      <button onClick={() => navigate("/voice/character-select")}>Voice AI</button>
      <button onClick={() => navigate("/wallet")}>Wallet</button>
      <button onClick={() => navigate("/settings")}>Settings</button>
    </nav>
  );
}
