export default function NGOSection() {
  const ngos = [
    {
      name: "Hope Foundation",
      location: "Chennai",
    },
    {
      name: "Care India",
      location: "Bangalore",
    },
    {
      name: "Helping Hands",
      location: "Hyderabad",
    },
  ];

  return (
    <section className="py-20 bg-white text-center">
      <h2 className="text-4xl font-bold text-pink-600 mb-10">
        NGO Partners
      </h2>

      <div className="grid md:grid-cols-3 gap-6 px-10">
        {ngos.map((ngo, index) => (
          <div
            key={index}
            className="bg-pink-50 p-6 rounded-2xl shadow-md"
          >
            <h3 className="text-2xl font-semibold mb-2">
              {ngo.name}
            </h3>

            <p className="text-gray-600">
              {ngo.location}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}