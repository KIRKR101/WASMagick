// Stores image data and conversion results
let imageFiles = [];
let wiperCurrentIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    // Reset options to default values on page load
    resetOptions();
});

function setupEventListeners() {
    // --- Main Action Buttons ---
    document.getElementById('convertBtn').addEventListener('click', convertImages);
    document.getElementById('resetOptionsBtn').addEventListener('click', resetOptions);
    document.getElementById('resetBtn').addEventListener('click', resetConverter);
    document.getElementById('downloadSingleBtn').addEventListener('click', downloadSingleImage);
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllImages);
    // Wiper button listener
    document.getElementById('compareWiperBtn').addEventListener('click', openWiperLightbox);

    // --- File Upload ---
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('click', () => fileInput.click());
    document.getElementById('addMoreBtn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // --- Tab Navigation (using data-tab) ---
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => switchTab(e.currentTarget.dataset.tab));
    });

    // --- Main Carousel Navigation ---
    document.getElementById("prevBtn").addEventListener('click', prevSlide);
    document.getElementById("nextBtn").addEventListener('click', nextSlide);
    
    // Quick Rotate Buttons
    document.querySelectorAll('.quick-rotate-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const degrees = parseInt(e.currentTarget.dataset.degrees);
            rotateQuick(degrees);
        });
    });

    // Wiper Lightbox Listeners
    document.getElementById("wiperLightbox").addEventListener('click', closeWiperLightbox);
    document.getElementById("prevWiperBtn").addEventListener('click', showPrevWiperSlide);
    document.getElementById("nextWiperBtn").addEventListener('click', showNextWiperSlide);
    document.getElementById("downloadWiperImageBtn").addEventListener('click', downloadWiperImage);
    document.querySelector("#wiperLightbox #downloadAllWiperBtn").addEventListener('click', downloadAllImages);

    // All Input Sliders and Selects
    document.getElementById('outputFormat').addEventListener('change', toggleFormatOptions);
    document.getElementById('quality').addEventListener('input', (e) => updateQualityValue(e.target.value));
    document.getElementById('webpLossless').addEventListener('change', toggleWebpLossless);
    document.getElementById('pngCompression').addEventListener('input', (e) => updatePngCompressionValue(e.target.value));
    document.getElementById('resizeMode').addEventListener('change', toggleResizeControls);
    document.getElementById('scalePercentage').addEventListener('input', (e) => updateScaleValue(e.target.value));
    document.getElementById('rotation').addEventListener('input', (e) => updateRotationValue(e.target.value));
    document.getElementById('skewX').addEventListener('input', (e) => updateSkewXValue(e.target.value));
    document.getElementById('blur').addEventListener('input', (e) => updateBlurValue(e.target.value));
    document.getElementById('sharpen').addEventListener('input', (e) => updateSharpenValue(e.target.value));

    // Initialize Lucide icons
    lucide.createIcons();
}

// Handles file selection from input or drag-and-drop
function handleFileSelect(event) {
    processFiles(event.target.files);
    // Clear the input to allow re-uploading the same file
    event.target.value = "";
}

// Prevents default drag behavior and adds visual feedback
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("border-white/60", "bg-white/5");
}

// Removes visual feedback when drag leaves the area
function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("border-white/60", "bg-white/5");
}

// Processes dropped files and removes visual feedback
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("border-white/60", "bg-white/5");
    processFiles(event.dataTransfer.files);
}

// Filters for valid image files and adds them to the global state
function processFiles(files) {
    const validFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
    );
    if (validFiles.length === 0) {
        showError("Please select valid image files.");
        return;
    }

    validFiles.forEach((file) => {
        const fileEntry = {
            originalFile: file,
            convertedBlob: null,
            originalData: null,
            id: `file-${Date.now()}-${Math.random()}`,
        };
        imageFiles.push(fileEntry);
    });

    updatePreviewUI();
}

// Manages the visibility of UI sections based on the number of loaded images
function updatePreviewUI() {
    if (imageFiles.length === 0) return;

    hideError();
    document.getElementById('uploadArea').classList.add('hidden');
    document.getElementById('controlsAndPreviewsWrapper').classList.remove('hidden'); 
    document.getElementById('previewSection').classList.remove('hidden');
    document.getElementById('addMoreBtn').classList.remove('hidden');

    if (imageFiles.length === 1) {
        setupSingleImageView();
        // Hide the thumbnail strip for a single image
        document.getElementById('thumbnailPreviewStrip').classList.add('hidden');
    } else {
        setupMultiImageView();
        // Show the thumbnail strip for multiple images
        document.getElementById('thumbnailPreviewStrip').classList.remove('hidden');
    }
}

// Configures the UI for displaying a single image preview
function setupSingleImageView() {
    document.getElementById('multiImageCarouselView').classList.add('hidden');
    document.getElementById('singleImageView').classList.remove('hidden');

    const fileEntry = imageFiles[0];
    const reader = new FileReader();

    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            fileEntry.originalData = { width: img.width, height: img.height, size: fileEntry.originalFile.size, url: e.target.result };
            document.getElementById('originalPreviewTwoCol').src = e.target.result;
            document.getElementById('originalInfoTwoCol').innerHTML = `<strong>Size:</strong> ${formatFileSize(fileEntry.originalFile.size)}<br><strong>Dimensions:</strong> ${img.width} × ${img.height}px`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(fileEntry.originalFile);

    // Clear any previously converted image data
    document.getElementById('convertedPreviewTwoCol').src = '';
    document.getElementById('convertedInfoTwoCol').innerHTML = '';
}

