import {
    initializeImageMagick,
    ImageMagick,
    Magick,
    MagickFormat,
    Percentage,
} from "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.24/+esm";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

// Global state for image files and carousel/wiper indices
let imageFiles = [];
let wiperCurrentIndex = 0;
let carouselCurrentIndex = 0;

/**
 * Initializes the ImageMagick library and sets up the application.
 */
async function main() {
    const uploadText = document.querySelector(".upload-text");
    uploadText.textContent = "Loading ImageMagick Library...";
    console.log("Initializing ImageMagick...");

    // Check if WebAssembly is supported
    if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this browser. Please use a modern browser.');
    }

    try {
        // Use a more robust initialization approach
        const wasmUrl = "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.24/dist/magick.wasm";
        
        // Add timeout and retry logic for WASM loading
        await initializeImageMagickWithRetry(wasmUrl);

        console.log("ImageMagick Initialized Successfully.");
        console.log(Magick.imageMagickVersion);
        console.log("Delegates:", Magick.delegates);

        uploadText.textContent = "Drag & drop image(s) here or click to browse";

        setupEventListeners();
        resetOptions();
    } catch (error) {
        console.error("Failed to initialize ImageMagick:", error);
        
        // Provide more specific error messages based on the error type
        let errorMessage = "Error: Could not load image library.";
        
        if (error.message.includes('timeout')) {
            errorMessage = "Error: Library loading timed out. Please check your internet connection and refresh the page.";
        } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            errorMessage = "Error: CORS policy blocked library loading. Please try a different browser or refresh the page.";
        } else if (error.message.includes('AbortError') || error.message.includes('aborted')) {
            errorMessage = "Error: Library loading was interrupted. Please refresh the page and try again.";
        } else if (error.message.includes('fetch')) {
            errorMessage = "Error: Network error while loading library. Please check your internet connection.";
        }
        
        uploadText.textContent = errorMessage;
        uploadText.parentElement.classList.add(
            "border-red-500/50",
            "text-red-400"
        );
        
        // Add a retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry Loading';
        retryButton.className = 'mt-4 px-4 py-2 bg-white/10 border border-white/30 rounded-lg hover:bg-white/20 transition-colors';
        retryButton.onclick = () => {
            uploadText.parentElement.classList.remove("border-red-500/50", "text-red-400");
            retryButton.remove();
            main();
        };
        uploadText.parentElement.appendChild(retryButton);
    }
}

/**
 * Initialize ImageMagick with retry logic and better error handling
 */
async function initializeImageMagickWithRetry(wasmUrl, maxRetries = 3) {
    const wasmUrls = [
        "https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.24/dist/magick.wasm",
        "https://unpkg.com/@imagemagick/magick-wasm@0.0.24/dist/magick.wasm",
        "https://cdnjs.cloudflare.com/ajax/libs/imagemagick-wasm/0.0.24/magick.wasm",
        "./js/magick.wasm" // Local fallback
    ];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        for (let urlIndex = 0; urlIndex < wasmUrls.length; urlIndex++) {
            const currentUrl = wasmUrls[urlIndex];
            try {
                console.log(`Attempt ${attempt} to initialize ImageMagick from ${currentUrl}...`);
                
                // Set up a timeout for the initialization
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Initialization timeout')), 30000); // 30 second timeout
                });
                
                // Try streaming compilation first, then fallback to non-streaming
                let initPromise;
                try {
                    initPromise = initializeImageMagick(currentUrl);
                    await Promise.race([initPromise, timeoutPromise]);
                } catch (streamingError) {
                    console.warn(`Streaming compilation failed for ${currentUrl}, trying non-streaming approach:`, streamingError);
                    
                    // Fallback: try to disable streaming compilation
                    if (typeof WebAssembly.instantiateStreaming === 'function') {
                        // Temporarily disable streaming compilation
                        const originalInstantiateStreaming = WebAssembly.instantiateStreaming;
                        WebAssembly.instantiateStreaming = async (response, importObject) => {
                            const arrayBuffer = await response.arrayBuffer();
                            return WebAssembly.instantiate(arrayBuffer, importObject);
                        };
                        
                        try {
                            initPromise = initializeImageMagick(currentUrl);
                            await Promise.race([initPromise, timeoutPromise]);
                        } finally {
                            // Restore original function
                            WebAssembly.instantiateStreaming = originalInstantiateStreaming;
                        }
                    } else {
                        throw streamingError;
                    }
                }
                
                console.log(`ImageMagick initialized successfully on attempt ${attempt} from ${currentUrl}`);
                return;
                
            } catch (error) {
                console.error(`Attempt ${attempt} failed with URL ${currentUrl}:`, error);
                
                // If this is the last URL and last attempt, throw the error
                if (urlIndex === wasmUrls.length - 1 && attempt === maxRetries) {
                    throw new Error(`Failed to initialize ImageMagick after ${maxRetries} attempts: ${error.message}`);
                }
                
                // If this is the last URL but not the last attempt, wait before retrying
                if (urlIndex === wasmUrls.length - 1) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    console.log(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }
}

