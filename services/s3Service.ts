export enum S3Folder {
    BUSINESS_LOGOS = 'business-logos',
    USER_AVATARS = 'user-avatars',
    DOCUMENTS = 'documents',
    INVOICES = 'invoices',
    RECEIPTS = 'receipts',
    CONTRACTS = 'contracts',
    REPORTS = 'reports',
    TEMP = 'temp',
    TICKETS = 'tickets',
}

export interface UploadOptions {
    file: File;
    folder: S3Folder;
    metadata?: Record<string, string>;
}

export interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    error?: string;
}

export interface DeleteOptions {
    key?: string;
    url?: string;
}

export interface DeleteResult {
    success: boolean;
    message?: string;
    key?: string;
    error?: string;
}

class S3Service {
    private readonly uploadEndpoint = '/api/s3/upload';
    private readonly deleteEndpoint = '/api/s3/delete';

    async upload(options: UploadOptions): Promise<UploadResult> {
        const { file, folder, metadata = {} } = options;

        try {
            if (!file) {
                return {
                    success: false,
                    error: 'File is required',
                };
            }

            if (!Object.values(S3Folder).includes(folder)) {
                return {
                    success: false,
                    error: 'Invalid folder specified',
                };
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);
            formData.append('metadata', JSON.stringify(metadata));

            const response = await fetch(this.uploadEndpoint, {
                method: 'POST',
                body: formData,
            });

            const result: UploadResult = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Upload failed',
                };
            }

            return result;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to upload file',
            };
        }
    }

    async uploadMultiple(files: UploadOptions[]): Promise<UploadResult[]> {
        if (!files || files.length === 0) {
            return [];
        }

        const uploadPromises = files.map(fileOptions => this.upload(fileOptions));
        return Promise.all(uploadPromises);
    }

    async delete(options: DeleteOptions): Promise<DeleteResult> {
        const { key, url } = options;

        try {
            if (!key && !url) {
                return {
                    success: false,
                    error: 'Either key or url must be provided',
                };
            }

            const params = new URLSearchParams();
            if (key) params.append('key', key);
            if (url) params.append('url', url);

            const response = await fetch(`${this.deleteEndpoint}?${params.toString()}`, {
                method: 'DELETE',
            });

            const result: DeleteResult = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error || 'Delete failed',
                };
            }

            return result;
        } catch (error) {
            console.error('S3 Delete Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete file',
            };
        }
    }

    async deleteMultiple(items: DeleteOptions[]): Promise<DeleteResult[]> {
        if (!items || items.length === 0) {
            return [];
        }

        const deletePromises = items.map(item => this.delete(item));
        return Promise.all(deletePromises);
    }

    extractKeyFromUrl(url: string): string | null {
        try {
            const patterns = [
                /https:\/\/[^.]+\.s3\.[^.]+\.amazonaws\.com\/(.+)/,
                /https:\/\/[^.]+\.s3\.amazonaws\.com\/(.+)/,
                /https:\/\/s3\.[^.]+\.amazonaws\.com\/[^/]+\/(.+)/,
                /https:\/\/s3\.amazonaws\.com\/[^/]+\/(.+)/,
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return decodeURIComponent(match[1]);
                }
            }

            return null;
        } catch (error) {
            console.error('Error extracting key from URL:', error);
            return null;
        }
    }

    isValidFolder(folder: string): folder is S3Folder {
        return Object.values(S3Folder).includes(folder as S3Folder);
    }
}

export const s3Service = new S3Service();

export const isS3Folder = (value: string): value is S3Folder => {
    return Object.values(S3Folder).includes(value as S3Folder);
};