// Configures the UI for displaying multiple image previews in a carousel
function setupMultiImageView() {
    document.getElementById('singleImageView').classList.add('hidden');
    document.getElementById('multiImageCarouselView').classList.remove('hidden');

    const container = document.getElementById('carouselContainer');
    const thumbnailContainer = document.getElementById('thumbnailPreviewStrip');
    const template = document.getElementById('carouselSlideTemplate');
    
    // Clear previous carousel and thumbnail content
    container.innerHTML = ''; 
    thumbnailContainer.innerHTML = '';

    imageFiles.forEach((fileEntry, index) => {
        // Create the main carousel slide element
        const slide = template.content.cloneNode(true);
        const slideElement = slide.querySelector('.carousel-slide');
        slideElement.dataset.id = fileEntry.id;
        slideElement.style.display = 'none'; 

        // Create the thumbnail preview element
        const thumb = document.createElement('img');
        thumb.dataset.id = fileEntry.id;
        thumb.className = 'thumbnail-preview';
        thumb.title = `Go to Image ${index + 1}`;
        // Set click event to switch to the corresponding slide
        thumb.onclick = () => showSlide(index);

        const reader = new FileReader();
        reader.onload = e => {
            const imgUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                fileEntry.originalData = { width: img.width, height: img.height, size: fileEntry.originalFile.size, url: imgUrl };
                slideElement.querySelector('.originalPreview').src = imgUrl;
                slideElement.querySelector('.originalInfo').innerHTML = `<strong>Size:</strong> ${formatFileSize(fileEntry.originalFile.size)}<br><strong>Dimensions:</strong> ${img.width} × ${img.height}px`;
                // Set thumbnail image source
                thumb.src = imgUrl;
            };
            img.src = imgUrl;
        };
        reader.readAsDataURL(fileEntry.originalFile);
        
        container.appendChild(slide);
        thumbnailContainer.appendChild(thumb);
    });

    carouselCurrentIndex = 0;
    showSlide(carouselCurrentIndex);
}

// Initiates the image conversion process for all loaded images
async function convertImages() {
    if (imageFiles.length === 0) {
        showError("Please upload an image first.");
        return;
    }

    showLoading(imageFiles.length);
    const settings = getConversionSettings();
    let convertedCount = 0;

    for (const fileEntry of imageFiles) {
        const loader = getLoaderForFile(fileEntry.id);
        if (loader) loader.classList.remove("hidden");

        try {
            // Ensure original image data is available for conversion
            if (!fileEntry.originalData) {
                const url = await readFileAsDataURL(fileEntry.originalFile);
                const dims = await getImageDimensions(url);
                fileEntry.originalData = {
                    ...dims,
                    size: fileEntry.originalFile.size,
                    url: url,
                };
            }

            const img = await createImageBitmap(fileEntry.originalFile);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const dimensions = calculateDimensions(
                img.width,
                img.height,
                settings
            );

            canvas.width = dimensions.width;
            canvas.height = dimensions.height;

            applyCanvasOperations(ctx, img, canvas, settings, dimensions);

            const mimeType = getMimeType(settings.outputFormat);
            const quality = calculateQuality(settings, settings.outputFormat);

            const blob = await new Promise((resolve) =>
                canvas.toBlob(resolve, mimeType, quality)
            );
            fileEntry.convertedBlob = blob;
            updateConvertedImageUI(fileEntry);
        } catch (error) {
            console.error("Conversion Error:", error);
            const infoElement = getInfoElementForFile(fileEntry.id);
            if (infoElement)
                infoElement.innerHTML = `<span class="text-red-400">Conversion Failed</span>`;
        } finally {
            if (loader) loader.classList.add("hidden");
            convertedCount++;
            updateProgressBar(convertedCount, imageFiles.length);
        }
    }

    hideLoading();
    document.getElementById("downloadSection").classList.remove("hidden");

    // Adjust visibility of download buttons based on the number of images
    const downloadSingleBtn = document.getElementById("downloadSingleBtn");
    const downloadAllBtn = document.getElementById("downloadAllBtn");

    if (imageFiles.length === 1) {
        downloadSingleBtn.classList.remove("hidden");
        downloadAllBtn.classList.add("hidden");
    } else {
        downloadSingleBtn.classList.add("hidden");
        downloadAllBtn.classList.remove("hidden");
    }

    // Show compare button if any image was successfully converted
    if (imageFiles.some((f) => f.convertedBlob)) {
        document.getElementById("compareWiperBtn").classList.remove("hidden");
    }
}

// Updates the UI with the converted image and its details
function updateConvertedImageUI(fileEntry) {
    const url = URL.createObjectURL(fileEntry.convertedBlob);
    const compression = fileEntry.originalData.size > fileEntry.convertedBlob.size ?
        `<strong>Reduction:</strong> <span class="text-green-500">${((1 - fileEntry.convertedBlob.size / fileEntry.originalData.size) * 100).toFixed(1)}% ↓</span>` :
        `<strong>Increase:</strong> <span class="text-red-500">${((fileEntry.convertedBlob.size / fileEntry.originalData.size - 1) * 100).toFixed(1)}% ↑</span>`;
    
    const infoHTML = `<strong>Size:</strong> ${formatFileSize(fileEntry.convertedBlob.size)}<br><strong>Dimensions:</strong> ${fileEntry.originalData.width} × ${fileEntry.originalData.height}px<br>${compression}`;

    const imgElement = getImageElementForFile(fileEntry.id);
    const infoElement = getInfoElementForFile(fileEntry.id);

    if (imgElement) imgElement.src = url;
    if (infoElement) infoElement.innerHTML = infoHTML;
}