// Initialize the application when the DOM is fully loaded.
document.addEventListener("DOMContentLoaded", main);

function setupEventListeners() {
    // Main action buttons
    document
        .getElementById("convertBtn")
        .addEventListener("click", convertImages);
    document
        .getElementById("resetOptionsBtn")
        .addEventListener("click", resetOptions);
    document
        .getElementById("resetBtn")
        .addEventListener("click", resetConverter);
    document
        .getElementById("downloadSingleBtn")
        .addEventListener("click", downloadSingleImage);
    document
        .getElementById("downloadAllBtn")
        .addEventListener("click", downloadAllImages);
    document
        .getElementById("compareWiperBtn")
        .addEventListener("click", openWiperLightbox);

    // File upload
    const fileInput = document.getElementById("fileInput");
    const uploadArea = document.getElementById("uploadArea");
    uploadArea.addEventListener("click", () => fileInput.click());
    document
        .getElementById("addMoreBtn")
        .addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileSelect);
    uploadArea.addEventListener("dragover", handleDragOver);
    uploadArea.addEventListener("dragleave", handleDragLeave);
    uploadArea.addEventListener("drop", handleDrop);

    // Tab navigation
    document.querySelectorAll(".tab-button").forEach((button) => {
        button.addEventListener("click", (e) =>
            switchTab(e.currentTarget.dataset.tab)
        );
    });

    // Main carousel navigation
    document.getElementById("prevBtn").addEventListener("click", prevSlide);
    document.getElementById("nextBtn").addEventListener("click", nextSlide);

    // Quick rotate buttons
    document.querySelectorAll(".quick-rotate-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
            const degrees = parseInt(e.currentTarget.dataset.degrees);
            rotateQuick(degrees);
        });
    });

    // Wiper lightbox listeners
    document
        .getElementById("wiperLightbox")
        .addEventListener("click", closeWiperLightbox);
    document
        .getElementById("prevWiperBtn")
        .addEventListener("click", showPrevWiperSlide);
    document
        .getElementById("nextWiperBtn")
        .addEventListener("click", showNextWiperSlide);
    document
        .getElementById("downloadWiperImageBtn")
        .addEventListener("click", downloadWiperImage);
    document
        .querySelector("#wiperLightbox #downloadAllWiperBtn")
        .addEventListener("click", downloadAllImages);

    // Input sliders and selects
    document
        .getElementById("outputFormat")
        .addEventListener("change", toggleFormatOptions);
    document
        .getElementById("quality")
        .addEventListener("input", (e) => updateQualityValue(e.target.value));
    document
        .getElementById("webpLossless")
        .addEventListener("change", toggleWebpLossless);
    document
        .getElementById("pngCompression")
        .addEventListener("input", (e) =>
            updatePngCompressionValue(e.target.value)
        );
    document
        .getElementById("resizeMode")
        .addEventListener("change", toggleResizeControls);
    document
        .getElementById("scalePercentage")
        .addEventListener("input", (e) => updateScaleValue(e.target.value));
    document
        .getElementById("rotation")
        .addEventListener("input", (e) => updateRotationValue(e.target.value));
    document
        .getElementById("skewX")
        .addEventListener("input", (e) => updateSkewXValue(e.target.value));
    document
        .getElementById("blur")
        .addEventListener("input", (e) => updateBlurValue(e.target.value));
    document
        .getElementById("sharpen")
        .addEventListener("input", (e) => updateSharpenValue(e.target.value));
    document
        .getElementById("noise")
        .addEventListener("input", (e) => updateNoiseValue(e.target.value));
    document
        .getElementById("vignette")
        .addEventListener("input", (e) => updateVignetteValue(e.target.value));
    document
        .getElementById("pixelate")
        .addEventListener("input", (e) => updatePixelateValue(e.target.value));
    document
        .getElementById("brightness")
        .addEventListener("input", (e) =>
            updateBrightnessValue(e.target.value)
        );
    document
        .getElementById("contrast")
        .addEventListener("input", (e) => updateContrastValue(e.target.value));
    document
        .getElementById("saturation")
        .addEventListener("input", (e) =>
            updateSaturationValue(e.target.value)
        );
    document
        .getElementById("hue")
        .addEventListener("input", (e) => updateHueValue(e.target.value));
    document
        .getElementById("gamma")
        .addEventListener("input", (e) => updateGammaValue(e.target.value));
    document
        .getElementById("exposure")
        .addEventListener("input", (e) => updateExposureValue(e.target.value));
    document
        .getElementById("highlights")
        .addEventListener("input", (e) =>
            updateHighlightsValue(e.target.value)
        );
    document
        .getElementById("shadows")
        .addEventListener("input", (e) => updateShadowsValue(e.target.value));
    document
        .getElementById("unsharpMask")
        .addEventListener("input", (e) =>
            updateUnsharpMaskValue(e.target.value)
        );

    // Initialize Lucide icons
    lucide.createIcons();
}

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

        // Wrap operations in a Promise for async handling
        await new Promise((resolve, reject) => {
            (async () => {
                try {
                    if (fileEntry.originalFile.type === "image/png") {
                        // Process PNGs using Canvas
                        await processPngWithCanvas(fileEntry, settings);
                        updateConvertedImageUI(fileEntry);
                        resolve();
                    } else {
                        // Process other formats using ImageMagick
                        const fileBytes = new Uint8Array(
                            await fileEntry.originalFile.arrayBuffer()
                        );

                        await ImageMagick.read(fileBytes, (image) => {
                            // Apply conversion settings to the image
                            applyMagickSettings(image, settings);

                            const outputFormat = getMagickFormat(
                                settings.outputFormat
                            );

                            image.write(outputFormat, (outputBytes) => {
                                const mimeType = getMimeType(
                                    settings.outputFormat
                                );
                                const blob = new Blob([outputBytes], {
                                    type: mimeType,
                                });

                                fileEntry.convertedBlob = blob;
                                updateConvertedImageUI(fileEntry);

                                resolve();
                            });
                        });
                    }
                } catch (error) {
                    console.error("Image Conversion Error:", error);
                    const infoElement = getInfoElementForFile(fileEntry.id);
                    if (infoElement)
                        infoElement.innerHTML = `<span class="text-red-400">Conversion Failed: ${error.message}</span>`;

                    reject(error);
                } finally {
                    if (loader) loader.classList.add("hidden");
                    convertedCount++;
                    updateProgressBar(convertedCount, imageFiles.length);
                }
            })();
        });
    }

    // Update UI after all images are processed
    hideLoading();
    document.getElementById("downloadSection").classList.remove("hidden");
    const downloadSingleBtn = document.getElementById("downloadSingleBtn");
    const downloadAllBtn = document.getElementById("downloadAllBtn");
    if (imageFiles.length === 1) {
        downloadSingleBtn.classList.remove("hidden");
        downloadAllBtn.classList.add("hidden");
    } else {
        downloadSingleBtn.classList.add("hidden");
        downloadAllBtn.classList.remove("hidden");
    }
    if (imageFiles.some((f) => f.convertedBlob)) {
        document.getElementById("compareWiperBtn").classList.remove("hidden");
    }
}

