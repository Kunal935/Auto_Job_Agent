import { useNavigate } from "react-router-dom";

export default function JobCard({ job }) {
  const navigate = useNavigate();

  return (
    <div className="border p-4 rounded shadow-sm">
      <h3 className="font-semibold">{job.title}</h3>
      <p>Match Score: {job.score}%</p>

      <div className="flex gap-2 mt-2">
        <button
          className="text-blue-600"
          onClick={() => navigate("/autojob/cover-letter")}
        >
          Generate Cover Letter
        </button>

        <button className="text-gray-600">
          Save ⭐
        </button>
      </div>
    </div>
  );
}
