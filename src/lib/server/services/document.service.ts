import { getDb } from '$lib/server/db';
import { receiptDocuments } from '$lib/server/db/schema';
import { getOrSeedExpenseCategories, autoCategorizeExpense } from '$lib/server/categories';
import { performDocumentOcr } from '$lib/server/ocr';
import type { ParsedOcrResult } from '$lib/types';

export class DocumentProcessingService {
	constructor(
		private d1?: D1Database,
		private r2?: R2Bucket
	) {}

	async processScan(
		tenant: App.Locals['tenant'],
		fileBuffer: ArrayBuffer,
		fileName: string,
		mimeType: string,
		documentType: string,
		rawTextPrompt?: string
	): Promise<{ fileUrl: string; fileName: string; parsedData: ParsedOcrResult }> {
		if (!tenant) throw new Error('Unauthenticated tenant context');

		let storedUrl = `/uploads/${fileName}`;
		if (this.r2) {
			await this.r2.put(fileName, fileBuffer, {
				httpMetadata: { contentType: mimeType || 'image/jpeg' }
			});
			storedUrl = `r2://${fileName}`;
		}

		const extractedData: ParsedOcrResult = await performDocumentOcr(
			fileBuffer,
			fileName,
			documentType,
			rawTextPrompt || ''
		);

		if (this.d1) {
			const db = getDb(this.d1);
			const categoriesList = await getOrSeedExpenseCategories(
				db,
				tenant.activeHouseholdId,
				tenant.userId
			);

			if (categoriesList.length > 0) {
				const matched = autoCategorizeExpense(
					extractedData.vendor || '',
					extractedData.rawText || '',
					categoriesList
				);
				if (matched) {
					extractedData.category = matched.slug;
					extractedData.categoryName = matched.name;
				} else {
					extractedData.category = null;
					extractedData.categoryName = null;
				}
			}

			try {
				await db.insert(receiptDocuments).values({
					userId: tenant.userId,
					householdId: tenant.activeHouseholdId,
					fileName,
					fileUrl: storedUrl,
					mimeType: mimeType || 'image/jpeg',
					status: 'completed',
					parsedData: JSON.stringify(extractedData)
				});
			} catch (logErr) {
				console.warn('Failed to log receipt document in DB:', logErr);
			}
		}

		return {
			fileUrl: storedUrl,
			fileName,
			parsedData: extractedData
		};
	}
}