/**
 * Processes PNG images using the HTML Canvas API.
 * @param {object} fileEntry - The file entry object containing original file and data.
 * @param {object} settings - The conversion settings.
 */
async function processPngWithCanvas(fileEntry, settings) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.save(); // Save the current state

            // Translate to center for rotation/flip
            ctx.translate(canvas.width / 2, canvas.height / 2);

            if (settings.rotation !== 0) {
                ctx.rotate((settings.rotation * Math.PI) / 180);
            }
            if (settings.flipHorizontal) {
                ctx.scale(-1, 1);
            }
            if (settings.flipVertical) {
                ctx.scale(1, -1);
            }

            // Draw the image
            ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);

            ctx.restore(); // Restore the state

            // Apply color filters (simplified for now)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Grayscale
            if (settings.filterEffect === "grayscale") {
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg; // red
                    data[i + 1] = avg; // green
                    data[i + 2] = avg; // blue
                }
            }
            // Invert
            else if (settings.filterEffect === "invert") {
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i]; // red
                    data[i + 1] = 255 - data[i + 1]; // green
                    data[i + 2] = 255 - data[i + 2]; // blue
                }
            }
            // Sepia (simplified)
            else if (settings.filterEffect === "sepia") {
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
            }

            // Apply pixel data back to context
            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    fileEntry.convertedBlob = blob;
                    resolve();
                } else {
                    reject(new Error("Failed to convert canvas to blob."));
                }
            }, "image/png", settings.pngCompression / 9); // PNG compression quality (0-1, 1 is best)
        };
        img.onerror = (e) => reject(new Error("Failed to load image for canvas processing."));
        img.src = URL.createObjectURL(fileEntry.originalFile);
    });
}

