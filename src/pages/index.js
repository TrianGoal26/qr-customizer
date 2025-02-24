import React, { useState, useEffect, useRef } from 'react';

const GradientShapeQR = () => {
  // Stato base per l'URL e parametri dinamici
  const [baseUrl, setBaseUrl] = useState("https://www.triangoal.it/business-card");
  const [dynamicParam, setDynamicParam] = useState("");
  const [text, setText] = useState("");
  const [fgColor1, setFgColor1] = useState("#FF0066");
  const [fgColor2, setFgColor2] = useState("#9933FF");
  const [fgColor3, setFgColor3] = useState("#0066FF");
  const [shape, setShape] = useState("triangle");
  const canvasRef = useRef(null);
  const size = 550;
  const padding = 20;
  const pixelSize = 6.5;
  const pixelGap = 0.3;
  
  // Array per memorizzare i rettangoli e i loro colori per l'SVG
  const [svgElements, setSvgElements] = useState([]);

  useEffect(() => {
    const fullUrl = dynamicParam 
      ? `${baseUrl}/${dynamicParam}`
      : baseUrl;
    setText(fullUrl);
  }, [baseUrl, dynamicParam]);

  const generateQRCode = async (text) => {
    const QRCode = await import('qrcode');
    return new Promise((resolve) => {
      QRCode.toCanvas(null, text, {
        width: 200,
        margin: 0,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error, canvas) => {
        if (!error) resolve(canvas);
      });
    });
  };

  const interpolateThreeColors = (color1, color2, color3, factor) => {
    // If factor is in first half, interpolate between color1 and color2
    // If factor is in second half, interpolate between color2 and color3
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
    
    // Converti i valori RGB in formato esadecimale per SVG
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    
    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return { rgb: `rgb(${r}, ${g}, ${b})`, hex: hexColor };
  };

  const isInShape = (x, y, shape, width, height, centerX = size / 2, centerY = size / 2) => {
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
      default:
        return false;
    }
  };

  const updateCanvas = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.clearRect(0, 0, size, size);
      
      // Array temporaneo per gli elementi SVG
      const tempSvgElements = [];

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

      const qrCanvas = await generateQRCode(text);
      const qrSize = 200;
      
      let qrX = centerX - qrSize / 2;
      let qrY;
      
      switch (shape) {
        case "triangle": {
          const triangleHeight = (Math.sqrt(3) / 2) * shapeWidth;
          qrX = centerX - qrSize / 2.3 - 8;
          qrY = centerY - triangleHeight/2 + (triangleHeight * 0.50);
          break;
        }
        case "circle": {
          qrY = centerY - qrSize/2;
          break;
        }
        default:
          qrY = centerY - qrSize / 2;
      }

      const qrMaskArea = (x, y) => {
        if (shape === "triangle") {
          return x >= qrX - 5 && 
                 x <= qrX + qrSize + -1 && // Increased right padding
                 y >= qrY - 5 && 
                 y <= qrY + qrSize;
        } else if (shape === "circle") {
          return x >= qrX - 5 && 
                 x <= qrX + qrSize + 5 && 
                 y >= qrY - 10 && 
                 y <= qrY + qrSize + 5;
        }
        return false;
      };

      if (shape !== "square") {
        const cols = Math.ceil(shapeWidth / pixelSize);
        const rows = Math.ceil(shapeHeight / pixelSize);
        
        const adjustedPixelGap = shape === "triangle" ? 0.6 : 0.6;
        
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = centerX - shapeWidth/2 + col * pixelSize;
            const y = centerY - shapeHeight/2 + row * pixelSize;
            
            if (!qrMaskArea(x, y) && 
                isInShape(x, y, shape, shapeWidth, shapeHeight) && 
                Math.random() < adjustedPixelGap) {
              const gradientProgress = col / cols;
              const color = interpolateThreeColors(fgColor1, fgColor2, fgColor3, gradientProgress);
              ctx.fillStyle = color.rgb;
              ctx.fillRect(x, y, pixelSize - 0.5, pixelSize - 0.5);
              
              // Salva i dati per SVG
              tempSvgElements.push({
                type: 'rect',
                x,
                y,
                width: pixelSize - 0.5,
                height: pixelSize - 0.5,
                fill: color.hex
              });
            }
          }
        }
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = qrSize;
      tempCanvas.height = qrSize;
      const tempCtx = tempCanvas.getContext('2d');
      
      const qrCtx = qrCanvas.getContext('2d');
      const qrData = qrCtx.getImageData(0, 0, qrSize, qrSize);

      const gradientQR = ctx.createImageData(qrSize, qrSize);
      // Raggruppa i pixel del QR code per creare rettangoli più grandi quando possibile
      const qrBlocks = [];
      const processedIndices = new Set();

      for (let y = 0; y < qrSize; y++) {
        for (let x = 0; x < qrSize; x++) {
          const index = (y * qrSize + x) * 4;
          
          // Salta se è già stato processato o se è bianco (trasparente)
          if (processedIndices.has(index) || qrData.data[index] !== 0) continue;
          
          const gradientFactor = x / qrSize;
          const color = interpolateThreeColors(fgColor1, fgColor2, fgColor3, gradientFactor);
          
          // Trova la larghezza del blocco contiguo
          let width = 1;
          while (x + width < qrSize && 
                qrData.data[(y * qrSize + (x + width)) * 4] === 0 &&
                !processedIndices.has((y * qrSize + (x + width)) * 4)) {
            width++;
          }
          
          // Trova l'altezza del blocco contiguo
          let height = 1;
          let validBlock = true;
          
          whileLoop:
          while (y + height < qrSize) {
            for (let i = 0; i < width; i++) {
              const checkIndex = ((y + height) * qrSize + (x + i)) * 4;
              if (qrData.data[checkIndex] !== 0 || processedIndices.has(checkIndex)) {
                validBlock = false;
                break whileLoop;
              }
            }
            height++;
          }
          
          // Segna tutti i pixel nel blocco come processati
          for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
              processedIndices.add(((y + j) * qrSize + (x + i)) * 4);
            }
          }
          
          // Aggiungi il blocco all'array
          qrBlocks.push({
            x: x + qrX,
            y: y + qrY,
            width,
            height,
            fill: color.hex
          });
          
          // Disegna sul canvas
          const rgb = color.hex.match(/[\da-f]{2}/gi).map(hex => parseInt(hex, 16));
          for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
              const idx = ((y + j) * qrSize + (x + i)) * 4;
              gradientQR.data[idx] = rgb[0];
              gradientQR.data[idx + 1] = rgb[1];
              gradientQR.data[idx + 2] = rgb[2];
              gradientQR.data[idx + 3] = 255;
            }
          }
        }
      }

      // Aggiungi i blocchi QR agli elementi SVG
      tempSvgElements.push(...qrBlocks.map(block => ({
        type: 'rect',
        ...block
      })));

      tempCtx.putImageData(gradientQR, 0, 0);
      ctx.drawImage(tempCanvas, qrX, qrY);
      
      // Aggiorna lo stato SVG
      setSvgElements(tempSvgElements);

    } catch (err) {
      console.error('Error generating shape:', err);
    }
  };

  const handleDownload = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    const qrSize = 200;
    
    // Crea un documento SVG con tutti gli elementi
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("xmlns", svgNS);
    
    // Aggiungi un gruppo per il QR code e un altro per lo sfondo
    const backgroundGroup = document.createElementNS(svgNS, "g");
    backgroundGroup.setAttribute("id", "background");
    
    const qrGroup = document.createElementNS(svgNS, "g");
    qrGroup.setAttribute("id", "qr-code");
    
    // Aggiungi tutti gli elementi SVG
    svgElements.forEach(element => {
      if (element.type === 'rect') {
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", element.x);
        rect.setAttribute("y", element.y);
        rect.setAttribute("width", element.width);
        rect.setAttribute("height", element.height);
        rect.setAttribute("fill", element.fill);
        
        // Determina se è parte del QR code o dello sfondo
        const isQrPart = element.x >= (centerX - qrSize / 2.3 - 20) && 
                         element.x <= (centerX + qrSize / 2.3 + 20) &&
                         element.y >= (centerY - qrSize / 2 - 20) && 
                         element.y <= (centerY + qrSize / 2 + 20);
        
        if (isQrPart) {
          qrGroup.appendChild(rect);
        } else {
          backgroundGroup.appendChild(rect);
        }
      }
    });
    
    // Aggiungi i gruppi al SVG
    svg.appendChild(backgroundGroup);
    svg.appendChild(qrGroup);
    
    // Serializza l'SVG in una stringa
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    // Crea un Blob SVG
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    // Crea il link di download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gradient-qr-shape.svg';
    link.click();
    
    // Pulisci
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    updateCanvas();
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
        </div>
      </div>
    </div>
  );
};

export default GradientShapeQR;
