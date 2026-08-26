/**
 * Client-side browser OCR helper with multiple fallback strategies
 */
export async function extractTextFromImageFile(file: File): Promise<string> {
	if (!file) return '';

	// 1. Read file as Data URL
	const dataUrl = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

	// Strategy 1: Use window.Tesseract if loaded via CDN
	try {
		const win = window as unknown as {
			Tesseract?: {
				recognize: (img: string, lang: string) => Promise<{ data?: { text?: string } }>;
			};
		};
		if (!win.Tesseract) {
			if (!document.getElementById('tesseract-cdn-script')) {
				const script = document.createElement('script');
				script.id = 'tesseract-cdn-script';
				script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
				document.head.appendChild(script);
				await new Promise((resolve) => {
					script.onload = resolve;
					script.onerror = resolve;
					setTimeout(resolve, 3000); // 3s timeout
				});
			}
		}

		if (win.Tesseract && typeof win.Tesseract.recognize === 'function') {
			const res = await win.Tesseract.recognize(dataUrl, 'eng');
			const text = res?.data?.text || '';
			if (text.trim().length > 10) {
				return text;
			}
		}
	} catch (cdnErr) {
		console.warn('CDN Tesseract strategy failed:', cdnErr);
	}

	// Strategy 2: Use bundled npm tesseract.js
	try {
		const tesseractModule = await import('tesseract.js');
		const Tesseract =
			(
				tesseractModule as {
					default?: { recognize: typeof tesseractModule.recognize };
					recognize?: typeof tesseractModule.recognize;
				}
			).default || tesseractModule;

		if (Tesseract && typeof Tesseract.recognize === 'function') {
			const res = await Tesseract.recognize(dataUrl, 'eng');
			const text = res?.data?.text || '';
			if (text.trim().length > 10) {
				return text;
			}
		}
	} catch (npmErr) {
		console.warn('NPM Tesseract strategy failed:', npmErr);
	}

	return '';
}
