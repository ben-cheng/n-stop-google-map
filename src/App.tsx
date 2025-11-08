import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const App: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [mapUrl, setMapUrl] = useState<string>("https://google.com/maps/dir/");

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    const baseUrl = "https://google.com/maps/dir/";

    const directions = value
      .split("\n")
      .map((stop) => stop.trim())
      .map((stop) => encodeURIComponent(stop).replace(/%20/g, "+"))
      .filter((stop) => stop.length > 0)
      .join("/");

    const fullUrl = directions.length > 0 ? baseUrl + directions : baseUrl;
    setMapUrl(fullUrl);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">N-stop Google Map</h1>

      <label htmlFor="textInput" className="block mb-2 font-medium">
        Enter stops (one per line):
      </label>

      <textarea
        id="textInput"
        value={input}
        onChange={handleInputChange}
        className="w-full h-80 p-3 border rounded-lg mb-4"
        placeholder="Enter each stop on a new line..."
      />

      <div className="break-words mb-6">
        <a
          id="link"
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {mapUrl}
        </a>
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">About N-stop Google Map</h2>
        <p className="mb-4">
          N-stop Google Map helps you create and visualize routes with multiple stops using
          Google Maps. It’s designed to help plan trips with several destinations efficiently.
        </p>

        <h3 className="text-lg font-semibold">Features:</h3>
        <ul className="list-disc list-inside mb-4">
          <li>Add multiple stops to your route</li>
          <li>View the entire route on Google Maps</li>
          <li>Get directions and estimated travel times</li>
          <li>Save and share your routes</li>
        </ul>

        <h3 className="text-lg font-semibold">How to Use:</h3>
        <ol className="list-decimal list-inside">
          <li>Enter your starting point and destination.</li>
          <li>Add any additional stops you want to include.</li>
          <li>Copy or click the generated Google Maps link.</li>
          <li>Use the provided directions to navigate your trip.</li>
        </ol>
      </div>
    </div>
  )
}

export default App
