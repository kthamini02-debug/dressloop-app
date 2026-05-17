export default function Testimonials() {
  const reviews = [
    {
      name: "Priya Sharma",
      role: "Donor - Chennai",
      text: "DressLoop made it simple to donate my unused clothes to families who genuinely needed them. The experience was smooth and meaningful.",
    },
    {
      name: "Helping Hands NGO",
      role: "NGO Partner",
      text: "Through DressLoop, our NGO received quality clothing donations regularly. It helped us support many underprivileged communities.",
    },
    {
      name: "Arjun Kumar",
      role: "Volunteer - Bangalore",
      text: "The platform is modern, responsive, and easy to use. DressLoop creates a real social impact through sustainable fashion donations.",
    },
  ];

  return (
    <section className="py-20 bg-pink-50 text-center">
      <h2 className="text-4xl font-bold text-pink-600 mb-10">
        What People Say
      </h2>

      <div className="grid md:grid-cols-3 gap-6 px-10">
        {reviews.map((review, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <p className="text-gray-700 mb-4">
              "{review.text}"
            </p>

            <h3 className="font-semibold text-pink-600 text-lg">
              {review.name}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {review.role}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}