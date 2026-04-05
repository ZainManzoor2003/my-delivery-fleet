import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { S3Folder, UploadResult } from '@/services/s3Service';

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const ALLOWED_TYPES: Record<S3Folder, string[]> = {
    [S3Folder.BUSINESS_LOGOS]: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
    [S3Folder.USER_AVATARS]: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    [S3Folder.DOCUMENTS]: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    [S3Folder.INVOICES]: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    [S3Folder.RECEIPTS]: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    [S3Folder.CONTRACTS]: ['application/pdf'],
    [S3Folder.REPORTS]: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    [S3Folder.TEMP]: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    [S3Folder.TICKETS]: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
};

const MAX_FILE_SIZES: Record<S3Folder, number> = {
    [S3Folder.BUSINESS_LOGOS]: 1024 * 1024, // 1MB
    [S3Folder.USER_AVATARS]: 2 * 1024 * 1024, // 2MB
    [S3Folder.DOCUMENTS]: 10 * 1024 * 1024, // 10MB
    [S3Folder.INVOICES]: 5 * 1024 * 1024, // 5MB
    [S3Folder.RECEIPTS]: 5 * 1024 * 1024, // 5MB
    [S3Folder.CONTRACTS]: 10 * 1024 * 1024, // 10MB
    [S3Folder.REPORTS]: 20 * 1024 * 1024, // 20MB
    [S3Folder.TEMP]: 5 * 1024 * 1024, // 5MB
    [S3Folder.TICKETS]: 10 * 1024 * 1024, // 10MB
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as S3Folder;

        if (!file) {
            const errorResult: UploadResult = {
                success: false,
                error: 'No file provided',
            };
            return NextResponse.json(errorResult, { status: 400 });
        }

        if (!Object.values(S3Folder).includes(folder)) {
            const errorResult: UploadResult = {
                success: false,
                error: 'Invalid folder specified',
            };
            return NextResponse.json(errorResult, { status: 400 });
        }

        const allowedTypes = ALLOWED_TYPES[folder];
        if (!allowedTypes.includes(file.type)) {
            const errorResult: UploadResult = {
                success: false,
                error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            };
            return NextResponse.json(errorResult, { status: 400 });
        }

        const maxSize = MAX_FILE_SIZES[folder];
        if (file.size > maxSize) {
            const errorResult: UploadResult = {
                success: false,
                error: `File size must not exceed ${(maxSize / (1024 * 1024)).toFixed(0)}MB`,
            };
            return NextResponse.json(errorResult, { status: 400 });
        }

        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${folder}/${timestamp}-${randomString}-${sanitizedFileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        const successResult: UploadResult = {
            success: true,
            url: publicUrl,
            key: key,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        };

        return NextResponse.json(successResult);
    } catch (error) {
        console.error('Upload error:', error);
        const errorResult: UploadResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
        return NextResponse.json(errorResult, { status: 500 });
    }
}
