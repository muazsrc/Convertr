// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const imageDetails = document.getElementById('imageDetails');
const conversionOptions = document.getElementById('conversionOptions');
const currentFormatTrigger = document.getElementById('currentFormatTrigger');
const currentFormatText = document.getElementById('currentFormatText');
const targetFormatTrigger = document.getElementById('targetFormatTrigger');
const targetFormatText = document.getElementById('targetFormatText');
const targetFormatOptions = document.getElementById('targetFormatOptions');
const convertButton = document.getElementById('convertButton');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressBar = document.getElementById('progressBar');
const completedArea = document.getElementById('completedArea');
const downloadButton = document.getElementById('downloadButton');
const resetButton = document.getElementById('resetButton');
const toast = document.getElementById('toast');

// State variables
let currentFile = null;
let currentFormat = '';
let targetFormat = '';
let convertedBlob = null;
let isZipFile = false;
let pageCount = 1;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Hide the convert button by default
  convertButton.classList.remove('active');
  
  // Setup the dropdown
  replaceCustomDropdown();
});

// Event listeners  
// Update upload area event listener
// Update drag-and-drop handlers
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('active');
  e.dataTransfer.dropEffect = 'copy';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('active');
  
  const files = e.dataTransfer.files;
  if (files.length > 1) {
    showToast('Please upload only one file', true);
    return;
  }
  
  handleFileUpload(files[0]);
});

uploadArea.addEventListener('click', (e) => {
  if (e.target === uploadArea || e.target.closest('.upload-icon')) {
    fileInput.click();
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFileUpload(e.target.files[0]);
  }
});

// COMPLETELY NEW APPROACH: Replace custom dropdown with native select
function replaceCustomDropdown() {
  // Get the parent container
  const customSelect = targetFormatTrigger.parentElement;
  const optionGroup = customSelect.parentElement;
  
  // Create a native select element
  const nativeSelect = document.createElement('select');
  nativeSelect.id = 'targetFormatSelect';
  nativeSelect.className = 'native-select';
  nativeSelect.style.width = '100%';
  nativeSelect.style.padding = '0.75rem 1rem';
  nativeSelect.style.backgroundColor = 'var(--background)';
  nativeSelect.style.border = '1px solid rgba(0, 0, 0, 0.1)';
  nativeSelect.style.borderRadius = '0.5rem';
  nativeSelect.style.cursor = 'pointer';
  nativeSelect.style.fontSize = '1rem';
  nativeSelect.style.color = 'var(--text)';
  
  // Add a default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select format';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  nativeSelect.appendChild(defaultOption);
  
  // Add options from the existing dropdown
  const options = targetFormatOptions.querySelectorAll('.select-option');
  options.forEach(option => {
    const newOption = document.createElement('option');
    newOption.value = option.dataset.value;
    newOption.textContent = option.textContent;
    nativeSelect.appendChild(newOption);
  });
  
  // Add change event listener
  nativeSelect.addEventListener('change', () => {
    targetFormat = nativeSelect.value;
    
    if (currentFormat && targetFormat) {
      convertButton.classList.add('active');
    } else {
      convertButton.classList.remove('active');
    }
  });
  
  // Replace the custom select with the native select
  optionGroup.replaceChild(nativeSelect, customSelect);
}

convertButton.addEventListener('click', () => {
  if (currentFile && targetFormat) {
    convertImage();
  } else {
    showToast('Please select a file and target format', true);
  }
});

downloadButton.addEventListener('click', () => {
  if (convertedBlob) {
    downloadFile();
  }
});

resetButton.addEventListener('click', () => {
  resetConverter();
});

