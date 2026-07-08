// On-screen error catcher for easy local testing feedback
window.addEventListener("error", (e) => {
  // Ignore temporary undefined errors while we wait for fallbacks
  if (e.message && e.message.includes("QRCodeStyling")) return;
  
  console.error("Caught error:", e);
  const errorBox = document.createElement("div");
  errorBox.style.position = "fixed";
  errorBox.style.bottom = "20px";
  errorBox.style.left = "20px";
  errorBox.style.right = "20px";
  errorBox.style.padding = "16px";
  errorBox.style.background = "#fee2e2";
  errorBox.style.border = "1px solid #fca5a5";
  errorBox.style.borderRadius = "8px";
  errorBox.style.color = "#991b1b";
  errorBox.style.zIndex = "10000";
  errorBox.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
  errorBox.style.fontFamily = "monospace";
  errorBox.style.fontSize = "0.85rem";
  errorBox.innerHTML = `<strong>JavaScript Error:</strong> ${e.message}<br><small>${e.filename}:${e.lineno}</small>`;
  document.body.appendChild(errorBox);
});

document.addEventListener("DOMContentLoaded", () => {
  // Select DOM Elements
  const qrDataInput = document.getElementById("qr-data");
  
  const bgColorInput = document.getElementById("bg-color");
  const bgColorVal = document.getElementById("bg-color-val");
  
  const fgSolidRadio = document.getElementById("fg-solid");
  const fgGradientRadio = document.getElementById("fg-gradient");
  const solidFgWrapper = document.getElementById("solid-fg-wrapper");
  const gradientSettingsWrapper = document.getElementById("gradient-settings-wrapper");
  
  const fgColorInput = document.getElementById("fg-color");
  const fgColorVal = document.getElementById("fg-color-val");
  
  const gradColor1Input = document.getElementById("gradient-color-1");
  const gradColor1Val = document.getElementById("grad-1-val");
  const gradColor2Input = document.getElementById("gradient-color-2");
  const gradColor2Val = document.getElementById("grad-2-val");
  const gradTypeSelect = document.getElementById("gradient-type");
  const gradRotationInput = document.getElementById("gradient-rotation");
  const gradRotationVal = document.getElementById("rotation-val");
  const gradRotationItem = document.getElementById("gradient-rotation-item");
  
  const dotStyleSelect = document.getElementById("dot-style");
  const cornerSquareSelect = document.getElementById("corner-square-style");
  const cornerDotSelect = document.getElementById("corner-dot-style");
  const errorCorrectionSelect = document.getElementById("error-correction");
  
  const logoTrigger = document.getElementById("logo-trigger");
  const logoUploadInput = document.getElementById("logo-upload");
  const logoFilename = document.getElementById("logo-filename");
  const logoClearBtn = document.getElementById("logo-clear");
  const logoOptionsWrapper = document.getElementById("logo-options-wrapper");
  const logoSizeInput = document.getElementById("logo-size");
  const logoSizeVal = document.getElementById("logo-size-val");
  const logoClearBgCheckbox = document.getElementById("logo-clear-bg");
  
  const downloadFormatSelect = document.getElementById("download-format");
  const downloadBtn = document.getElementById("btn-download");
  const qrcodeContainer = document.getElementById("qrcode-container");
  
  // App State
  let qrCode = null;
  let logoDataUrl = null;
  
  // Generate options from current form state
  function getOptionsFromForm() {
    const data = qrDataInput.value.trim() || "https://google.com";
    const bgColor = bgColorInput.value;
    const isGradient = fgGradientRadio.checked;
    
    // Base configuration
    const options = {
      width: 280,
      height: 280,
      type: "canvas",
      margin: 10,
      data: data,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: errorCorrectionSelect.value
      },
      backgroundOptions: {
        color: bgColor
      },
      dotsOptions: {
        type: dotStyleSelect.value
      },
      cornersSquareOptions: {
        type: cornerSquareSelect.value
      },
      cornersDotOptions: {
        type: cornerDotSelect.value
      }
    };

    // Apply Solid Color vs Gradient Foreground
    if (isGradient) {
      const grad1 = gradColor1Input.value;
      const grad2 = gradColor2Input.value;
      const gradType = gradTypeSelect.value;
      
      const rotationDeg = parseInt(gradRotationInput.value);
      const rotationRad = (rotationDeg * Math.PI) / 180;
      
      const gradient = {
        type: gradType,
        rotation: rotationRad,
        colorStops: [
          { offset: 0, color: grad1 },
          { offset: 1, color: grad2 }
        ]
      };

      options.dotsOptions.gradient = gradient;
      options.cornersSquareOptions.gradient = gradient;
      options.cornersDotOptions.gradient = gradient;
    } else {
      const fgColor = fgColorInput.value;
      options.dotsOptions.color = fgColor;
      options.cornersSquareOptions.color = fgColor;
      options.cornersDotOptions.color = fgColor;
    }

    // Apply logo options
    if (logoDataUrl) {
      options.image = logoDataUrl;
      options.imageOptions = {
        hideBackgroundDots: logoClearBgCheckbox.checked,
        imageSize: parseFloat(logoSizeInput.value),
        margin: 4,
        crossOrigin: "anonymous"
      };
    } else {
      options.image = "";
      options.imageOptions = {
        hideBackgroundDots: false,
        imageSize: 0,
        margin: 0
      };
    }

    return options;
  }

  // Trigger update
  function updateQRCode() {
    if (qrCode) {
      qrCode.update(getOptionsFromForm());
    }
  }

  // Bind event listeners
  function bindEvents() {
    // Text/URL data input
    qrDataInput.addEventListener("input", updateQRCode);

    // Background Color picker
    bgColorInput.addEventListener("input", (e) => {
      bgColorVal.textContent = e.target.value;
      updateQRCode();
    });

    // Solid vs Gradient toggle
    fgSolidRadio.addEventListener("change", () => {
      solidFgWrapper.classList.remove("hidden");
      gradientSettingsWrapper.classList.add("hidden");
      updateQRCode();
    });

    fgGradientRadio.addEventListener("change", () => {
      solidFgWrapper.classList.add("hidden");
      gradientSettingsWrapper.classList.remove("hidden");
      updateQRCode();
    });

    // Solid Foreground Color picker
    fgColorInput.addEventListener("input", (e) => {
      fgColorVal.textContent = e.target.value;
      updateQRCode();
    });

    // Gradient inputs
    gradColor1Input.addEventListener("input", (e) => {
      gradColor1Val.textContent = e.target.value;
      updateQRCode();
    });

    gradColor2Input.addEventListener("input", (e) => {
      gradColor2Val.textContent = e.target.value;
      updateQRCode();
    });

    gradTypeSelect.addEventListener("change", (e) => {
      if (e.target.value === "radial") {
        gradRotationItem.classList.add("hidden");
      } else {
        gradRotationItem.classList.remove("hidden");
      }
      updateQRCode();
    });

    gradRotationInput.addEventListener("input", (e) => {
      gradRotationVal.textContent = e.target.value;
      updateQRCode();
    });

    // Style drop-downs
    dotStyleSelect.addEventListener("change", updateQRCode);
    cornerSquareSelect.addEventListener("change", updateQRCode);
    cornerDotSelect.addEventListener("change", updateQRCode);
    errorCorrectionSelect.addEventListener("change", updateQRCode);

    // Logo upload elements
    logoTrigger.addEventListener("click", () => {
      logoUploadInput.click();
    });

    logoUploadInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        logoFilename.textContent = file.name;
        logoClearBtn.classList.remove("hidden");
        logoOptionsWrapper.classList.remove("hidden");

        const reader = new FileReader();
        reader.onload = (event) => {
          logoDataUrl = event.target.result;
          updateQRCode();
        };
        reader.readAsDataURL(file);
      }
    });

    // Logo actions
    logoClearBtn.addEventListener("click", () => {
      logoDataUrl = null;
      logoUploadInput.value = "";
      logoFilename.textContent = "No image chosen";
      logoClearBtn.classList.add("hidden");
      logoOptionsWrapper.classList.add("hidden");
      updateQRCode();
    });

    logoSizeInput.addEventListener("input", (e) => {
      logoSizeVal.textContent = e.target.value;
      updateQRCode();
    });

    logoClearBgCheckbox.addEventListener("change", updateQRCode);

    // Download Trigger
    downloadBtn.addEventListener("click", () => {
      const format = downloadFormatSelect.value;
      downloadBtn.style.transform = "scale(0.98)";
      setTimeout(() => {
        downloadBtn.style.transform = "";
      }, 150);

      if (qrCode) {
        qrCode.download({
          name: "qrcode",
          extension: format
        });
      }
    });
  }

  // Safe initialization loop
  function initApp() {
    if (typeof QRCodeStyling === "undefined") {
      setTimeout(initApp, 100);
      return;
    }
    
    // Initialize instance
    qrCode = new QRCodeStyling(getOptionsFromForm());
    qrCode.append(qrcodeContainer);
    
    // Bind listeners
    bindEvents();
  }

  // Run initialization
  initApp();
});
