import { useState } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';
import { jsPDF } from "jspdf";
// --- CONFIGURATION: TOGGLE LOCAL VS ONLINE BACKEND HERE ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [status, setStatus] = useState('Waiting for an infographic upload...');
  const [result, setResult] = useState('');

  // 1. Handle when a user selects an image file
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setStatus('Image loaded. Click the convert button below!');
      setResult(''); // Clear previous runs
    }
  };

  // 2. The core pipeline: Scan image with Tesseract -> Send raw text to Django
  const processWorkflow = async () => {
    if (!selectedImage) {
      setStatus('Please upload an image first.');
      return;
    }

    try {
      // --- PHASE 1: LOCAL TESSERACT OCR ---
      setStatus('Scanning image for text (OCR active)...');

      const tesseractResult = await Tesseract.recognize(
        selectedImage,
        'eng',
        { logger: (m) => console.log(m) } // Tracks conversion logs in your browser inspect console
      );

      const extractedText = tesseractResult.data.text;

      if (!extractedText.trim()) {
        setStatus('OCR Error: No text could be identified in this image.');
        return;
      }

      // --- PHASE 2: CALL SECURE DJANGO BACKEND ---
      setStatus('Text extracted! Sending to Django server for AI structural rendering...');

      const response = await fetch(`${API_BASE_URL}/api/process-ai/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw_text: extractedText }),
      });

      const data = await response.json();

      if (response.ok && data.generated_text) {
        setResult(data.generated_text);
        setStatus('Complete! Accessible structure generated successfully.');
      } else {
        throw new Error(data.error || "The Django backend returned an error.");
      }

    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message || 'Failed to establish connection to server.'}`);
    }
  };

  // 3. Helper to download the AI response layout locally as a clean text file
  const downloadTextFile = () => {
    const element = document.createElement("a");
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "accessible-infographic-description.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  const handleDownloadPDF = () => {
    // 1. Create a new PDF document (portrait, standard A4 size)
    const doc = new jsPDF();

    // 2. Add a proper Heading (This helps with structure)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Accessible Image Description", 20, 20);

    // 3. Add the AI-Generated Text
    // We use splitTextToSize so the text wraps neatly and doesn't run off the page!
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const wrappedText = doc.splitTextToSize(result, 170); // Adjust 'aiGeneratedText' to whatever your state variable is named!
    doc.text(wrappedText, 20, 30);

    // 4. Calculate where the text ends so we can put the image below it
    const textHeight = wrappedText.length * 7;
    const imageYPosition = 30 + textHeight + 10;

    // 5. Add the original image (Assuming you have the image saved in a state variable like 'selectedImage')
    // We have to convert the image file to a URL the PDF can read
    if (selectedImage) {
      const imageUrl = URL.createObjectURL(selectedImage);

      // Add the image to the PDF: (image source, format, X pos, Y pos, width, height)
      // Note: You might need to tweak the width/height (150x100) to fit your design
      doc.addImage(imageUrl, "JPEG", 20, imageYPosition, 150, 100);
    }

    // 6. Trigger the download!
    doc.save("Accessible_Narrative.pdf");
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1>Accessible Infographic Converter</h1>
        <p style={{ color: '#666' }}>Convert visual charts into screen-reader-ready textual layouts securely</p>
      </header>

      {/* Upload Interface Section */}
      <div style={{ border: '2px dashed #bbb', padding: '30px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'block', margin: '0 auto 15px auto' }} />
        <small style={{ color: '#888' }}>Supports PNG, JPG, JPEG, or WEBP graphs</small>
      </div>

      {/* Image Preview Box */}
      {selectedImage && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <img src={selectedImage} alt="Uploaded chart preview" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '6px', border: '1px solid #ddd' }} />
        </div>
      )}

      {/* Trigger Execution Button */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <button
          onClick={processWorkflow}
          disabled={!selectedImage}
          style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', background: selectedImage ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: selectedImage ? 'pointer' : 'not-allowed' }}
        >
          Generate Accessible Narrative
        </button>
      </div>

      {/* Live Operational Status Box */}
      <div style={{ padding: '12px', background: '#e9ecef', borderRadius: '4px', borderLeft: '5px solid #6c757d', marginBottom: '30px', color: '#333' }}>
        <strong>Current State:</strong> {status}
      </div>

      {/* Content Results Display Section */}
      {result && (
        <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '25px', color: '#212529' }}>
          <h2 style={{ marginTop: '0', color: '#007bff' }}>Accessible Description:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', lineHeight: '1.6', background: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
            {result}
          </pre>

          <button
            onClick={handleDownloadPDF}
            style={{ marginTop: '15px', padding: '10px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Download Description (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}

export default App;