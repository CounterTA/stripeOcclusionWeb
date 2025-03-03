document.addEventListener('DOMContentLoaded', () => {
    const pasteButton = document.getElementById('pasteButton');
    const imageUpload = document.getElementById('imageUpload');
    const filenameDisplay = document.getElementById('filename-display');
    const originalCanvas = document.getElementById('originalCanvas'); // Keeping original canvas for single original image preview if needed. Consider removing if not used.
    const stripes1Canvas = document.getElementById('stripes1Canvas');
    const stripes2Canvas = document.getElementById('stripes2Canvas');
    const stripes3Canvas = document.getElementById('stripes3Canvas');
    const originalCanvas1 = document.getElementById('originalCanvas1');
    const originalCanvas2 = document.getElementById('originalCanvas2');
    const originalCanvas3 = document.getElementById('originalCanvas3');
    const createAnkiCardsButton = document.getElementById('createAnkiCardsButton');
    const statusMessage = document.getElementById('status-message');
    const stripeColorInput = document.getElementById('stripeColor');
    const stripeWidthPercentInput = document.getElementById('stripeWidthPercent');
    const stripes1CountInput = document.getElementById('stripes1Count');
    const stripes2CountInput = document.getElementById('stripes2Count');
    const stripes3CountInput = document.getElementById('stripes3Count');
    const stripes1Heading = document.getElementById('stripes1Heading');
    const stripes2Heading = document.getElementById('stripes2Heading');
    const stripes3Heading = document.getElementById('stripes3Heading');


    imageUpload.addEventListener('change', handleImageUpload);
    pasteButton.addEventListener('click', handlePasteImage);
    createAnkiCardsButton.addEventListener('click', processImageForAnki);

    let originalImageDataURL = null;
    let stripedImageDataURLs = {};


    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            filenameDisplay.textContent = file.name;
            loadImageFromFile(file);
        } else {
            filenameDisplay.textContent = 'No image loaded';
            clearCanvases();
            resetDataURLs();
        }
    }

    function loadImageFromFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                displayImages(img);
            };
            img.src = e.target.result;
            originalImageDataURL = e.target.result;
            resetStripedDataURLs();
        }
        reader.readAsDataURL(file);
    }

    async function handlePasteImage() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        const imageUrl = URL.createObjectURL(blob);
                        const img = new Image();
                        img.onload = function() {
                            filenameDisplay.textContent = 'Image pasted from clipboard';
                            displayImages(img);
                            URL.revokeObjectURL(imageUrl);
                            blobToDataURL(blob).then(dataURL => {
                                originalImageDataURL = dataURL;
                                resetStripedDataURLs();
                            });
                        };
                        img.src = imageUrl;
                        return;
                    }
                }
            }
            filenameDisplay.textContent = 'No image found in clipboard';
            clearCanvases();
            resetDataURLs();
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            filenameDisplay.textContent = 'Clipboard access failed (see console)';
            clearCanvases();
            resetDataURLs();
        }
    }

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }


    function displayImages(img) {
        displayOriginalImageCopies(img); // Display original image copies first

        const stripeCounts = [
            parseInt(stripes1CountInput.value),
            parseInt(stripes2CountInput.value),
            parseInt(stripes3CountInput.value)
        ];
        const canvases = [stripes1Canvas, stripes2Canvas, stripes3Canvas];
        const headings = [stripes1Heading, stripes2Heading, stripes3Heading];

        for (let i = 0; i < stripeCounts.length; i++) {
            headings[i].textContent = `${stripeCounts[i]} Stripes Card ${i+1}`; // Update heading text
            stripedImageDataURLs[`card${i+1}`] = applyStripes(img, stripeCounts[i], canvases[i]); // Store with card index
        }
    }

    function displayOriginalImageCopies(img) {
        displayOriginalImageOnCanvas(img, originalCanvas1);
        displayOriginalImageOnCanvas(img, originalCanvas2);
        displayOriginalImageOnCanvas(img, originalCanvas3);
    }

    function displayOriginalImageOnCanvas(img, canvas) {
        const ctx = canvas.getContext('2d');
        setCanvasSize(canvas, img);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }


    function displayOriginalImage(img) { // Keep this if you still want a single original image preview, otherwise can remove.
        const ctx = originalCanvas.getContext('2d');
        setCanvasSize(originalCanvas, img);
        ctx.drawImage(img, 0, 0, originalCanvas.width, originalCanvas.height);
    }

    function applyStripes(img, numStripes, canvas) {
        const ctx = canvas.getContext('2d');
        setCanvasSize(canvas, img);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const stripeWidthPercentage = parseFloat(stripeWidthPercentInput.value) / 100;
        let stripeWidth = Math.floor(width * stripeWidthPercentage);
        if (stripeWidth < 1) stripeWidth = 1;
        const stripeColor = stripeColorInput.value;

        const spaceBetweenStripes = Math.floor((width - (numStripes * stripeWidth)) / (numStripes + 1));
        let currentX = spaceBetweenStripes;

        ctx.fillStyle = stripeColor;
        for (let i = 0; i < numStripes; i++) {
            ctx.fillRect(currentX, 0, stripeWidth, height);
            currentX += stripeWidth + spaceBetweenStripes;
        }
        return canvas.toDataURL('image/png');
    }

    function setCanvasSize(canvas, img) {
        canvas.width = img.width;
        canvas.height = img.height;
    }

    function clearCanvases() {
        clearCanvas(originalCanvas);
        clearCanvas(stripes1Canvas);
        clearCanvas(stripes2Canvas);
        clearCanvas(stripes3Canvas);
        clearCanvas(originalCanvas1);
        clearCanvas(originalCanvas2);
        clearCanvas(originalCanvas3);
    }

    function clearCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function resetDataURLs() {
        originalImageDataURL = null;
        resetStripedDataURLs();
    }

    function resetStripedDataURLs() {
        stripedImageDataURLs = {};
    }


    async function processImageForAnki() {
        if (!originalImageDataURL) {
            statusMessage.textContent = "Please load an image first.";
            return;
        }

        statusMessage.textContent = "Creating Anki cards...";
        const stripeCounts = [
            parseInt(stripes1CountInput.value),
            parseInt(stripes2CountInput.value),
            parseInt(stripes3CountInput.value)
        ];
        const cardKeys = ['card1', 'card2', 'card3']; // Keys to match stripedImageDataURLs
        const deckName = "Image Stripes Deck";
        const modelName = "Basic";


        try {
            // 1. Add Original Image to Anki Media (only once)
            const originalFilename = 'original_image.png';
            const originalMediaResponse = await ankiConnectInvoke('storeMediaFile', 6, {
                filename: originalFilename,
                data: dataURLToAnkiBase64(originalImageDataURL)
            });
            if (originalMediaResponse.error) throw originalMediaResponse.error;

            // 2. Add Striped Images to Anki Media and Create Notes (loop through cards)
            for (let i = 0; i < cardKeys.length; i++) {
                const count = stripeCounts[i];
                const cardKey = cardKeys[i];
                if (count <= 0 ) continue; // Skip card creation if stripe count is zero or less

                const stripedFilename = `stripes_${count}_card${i+1}.png`; // Unique filename for each card
                const stripedDataURL = stripedImageDataURLs[cardKey];

                const stripedMediaResponse = await ankiConnectInvoke('storeMediaFile', 6, {
                    filename: stripedFilename,
                    data: dataURLToAnkiBase64(stripedDataURL)
                });
                if (stripedMediaResponse.error) throw stripedMediaResponse.error;


                // 3. Create Anki Note
                const noteResponse = await ankiConnectInvoke('addNote', 6, {
                    note: {
                        deckName: deckName,
                        modelName: modelName,
                        fields: {
                            Front: `<img src="${stripedFilename}">`,
                            Back: `<img src="${originalFilename}">`
                        },
                        options: { allowDuplicate: false, duplicateScope: "deck" },
                        tags: ["image_stripes"]
                    }
                });
                if (noteResponse.error) throw noteResponse.error;
            }


            statusMessage.textContent = "Anki cards created successfully!";

        } catch (error) {
            console.error("AnkiConnect Error:", error);
            statusMessage.textContent = `AnkiConnect Error: ${error.message || error}. See console.`;
        }
    }


    async function ankiConnectInvoke(action, version, params = {}) {
        const requestJson = { action, version, params };
        try {
            const response = await fetch('http://127.0.0.1:8765', {
                method: 'POST',
                body: JSON.stringify(requestJson),
            });
            return await response.json();
        } catch (error) {
            return { error: { message: String(error), type: "network_error" } };
        }
    }


    function dataURLToAnkiBase64(dataURL) {
        const base64 = dataURL.split(',')[1];
        return base64;
    }


});