import { useState } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

// --- CONFIGURATION: TOGGLE LOCAL VS ONLINE BACKEND HERE ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPdfUpload, setIsPdfUpload] = useState(false);
  const [status, setStatus] = useState('Waiting for an infographic upload...');
  const [result, setResult] = useState('');
  const [imageFormat, setImageFormat] = useState('JPEG');

  // 1. Handle when a user selects a file
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Bulletproof check for PDF
      const isFilePdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
      setIsPdfUpload(isFilePdf);

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

  // 2. The core pipeline: Traffic Cop (PDF vs Image)
  const processWorkflow = async () => {
    if (!selectedFile) {
      setStatus('Please upload a file first.');
      return;
    }

    try {
      const isPDF = selectedFile.type.includes('pdf') || selectedFile.name.toLowerCase().endsWith('.pdf');

      // ==========================================
      // PIPELINE 1: PDF PROCESSING
      // ==========================================
      if (isPDF) {
        setStatus('PDF detected! Sending directly to secure server for processing...');
        
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch(`${API_BASE_URL}/api/process-pdf-ai/`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.generated_text) {
          if (data.generated_text.includes("VALIDATION_ERROR:")) {
            setStatus("Upload Rejected: This PDF does not appear to be a flowchart or infographic.");
            setResult("Error: The platform requires an infographic, diagram, or flowchart layout to generate a meaningful structural narrative.");
            return;
          }
          setResult(data.generated_text);
          setStatus('Complete! Accessible structure generated successfully.');
        } else {
          throw new Error(data.error || "The Django backend returned an error.");
        }
      } 
      // ==========================================
      // PIPELINE 2: IMAGE PROCESSING (TESSERACT)
      // ==========================================
      else {
        setStatus('Scanning image for text (OCR active)...');

        const tesseractResult = await Tesseract.recognize(
          selectedImage,
          'eng',
          { logger: (m) => console.log(m) } 
        );

        const extractedText = tesseractResult.data.text;

        if (!extractedText.trim()) {
          setStatus('OCR Error: No text could be identified in this image.');
          return;
        }

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
            return; 
          }
          setResult(data.generated_text);
          setStatus('Complete! Accessible structure generated successfully.');
        } else {
          throw new Error(data.error || "The Django backend returned an error.");
        }
      }
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message || 'Failed to establish connection to server.'}`);
    }
  };

  // 3. Helper to download the AI response layout locally
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('https://accessible-narrative-backend.onrender.com/api/generate-pdf/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          narrative: result,       
          image: base64Image     
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF on the server.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'Accessible_Narrative.pdf';
      document.body.appendChild(a);
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
        <input type="file" accept="image/*,application/pdf" onChange={handleImageUpload} style={{ display: 'block', margin: '0 auto 15px auto' }} />
        <small style={{ color: '#888' }}>Supports PNG, JPG, JPEG, WEBP, or PDF graphs</small>
      </div>

      {/* Image / File Preview Box */}
      {selectedImage && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          {isPdfUpload ? (
            <div style={{ padding: '40px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px' }}>
              <h3 style={{ margin: 0, color: '#555' }}>📄 PDF Document Uploaded</h3>
              <p style={{ color: '#888', margin: '10px 0 0 0' }}>{selectedFile?.name}</p>
            </div>
          ) : (
            <img src={selectedImage} alt="Uploaded chart preview" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '6px', border: '1px solid #ddd' }} />
          )}
        </div>
      )}

      {/* Trigger Execution Button */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <button
          onClick={processWorkflow}
          disabled={!selectedFile}
          style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', background: selectedFile ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: selectedFile ? 'pointer' : 'not-allowed' }}
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