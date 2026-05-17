export default function Navbar() {
  return (
    <nav className="w-full bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-pink-600">
        DressLoop
      </h1>

      <div className="flex gap-6 text-gray-700 font-medium">
        <a href="#">Home</a>
        <a href="#">Donate</a>
        <a href="#">NGOs</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>

      <button className="bg-pink-600 text-white px-4 py-2 rounded-lg">
        Login
      </button>
    </nav>
  );
}