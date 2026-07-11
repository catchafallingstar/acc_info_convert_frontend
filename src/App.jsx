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
  const [imageFormat, setImageFormat] = useState('JPEG');
  const [base64Image, setBase64Image] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null);
  // 1. Handle when a user selects an image file
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file); // Save the raw file for the backend
      setSelectedImage(URL.createObjectURL(file));

      const detectedFormat = file.type.split('/')[1]?.toUpperCase() || 'JPEG';
      setImageFormat(detectedFormat === 'JPG' ? 'JPEG' : detectedFormat);

      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result);
      };
      reader.readAsDataURL(file);

      setStatus('File loaded. Click the convert button below!');
      setResult('');
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
        if (data.generated_text.includes("VALIDATION_ERROR:")) {
          setStatus("Upload Rejected: This image does not appear to be a flowchart or infographic.");
          setResult("Error: The platform requires an infographic, diagram, or flowchart layout to generate a meaningful structural narrative.");
          return; // This stops the function early so it doesn't say "Complete!"
        }
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
  const handleDownloadPDF = async () => {
    try {
      // 1. Send the data to your new Django endpoint
      // Adjust the URL if your Django server runs on a different port/address
      const response = await fetch('https://accessible-narrative-backend.onrender.com/api/generate-pdf/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          narrative: result,       
          image: base64Image     // Change this from selectedImage to base64Image
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF on the server.');
      }

      // 2. Convert the backend response into a downloadable file blob
      const blob = await response.blob();

      // 3. Create a temporary ghost link to trigger the browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'Accessible_Narrative.pdf';
      document.body.appendChild(a);

      // 4. Click the link and clean up
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("There was a problem generating your PDF. Please try again.");
    }
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
        <strong>Current Status:</strong> {status}
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