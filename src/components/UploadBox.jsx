export default function UploadBox({ onFileSelect }) {
  return (
    <input
      type="file"
      accept=".pdf,.doc,.docx"
      onChange={(e) => onFileSelect(e.target.files[0])}
      className="border p-2 rounded w-full"
    />
  );
}