// Applies various image transformations and filters to the canvas
function applyCanvasOperations(ctx, img, canvas, settings, dimensions) {
    ctx.save();
    // Apply rotation if specified
    if (settings.rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((settings.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Apply horizontal and/or vertical flip
    let scaleX = 1,
        scaleY = 1;
    if (settings.flipHorizontal) scaleX = -1;
    if (settings.flipVertical) scaleY = -1;
    if (scaleX !== 1 || scaleY !== 1) {
        ctx.translate(
            scaleX < 0 ? canvas.width : 0,
            scaleY < 0 ? canvas.height : 0
        );
        ctx.scale(scaleX, scaleY);
    }

    // Apply skew transformation
    if (settings.skewX !== 0) {
        ctx.transform(
            1,
            0,
            Math.tan((settings.skewX * Math.PI) / 180),
            1,
            0,
            0
        );
    }

    // Apply CSS filters like blur, brightness, contrast, saturation, hue-rotate
    applyCanvasFilters(ctx, settings);

    // Draw the image onto the canvas based on aspect ratio settings
    if (settings.aspectRatio === "crop") drawImageCropped(ctx, img, dimensions);
    else if (settings.aspectRatio === "pad")
        drawImagePadded(ctx, img, dimensions);
    else ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.restore();

    // Apply pixel-level filter effects, color adjustments, and additional effects
    if (settings.filterEffect !== "none")
        applyFilterEffect(ctx, canvas, settings.filterEffect);
    applyColorAdjustments(ctx, canvas, settings);
    applyAdditionalEffects(ctx, canvas, settings);
}

// Helper to get the correct loader element for a given file ID
function getLoaderForFile(fileId) {
    if (imageFiles.length === 1) {
        return document.querySelector('.single-card-loader');
    }
    const slide = document.querySelector(`.carousel-slide[data-id="${fileId}"]`);
    return slide ? slide.querySelector('.card-loader') : null;
}

// Helper to get the correct image element for a given file ID
function getImageElementForFile(fileId) {
    if (imageFiles.length === 1) {
        return document.getElementById('convertedPreviewTwoCol');
    }
    const slide = document.querySelector(`.carousel-slide[data-id="${fileId}"]`);
    return slide ? slide.querySelector('.convertedPreview') : null;
}

// Helper to get the correct info element for a given file ID
function getInfoElementForFile(fileId) {
    if (imageFiles.length === 1) {
        return document.getElementById('convertedInfoTwoCol');
    }
    const slide = document.querySelector(`.carousel-slide[data-id="${fileId}"]`);
    return slide ? slide.querySelector('.convertedInfo') : null;
}

// Displays a specific slide in the image carousel
function showSlide(index) {
    const slides = document.querySelectorAll('#carouselContainer .carousel-slide');
    const thumbnails = document.querySelectorAll('#thumbnailPreviewStrip .thumbnail-preview');

    if (slides.length === 0) return;

    // Loop index if it goes out of bounds
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    // Hide all slides and remove active class from thumbnails
    slides.forEach(slide => {
        slide.style.display = 'none';
        slide.classList.remove('active');
    });
    thumbnails.forEach(thumb => thumb.classList.remove('active'));

    // Show the active slide and highlight its thumbnail
    const activeSlide = slides[index];
    if (activeSlide) {
        activeSlide.style.display = 'grid';
        activeSlide.classList.add('active');
    }
    const activeThumb = thumbnails[index];
    if(activeThumb) {
        activeThumb.classList.add('active');
        // Scroll the active thumbnail into view if necessary
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    carouselCurrentIndex = index;
    
    document.getElementById('carouselCounter').textContent = `Image ${index + 1} of ${slides.length}`;
}

// Navigates to the next slide in the carousel
function nextSlide() {
    showSlide(carouselCurrentIndex + 1);
}

// Navigates to the previous slide in the carousel
function prevSlide() {
    showSlide(carouselCurrentIndex - 1);
}

function openWiperLightbox() {
    const wiperLightbox = document.getElementById('wiperLightbox');
    const carousel = document.getElementById('wiperCarousel');
    carousel.innerHTML = ''; // Clear old content

    const convertedFiles = imageFiles.filter(f => f.convertedBlob);
    if (convertedFiles.length === 0) {
        showError("No converted images available to compare.");
        return;
    }

    convertedFiles.forEach((fileEntry, index) => {
        const slide = document.createElement('div');
        slide.className = 'wiper-slide';
        slide.dataset.index = index;
        slide.style.display = 'none'; // Hide by default

        // Dynamically create the wiper HTML for each image
        slide.innerHTML = `
            <div class="wiper-container" style="aspect-ratio: ${fileEntry.originalData.width} / ${fileEntry.originalData.height}">
                <div class="wiper-content">
                    <img src="${fileEntry.originalData.url}" class="wiper-image" alt="Original Image">
                    <div class="wiper-label original-label rounded-lg">Original</div>
                    <img src="${URL.createObjectURL(fileEntry.convertedBlob)}" class="wiper-image wiper-converted-image" alt="Converted Image">
                    <div class="wiper-label converted-label rounded-lg">Converted</div>
                    <input type="range" min="0" max="100" value="50" class="wiper-slider">
                    <div class="wiper-handle"></div>
                </div>
            </div>
        `;
        carousel.appendChild(slide);
    });

    wiperLightbox.classList.remove('hidden');
    wiperCurrentIndex = 0;
    showWiperSlide(wiperCurrentIndex);
}

function closeWiperLightbox(event) {
    if (event.target.id === 'wiperLightbox') {
        document.getElementById('wiperLightbox').classList.add('hidden');
    }
}

function showWiperSlide(index) {
    const slides = document.querySelectorAll('#wiperCarousel .wiper-slide');
    if (slides.length === 0) return;

    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    slides.forEach(s => s.style.display = 'none');
    
    const activeSlide = slides[index];
    if (activeSlide) {
        activeSlide.style.display = 'block';
        const slider = activeSlide.querySelector('.wiper-slider');
        if (slider) {
            slider.value = 50; // Reset position
            handleWiperSlider(slider); // Update view
            slider.oninput = () => handleWiperSlider(slider); // Attach listener
        }
    }
    wiperCurrentIndex = index;
}

function handleWiperSlider(slider) {
    const value = slider.value;
    const container = slider.closest('.wiper-content');
    if (container) {
        container.querySelector('.wiper-converted-image').style.clipPath = `inset(0 0 0 ${value}%)`;
        container.querySelector('.wiper-handle').style.left = `${value}%`;
    }
}

function showNextWiperSlide() {
    showWiperSlide(wiperCurrentIndex + 1);
}

function showPrevWiperSlide() {
    showWiperSlide(wiperCurrentIndex - 1);
}

function downloadWiperImage() {
    const convertedFiles = imageFiles.filter(f => f.convertedBlob);
    const currentFile = convertedFiles[wiperCurrentIndex];
    if (currentFile) {
        const outputFormat = document.getElementById("outputFormat").value;
        const baseName = currentFile.originalFile.name.substring(0, currentFile.originalFile.name.lastIndexOf("."));
        const newName = `${baseName}-converted.${outputFormat}`;
        downloadBlob(currentFile.convertedBlob, newName);
    }
}

// Downloads the single converted image (if only one was uploaded)
function downloadSingleImage() {
    if (imageFiles.length > 0 && imageFiles[0].convertedBlob) {
        const file = imageFiles[0];
        const outputFormat = document.getElementById("outputFormat").value;
        const baseName = file.originalFile.name.substring(
            0,
            file.originalFile.name.lastIndexOf(".")
        );
        const newName = `${baseName}-converted.${outputFormat}`;
        downloadBlob(file.convertedBlob, newName);
    }
}

// Downloads all converted images as a ZIP file
async function downloadAllImages() {
    const convertedFiles = imageFiles.filter((f) => f.convertedBlob);
    if (convertedFiles.length === 0) {
        showError("No converted images to download.");
        return;
    }

    const zip = new JSZip();
    const outputFormat = document.getElementById("outputFormat").value;

    convertedFiles.forEach((file) => {
        const originalName = file.originalFile.name;
        const baseName = originalName.substring(
            0,
            originalName.lastIndexOf(".")
        );
        const newName = `${baseName}-converted.${outputFormat}`;
        zip.file(newName, file.convertedBlob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, "converted-images.zip");
}

// Triggers a download for a given Blob and filename
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Resets the converter to its initial state, clearing all images and UI elements
function resetConverter() {
    imageFiles = [];
    document.getElementById('fileInput').value = '';

    // Hide all dynamic UI sections
    document.getElementById('previewSection').classList.add('hidden');
    document.getElementById('singleImageView').classList.add('hidden');
    document.getElementById('multiImageCarouselView').classList.add('hidden');
    document.getElementById('controlsAndPreviewsWrapper').classList.add('hidden');
    document.getElementById('downloadSection').classList.add('hidden');
    document.getElementById('addMoreBtn').classList.add('hidden');
    document.getElementById('compareWiperBtn').classList.add('hidden');

    // Clear dynamic content
    document.getElementById('carouselContainer').innerHTML = '';
    document.getElementById('thumbnailPreviewStrip').innerHTML = '';
    document.getElementById('originalPreviewTwoCol').src = '';
    document.getElementById('originalInfoTwoCol').innerHTML = '';
    document.getElementById('convertedPreviewTwoCol').src = '';
    document.getElementById('convertedInfoTwoCol').innerHTML = '';
    
    // Show the initial upload area
    document.getElementById('uploadArea').classList.remove('hidden');
    resetOptions();
    hideError();
}

// Displays the loading spinner and updates loading text
function showLoading(total) {
    document.getElementById(
        "loadingText"
    ).textContent = `Processing ${total} image(s)...`;
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("convertBtn").disabled = true;
    document.getElementById("convertBtnText").textContent = "Processing...";
}

// Hides the loading spinner and re-enables the convert button
function hideLoading() {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("convertBtn").disabled = false;
    document.getElementById("convertBtnText").textContent = "Convert Image(s)";
    document.getElementById("progressBar").style.width = "0%";
}

// Updates the progress bar width
function updateProgressBar(current, total) {
    const percent = total > 0 ? (current / total) * 100 : 0;
    document.getElementById("progressBar").style.width = `${percent}%`;
}

// Formats file size into human-readable units (Bytes, KB, MB, GB)
function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Displays an error message
function showError(message) {
    const errorText = document.getElementById("errorText");
    errorText.textContent = message;
    document.getElementById("errorMsg").classList.remove("hidden");
}

// Hides the error message
function hideError() {
    document.getElementById("errorMsg").classList.add("hidden");
}

// Switches between different tab content sections
function switchTab(tabName) {
    document
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));
    document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));
    event.target.classList.add("active");
    document.getElementById(tabName + "-tab").classList.add("active");
}

// Toggles visibility of format-specific options and quality slider
function toggleFormatOptions() {
    const format = document.getElementById("outputFormat").value;
    document.getElementById("webpOptions").classList.add("hidden");
    document.getElementById("jpegOptions").classList.add("hidden");
    document.getElementById("pngOptions").classList.add("hidden");
    if (format === "webp") {
        document.getElementById("webpOptions").classList.remove("hidden");
    } else if (format === "jpeg") {
        document.getElementById("jpegOptions").classList.remove("hidden");
    } else if (format === "png") {
        document.getElementById("pngOptions").classList.remove("hidden");
    }
    // Disable quality slider for formats where it's not applicable
    const qualityDisabled = ["png", "bmp", "gif", "tiff"].includes(format);
    document.getElementById("quality").disabled = qualityDisabled;
    if (qualityDisabled) {
        document
            .getElementById("quality")
            .parentElement.classList.add("opacity-50");
    } else {
        document
            .getElementById("quality")
            .parentElement.classList.remove("opacity-50");
    }
}

// Toggles WebP lossless compression and disables quality slider if enabled
function toggleWebpLossless() {
    const lossless = document.getElementById("webpLossless").checked;
    const qualitySlider = document.getElementById("quality");
    if (lossless) {
        qualitySlider.disabled = true;
        qualitySlider.parentElement.classList.add("opacity-50");
    } else {
        qualitySlider.disabled = false;
        qualitySlider.parentElement.classList.remove("opacity-50");
    }
}

// Sets rotation value and updates its display
function rotateQuick(degrees) {
    document.getElementById("rotation").value = degrees;
    updateRotationValue(degrees);
}

// Updates the displayed quality value
function updateQualityValue(value) {
    document.getElementById("qualityValue").textContent = value + "%";
}

// Updates the displayed PNG compression level
function updatePngCompressionValue(value) {
    document.getElementById("pngCompressionValue").textContent = value;
}

// Updates the displayed scale percentage
function updateScaleValue(value) {
    document.getElementById("scaleValue").textContent = value + "%";
}

// Updates the displayed rotation value
function updateRotationValue(value) {
    document.getElementById("rotationValue").textContent = value + "°";
}

// Updates the displayed skew X value
function updateSkewXValue(value) {
    document.getElementById("skewXValue").textContent = value + "°";
}

// Updates the displayed blur value
function updateBlurValue(value) {
    document.getElementById("blurValue").textContent = value + "px";
}

// Updates the displayed sharpen value
function updateSharpenValue(value) {
    document.getElementById("sharpenValue").textContent = value;
}

// Updates the displayed noise reduction value
function updateNoiseValue(value) {
    document.getElementById("noiseValue").textContent = value;
}

// Updates the displayed vignette value
function updateVignetteValue(value) {
    document.getElementById("vignetteValue").textContent = value;
}

// Updates the displayed pixelate value
function updatePixelateValue(value) {
    document.getElementById("pixelateValue").textContent = value;
}

// Updates the displayed brightness value
function updateBrightnessValue(value) {
    document.getElementById("brightnessValue").textContent = value;
}

// Updates the displayed contrast value
function updateContrastValue(value) {
    document.getElementById("contrastValue").textContent = value;
}

// Updates the displayed saturation value
function updateSaturationValue(value) {
    document.getElementById("saturationValue").textContent = value;
}

// Updates the displayed hue shift value
function updateHueValue(value) {
    document.getElementById("hueValue").textContent = value + "°";
}

// Updates the displayed gamma value
function updateGammaValue(value) {
    document.getElementById("gammaValue").textContent =
        parseFloat(value).toFixed(1);
}

// Updates the displayed exposure value
function updateExposureValue(value) {
    document.getElementById("exposureValue").textContent = value;
}

// Updates the displayed highlights value
function updateHighlightsValue(value) {
    document.getElementById("highlightsValue").textContent = value;
}

// Updates the displayed shadows value
function updateShadowsValue(value) {
    document.getElementById("shadowsValue").textContent = value;
}

// Updates the displayed unsharp mask value
function updateUnsharpMaskValue(value) {
    document.getElementById("unsharpMaskValue").textContent = value;
}

// Toggles visibility of resize controls based on selected resize mode
function toggleResizeControls() {
    const mode = document.getElementById("resizeMode").value;
    document.getElementById("dimensionsControls").classList.add("hidden");
    document.getElementById("percentageControls").classList.add("hidden");
    document.getElementById("presetControls").classList.add("hidden");
    document.getElementById("maxDimensionControls").classList.add("hidden");
    if (mode === "dimensions") {
        document
            .getElementById("dimensionsControls")
            .classList.remove("hidden");
    } else if (mode === "percentage") {
        document
            .getElementById("percentageControls")
            .classList.remove("hidden");
    } else if (mode === "preset") {
        document.getElementById("presetControls").classList.remove("hidden");
    } else if (mode === "maxdimension") {
        document
            .getElementById("maxDimensionControls")
            .classList.remove("hidden");
    }
}

// Resets all conversion options to their default values
function resetOptions() {
    document.getElementById("outputFormat").value = "jpeg";
    document.getElementById("quality").value = 85;
    updateQualityValue(85);
    document.getElementById("webpLossless").checked = false;
    document.getElementById("jpegProgressive").checked = false;
    document.getElementById("jpegOptimize").checked = true;
    document.getElementById("pngCompression").value = 6;
    updatePngCompressionValue(6);
    document.getElementById("resizeMode").value = "none";
    document.getElementById("aspectRatio").value = "preserve";
    document.getElementById("customWidth").value = "";
    document.getElementById("customHeight").value = "";
    document.getElementById("scalePercentage").value = 100;
    updateScaleValue(100);
    document.getElementById("presetSize").value = "thumbnail";
    document.getElementById("maxDimension").value = 1920;
    document.getElementById("resamplingAlgorithm").value = "lanczos";
    toggleResizeControls();
    document.getElementById("rotation").value = 0;
    updateRotationValue(0);
    document.getElementById("flipHorizontal").checked = false;
    document.getElementById("flipVertical").checked = false;
    document.getElementById("skewX").value = 0;
    updateSkewXValue(0);
    document.getElementById("blur").value = 0;
    updateBlurValue(0);
    document.getElementById("sharpen").value = 0;
    updateSharpenValue(0);
    document.getElementById("filterEffect").value = "none";
    document.getElementById("noise").value = 0;
    updateNoiseValue(0);
    document.getElementById("vignette").value = 0;
    updateVignetteValue(0);
    document.getElementById("pixelate").value = 0;
    updatePixelateValue(0);
    document.getElementById("brightness").value = 0;
    updateBrightnessValue(0);
    document.getElementById("contrast").value = 0;
    updateContrastValue(0);
    document.getElementById("saturation").value = 0;
    updateSaturationValue(0);
    document.getElementById("hue").value = 0;
    updateHueValue(0);
    document.getElementById("gamma").value = 1.0;
    updateGammaValue(1.0);
    document.getElementById("exposure").value = 0;
    updateExposureValue(0);
    document.getElementById("highlights").value = 0;
    updateHighlightsValue(0);
    document.getElementById("shadows").value = 0;
    updateShadowsValue(0);
    document.getElementById("colorSpace").value = "srgb";
    document.getElementById("dpi").value = 72;
    document.getElementById("stripMetadata").checked = true;
    document.getElementById("autoOrient").checked = true;
    document.getElementById("chromaSubsampling").value = "4:2:0";
    document.getElementById("unsharpMask").value = 0;
    updateUnsharpMaskValue(0);
    toggleFormatOptions();
}

// Gathers all current conversion settings from the UI
function getConversionSettings() {
    return {
        outputFormat: document.getElementById("outputFormat").value,
        quality: parseInt(document.getElementById("quality").value),
        webpLossless: document.getElementById("webpLossless").checked,
        jpegProgressive: document.getElementById("jpegProgressive").checked,
        jpegOptimize: document.getElementById("jpegOptimize").checked,
        pngCompression: parseInt(
            document.getElementById("pngCompression").value
        ),
        resizeMode: document.getElementById("resizeMode").value,
        aspectRatio: document.getElementById("aspectRatio").value,
        customWidth:
            parseInt(document.getElementById("customWidth").value) || null,
        customHeight:
            parseInt(document.getElementById("customHeight").value) || null,
        scalePercentage: parseInt(
            document.getElementById("scalePercentage").value
        ),
        presetSize: document.getElementById("presetSize").value,
        maxDimension:
            parseInt(document.getElementById("maxDimension").value) || 1920,
        resamplingAlgorithm: document.getElementById("resamplingAlgorithm")
            .value,
        rotation: parseInt(document.getElementById("rotation").value),
        flipHorizontal: document.getElementById("flipHorizontal").checked,
        flipVertical: document.getElementById("flipVertical").checked,
        skewX: parseInt(document.getElementById("skewX").value),
        blur: parseInt(document.getElementById("blur").value),
        sharpen: parseInt(document.getElementById("sharpen").value),
        filterEffect: document.getElementById("filterEffect").value,
        noise: parseInt(document.getElementById("noise").value),
        vignette: parseInt(document.getElementById("vignette").value),
        pixelate: parseInt(document.getElementById("pixelate").value),
        brightness: parseInt(document.getElementById("brightness").value),
        contrast: parseInt(document.getElementById("contrast").value),
        saturation: parseInt(document.getElementById("saturation").value),
        hue: parseInt(document.getElementById("hue").value),
        gamma: parseFloat(document.getElementById("gamma").value),
        exposure: parseInt(document.getElementById("exposure").value),
        highlights: parseInt(document.getElementById("highlights").value),
        shadows: parseInt(document.getElementById("shadows").value),
        colorSpace: document.getElementById("colorSpace").value,
        dpi: parseInt(document.getElementById("dpi").value),
        stripMetadata: document.getElementById("stripMetadata").checked,
        autoOrient: document.getElementById("autoOrient").checked,
        chromaSubsampling: document.getElementById("chromaSubsampling").value,
        unsharpMask: parseInt(document.getElementById("unsharpMask").value),
    };
}

// Returns the MIME type string for a given image format
function getMimeType(format) {
    const mimeTypes = {
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        bmp: "image/bmp",
        gif: "image/gif",
        tiff: "image/tiff",
        avif: "image/avif",
    };
    return mimeTypes[format] || "image/jpeg";
}

// Calculates the image quality for canvas.toBlob based on format and settings
function calculateQuality(settings, format) {
    // PNG, BMP, GIF, TIFF formats do not use quality settings
    if (["png", "bmp", "gif", "tiff"].includes(format)) {
        return 1;
    }
    // WebP lossless compression ignores quality setting
    if (format === "webp" && settings.webpLossless) {
        return 1;
    }
    let quality = settings.quality / 100;
    // Adjust quality for better results at higher settings
    if (quality > 0.95) {
        quality = 0.95;
    } else if (quality > 0.9) {
        quality = quality * 0.95;
    }
    // Ensure quality is within valid range [0.01, 1]
    return Math.max(0.01, Math.min(1, quality));
}

// Calculates the target dimensions for resizing based on selected mode
function calculateDimensions(originalWidth, originalHeight, settings) {
    let width = originalWidth;
    let height = originalHeight;

    if (settings.resizeMode === "dimensions") {
        if (settings.customWidth && settings.customHeight) {
            width = settings.customWidth;
            height = settings.customHeight;
        } else if (settings.customWidth) {
            width = settings.customWidth;
            height = Math.round((originalHeight * width) / originalWidth);
        } else if (settings.customHeight) {
            height = settings.customHeight;
            width = Math.round((originalWidth * height) / originalHeight);
        }
    } else if (settings.resizeMode === "percentage") {
        const scale = settings.scalePercentage / 100;
        width = Math.round(originalWidth * scale);
        height = Math.round(originalHeight * scale);
    } else if (settings.resizeMode === "preset") {
        const presets = {
            thumbnail: [150, 150],
            small: [400, 300],
            medium: [800, 600],
            large: [1200, 900],
            hd: [1920, 1080],
            "4k": [3840, 2160],
        };
        [width, height] = presets[settings.presetSize];
    } else if (settings.resizeMode === "maxdimension") {
        const maxDim = settings.maxDimension;
        if (originalWidth > maxDim || originalHeight > maxDim) {
            if (originalWidth > originalHeight) {
                width = maxDim;
                height = Math.round((originalHeight * maxDim) / originalWidth);
            } else {
                height = maxDim;
                width = Math.round((originalWidth * maxDim) / originalHeight);
            }
        }
    }
    return { width, height };
}

// Draws the image onto the canvas, cropping to fit the target dimensions
function drawImageCropped(ctx, img, dimensions) {
    const sourceAspect = img.width / img.height;
    const targetAspect = dimensions.width / dimensions.height;
    let sourceWidth, sourceHeight, sourceX, sourceY;

    if (sourceAspect > targetAspect) {
        // Original image is wider than target aspect, crop width
        sourceHeight = img.height;
        sourceWidth = img.height * targetAspect;
        sourceX = (img.width - sourceWidth) / 2;
        sourceY = 0;
    } else {
        // Original image is taller than target aspect, crop height
        sourceWidth = img.width;
        sourceHeight = img.width / targetAspect;
        sourceX = 0;
        sourceY = (img.height - sourceHeight) / 2;
    }
    ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        dimensions.width,
        dimensions.height
    );
}

// Draws the image onto the canvas, padding with white to fit target dimensions
function drawImagePadded(ctx, img, dimensions) {
    const sourceAspect = img.width / img.height;
    const targetAspect = dimensions.width / dimensions.height;
    let drawWidth, drawHeight, drawX, drawY;

    if (sourceAspect > targetAspect) {
        // Original image is wider, fit width and pad height
        drawWidth = dimensions.width;
        drawHeight = dimensions.width / sourceAspect;
        drawX = 0;
        drawY = (dimensions.height - drawHeight) / 2;
    } else {
        // Original image is taller, fit height and pad width
        drawHeight = dimensions.height;
        drawWidth = dimensions.height * sourceAspect;
        drawX = (dimensions.width - drawWidth) / 2;
        drawY = 0;
    }
    // Fill background with white before drawing image
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// Applies CSS-like filters (blur, brightness, contrast, saturation, hue-rotate) to the canvas context
function applyCanvasFilters(ctx, settings) {
    const filters = [];
    if (settings.blur > 0) {
        filters.push(`blur(${settings.blur}px)`);
    }
    if (settings.brightness !== 0) {
        const brightness = 1 + settings.brightness / 100;
        filters.push(`brightness(${brightness})`);
    }
    if (settings.contrast !== 0) {
        const contrast = 1 + settings.contrast / 100;
        filters.push(`contrast(${contrast})`);
    }
    if (settings.saturation !== 0) {
        const saturation = 1 + settings.saturation / 100;
        filters.push(`saturate(${saturation})`);
    }
    if (settings.hue !== 0) {
        filters.push(`hue-rotate(${settings.hue}deg)`);
    }
    if (filters.length > 0) {
        ctx.filter = filters.join(" ");
    }
}

// Applies pixel-level filter effects (grayscale, sepia, invert, vintage, emboss, edge detection)
function applyFilterEffect(ctx, canvas, effect) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    switch (effect) {
        case "grayscale":
            for (let i = 0; i < data.length; i += 4) {
                const gray =
                    data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            break;
        case "sepia":
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            }
            break;
        case "invert":
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;
        case "vintage":
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, r * 1.2 + g * 0.3 + b * 0.1);
                data[i + 1] = Math.min(255, r * 0.2 + g * 1.1 + b * 0.2);
                data[i + 2] = Math.min(255, r * 0.1 + g * 0.2 + b * 0.8);
            }
            break;
        case "emboss":
            applyConvolutionFilter(ctx, canvas, [
                [-2, -1, 0],
                [-1, 1, 1],
                [0, 1, 2],
            ]);
            break;
        case "edge":
            applyConvolutionFilter(ctx, canvas, [
                [-1, -1, -1],
                [-1, 8, -1],
                [-1, -1, -1],
            ]);
            break;
    }
    ctx.putImageData(imageData, 0, 0);
}