/**
 * Applies ImageMagick specific settings to an image.
 * This function is now only called for non-PNG formats.
 */
function applyMagickSettings(image, settings) {
    image.quality = settings.quality;
    // PNG specific settings are now handled by processPngWithCanvas
    // if (settings.outputFormat === "png") {
    //     image.define(
    //         "png:compression-level",
    //         settings.pngCompression.toString()
    //     );
    // }
    if (settings.rotation !== 0) image.rotate(settings.rotation);
    if (settings.flipHorizontal) image.flop();
    if (settings.flipVertical) image.flip();
    if (settings.blur > 0) image.blur(0, settings.blur);
    if (settings.sharpen > 0) image.sharpen(0, settings.sharpen / 10);
    if (settings.filterEffect === "grayscale") image.grayscale();
    if (settings.filterEffect === "sepia") image.sepia(80);
    if (settings.filterEffect === "invert") image.negate();

    // Modulate brightness, saturation, and hue using Percentage objects
    image.modulate(
        new Percentage(100 + settings.brightness),
        new Percentage(100 + settings.saturation),
        new Percentage(100 + settings.hue / 3.6)
    );

    if (settings.stripMetadata) image.strip();
}

function getMagickFormat(formatStr) {
    const formatMap = {
        jpeg: MagickFormat.Jpeg,
        // PNG is now handled by canvas, so it won't use MagickFormat.Png for conversion
        // png: MagickFormat.Png,
        webp: MagickFormat.Webp,
        gif: MagickFormat.Gif,
        bmp: MagickFormat.Bmp,
        tiff: MagickFormat.Tiff,
        avif: MagickFormat.Avif,
    };
    return formatMap[formatStr.toLowerCase()] || MagickFormat.Jpeg;
}

