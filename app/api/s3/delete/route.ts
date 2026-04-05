import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { DeleteResult, s3Service } from '@/services/s3Service';

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');
        const url = searchParams.get('url');

        if (!key && !url) {
            const errorResult: DeleteResult = {
                success: false,
                error: 'No key or URL provided',
            };
            return NextResponse.json(errorResult, { status: 400 });
        }

        let fileKey = key;
        if (url && !key) {
            fileKey = s3Service.extractKeyFromUrl(url);
            if (!fileKey) {
                const errorResult: DeleteResult = {
                    success: false,
                    error: 'Invalid S3 URL',
                };
                return NextResponse.json(errorResult, { status: 400 });
            }
        }

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: fileKey!,
        });

        await s3Client.send(command);

        const successResult: DeleteResult = {
            success: true,
            message: 'File deleted successfully',
            key: fileKey!,
        };

        return NextResponse.json(successResult);
    } catch (error) {
        const errorResult: DeleteResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
        return NextResponse.json(errorResult, { status: 500 });
    }
}