// Applies a convolution matrix filter to the image data
function applyConvolutionFilter(ctx, canvas, kernel) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    const width = canvas.width;
    const height = canvas.height;
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let r = 0,
                g = 0,
                b = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * width + (x + kx)) * 4;
                    const weight = kernel[ky + 1][kx + 1];
                    r += data[idx] * weight;
                    g += data[idx + 1] * weight;
                    b += data[idx + 2] * weight;
                }
            }
            const idx = (y * width + x) * 4;
            output[idx] = Math.min(255, Math.max(0, r));
            output[idx + 1] = Math.min(255, Math.max(0, g));
            output[idx + 2] = Math.min(255, Math.max(0, b));
        }
    }
    // Copy processed data back to original imageData
    for (let i = 0; i < data.length; i++) {
        data[i] = output[i];
    }
}

// Applies color adjustments like gamma, exposure, highlights, and shadows
function applyColorAdjustments(ctx, canvas, settings) {
    if (
        settings.gamma !== 1.0 ||
        settings.exposure !== 0 ||
        settings.highlights !== 0 ||
        settings.shadows !== 0
    ) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i] / 255;
            let g = data[i + 1] / 255;
            let b = data[i + 2] / 255;

            // Apply gamma correction
            if (settings.gamma !== 1.0) {
                r = Math.pow(r, 1 / settings.gamma);
                g = Math.pow(g, 1 / settings.gamma);
                b = Math.pow(b, 1 / settings.gamma);
            }
            // Apply exposure adjustment
            if (settings.exposure !== 0) {
                const exposureFactor = Math.pow(2, settings.exposure / 100);
                r *= exposureFactor;
                g *= exposureFactor;
                b *= exposureFactor;
            }
            // Apply highlights and shadows adjustments
            if (settings.highlights !== 0 || settings.shadows !== 0) {
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                if (luminance > 0.5 && settings.highlights !== 0) {
                    const factor =
                        1 + (settings.highlights / 100) * (luminance - 0.5) * 2;
                    r *= factor;
                    g *= factor;
                    b *= factor;
                }
                if (luminance < 0.5 && settings.shadows !== 0) {
                    const factor =
                        1 + (settings.shadows / 100) * (0.5 - luminance) * 2;
                    r *= factor;
                    g *= factor;
                    b *= factor;
                }
            }
            data[i] = Math.min(255, Math.max(0, r * 255));
            data[i + 1] = Math.min(255, Math.max(0, g * 255));
            data[i + 2] = Math.min(255, Math.max(0, b * 255));
        }
        ctx.putImageData(imageData, 0, 0);
    }
}

