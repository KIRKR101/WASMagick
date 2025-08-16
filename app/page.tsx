'use client';

import { useState, useEffect, useRef } from 'react';
import { FolderUp, AlertTriangle, ChevronLeft, ChevronRight, Eye, Trash2, Download } from 'lucide-react';
import JSZip from 'jszip';
import { MagickFormat } from '@imagemagick/magick-wasm';
import { convertFileWithMagick } from '../components/converter/converter';

export default function Home() {
    const [activeMainTab, setActiveMainTab] = useState('settings');
    const [activeSettingsTab, setActiveSettingsTab] = useState('format');

    // State for input values
    const [quality, setQuality] = useState(85);
    const [pngCompression, setPngCompression] = useState(6);
    const [webpLossless, setWebpLossless] = useState(false);
    const [jpegProgressive, setJpegProgressive] = useState(false);
    const [jpegOptimize, setJpegOptimize] = useState(true);
    const [scalePercentage, setScalePercentage] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [blur, setBlur] = useState(0);
    const [sharpen, setSharpen] = useState(0);
    const [noise, setNoise] = useState(0);
    const [vignette, setVignette] = useState(0);
    const [pixelate, setPixelate] = useState(0);
    const [filterEffect, setFilterEffect] = useState('none');
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);
    const [hue, setHue] = useState(0);
    const [gamma, setGamma] = useState(1.0);
    const [exposure, setExposure] = useState(0);
    const [highlights, setHighlights] = useState(0);
    const [shadows, setShadows] = useState(0);
    const [flipHorizontal, setFlipHorizontal] = useState(false);
    const [flipVertical, setFlipVertical] = useState(false);
    const [customWidth, setCustomWidth] = useState<number | undefined>();
    const [customHeight, setCustomHeight] = useState<number | undefined>();
    const [presetSize, setPresetSize] = useState('thumbnail');
    const [maxDimension, setMaxDimension] = useState(1920);
    const [aspectRatio, setAspectRatio] = useState('preserve');
    const [resamplingAlgorithm, setResamplingAlgorithm] = useState('lanczos');
    const [outputFormat, setOutputFormat] = useState('jpeg');
    const [resizeMode, setResizeMode] = useState('none');
    const [stripMetadata, setStripMetadata] = useState(true);
    const [autoOrient, setAutoOrient] = useState(true);
    const [wiperLightboxVisible, setWiperLightboxVisible] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [convertedFiles, setConvertedFiles] = useState<Map<string, Blob>>(new Map());
    const [wiperCurrentIndex, setWiperCurrentIndex] = useState(0);
    const wiperSliderRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (imageFiles.length > 0) {
            setActiveMainTab('images');
        }
    }, [imageFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            processFiles(Array.from(files));
        }
        e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-white/60", "bg-white/5");
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-white/60", "bg-white/5");
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-white/60", "bg-white/5");
        processFiles(Array.from(e.dataTransfer.files));
    };

    const processFiles = (files: File[]) => {
        const validFiles = files.filter((file) =>
            file.type.startsWith("image/")
        );
        if (validFiles.length === 0) {
            showError("Please select valid image files.");
            return;
        }
        setImageFiles(prev => [...prev, ...validFiles]);
    };

    const convertImages = async () => {
        if (imageFiles.length === 0) {
            showError("Please upload an image first.");
            return;
        }

        showLoading(imageFiles.length);

        const newConvertedFiles = new Map<string, Blob>();

        const loadImage = (f: File) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Image loading failed'));
            img.src = URL.createObjectURL(f);
        });

        const fmtFromString = (fmt: string): MagickFormat => {
            switch (fmt.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    return MagickFormat.Jpeg;
                case 'png':
                    return MagickFormat.Png;
                case 'webp':
                    return MagickFormat.WebP;
                case 'jxl':
                    return MagickFormat.Jxl;
                case 'gif':
                    return MagickFormat.Gif;
                case 'bmp':
                    return MagickFormat.Bmp;
                case 'tiff':
                    return MagickFormat.Tiff;
                case 'ico':
                    return MagickFormat.Ico;
                case 'svg':
                    return MagickFormat.Svg;
                default:
                    return MagickFormat.Jpeg;
            }
        };
        // All rendering is handled by ImageMagick; no canvas fallback

        for (const file of imageFiles) {
            try {
                const img = await loadImage(file);
                const originalAspectRatio = img.width / img.height;
                let targetWidth = img.width;
                let targetHeight = img.height;

                if (resizeMode !== "none") {
                    if (resizeMode === "dimensions") {
                        // Handle custom dimensions - only calculate what's needed based on aspect mode
                        if (customWidth && customHeight) {
                            targetWidth = customWidth;
                            targetHeight = customHeight;
                        } else if (customWidth && !customHeight) {
                            targetWidth = customWidth;
                            // Only calculate height if we're preserving aspect ratio
                            if (aspectRatio === "preserve" || !aspectRatio) {
                                targetHeight = Math.round(customWidth / originalAspectRatio);
                            } else {
                                targetHeight = img.height; // Keep original height for other modes
                            }
                        } else if (!customWidth && customHeight) {
                            targetHeight = customHeight;
                            // Only calculate width if we're preserving aspect ratio
                            if (aspectRatio === "preserve" || !aspectRatio) {
                                targetWidth = Math.round(customHeight * originalAspectRatio);
                            } else {
                                targetWidth = img.width; // Keep original width for other modes
                            }
                        }
                    } else if (resizeMode === "percentage") {
                        targetWidth = Math.round(img.width * (scalePercentage / 100));
                        targetHeight = Math.round(img.height * (scalePercentage / 100));
                    } else if (resizeMode === "preset") {
                        const presets: { [key: string]: { width: number; height: number } } = {
                            thumbnail: { width: 150, height: 150 },
                            small: { width: 400, height: 300 },
                            medium: { width: 800, height: 600 },
                            large: { width: 1200, height: 900 },
                            hd: { width: 1920, height: 1080 },
                            "4k": { width: 3840, height: 2160 },
                        };
                        const newDims = presets[presetSize];
                        if (newDims) {
                            targetWidth = newDims.width;
                            targetHeight = newDims.height;
                        }
                    } else if (resizeMode === "maxdimension") {
                        if (img.width > maxDimension || img.height > maxDimension) {
                            if (img.width > img.height) {
                                targetWidth = maxDimension;
                                targetHeight = Math.round(
                                    (maxDimension / img.width) * img.height
                                );
                            } else {
                                targetHeight = maxDimension;
                                targetWidth = Math.round(
                                    (maxDimension / img.height) * img.width
                                );
                            }
                        }
                    }
                }

                // Ensure we pass a fresh Blob (some Image objects can hold Blob URLs longer)
                const workingBlob = file.slice(0, file.size, file.type);
                let blob: Blob | null = null;
                // STRICT: Magick only (no canvas fallback) for verification
                blob = await convertFileWithMagick(workingBlob, {
                    format: fmtFromString(outputFormat),
                    quality,
                    // Pass both fit box and aspect handling mode to Magick
                    boxWidth: Math.round(targetWidth),
                    boxHeight: Math.round(targetHeight),
                    width: Math.round(targetWidth),
                    height: Math.round(targetHeight),
                    filter: filterEffect,
                    brightness,
                    contrast,
                    hue,
                    exposure,
                    highlights,
                    shadows,
                    rotation,
                    flip: flipVertical,
                    flop: flipHorizontal,
                    blur,
                    sharpen,
                    noise,
                    vignette,
                    pixelate,
                    saturation,
                    gamma,
                    resample: resamplingAlgorithm as any,
                    stripMetadata,
                    autoOrient,
                    pngCompression,
                    webpLossless,
                    jpegProgressive,
                    jpegOptimize,
                    aspectMode: aspectRatio as any,
                    padColor: { r: 0, g: 0, b: 0, a: 255 },
                });
                newConvertedFiles.set(file.name, blob);
            } catch (err) {
                console.error(`Failed to convert ${file.name}:`, err);
                showError(`Failed to convert ${file.name}`);
            }
        }

        setConvertedFiles(newConvertedFiles);
        hideLoading();
    };

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    const hideError = () => {
        setError(null);
    };

    const showLoading = (total: number) => {
        hideError();
        setLoadingText(`Processing ${total} image(s)...`);
        setIsLoading(true);
    };

    const hideLoading = () => {
        setIsLoading(false);
        setLoadingText('');
    };

    const deleteAllFiles = () => {
        setImageFiles([]);
    };

    const resetConverter = () => {
        setImageFiles([]);
        setActiveMainTab('settings');
        resetOptions();
    };

    const resetOptions = () => {
        setQuality(85);
        setPngCompression(6);
        setScalePercentage(100);
        setRotation(0);
        setBlur(0);
        setSharpen(0);
        setNoise(0);
        setVignette(0);
        setPixelate(0);
        setFilterEffect('none');
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setHue(0);
        setGamma(1.0);
        setExposure(0);
        setHighlights(0);
        setShadows(0);
        setOutputFormat('jpeg');
        setResizeMode('none');
        setAspectRatio('preserve');
        setCustomWidth(undefined);
        setCustomHeight(undefined);
        setPresetSize('thumbnail');
        setMaxDimension(1920);
        setResamplingAlgorithm('lanczos');
        setWebpLossless(false);
        setJpegProgressive(false);
        setJpegOptimize(true);
        setStripMetadata(true);
        setAutoOrient(true);
    };

    const switchMainTab = (tabName: string) => {
        setActiveMainTab(tabName);
    };

    const switchSettingsTab = (tabName: string) => {
        setActiveSettingsTab(tabName);
    };
    
    const quickRotate = (degrees: number) => {
        setRotation(degrees);
    };

    const openWiperLightbox = (index: number) => {
        setWiperCurrentIndex(index);
        setWiperLightboxVisible(true);
    };

    const closeWiperLightbox = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).id === 'wiperLightbox') {
            setWiperLightboxVisible(false);
        }
    };

    const showNextWiperSlide = () => {
        setWiperCurrentIndex(prev => (prev + 1) % imageFiles.length);
    };

    const showPrevWiperSlide = () => {
        setWiperCurrentIndex(prev => (prev - 1 + imageFiles.length) % imageFiles.length);
    };

    const handleWiperSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const container = e.target.closest('.wiper-content');
        if (container) {
            (container.querySelector('.wiper-converted-image') as HTMLElement).style.clipPath = `inset(0 0 0 ${value}%)`;
            (container.querySelector('.wiper-handle') as HTMLElement).style.left = `${value}%`;
        }
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadFile = (fileName: string) => {
        const blob = convertedFiles.get(fileName);
        if (blob) {
            const baseName = fileName.substring(0, fileName.lastIndexOf("."));
            const newName = `${baseName}-converted.${outputFormat}`;
            downloadBlob(blob, newName);
        } else {
            showError("Image not converted yet.");
        }
    };

    const downloadAllImages = async () => {
        if (convertedFiles.size === 0) {
            showError("No converted images to download.");
            return;
        }
        const zip = new JSZip();
        convertedFiles.forEach((blob, fileName) => {
            const baseName = fileName.substring(0, fileName.lastIndexOf("."));
            const newName = `${baseName}-converted.${outputFormat}`;
            zip.file(newName, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, "converted-images.zip");
    };

    const downloadWiperImage = () => {
        const file = imageFiles[wiperCurrentIndex];
        if (file) {
            downloadFile(file.name);
        }
    };

    const ImageRow = ({ file, index, onDelete, onPreview }: { file: File, index: number, onDelete: (fileName: string) => void, onPreview: (index: number) => void }) => {
        const [imageUrl, setImageUrl] = useState<string | null>(null);
        const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null);
        const convertedBlob = convertedFiles.get(file.name);

        useEffect(() => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                setImageUrl(url);
                const img = new Image();
                img.onload = () => {
                    setDimensions({ width: img.width, height: img.height });
                };
                img.src = url;
            };
            reader.readAsDataURL(file);
        }, [file]);

        return (
            <div className="image-row bg-black border border-white/20 rounded-lg p-4">
                <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-4">
                    <div className="flex items-center gap-3 2xl:gap-4 min-w-0 flex-1">
                        {imageUrl && <img className="w-12 h-12 sm:w-16 sm:h-16 rounded-md object-cover flex-shrink-0 original-thumbnail" src={imageUrl} alt="Image Thumbnail" />}
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold file-name text-sm sm:text-base text-white file-name-smart" title={file.name}>{file.name}</p>
                            <p className="text-xs sm:text-sm text-white/60 dimensions">
                                {dimensions ? `${dimensions.width} × ${dimensions.height}px` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between 2xl:justify-end gap-4 2xl:gap-6">
                        <div className="flex items-center gap-3">
                            <div className="text-left 2xl:text-right flex-shrink-0">
                                <p className="font-semibold file-size text-sm sm:text-base text-white">
                                    {convertedBlob ? `${(convertedBlob.size / 1024).toFixed(2)} KB` : `${(file.size / 1024).toFixed(2)} KB`}
                                </p>
                                {convertedBlob && (
                                    <p className={`text-xs sm:text-sm reduction-percentage ${file.size > convertedBlob.size ? 'text-green-400' : 'text-red-400'}`}>
                                        {((1 - convertedBlob.size / file.size) * 100).toFixed(1)}% Reduction
                                    </p>
                                )}
                            </div>
                            <span className="format-tag text-white text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/30 hidden sm:block">{outputFormat.toUpperCase()}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onPreview(index)} className="preview-btn btn border border-white/20 text-white/80 font-medium p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors duration-200 cursor-pointer flex items-center justify-center">
                                <Eye size={18} />
                            </button>
                            <button onClick={() => onDelete(file.name)} className="delete-btn btn border border-white/20 text-white/80 font-medium p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-red-500/20 hover:text-white hover:border-red-500/40 transition-colors duration-200 cursor-pointer flex items-center justify-center">
                                <Trash2 size={18} />
                            </button>
                            <button onClick={() => downloadFile(file.name)} className="download-btn btn bg-green-500/10 border border-green-500/30 text-green-400 font-medium p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-green-500/20 hover:text-white hover:border-green-500/40 transition-colors duration-200 cursor-pointer flex items-center gap-1 sm:gap-2">
                                <Download size={18} />
                                <span className="hidden sm:inline text-sm">Download</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen p-5">
            <div className="container max-w-6xl mx-auto bg-black border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                <header className="text-center p-8 border-b border-white/20">
                    <h1 className="text-5xl font-bold mb-2">WASMagick</h1>
                    <p className="text-lg text-white/60">Image Converter Using Image Magick from WASM</p>
                </header>

                <main className="content p-8">
                    <div id="uploadArea" onClick={() => document.getElementById('fileInput')?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="upload-area border-2 border-dashed border-white/30 rounded-lg p-12 text-center mb-6 transition-all duration-300 cursor-pointer hover:border-white/60 hover:bg-white/5 hover-lift">
                        <div className="upload-icon text-6xl mb-4 pulse-soft"><FolderUp className="mx-auto h-16 w-16" /></div>
                        <div className="upload-text text-xl text-white/70 mb-4">Drag & drop image(s) here or click to browse</div>
                        <input type="file" id="fileInput" className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                    </div>
                    {error && (
                        <div id="errorMsg" className="error bg-red-500/20 text-red-400 p-4 rounded-lg border border-red-500/50 mb-6">
                            <div className="flex items-center">
                                <span className="text-xl mr-3"><AlertTriangle /></span>
                                <span id="errorText">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex border-b border-white/20 mb-8">
                        <button id="settings-main-tab" onClick={() => switchMainTab('settings')} className={`main-tab-button px-6 py-3 text-lg font-semibold border-b-2 transition-colors cursor-pointer ${activeMainTab === 'settings' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white'}`}>Settings</button>
                        <button id="images-main-tab" onClick={() => switchMainTab('images')} className={`main-tab-button px-6 py-3 text-lg font-semibold border-b-2 transition-colors cursor-pointer ${activeMainTab === 'images' ? 'border-white text-white' : 'border-transparent text-white/60 hover:text-white'}`}>Images</button>
                    </div>

                    <div id="main-tab-content">
                        <div id="settings-main-tab-content" className={`main-tab-pane ${activeMainTab === 'settings' ? 'active' : 'hidden'}`}>
                            <div id="controls" className="controls bg-black p-8 rounded-lg border border-white/20">
                                <div className="flex flex-wrap gap-2 mb-6 border-b border-white/20 pb-4">
                                    <button onClick={() => switchSettingsTab('format')} className={`tab-button px-4 py-2 rounded-lg border border-white/30 cursor-pointer ${activeSettingsTab === 'format' ? 'bg-white/10' : ''}`} data-tab="format">Format & Quality</button>
                                    <button onClick={() => switchSettingsTab('resize')} className={`tab-button px-4 py-2 rounded-lg border border-white/30 cursor-pointer ${activeSettingsTab === 'resize' ? 'bg-white/10' : ''}`} data-tab="resize">Resize & Crop</button>
                                    <button onClick={() => switchSettingsTab('transform')} className={`tab-button px-4 py-2 rounded-lg border border-white/30 cursor-pointer ${activeSettingsTab === 'transform' ? 'bg-white/10' : ''}`} data-tab="transform">Transform</button>
                                    <button onClick={() => switchSettingsTab('filters')} className={`tab-button px-4 py-2 rounded-lg border border-white/30 cursor-pointer ${activeSettingsTab === 'filters' ? 'bg-white/10' : ''}`} data-tab="filters">Filters & Effects</button>
                                    <button onClick={() => switchSettingsTab('color')} className={`tab-button px-4 py-2 rounded-lg border border-white/30 cursor-pointer ${activeSettingsTab === 'color' ? 'bg-white/10' : ''}`} data-tab="color">Color Adjustments</button>
                                    <button onClick={() => switchSettingsTab('advanced')} className={`tab-button px-4 py-2 rounded-lg border border-white/30 cursor-pointer ${activeSettingsTab === 'advanced' ? 'bg-white/10' : ''}`} data-tab="advanced">Advanced</button>
                                </div>

                                <div id="format-tab" className={`tab-content ${activeSettingsTab === 'format' ? 'active' : 'hidden'}`}>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="control-group">
                                            <label htmlFor="outputFormat" className="block text-lg font-semibold mb-2">Output Format</label>
                                            <select id="outputFormat" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80 cursor-pointer">
                                                <option value="jpeg">JPEG</option>
                                                <option value="png">PNG</option>
                                                <option value="webp">WebP</option>
                                                <option value="jxl">JPXL</option>
                                                <option value="bmp">BMP</option>
                                                <option value="gif">GIF</option>
                                                <option value="tiff">TIFF</option>
                                                <option value="ico">ICO</option>
                                                <option value="svg">SVG</option>
                                            </select>
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="quality" className="block text-lg font-semibold mb-2">Quality <span id="qualityValue">{quality}%</span></label>
                                            <input type="range" id="quality" className="range-slider w-full cursor-pointer" min="1" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div id="webpOptions" className={`mt-4 ${outputFormat === 'webp' ? '' : 'hidden'}`}>
                                        <label className="flex items-center">
                                            <input type="checkbox" id="webpLossless" className="mr-2 cursor-pointer" checked={webpLossless} onChange={(e) => setWebpLossless(e.target.checked)} />
                                            <span className="text-lg">Lossless Compression (ignores quality setting)</span>
                                        </label>
                                    </div>
                                    <div id="jpegOptions" className={`mt-4 ${outputFormat === 'jpeg' ? '' : 'hidden'}`}>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="control-group">
                                                <label className="flex items-center">
                                                    <input type="checkbox" id="jpegProgressive" className="mr-2 cursor-pointer" checked={jpegProgressive} onChange={(e) => setJpegProgressive(e.target.checked)} />
                                                    <span className="text-lg">Progressive JPEG</span>
                                                </label>
                                            </div>
                                            <div className="control-group">
                                                <label className="flex items-center">
                                                    <input type="checkbox" id="jpegOptimize" className="mr-2 cursor-pointer" checked={jpegOptimize} onChange={(e) => setJpegOptimize(e.target.checked)} />
                                                    <span className="text-lg">Optimize Huffman Tables</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="pngOptions" className={`mt-4 ${outputFormat === 'png' ? '' : 'hidden'}`}>
                                        <div className="control-group">
                                            <label htmlFor="pngCompression" className="block text-lg font-semibold mb-2">Compression Level <span id="pngCompressionValue">{pngCompression}</span></label>
                                            <input type="range" id="pngCompression" className="range-slider w-full cursor-pointer" min="0" max="9" value={pngCompression} onChange={(e) => setPngCompression(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                <div id="resize-tab" className={`tab-content ${activeSettingsTab === 'resize' ? 'active' : 'hidden'}`}>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="control-group">
                                            <label className="block text-lg font-semibold mb-2">Resize Mode</label>
                                            <select id="resizeMode" value={resizeMode} onChange={(e) => setResizeMode(e.target.value)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80 cursor-pointer">
                                                <option value="none">No Resize</option>
                                                <option value="dimensions">Custom Dimensions</option>
                                                <option value="percentage">Percentage</option>
                                                <option value="preset">Preset Sizes</option>
                                                <option value="maxdimension">Max Dimension</option>
                                            </select>
                                        </div>
                                        <div className="control-group">
                                            <label className="block text-lg font-semibold mb-2">Aspect Ratio</label>
                                            <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80 cursor-pointer">
                                                <option value="preserve">Preserve Original</option>
                                                <option value="force">Force New Dimensions</option>
                                                <option value="crop">Crop to Fit</option>
                                                <option value="pad">Pad to Fit</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div id="dimensionsControls" className={`grid md:grid-cols-2 gap-6 mt-4 ${resizeMode === 'dimensions' ? '' : 'hidden'}`}>
                                        <div className="control-group">
                                            <label htmlFor="customWidth" className="block text-lg font-semibold mb-2">Width (px)</label>
                                            <input type="number" id="customWidth" value={customWidth || ''} onChange={(e) => setCustomWidth(parseInt(e.target.value) || undefined)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80" placeholder="Auto" />
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="customHeight" className="block text-lg font-semibold mb-2">Height (px)</label>
                                            <input type="number" id="customHeight" value={customHeight || ''} onChange={(e) => setCustomHeight(parseInt(e.target.value) || undefined)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80" placeholder="Auto" />
                                        </div>
                                    </div>
                                    <div id="percentageControls" className={`mt-4 ${resizeMode === 'percentage' ? '' : 'hidden'}`}>
                                        <label htmlFor="scalePercentage" className="block text-lg font-semibold mb-2">Scale <span id="scaleValue">{scalePercentage}%</span></label>
                                        <input type="range" id="scalePercentage" className="range-slider w-full cursor-pointer" min="10" max="500" value={scalePercentage} onChange={(e) => setScalePercentage(parseInt(e.target.value))} />
                                    </div>
                                    <div id="presetControls" className={`mt-4 ${resizeMode === 'preset' ? '' : 'hidden'}`}>
                                        <label className="block text-lg font-semibold mb-2">Preset Sizes</label>
                                        <select id="presetSize" value={presetSize} onChange={(e) => setPresetSize(e.target.value)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80 cursor-pointer">
                                            <option value="thumbnail">Thumbnail (150x150)</option>
                                            <option value="small">Small (400x300)</option>
                                            <option value="medium">Medium (800x600)</option>
                                            <option value="large">Large (1200x900)</option>
                                            <option value="hd">HD (1920x1080)</option>
                                            <option value="4k">4K (3840x2160)</option>
                                        </select>
                                    </div>
                                    <div id="maxDimensionControls" className={`mt-4 ${resizeMode === 'maxdimension' ? '' : 'hidden'}`}>
                                        <label htmlFor="maxDimension" className="block text-lg font-semibold mb-2">Max Dimension (px)</label>
                                        <input type="number" id="maxDimension" value={maxDimension} onChange={(e) => setMaxDimension(parseInt(e.target.value))} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80" placeholder="1920" />
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-lg font-semibold mb-2">Resampling Algorithm</label>
                                        <select id="resamplingAlgorithm" value={resamplingAlgorithm} onChange={(e) => setResamplingAlgorithm(e.target.value)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80 cursor-pointer">
                                            <option value="lanczos">Lanczos (High Quality)</option>
                                            <option value="bicubic">Bicubic</option>
                                            <option value="bilinear">Bilinear (Fast)</option>
                                            <option value="nearest">Nearest Neighbor</option>
                                        </select>
                                    </div>
                                </div>

                                <div id="transform-tab" className={`tab-content ${activeSettingsTab === 'transform' ? 'active' : 'hidden'}`}>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="control-group">
                                            <label htmlFor="rotation" className="block text-lg font-semibold mb-2">Rotation <span id="rotationValue">{rotation}°</span></label>
                                            <input type="range" id="rotation" className="range-slider w-full cursor-pointer" min="0" max="360" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} />
                                        </div>
                                        <div className="control-group">
                                            <label className="block text-lg font-semibold mb-2">Quick Rotate</label>
                                            <div className="flex gap-2">
                                                <button onClick={() => quickRotate(90)} className="btn bg-black text-white py-2 px-4 rounded border border-white/30 hover:bg-white/10 quick-rotate-btn cursor-pointer" data-degrees="90">90°</button>
                                                <button onClick={() => quickRotate(180)} className="btn bg-black text-white py-2 px-4 rounded border border-white/30 hover:bg-white/10 quick-rotate-btn cursor-pointer" data-degrees="180">180°</button>
                                                <button onClick={() => quickRotate(270)} className="btn bg-black text-white py-2 px-4 rounded border border-white/30 hover:bg-white/10 quick-rotate-btn cursor-pointer" data-degrees="270">270°</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        <div className="control-group">
                                            <label className="block text-lg font-semibold mb-2">Flip</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center">
                                                    <input type="checkbox" id="flipHorizontal" className="mr-2 cursor-pointer" checked={flipHorizontal} onChange={(e) => setFlipHorizontal(e.target.checked)} />
                                                    Horizontal
                                                </label>
                                                <label className="flex items-center">
                                                    <input type="checkbox" id="flipVertical" className="mr-2 cursor-pointer" checked={flipVertical} onChange={(e) => setFlipVertical(e.target.checked)} />
                                                    Vertical
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="filters-tab" className={`tab-content ${activeSettingsTab === 'filters' ? 'active' : 'hidden'}`}>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="control-group">
                                            <label htmlFor="blur" className="block text-lg font-semibold mb-2">Blur <span id="blurValue">{blur}px</span></label>
                                            <input type="range" id="blur" className="range-slider w-full cursor-pointer" min="0" max="20" value={blur} onChange={(e) => setBlur(parseInt(e.target.value))} />
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="sharpen" className="block text-lg font-semibold mb-2">Sharpen <span id="sharpenValue">{sharpen}</span></label>
                                            <input type="range" id="sharpen" className="range-slider w-full cursor-pointer" min="0" max="100" value={sharpen} onChange={(e) => setSharpen(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        <div className="control-group">
                                            <label className="block text-lg font-semibold mb-2">Filter Effects</label>
                                            <select id="filterEffect" value={filterEffect} onChange={(e) => setFilterEffect(e.target.value)} className="w-full bg-black border border-white/30 rounded-lg p-3 focus:outline-none focus:border-white/80 cursor-pointer">
                                                <option value="none">None</option>
                                                <option value="grayscale">Grayscale</option>
                                                <option value="sepia">Sepia</option>
                                                <option value="invert">Invert</option>
                                                <option value="vintage">Vintage</option>
                                            </select>
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="noise" className="block text-lg font-semibold mb-2">Noise Reduction <span id="noiseValue">{noise}</span></label>
                                            <input type="range" id="noise" className="range-slider w-full cursor-pointer" min="0" max="100" value={noise} onChange={(e) => setNoise(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        <div className="control-group">
                                            <label htmlFor="vignette" className="block text-lg font-semibold mb-2">Vignette <span id="vignetteValue">{vignette}</span></label>
                                            <input type="range" id="vignette" className="range-slider w-full cursor-pointer" min="0" max="100" value={vignette} onChange={(e) => setVignette(parseInt(e.target.value))} />
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="pixelate" className="block text-lg font-semibold mb-2">Pixelate <span id="pixelateValue">{pixelate}</span></label>
                                            <input type="range" id="pixelate" className="range-slider w-full cursor-pointer" min="0" max="20" value={pixelate} onChange={(e) => setPixelate(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                <div id="color-tab" className={`tab-content ${activeSettingsTab === 'color' ? 'active' : 'hidden'}`}>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="control-group">
                                            <label htmlFor="brightness" className="block text-lg font-semibold mb-2">Brightness <span id="brightnessValue">{brightness}</span></label>
                                            <input type="range" id="brightness" className="range-slider w-full cursor-pointer" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} />
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="contrast" className="block text-lg font-semibold mb-2">Contrast <span id="contrastValue">{contrast}</span></label>
                                            <input type="range" id="contrast" className="range-slider w-full cursor-pointer" min="-100" max="100" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        <div className="control-group">
                                            <label htmlFor="saturation" className="block text-lg font-semibold mb-2">Saturation <span id="saturationValue">{saturation}</span></label>
                                            <input type="range" id="saturation" className="range-slider w-full cursor-pointer" min="-100" max="100" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} />
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="hue" className="block text-lg font-semibold mb-2">Hue Shift <span id="hueValue">{hue}°</span></label>
                                            <input type="range" id="hue" className="range-slider w-full cursor-pointer" min="0" max="360" value={hue} onChange={(e) => setHue(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        <div className="control-group">
                                            <label htmlFor="gamma" className="block text-lg font-semibold mb-2">Gamma <span id="gammaValue">{gamma.toFixed(1)}</span></label>
                                            <input type="range" id="gamma" className="range-slider w-full cursor-pointer" min="0.1" max="3.0" step="0.1" value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} />
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="exposure" className="block text-lg font-semibold mb-2">Exposure <span id="exposureValue">{exposure}</span></label>
                                            <input type="range" id="exposure" className="range-slider w-full cursor-pointer" min="-200" max="200" value={exposure} onChange={(e) => setExposure(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        <div className="control-group">
                                            <label htmlFor="highlights" className="block text-lg font-semibold mb-2">Highlights <span id="highlightsValue">{highlights}</span></label>
                                            <input type="range" id="highlights" className="range-slider w-full cursor-pointer" min="-100" max="100" value={highlights} onChange={(e) => setHighlights(parseInt(e.target.value))} />
                                        </div>
                                        <div className="control-group">
                                            <label htmlFor="shadows" className="block text-lg font-semibold mb-2">Shadows <span id="shadowsValue">{shadows}</span></label>
                                            <input type="range" id="shadows" className="range-slider w-full cursor-pointer" min="-100" max="100" value={shadows} onChange={(e) => setShadows(parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </div>

                                <div id="advanced-tab" className={`tab-content ${activeSettingsTab === 'advanced' ? 'active' : 'hidden'}`}>
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        <div className="control-group">
                                            <label className="flex items-center">
                                                <input type="checkbox" id="stripMetadata" className="mr-2 cursor-pointer" checked={stripMetadata} onChange={(e) => setStripMetadata(e.target.checked)} />
                                                <span className="text-lg">Strip EXIF/Metadata</span>
                                            </label>
                                        </div>
                                        <div className="control-group">
                                            <label className="flex items-center">
                                                <input type="checkbox" id="autoOrient" className="mr-2 cursor-pointer" checked={autoOrient} onChange={(e) => setAutoOrient(e.target.checked)} />
                                                <span className="text-lg">Auto-Orient from EXIF</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/20">
                                    <div className="flex gap-4">
                                        <button id="resetOptionsBtn" onClick={resetOptions} className="btn bg-black text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-white/30 hover:bg-white/10 focus:outline-none focus:border-white/80 cursor-pointer">
                                            Reset Options
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="images-main-tab-content" className={`main-tab-pane ${activeMainTab === 'images' ? '' : 'hidden'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-3xl font-bold">Images</h2>
                                    <p className="text-white/60">Optimised images ready for download.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button id="deleteAllBtn" onClick={deleteAllFiles} className="btn bg-black text-white font-bold py-2 px-4 rounded-lg border border-white/30 hover:bg-white/10 cursor-pointer">Delete All</button>
                                    <button id="downloadAllBtn" onClick={downloadAllImages} className="btn bg-black text-white font-bold py-2 px-4 rounded-lg border border-white/30 hover:bg-white/10 cursor-pointer">Download All</button>
                                </div>
                            </div>
                            <div id="image-list" className="space-y-4">
                                {imageFiles.map((file, index) => (
                                    <ImageRow key={index} file={file} index={index} onDelete={(fileName) => setImageFiles(files => files.filter(f => f.name !== fileName))} onPreview={openWiperLightbox} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/20">
                        <div className="flex gap-4">
                            <button id="convertBtn" onClick={convertImages} disabled={isLoading} className="btn flex-1 bg-black text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-white/30 hover:bg-white/10 focus:outline-none focus:border-white/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                <span id="convertBtnText">{isLoading ? 'Processing...' : 'Convert Image(s)'}</span>
                            </button>
                            <button id="resetBtn" onClick={resetConverter} className="btn bg-black text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-white/30 hover:bg-white/10 focus:outline-none focus:border-white/80 cursor-pointer">
                                Start Over
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {wiperLightboxVisible && imageFiles[wiperCurrentIndex] && (
                <div id="wiperLightbox" onClick={closeWiperLightbox} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="relative w-full max-w-6xl">
                        <div id="wiperCarousel" className="relative">
                            <div className="wiper-slide" style={{ display: 'block' }}>
                                <div className="wiper-container">
                                    <div className="wiper-content">
                                        <img src={URL.createObjectURL(imageFiles[wiperCurrentIndex])} className="wiper-image" alt="Original Image" />
                                        <div className="wiper-label original-label rounded-lg">Original</div>
                                        {convertedFiles.has(imageFiles[wiperCurrentIndex].name) ? (
                                            <img src={URL.createObjectURL(convertedFiles.get(imageFiles[wiperCurrentIndex].name)!)} className="wiper-image wiper-converted-image" alt="Converted Image" />
                                        ) : (
                                            <div className="wiper-image wiper-converted-image flex items-center justify-center bg-black text-white">Not Converted Yet</div>
                                        )}
                                        <div className="wiper-label converted-label rounded-lg">Converted</div>
                                        <input ref={wiperSliderRef} type="range" min="0" max="100" defaultValue="50" className="wiper-slider" onInput={handleWiperSlider} />
                                        <div className="wiper-handle"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button id="prevWiperBtn" onClick={showPrevWiperSlide} className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-full text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition z-10 cursor-pointer"><ChevronLeft size={32} /></button>
                        <button id="nextWiperBtn" onClick={showNextWiperSlide} className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-full text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition z-10 cursor-pointer"><ChevronRight size={32} /></button>
                        <div className="absolute bg-black py-2 px-4 border border-white/20 rounded-lg -bottom-4 left-1/2 -translate-x-1/2 translate-y-full flex gap-4 mt-4">
                            <button id="downloadWiperImageBtn" onClick={downloadWiperImage} className="btn bg-black text-white font-bold py-2 px-4 rounded-md border border-white/30 hover:bg-white/10 cursor-pointer">Download this Image</button>
                            <button id="downloadAllWiperBtn" onClick={downloadAllImages} className="btn bg-black text-white font-bold py-2 px-4 rounded-md border border-white/30 hover:bg-white/10 cursor-pointer">Download All (.zip)</button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && (
                <div id="loading" className="loading text-center p-6 fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <div className="spinner w-12 h-12 border-4 border-t-white/80 border-white/20 rounded-full mx-auto mb-4 animate-spin"></div>
                    <p id="loadingText" className="text-white/70 mb-4">{loadingText}</p>
                    <div className="w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
                        <div id="progressBar" className="progress-bar h-full bg-white/60 rounded-full"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