function handleFileSelect(event) {
    processFiles(event.target.files);
    event.target.value = "";
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("border-white/60", "bg-white/5");
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("border-white/60", "bg-white/5");
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("border-white/60", "bg-white/5");
    processFiles(event.dataTransfer.files);
}

function processFiles(files) {
    const validFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
    );
    if (validFiles.length === 0) {
        showError("Please select valid image files.");
        return;
    }
    validFiles.forEach((file) => {
        imageFiles.push({
            originalFile: file,
            convertedBlob: null,
            originalData: null,
            id: `file-${Date.now()}-${Math.random()}`,
        });
    });
    updatePreviewUI();
}

function updatePreviewUI() {
    if (imageFiles.length === 0) return;
    hideError();
    document.getElementById("uploadArea").classList.add("hidden");
    document
        .getElementById("controlsAndPreviewsWrapper")
        .classList.remove("hidden");
    document.getElementById("previewSection").classList.remove("hidden");
    document.getElementById("addMoreBtn").classList.remove("hidden");
    if (imageFiles.length === 1) {
        setupSingleImageView();
        document
            .getElementById("thumbnailPreviewStrip")
            .classList.add("hidden");
    } else {
        setupMultiImageView();
        document
            .getElementById("thumbnailPreviewStrip")
            .classList.remove("hidden");
    }
}

function setupSingleImageView() {
    document.getElementById("multiImageCarouselView").classList.add("hidden");
    document.getElementById("singleImageView").classList.remove("hidden");
    const fileEntry = imageFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            fileEntry.originalData = {
                width: img.width,
                height: img.height,
                size: fileEntry.originalFile.size,
                url: e.target.result,
            };
            document.getElementById("originalPreviewTwoCol").src =
                e.target.result;
            document.getElementById(
                "originalInfoTwoCol"
            ).innerHTML = `<strong>Size:</strong> ${formatFileSize(
                fileEntry.originalFile.size
            )}<br><strong>Dimensions:</strong> ${img.width} × ${img.height}px`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(fileEntry.originalFile);
    document.getElementById("convertedPreviewTwoCol").src = "";
    document.getElementById("convertedInfoTwoCol").innerHTML = "";
}

