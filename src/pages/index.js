import React, { useState, useEffect, useRef } from 'react';

const GradientShapeQR = () => {
  // Base state for URL and dynamic parameters
  const [baseUrl, setBaseUrl] = useState("https://www.triangoal.it/business-card");
  const [dynamicParam, setDynamicParam] = useState("");
  const [text, setText] = useState("");
  const [fgColor1, setFgColor1] = useState("#FF0066");
  const [fgColor2, setFgColor2] = useState("#9933FF");
  const [fgColor3, setFgColor3] = useState("#0066FF");
  const [shape, setShape] = useState("triangle");
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const size = 550;
  const padding = 20;
  const pixelSize = 6.5;
  const pixelGap = 0.3;
  const [qrModules, setQrModules] = useState([]);

  // Update the complete URL when base URL or dynamic parameter changes
  useEffect(() => {
    const fullUrl = dynamicParam 
      ? `${baseUrl}/${dynamicParam}`
      : baseUrl;
    setText(fullUrl);
  }, [baseUrl, dynamicParam]);

  // Initialize SVG with proper namespace when component mounts
  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    updateSVG();
  }, []);

  // Generate QR code data
  const generateQRCode = async (text) => {
    try {
      const QRCode = await import('qrcode');
      return new Promise((resolve) => {
        QRCode.create(text, {
          errorCorrectionLevel: 'H'
        }, (err, qrData) => {
          if (err) {
            console.error("QR code generation error:", err);
            resolve([]);
            return;
          }
          
          if (!qrData || !qrData.modules || !qrData.modules.data) {
            console.error("Invalid QR data structure:", qrData);
            resolve([]);
            return;
          }
          
          // Convert data to 2D array
          const modules = qrData.modules.data;
          const moduleCount = qrData.modules.size;
          
          const moduleArray = [];
          for (let y = 0; y < moduleCount; y++) {
            const row = [];
            for (let x = 0; x < moduleCount; x++) {
              const index = y * moduleCount + x;
              row.push(modules[index]);
            }
            moduleArray.push(row);
          }
          
          resolve(moduleArray);
        });
      });
    } catch (error) {
      console.error("Error importing QRCode:", error);
      return [];
    }
  };

  // Interpolate between three colors based on factor (0-1)
  const interpolateThreeColors = (color1, color2, color3, factor) => {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r3 = parseInt(color3.slice(1, 3), 16);
    const g3 = parseInt(color3.slice(3, 5), 16);
    const b3 = parseInt(color3.slice(5, 7), 16);
    
    let r, g, b;
    if (factor <= 0.5) {
      // Interpolate between color1 and color2
      const adjustedFactor = factor * 2; // Scale factor to 0-1 range
      r = Math.round(r1 + (r2 - r1) * adjustedFactor);
      g = Math.round(g1 + (g2 - g1) * adjustedFactor);
      b = Math.round(b1 + (b2 - b1) * adjustedFactor);
    } else {
      // Interpolate between color2 and color3
      const adjustedFactor = (factor - 0.5) * 2; // Scale factor to 0-1 range
      r = Math.round(r2 + (r3 - r2) * adjustedFactor);
      g = Math.round(g2 + (g3 - g2) * adjustedFactor);
      b = Math.round(b2 + (b3 - b2) * adjustedFactor);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Convert RGB color string to hex format
  const rgbToHex = (rgb) => {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return "#000000";
    
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
  };

  // Check if a point is within the selected shape
  const isInShape = (x, y, shape, width, height, centerX, centerY) => {
    switch (shape) {
      case "triangle": {
        const sideLength = width;
        const triangleHeight = (Math.sqrt(3) / 2) * sideLength;
        
        const topX = centerX;
        const topY = centerY - triangleHeight/2;
        
        const leftX = centerX - sideLength/2;
        const leftY = centerY + triangleHeight/2;
        
        const rightX = centerX + sideLength/2;
        const rightY = centerY + triangleHeight/2;

        const mainArea = Math.abs((leftX * (rightY - topY) + rightX * (topY - leftY) + topX * (leftY - rightY)) / 2);
        const area1 = Math.abs((x * (rightY - topY) + rightX * (topY - y) + topX * (y - rightY)) / 2);
        const area2 = Math.abs((leftX * (y - topY) + x * (topY - leftY) + topX * (leftY - y)) / 2);
        const area3 = Math.abs((leftX * (rightY - y) + rightX * (y - leftY) + x * (leftY - rightY)) / 2);

        return Math.abs(mainArea - (area1 + area2 + area3)) < 1;
      }
      case "circle": {
        const dx = x - centerX;
        const dy = y - centerY;
        const radius = width / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threshold = 0.98;
        return distance <= radius * threshold;
      }
      case "square": {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        return (
          x >= centerX - halfWidth &&
          x <= centerX + halfWidth &&
          y >= centerY - halfHeight &&
          y <= centerY + halfHeight
        );
      }
      default:
        return false;
    }
  };

  // Update SVG with current settings
  const updateSVG = async () => {
    if (!svgRef.current) return;
    
    try {
      // Clear previous SVG content
      while (svgRef.current.firstChild) {
        svgRef.current.removeChild(svgRef.current.firstChild);
      }
      
      // Get QR code data
      const qrModulesData = await generateQRCode(text);
      setQrModules(qrModulesData);
      
      const effectiveSize = size - 2 * padding;
      let shapeWidth, shapeHeight;
      
      if (shape === "triangle") {
        shapeWidth = effectiveSize * 1.1;
        shapeHeight = (Math.sqrt(3) / 2) * shapeWidth;
      } else if (shape === "circle") {
        shapeWidth = effectiveSize * 0.85;
        shapeHeight = shapeWidth;
      } else {
        shapeWidth = effectiveSize * 0.8;
        shapeHeight = shapeWidth;
      }

      const centerX = size / 2;
      const centerY = size / 2;
      
      // Create defs element for gradients
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgRef.current.appendChild(defs);
      
      // Create gradient definition
      const gradientId = "shapeGradient";
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("x2", "100%");
      gradient.setAttribute("y2", "0%");
      
      const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", fgColor1);
      
      const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop2.setAttribute("offset", "50%");
      stop2.setAttribute("stop-color", fgColor2);
      
      const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop3.setAttribute("offset", "100%");
      stop3.setAttribute("stop-color", fgColor3);
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      gradient.appendChild(stop3);
      defs.appendChild(gradient);
      
      // Create the shape with pixels
      const pixelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      pixelGroup.setAttribute("class", "shape-pixels");
      
      const cols = Math.ceil(shapeWidth / pixelSize);
      const rows = Math.ceil(shapeHeight / pixelSize);
      const adjustedPixelGap = shape === "triangle" ? 0.6 : 0.6;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = centerX - shapeWidth/2 + col * pixelSize;
          const y = centerY - shapeHeight/2 + row * pixelSize;
          
          if (isInShape(x, y, shape, shapeWidth, shapeHeight, centerX, centerY) && 
              Math.random() < adjustedPixelGap) {
            const gradientProgress = col / cols;
            const color = interpolateThreeColors(fgColor1, fgColor2, fgColor3, gradientProgress);
            const hexColor = rgbToHex(color);
            
            const pixel = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            pixel.setAttribute("x", x);
            pixel.setAttribute("y", y);
            pixel.setAttribute("width", pixelSize - 0.5);
            pixel.setAttribute("height", pixelSize - 0.5);
            pixel.setAttribute("fill", hexColor);
            
            pixelGroup.appendChild(pixel);
          }
        }
      }
      
      svgRef.current.appendChild(pixelGroup);
      
      // Draw QR code if we have data
      if (qrModulesData.length > 0) {
        const moduleCount = qrModulesData.length;
        const qrSize = 200;
        const moduleSize = qrSize / moduleCount;
        
        let qrX = centerX - qrSize / 2;
        let qrY = centerY - qrSize / 2;
        
        // Adjust position based on shape
        if (shape === "triangle") {
          const triangleHeight = (Math.sqrt(3) / 2) * shapeWidth;
          qrX = centerX - qrSize / 2.3 - 8;
          qrY = centerY - triangleHeight/2 + (triangleHeight * 0.50);
        }
        
        // Create QR code group
        const qrGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        qrGroup.setAttribute("class", "qr-code");
        
        // Draw individual QR modules
        for (let y = 0; y < moduleCount; y++) {
          for (let x = 0; x < moduleCount; x++) {
            if (qrModulesData[y][x]) {
              const moduleX = qrX + x * moduleSize;
              const moduleY = qrY + y * moduleSize;
              
              const gradientFactor = x / moduleCount;
              const color = interpolateThreeColors(fgColor1, fgColor2, fgColor3, gradientFactor);
              const hexColor = rgbToHex(color);
              
              const qrModule = document.createElementNS("http://www.w3.org/2000/svg", "rect");
              qrModule.setAttribute("x", moduleX);
              qrModule.setAttribute("y", moduleY);
              qrModule.setAttribute("width", moduleSize);
              qrModule.setAttribute("height", moduleSize);
              qrModule.setAttribute("fill", hexColor);
              
              qrGroup.appendChild(qrModule);
            }
          }
        }
        
        svgRef.current.appendChild(qrGroup);
      }
      
      // Update canvas for preview
      updateCanvasFromSVG();
      
    } catch (err) {
      console.error('Error generating SVG:', err);
    }
  };

  // Update canvas preview from SVG
  const updateCanvasFromSVG = () => {
    if (!canvasRef.current || !svgRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Convert SVG to an image and draw on canvas
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => {
      console.error("Error loading SVG as image:", e);
    };
    img.src = url;
  };

  // Handle download of SVG file
  const handleDownload = () => {
    if (!svgRef.current) return;
    
    try {
      // Create a clone of the SVG element for download
      const svgClone = svgRef.current.cloneNode(true);
      
      // Ensure SVG has the required namespaces
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      
      // Create a serialized SVG string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Add XML declaration
      const svgDoctype = '<?xml version="1.0" standalone="no"?>\n';
      const svgFinal = svgDoctype + svgData;
      
      // Create a Blob with the SVG data
      const blob = new Blob([svgFinal], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create a download link and trigger it
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gradient-qr-shape.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Error downloading SVG:', err);
    }
  };

  // Update SVG when parameters change
  useEffect(() => {
    updateSVG();
  }, [text, fgColor1, fgColor2, fgColor3, shape]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Gradient QR Shape Generator</h1>

      <div className="mb-4 w-full max-w-md">
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Enter base URL"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={dynamicParam}
            onChange={(e) => setDynamicParam(e.target.value)}
            placeholder="Enter dynamic parameter (optional)"
            className="w-full p-2 border rounded"
          />
          <div className="text-sm text-gray-600">
            Generated URL: {text}
          </div>
        </div>
      </div>
      
      <div className="mb-4 w-full max-w-md">
        <label className="block mb-2">
          Shape:
          <select 
            value={shape} 
            onChange={(e) => setShape(e.target.value)}
            className="ml-2 p-2 border rounded"
          >
            <option value="triangle">Triangle</option>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
          </select>
        </label>
      </div>

      <div className="mb-4 w-full max-w-md">
        <label className="block mb-2">
          Gradient Colors:
          <div className="flex space-x-2 mt-1">
            <div className="flex flex-col items-center">
              <span className="text-sm">Left</span>
              <input 
                type="color" 
                value={fgColor1} 
                onChange={(e) => setFgColor1(e.target.value)} 
                className="w-20 h-10" 
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm">Center</span>
              <input 
                type="color" 
                value={fgColor2} 
                onChange={(e) => setFgColor2(e.target.value)} 
                className="w-20 h-10" 
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm">Right</span>
              <input 
                type="color" 
                value={fgColor3} 
                onChange={(e) => setFgColor3(e.target.value)} 
                className="w-20 h-10" 
              />
            </div>
          </div>
        </label>
      </div>

      <button 
        onClick={handleDownload}
        className="mb-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Download QR Code as SVG
      </button>

      <div className="p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <svg 
            ref={svgRef} 
            width={size} 
            height={size} 
            version="1.1"
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    </div>
  );
};

export default GradientShapeQR;
