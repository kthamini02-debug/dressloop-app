export default function Footer() {
  return (
    <footer className="bg-pink-600 text-white py-10 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        
        <div>
          <h2 className="text-3xl font-bold mb-4">
            DressLoop
          </h2>

          <p className="text-pink-100">
            Empowering sustainable fashion through meaningful clothing donations.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">
            Quick Links
          </h3>

          <ul className="space-y-2 text-pink-100">
            <li>Home</li>
            <li>Donate</li>
            <li>NGOs</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">
            Contact
          </h3>

          <p className="text-pink-100">
            support@dressloop.org
          </p>

          <p className="text-pink-100 mt-2">
            Chennai, India
          </p>
        </div>
      </div>

      <div className="text-center text-pink-100 mt-10 border-t border-pink-400 pt-4">
        © 2026 DressLoop. All rights reserved.
      </div>
    </footer>
  );
}