function setupMultiImageView() {
    document.getElementById("singleImageView").classList.add("hidden");
    document
        .getElementById("multiImageCarouselView")
        .classList.remove("hidden");
    const container = document.getElementById("carouselContainer");
    const thumbnailContainer = document.getElementById("thumbnailPreviewStrip");
    const template = document.getElementById("carouselSlideTemplate");
    container.innerHTML = "";
    thumbnailContainer.innerHTML = "";
    imageFiles.forEach((fileEntry, index) => {
        const slide = template.content.cloneNode(true);
        const slideElement = slide.querySelector(".carousel-slide");
        slideElement.dataset.id = fileEntry.id;
        slideElement.style.display = "none";
        const thumb = document.createElement("img");
        thumb.dataset.id = fileEntry.id;
        thumb.className = "thumbnail-preview";
        thumb.title = `Go to Image ${index + 1}`;
        thumb.onclick = () => showSlide(index);
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgUrl = e.target.result;
            const img = new Image();
            img.onload = () => {
                fileEntry.originalData = {
                    width: img.width,
                    height: img.height,
                    size: fileEntry.originalFile.size,
                    url: imgUrl,
                };
                slideElement.querySelector(".originalPreview").src = imgUrl;
                slideElement.querySelector(
                    ".originalInfo"
                ).innerHTML = `<strong>Size:</strong> ${formatFileSize(
                    fileEntry.originalFile.size
                )}<br><strong>Dimensions:</strong> ${img.width} × ${
                    img.height
                }px`;
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

function showSlide(index) {
    const slides = document.querySelectorAll(
        "#carouselContainer .carousel-slide"
    );
    const thumbnails = document.querySelectorAll(
        "#thumbnailPreviewStrip .thumbnail-preview"
    );
    if (slides.length === 0) return;
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    slides.forEach((slide) => {
        slide.style.display = "none";
        slide.classList.remove("active");
    });
    thumbnails.forEach((thumb) => thumb.classList.remove("active"));
    const activeSlide = slides[index];
    if (activeSlide) {
        activeSlide.style.display = "grid";
        activeSlide.classList.add("active");
    }
    const activeThumb = thumbnails[index];
    if (activeThumb) {
        activeThumb.classList.add("active");
        activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    carouselCurrentIndex = index;
    document.getElementById("carouselCounter").textContent = `Image ${
        index + 1
    } of ${slides.length}`;
}

function nextSlide() {
    showSlide(carouselCurrentIndex + 1);
}
function prevSlide() {
    showSlide(carouselCurrentIndex - 1);
}

function updateConvertedImageUI(fileEntry) {
    const url = URL.createObjectURL(fileEntry.convertedBlob);
    const reduction =
        fileEntry.originalFile.size > fileEntry.convertedBlob.size
            ? `<strong>Reduction:</strong> <span class="text-green-500">${(
                  (1 -
                      fileEntry.convertedBlob.size /
                          fileEntry.originalFile.size) *
                  100
              ).toFixed(1)}% ↓</span>`
            : `<strong>Increase:</strong> <span class="text-red-500">${(
                  (fileEntry.convertedBlob.size / fileEntry.originalFile.size -
                      1) *
                  100
              ).toFixed(1)}% ↑</span>`;
    // Dimensions are assumed to not change unless resize is implemented
    const dimensions = fileEntry.originalData;
    const infoHTML = `<strong>Size:</strong> ${formatFileSize(
        fileEntry.convertedBlob.size
    )}<br><strong>Dimensions:</strong> ${dimensions.width} × ${
        dimensions.height
    }px<br>${reduction}`;
    const imgElement = getImageElementForFile(fileEntry.id);
    const infoElement = getInfoElementForFile(fileEntry.id);
    if (imgElement) imgElement.src = url;
    if (infoElement) infoElement.innerHTML = infoHTML;
}

function getLoaderForFile(fileId) {
    if (imageFiles.length === 1)
        return document.querySelector(".single-card-loader");
    const slide = document.querySelector(
        `.carousel-slide[data-id="${fileId}"]`
    );
    return slide ? slide.querySelector(".card-loader") : null;
}

function getImageElementForFile(fileId) {
    if (imageFiles.length === 1)
        return document.getElementById("convertedPreviewTwoCol");
    const slide = document.querySelector(
        `.carousel-slide[data-id="${fileId}"]`
    );
    return slide ? slide.querySelector(".convertedPreview") : null;
}

function getInfoElementForFile(fileId) {
    if (imageFiles.length === 1)
        return document.getElementById("convertedInfoTwoCol");
    const slide = document.querySelector(
        `.carousel-slide[data-id="${fileId}"]`
    );
    return slide ? slide.querySelector(".convertedInfo") : null;
}

function resetConverter() {
    imageFiles = [];
    document.getElementById("fileInput").value = "";
    document.getElementById("previewSection").classList.add("hidden");
    document.getElementById("singleImageView").classList.add("hidden");
    document.getElementById("multiImageCarouselView").classList.add("hidden");
    document
        .getElementById("controlsAndPreviewsWrapper")
        .classList.add("hidden");
    document.getElementById("downloadSection").classList.add("hidden");
    document.getElementById("addMoreBtn").classList.add("hidden");
    document.getElementById("compareWiperBtn").classList.add("hidden");
    document.getElementById("carouselContainer").innerHTML = "";
    document.getElementById("thumbnailPreviewStrip").innerHTML = "";
    document.getElementById("originalPreviewTwoCol").src = "";
    document.getElementById("originalInfoTwoCol").innerHTML = "";
    document.getElementById("convertedPreviewTwoCol").src = "";
    document.getElementById("convertedInfoTwoCol").innerHTML = "";
    document.getElementById("uploadArea").classList.remove("hidden");
    resetOptions();
    hideError();
}

function showLoading(total) {
    document.getElementById(
        "loadingText"
    ).textContent = `Processing ${total} image(s)...`;
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("convertBtn").disabled = true;
    document.getElementById("convertBtnText").textContent = "Processing...";
}

function hideLoading() {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("convertBtn").disabled = false;
    document.getElementById("convertBtnText").textContent = "Convert Image(s)";
    document.getElementById("progressBar").style.width = "0%";
}

function updateProgressBar(current, total) {
    const percent = total > 0 ? (current / total) * 100 : 0;
    document.getElementById("progressBar").style.width = `${percent}%`;
}

function showError(message) {
    const errorText = document.getElementById("errorText");
    errorText.textContent = message;
    document.getElementById("errorMsg").classList.remove("hidden");
}

function hideError() {
    document.getElementById("errorMsg").classList.add("hidden");
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

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

function openWiperLightbox() {
    const wiperLightbox = document.getElementById("wiperLightbox");
    const carousel = document.getElementById("wiperCarousel");
    carousel.innerHTML = ""; // Clear old content

    const convertedFiles = imageFiles.filter((f) => f.convertedBlob);
    if (convertedFiles.length === 0) {
        showError("No converted images available to compare.");
        return;
    }

    convertedFiles.forEach((fileEntry, index) => {
        const slide = document.createElement("div");
        slide.className = "wiper-slide";
        slide.dataset.index = index;
        slide.style.display = "none"; // Hide by default

        // Dynamically create the wiper HTML for each image
        slide.innerHTML = `
            <div class="wiper-container" style="aspect-ratio: ${
                fileEntry.originalData.width
            } / ${fileEntry.originalData.height}">
                <div class="wiper-content">
                    <img src="${
                        fileEntry.originalData.url
                    }" class="wiper-image" alt="Original Image">
                    <div class="wiper-label original-label rounded-lg">Original</div>
                    <img src="${URL.createObjectURL(
                        fileEntry.convertedBlob
                    )}" class="wiper-image wiper-converted-image" alt="Converted Image">
                    <div class="wiper-label converted-label rounded-lg">Converted</div>
                    <input type="range" min="0" max="100" value="50" class="wiper-slider">
                    <div class="wiper-handle"></div>
                </div>
            </div>
        `;
        carousel.appendChild(slide);
    });

    wiperLightbox.classList.remove("hidden");
    wiperCurrentIndex = 0;
    showWiperSlide(wiperCurrentIndex);
}

function closeWiperLightbox(event) {
    if (event.target.id === "wiperLightbox") {
        document.getElementById("wiperLightbox").classList.add("hidden");
    }
}

function showWiperSlide(index) {
    const slides = document.querySelectorAll("#wiperCarousel .wiper-slide");
    if (slides.length === 0) return;

    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    slides.forEach((s) => (s.style.display = "none"));

    const activeSlide = slides[index];
    if (activeSlide) {
        activeSlide.style.display = "block";
        const slider = activeSlide.querySelector(".wiper-slider");
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
    const container = slider.closest(".wiper-content");
    if (container) {
        container.querySelector(
            ".wiper-converted-image"
        ).style.clipPath = `inset(0 0 0 ${value}%)`;
        container.querySelector(".wiper-handle").style.left = `${value}%`;
    }
}

function showNextWiperSlide() {
    showWiperSlide(wiperCurrentIndex + 1);
}

function showPrevWiperSlide() {
    showWiperSlide(wiperCurrentIndex - 1);
}

function downloadWiperImage() {
    const convertedFiles = imageFiles.filter((f) => f.convertedBlob);
    const currentFile = convertedFiles[wiperCurrentIndex];
    if (currentFile) {
        const outputFormat = document.getElementById("outputFormat").value;
        const baseName = currentFile.originalFile.name.substring(
            0,
            currentFile.originalFile.name.lastIndexOf(".")
        );
        const newName = `${baseName}-converted.${outputFormat}`;
        downloadBlob(currentFile.convertedBlob, newName);
    }
}

function getConversionSettings() {
    return {
        outputFormat: document.getElementById("outputFormat").value,
        quality: parseInt(document.getElementById("quality").value),
        webpLossless: document.getElementById("webpLossless").checked,
        pngCompression: parseInt(
            document.getElementById("pngCompression").value
        ),
        resizeMode: document.getElementById("resizeMode").value,
        rotation: parseInt(document.getElementById("rotation").value),
        flipHorizontal: document.getElementById("flipHorizontal").checked,
        flipVertical: document.getElementById("flipVertical").checked,
        blur: parseInt(document.getElementById("blur").value),
        sharpen: parseInt(document.getElementById("sharpen").value),
        filterEffect: document.getElementById("filterEffect").value,
        brightness: parseInt(document.getElementById("brightness").value),
        saturation: parseInt(document.getElementById("saturation").value),
        hue: parseInt(document.getElementById("hue").value),
        stripMetadata: document.getElementById("stripMetadata").checked,
    };
}

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

// UI value updaters
function updateQualityValue(value) {
    document.getElementById("qualityValue").textContent = value + "%";
}
function updatePngCompressionValue(value) {
    document.getElementById("pngCompressionValue").textContent = value;
}
function updateScaleValue(value) {
    document.getElementById("scaleValue").textContent = value + "%";
}
function updateRotationValue(value) {
    document.getElementById("rotationValue").textContent = value + "°";
}
function updateSkewXValue(value) {
    document.getElementById("skewXValue").textContent = value + "°";
}
function updateBlurValue(value) {
    document.getElementById("blurValue").textContent = value + "px";
}
function updateSharpenValue(value) {
    document.getElementById("sharpenValue").textContent = value;
}
function updateNoiseValue(value) {
    document.getElementById("noiseValue").textContent = value;
}
function updateVignetteValue(value) {
    document.getElementById("vignetteValue").textContent = value;
}
function updatePixelateValue(value) {
    document.getElementById("pixelateValue").textContent = value;
}
function updateBrightnessValue(value) {
    document.getElementById("brightnessValue").textContent = value;
}
function updateContrastValue(value) {
    document.getElementById("contrastValue").textContent = value;
}
function updateSaturationValue(value) {
    document.getElementById("saturationValue").textContent = value;
}
function updateHueValue(value) {
    document.getElementById("hueValue").textContent = value + "°";
}
function updateGammaValue(value) {
    document.getElementById("gammaValue").textContent =
        parseFloat(value).toFixed(1);
}
function updateExposureValue(value) {
    document.getElementById("exposureValue").textContent = value;
}
function updateHighlightsValue(value) {
    document.getElementById("highlightsValue").textContent = value;
}
function updateShadowsValue(value) {
    document.getElementById("shadowsValue").textContent = value;
}
function updateUnsharpMaskValue(value) {
    document.getElementById("unsharpMaskValue").textContent = value;
}
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

function getMimeType(formatStr) {
    const mimeTypes = {
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
        bmp: "image/bmp",
        tiff: "image/tiff",
        avif: "image/avif",
    };
    return mimeTypes[formatStr.toLowerCase()] || "image/jpeg";
}

function rotateQuick(degrees) {
    const rotationSlider = document.getElementById("rotation");
    if (rotationSlider) {
        rotationSlider.value = degrees;
        updateRotationValue(degrees);
    }
}

function switchTab(tabName) {
    document
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));
    document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));

    document
        .querySelector(`.tab-button[data-tab="${tabName}"]`)
        .classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
}