// Functions
function handleFileUpload(file) {
  // Check if file is an image or PDF
  const validTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/tiff', 
    'image/bmp', 
    'application/pdf',
    'image/pjpeg',
    'image/jfif'
  ];
  
  // Improved format detection
  const typeMapping = {
    'image/jpeg': 'jpeg',
    'image/pjpeg': 'jpeg',
    'image/jfif': 'jpeg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/tiff': 'tiff',
    'image/bmp': 'bmp',
    'application/pdf': 'pdf'
  };

  // Check file size
  const MAX_SIZE_MB = 10;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    showToast(`File size exceeds ${MAX_SIZE_MB}MB limit`, true);
    return;
  }
  
  if (!validTypes.includes(file.type)) {
    // Check file extension as fallback
    const ext = file.name.split('.').pop().toLowerCase();
    const extensionMapping = {
      'jpg': 'jpeg',
      'jpeg': 'jpeg',
      'jfif': 'jpeg',
      'pjpeg': 'jpeg',
      'pjp': 'jpeg',
      'png': 'png',
      'gif': 'gif',
      'tiff': 'tiff',
      'tif': 'tiff',
      'bmp': 'bmp',
      'pdf': 'pdf'
    };

    if (!extensionMapping[ext]) {
      showToast('Unsupported file type', true);
      return;
    }
    currentFormat = extensionMapping[ext];
      } else {
    currentFormat = typeMapping[file.type] || 'unknown';
  }
  
  currentFile = file;
  currentFormatText.textContent = currentFormat.toUpperCase();
  
  // Preview image (not for PDF)
  if (currentFormat !== 'pdf') {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      imagePreview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  } else {
    // For PDFs, render the first page as preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Use PDF.js to display PDF preview
        const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
        const page = await pdf.getPage(1);
        
        // Fit the page to a reasonable preview size
        const viewport = page.getViewport({ scale: 0.5 });
        
        // Create a canvas for PDF preview
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render the PDF page to the canvas
        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Set the preview image source to the canvas data URL
        previewImage.src = canvas.toDataURL();
        previewImage.style.maxWidth = '300px';
        imagePreview.style.display = 'flex';
      } catch (error) {
        console.error("Error rendering PDF preview:", error);
        
        // Fallback to PDF icon if rendering fails
        previewImage.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <text x="7" y="18" font-family="Arial" font-size="4.5" fill="currentColor" letter-spacing="0.4">P D F</text>
          </svg>
        `);
        previewImage.style.maxWidth = '120px';
        imagePreview.style.display = 'flex';
      }
    };
    reader.readAsArrayBuffer(file);
  }
  
  // Display file details
  imageDetails.innerHTML = '';
  const details = [
    { icon: '📄', text: file.name },
    { icon: '⚖️', text: formatBytes(file.size) },
    { icon: '🏷️', text: currentFormat.toUpperCase() }
  ];
  
  details.forEach(detail => {
    const detailElement = document.createElement('div');
    detailElement.classList.add('detail-item');
    detailElement.innerHTML = `<span>${detail.icon}</span><span>${detail.text}</span>`;
    imageDetails.appendChild(detailElement);
  });
  
  // Show conversion options
  conversionOptions.classList.add('active');
  
  // Check if we can show the convert button
  if (targetFormat) {
    convertButton.classList.add('active');
  } else {
    convertButton.classList.remove('active');
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function convertImage() {
  if (currentFormat === targetFormat) {
    showToast('Source and target formats are the same', true);
    return;
  }
  
  // Show progress bar
  progressBarContainer.style.display = 'block';
  progressBar.style.width = '0%';
  
  // Handle actual conversion based on file types
  if (currentFormat === 'pdf' && targetFormat !== 'pdf') {
    // PDF to Image conversion
    showToast('Converting PDF pages...');
    convertPdfToImage(currentFile, targetFormat)
      .then(result => {
        convertedBlob = result.blob;
        isZipFile = result.isZip;
        pageCount = result.pageCount;
        completeConversion();
      })
      .catch(error => {
        progressBarContainer.style.display = 'none';
        showToast('Error converting PDF: ' + error.message, true);
        console.error(error);
      });
  } else if (currentFormat !== 'pdf' && targetFormat !== 'pdf') {
    // Image to Image conversion
    showToast('Converting image format...');
    convertImageFormat(currentFile, targetFormat)
      .then(blob => {
        convertedBlob = blob;
        isZipFile = false;
        pageCount = 1;
        completeConversion();
      })
      .catch(error => {
        progressBarContainer.style.display = 'none';
        showToast('Error converting image: ' + error.message, true);
        console.error(error);
      });
  } else if (currentFormat !== 'pdf' && targetFormat === 'pdf') {
    // Image to PDF conversion
    showToast('Creating PDF from image...');
    convertImageToPdf(currentFile)
      .then(blob => {
        convertedBlob = blob;
        isZipFile = false;
        pageCount = 1;
        completeConversion();
      })
      .catch(error => {
        progressBarContainer.style.display = 'none';
        showToast('Error creating PDF: ' + error.message, true);
        console.error(error);
      });
  }
}

// Function to convert PDF to Image
async function convertPdfToImage(pdfFile, targetFormat) {
  return new Promise(async (resolve, reject) => {
    try {
      // Load the PDF using PDF.js
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      
      // Create a zip file if there are multiple pages
      const zip = new JSZip();
      const convertedFiles = [];
      
      // Update progress calculation to account for multiple pages
      const totalSteps = numPages;
      let completedSteps = 0;
      
      // Convert each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        // Get the page
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 }); // Scale up for better quality
        
        // Create a canvas to render the PDF page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        
        // Render the PDF page to the canvas
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => {
          const mimeType = targetFormat === 'jpg' || targetFormat === 'jpeg' 
            ? 'image/jpeg' 
            : `image/${targetFormat}`;
          
          if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
            canvas.toBlob(resolve, mimeType, 0.92);
          } else {
            canvas.toBlob(resolve, mimeType);
          }
        });
        
        // Add to zip if multiple pages, otherwise just store the blob
        if (numPages > 1) {
          zip.file(`page-${pageNum}.${targetFormat}`, blob);
        } else {
          convertedFiles.push(blob);
        }
        
        // Update progress
        completedSteps++;
        const progress = (completedSteps / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
      }
      
      // If multiple pages, create and return zip file, otherwise return single blob
      if (numPages > 1) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        resolve({ blob: zipBlob, isZip: true, pageCount: numPages });
      } else {
        resolve({ blob: convertedFiles[0], isZip: false, pageCount: 1 });
      }
      
    } catch (error) {
      console.error("PDF conversion error:", error);
      reject(error);
    }
  });
}

// Function to convert between image formats
function convertImageFormat(imageFile, targetFormat) {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create an image element to load the source image
      const img = new Image();
      img.onload = () => {
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert the canvas to a blob with the target format
        let mimeType = `image/${targetFormat}`;
        if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
          mimeType = 'image/jpeg';
        }
        
        // For JPEG, we can specify quality
        if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to convert image"));
              }
            },
            mimeType,
            0.92 // 92% quality for JPEG
          );
        } else {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to convert image"));
              }
            },
            mimeType
          );
        }
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      
      // Load the image from the file
      img.src = URL.createObjectURL(imageFile);
    } catch (error) {
      console.error("Image conversion error:", error);
      reject(error);
    }
  });
}

// Function to convert image to PDF
async function convertImageToPdf(imageFile) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFLib.PDFDocument.create();
      
      // Load the image file
      const img = new Image();
      img.onload = async () => {
        try {
          // Create a canvas with the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob
          const canvasBlob = await new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob));
          });
          
          // Convert blob to ArrayBuffer
          const arrayBuffer = await canvasBlob.arrayBuffer();
          const imageBytes = new Uint8Array(arrayBuffer);
          
          // Set PDF page size based on image dimensions with margins
          const margin = 40;
          const pageWidth = img.width + (2 * margin);
          const pageHeight = img.height + (2 * margin);
          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          
          // Embed the image in the PDF
          let pdfImage;
          if (imageFile.type === 'image/png' || currentFormat === 'png') {
            pdfImage = await pdfDoc.embedPng(imageBytes);
          } else {
            pdfImage = await pdfDoc.embedJpg(imageBytes);
          }
          
          // Draw the image on the PDF page
          page.drawImage(pdfImage, {
            x: margin,
            y: margin,
            width: img.width,
            height: img.height
          });
          
          // Save the PDF
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          resolve(blob);
        } catch (error) {
          console.error("PDF creation error:", error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image for PDF conversion"));
      };
      
      img.src = URL.createObjectURL(imageFile);
    } catch (error) {
      console.error("PDF creation error:", error);
      reject(error);
    }
  });
}

function completeConversion() {
  progressBarContainer.style.display = 'none';
  completedArea.style.display = 'flex';
  convertButton.classList.remove('active');
  
  // Update success message based on conversion type
  const completedMessage = document.querySelector('.completed-area h2');
  if (completedMessage) {
    if (isZipFile) {
      completedMessage.textContent = `Converted ${pageCount} pages successfully!`;
    } else {
      completedMessage.textContent = 'Conversion Complete!';
    }
  }
  
  // Update the download button text
  const downloadButtonText = document.querySelector('.download-button-text');
  if (downloadButtonText) {
    if (isZipFile) {
      downloadButtonText.textContent = `Download ZIP (${pageCount} ${targetFormat.toUpperCase()} files)`;
    } else {
      downloadButtonText.textContent = `Download ${targetFormat.toUpperCase()}`;
    }
  }
  
  // Make sure buttons are visible
  downloadButton.style.display = 'inline-flex';
  downloadButton.style.opacity = '1';
  downloadButton.style.height = 'auto';
  
  resetButton.style.display = 'inline-flex';
  resetButton.style.opacity = '1';
  resetButton.style.height = 'auto';
  
  const buttonGroup = document.querySelector('.button-group');
  if (buttonGroup) {
    buttonGroup.style.display = 'flex';
    buttonGroup.style.opacity = '1';
  }
}

function downloadFile() {
  if (convertedBlob) {
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    
    // Set appropriate filename based on whether it's a zip file
    if (isZipFile) {
      a.download = `converted_pages.zip`;
    } else {
      let fileExtension = targetFormat;
      if (targetFormat === 'jpeg') fileExtension = 'jpg';
      a.download = `converted.${fileExtension}`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show appropriate success message
    if (isZipFile) {
      showToast(`Successfully converted ${pageCount} pages to ${targetFormat.toUpperCase()}`);
    } else {
      showToast('File downloaded successfully!');
    }
  }
}

function resetConverter() {
  currentFile = null;
  currentFormat = '';
  targetFormat = '';
  convertedBlob = null;
  isZipFile = false;
  pageCount = 1;
  
  // Reset UI
  fileInput.value = '';
  imagePreview.style.display = 'none';
  conversionOptions.classList.remove('active');
  convertButton.classList.remove('active');
  completedArea.style.display = 'none';
  currentFormatText.textContent = 'Detecting...';
  targetFormatText.textContent = 'Select format';
  progressBar.style.width = '0%';
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = 'toast';
  
  if (isError) {
    toast.classList.add('error');
  }
  
  toast.classList.add('active');
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

// Initialize hint tooltips
document.querySelectorAll('.tooltip').forEach(tooltip => {
  tooltip.addEventListener('mouseover', () => {
    tooltip.querySelector('.tooltip-text').style.visibility = 'visible';
    tooltip.querySelector('.tooltip-text').style.opacity = '1';
  });
  
  tooltip.addEventListener('mouseout', () => {
    tooltip.querySelector('.tooltip-text').style.visibility = 'hidden';
    tooltip.querySelector('.tooltip-text').style.opacity = '0';
  });
});

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

mobileMenuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  navLinks.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar') && window.innerWidth <= 768) {
    navLinks.classList.remove('active');
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    navLinks.classList.remove('active');
  }
});