// Applies additional effects like vignette, pixelation, and unsharp mask
function applyAdditionalEffects(ctx, canvas, settings) {
    if (settings.vignette > 0) {
        applyVignette(ctx, canvas, settings.vignette);
    }
    if (settings.pixelate > 0) {
        applyPixelation(ctx, canvas, settings.pixelate);
    }
    if (settings.unsharpMask > 0) {
        applyUnsharpMask(ctx, canvas, settings.unsharpMask);
    }
}

// Applies a vignette effect to the image
function applyVignette(ctx, canvas, intensity) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const vignetteFactor =
                1 - (distance / maxDistance) * (intensity / 100);
            const factor = Math.max(0, vignetteFactor);
            const idx = (y * canvas.width + x) * 4;
            data[idx] *= factor;
            data[idx + 1] *= factor;
            data[idx + 2] *= factor;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

// Applies a pixelation effect to the image
function applyPixelation(ctx, canvas, pixelSize) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
            let r = 0,
                g = 0,
                b = 0,
                a = 0,
                count = 0;
            // Calculate average color of the pixel block
            for (
                let py = y;
                py < Math.min(y + pixelSize, canvas.height);
                py++
            ) {
                for (
                    let px = x;
                    px < Math.min(x + pixelSize, canvas.width);
                    px++
                ) {
                    const idx = (py * canvas.width + px) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    a += data[idx + 3];
                    count++;
                }
            }
            r /= count;
            g /= count;
            b /= count;
            a /= count;
            // Fill the pixel block with the average color
            for (
                let py = y;
                py < Math.min(y + pixelSize, canvas.height);
                py++
            ) {
                for (
                    let px = x;
                    px < Math.min(x + pixelSize, canvas.width);
                    px++
                ) {
                    const idx = (py * canvas.width + px) * 4;
                    output[idx] = r;
                    output[idx + 1] = g;
                    output[idx + 2] = b;
                    output[idx + 3] = a;
                }
            }
        }
    }
    const newImageData = new ImageData(output, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
}

