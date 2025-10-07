export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🎉 Marina Portal is Working!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Basic routing and rendering is functional
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">✅ What's Working</h2>
          <ul className="text-left space-y-2">
            <li>✅ Next.js 14 routing</li>
            <li>✅ TypeScript compilation</li>
            <li>✅ Tailwind CSS styling</li>
            <li>✅ Basic page rendering</li>
          </ul>
        </div>
        <div className="mt-6">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}


