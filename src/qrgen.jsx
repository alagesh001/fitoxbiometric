import React, { useRef, useState, useEffect } from "react";
import QRCodeStyling from "qr-code-styling";
import defaultLogo from "./assets/qrlogo.png"; // default TeachX logo

const QrGenerator = () => {
  const qrRef = useRef(null);
  const [qrCode, setQrCode] = useState(null);
  const [inputText, setInputText] = useState("");
  const [logoImage, setLogoImage] = useState(null);

  const generateQr = () => {
    const qr = new QRCodeStyling({
      width: 1000,
      height: 1000,
      data: inputText || "https://example.com", // fallback
      image: logoImage || defaultLogo, // use uploaded logo
      dotsOptions: { color: "#000000", type: "rounded" },
      backgroundOptions: { color: "#ffffff" },
      cornersSquareOptions: { type: "extra-rounded", color: "#ff6600" },
      imageOptions: { crossOrigin: "anonymous", margin: 10 },
    });

    setQrCode(qr);
  };

  // Render QR code in DOM
  useEffect(() => {
    if (qrCode && qrRef.current) {
      qrRef.current.innerHTML = ""; // clear previous
      qrCode.append(qrRef.current);
    }
  }, [qrCode]);

  // Download QR code
  const downloadQr = async () => {
    if (!qrCode) return;
    const blob = await qrCode.getRawData("png");
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoImage(reader.result); // base64 image
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Input field */}
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text or URL"
        className="w-80 px-3 py-2 border rounded-lg shadow text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Logo upload */}
      <input
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="w-80"
      />

      {/* Generate button */}
      <button
        onClick={generateQr}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Generate QR
      </button>

      {/* Download button */}
      {qrCode && (
        <button
          onClick={downloadQr}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          Download QR
        </button>
      )}

      {/* QR display */}
      <div ref={qrRef} />
    </div>
  );
};

export default QrGenerator;