// Applies an unsharp mask filter to enhance image sharpness
function applyUnsharpMask(ctx, canvas, amount) {
    const blurredCanvas = document.createElement("canvas");
    blurredCanvas.width = canvas.width;
    blurredCanvas.height = canvas.height;
    const blurredCtx = blurredCanvas.getContext("2d");
    blurredCtx.filter = "blur(1px)"; // Apply a slight blur to create the mask
    blurredCtx.drawImage(canvas, 0, 0);

    const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const blurredData = blurredCtx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const data = originalData.data;
    const blurred = blurredData.data;
    const factor = amount / 100;

    // Enhance edges by adding a scaled difference between original and blurred images
    for (let i = 0; i < data.length; i += 4) {
        const diffR = data[i] - blurred[i];
        const diffG = data[i + 1] - blurred[i + 1];
        const diffB = data[i + 2] - blurred[i + 2];

        data[i] = Math.min(255, Math.max(0, data[i] + diffR * factor));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + diffG * factor));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + diffB * factor));
    }
    ctx.putImageData(originalData, 0, 0);
}

// Reads a file as a Data URL (base64 encoded string)
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Gets the dimensions (width and height) of an image from its URL
function getImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = url;
    });
}

// Initialize options on page load to ensure consistent state
toggleFormatOptions();
