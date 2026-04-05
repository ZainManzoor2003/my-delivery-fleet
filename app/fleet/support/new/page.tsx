'use client'
import { useCreateTicket } from '@/app/hooks/useSupport'
import { useUserStore } from '@/app/stores/userStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { SearchableOrderDropdown } from '@/components/ui/searchable-order-dropdown'
import { TicketCategory } from '@/lib/enums/ticketCategory'
import { TicketPriority } from '@/lib/enums/ticketPriority'
import { useGetAllBusinessOrdersForDropdown, useGetOrder } from '@/app/hooks/useOrder'
import { ticketSchema } from '@/validations/ticketValidation'
import { Form, Formik } from 'formik'
import { ArrowLeft, Loader2, MapPin, Store, User2, X, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { useRef, useState } from 'react'
import { Loader } from '@/app/components/loader'
import { s3Service, S3Folder, UploadResult } from '@/services/s3Service'
import { useEffect } from 'react'

export default function NewTicket() {

    const { businessAddress, businessId } = useUserStore();
    const searchParams = useSearchParams()
    const createTicket = useCreateTicket();
    const { data: orders } = useGetAllBusinessOrdersForDropdown(businessId!)
    const [selectedOrderId, setSelectedOrderId] = useState<string>(searchParams.get("orderId") || '')
    const { data: orderData, isLoading: orderLoading } = useGetOrder(selectedOrderId);
    const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set())


    const order = orderData?.order;
    const formikRef = useRef<{ setFieldValue: (field: string, value: any) => void } | null>(null)

    // 2. Add this useEffect after your existing ones
    useEffect(() => {
        if (order?.orderNumber && formikRef.current) {
            formikRef.current.setFieldValue('orderNumber', order.orderNumber)
        }
    }, [order?.orderNumber])

    const router = useRouter()

    // Cleanup orphaned files when component unmounts or user navigates away
    useEffect(() => {
        return () => {
            const cleanupFiles = async () => {
                for (const file of uploadedFiles) {
                    if (file.key) {
                        try {
                            await s3Service.delete({ key: file.key })
                        } catch (error) {
                            console.error('Failed to cleanup file:', error)
                        }
                    }
                }
            }

            // Only cleanup if there are files and we're not in the middle of submission
            if (uploadedFiles.length > 0 && !isUploading) {
                cleanupFiles()
            }
        }
    }, [isUploading, uploadedFiles])

    const handleCreateTicket = async (
        values: {
            subject: string,
            orderNumber: string,
            priority: string,
            category: string,
            description: string,
            attachments: any[]
        },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        if (!businessId) {
            toast.error('User does not have a business associated with their account');
            formikHelpers.setSubmitting(false);
            return;
        }
        try {

            const body = {
                businessId,
                orderId: selectedOrderId,
                orderNumber: values.orderNumber,
                subject: values.subject,
                priority: values.priority as TicketPriority,
                category: values.category as TicketCategory,
                description: values.description,
                attachments: values.attachments
            }

            const result = await createTicket.mutateAsync(body);

            if (result.success) {
                setUploadedFiles([])
                toast.success('Ticket created successfully')
                router.push('/fleet/support');
            } else {
                toast.error('Failed to create order. Please try agaian.')
            }
        } catch (error: any) {
            if (error && error.message) {
                console.error('Error creating ticket:', error);
                toast.error(`Failed to create ticket. ${error.message}`)
            }
        } finally {
            formikHelpers.setSubmitting(false)
        }
    }

    return (
        <div className="py-5 min-h-screen">
            <div className="px-4">
                <div className="flex items-center justify-between flex-wrap">
                    <button
                        className="flex items-center text-md font-medium text-text-sidebar">
                        <ArrowLeft className="h-6 w-6 mr-2 hover:text-text-sidebar/70 cursor-pointer transition-colors"
                            onClick={() => router.push('/fleet/support')} />
                        Back to Support
                    </button>
                </div>
                <div className="py-5">
                    <div className="space-y-1">
                        <h1 className="text-xl font-medium text-text-sidebar">Create a support ticket</h1>
                        <p className="text-md text-text-2 font-normal">Enter details for a new ticket request.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row px-4 gap-6">
                <Formik
                    initialValues={{
                        subject: '',
                        orderNumber: '',
                        priority: TicketPriority.MEDIUM,
                        category: '',
                        description: '',
                        attachments: []
                    }}
                    validationSchema={ticketSchema}
                    onSubmit={handleCreateTicket}
                >
                    {({ values, handleChange, handleSubmit, errors, touched, isSubmitting, setFieldValue }) => {
                        formikRef.current = { setFieldValue }
                        const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
                            const files = event.target.files
                            if (!files || files.length === 0) return

                            setIsUploading(true)

                            try {
                                const uploadPromises = Array.from(files).map(file =>
                                    s3Service.upload({
                                        file,
                                        folder: S3Folder.TICKETS
                                    })
                                )

                                const results = await Promise.all(uploadPromises)
                                const successfulUploads = results.filter(result => result.success)

                                if (successfulUploads.length > 0) {
                                    const formattedAttachments = successfulUploads.map(file => ({
                                        fileName: file.fileName,
                                        fileSize: file.fileSize,
                                        fileUrl: file.url,
                                        type: file.fileType?.startsWith('image/') ? 'IMAGE' : 'PDF'
                                    }))

                                    setUploadedFiles(prev => [...prev, ...successfulUploads])
                                    setFieldValue('attachments', [...values.attachments, ...formattedAttachments])
                                    toast.success(`${successfulUploads.length} file(s) uploaded successfully`)
                                }

                                const failedUploads = results.filter(result => !result.success)
                                if (failedUploads.length > 0) {
                                    toast.error(`${failedUploads.length} file(s) failed to upload`)
                                }
                            } catch (error) {
                                console.error('Upload error:', error)
                                toast.error('Failed to upload files')
                            } finally {
                                setIsUploading(false)
                                // Clear the input
                                event.target.value = ''
                            }
                        }

                        const removeFile = async (index: number) => {
                            const fileToRemove = uploadedFiles[index]

                            setDeletingFiles(prev => new Set(prev).add(index))

                            if (fileToRemove?.key) {
                                try {
                                    await s3Service.delete({ key: fileToRemove.key })
                                } catch (error) {
                                    console.error('Failed to delete file from S3:', error)
                                    toast.error('Failed to delete file from storage')
                                    setDeletingFiles(prev => {
                                        const newSet = new Set(prev)
                                        newSet.delete(index)
                                        return newSet
                                    })
                                    return
                                }
                            }

                            setUploadedFiles(prev => prev.filter((_: any, i: number) => i !== index))
                            setFieldValue('attachments', values.attachments.filter((_: any, i: number) => i !== index))

                            setDeletingFiles(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(index)
                                return newSet
                            })
                        }

                        return (
                            <div className="min-w-0 flex-[1.6] h-fit space-y-6 px-6 py-6 bg-background border border-border rounded-[20px]">
                                <Form onSubmit={handleSubmit} >

                                    <div className="space-y-7">
                                        <h2 className="text-lg font-medium text-text-1 mt-2">Create Ticket</h2>
                                        <div className="grid grid-cols-2 gap-4">

                                            <div className='space-y-1'>
                                                <Label className="text-sm font-medium text-text-2 gap-0">Subject <span className='text-red-500'>*</span></Label>
                                                <Input placeholder="e.g. Jane Doe"
                                                    name='subject'
                                                    className={`h-10 placeholder:text-text-3 active:border-primary
                                                    ${errors.subject && touched.subject ? 'border-red-500' : 'border-border'}`}
                                                    value={values.subject}
                                                    onChange={handleChange}
                                                />
                                                {touched.subject && errors.subject && <span className='text-red-500 text-xs'>{errors.subject}</span>}
                                            </div>
                                            <div className='h-15'>
                                                <SearchableOrderDropdown
                                                    orders={orders}
                                                    value={values.orderNumber}
                                                    onChange={(value, id) => {
                                                        setFieldValue('orderNumber', value)
                                                        setSelectedOrderId(id)
                                                    }}
                                                    disabled={!!searchParams.get("orderId")}
                                                    placeholder="Search or select order..."
                                                    error={errors.orderNumber && touched.orderNumber ? true : false}
                                                />
                                                {touched.orderNumber && errors.orderNumber && <span className='text-red-500 text-xs'>{errors.orderNumber}</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-7">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-text-2 gap-0">Category<span className='text-red-500'>*</span></Label>
                                                    <Select
                                                        value={values.category}
                                                        onValueChange={(value) => {
                                                            setFieldValue('category', value);
                                                        }}
                                                    >
                                                        <SelectTrigger className={`w-full text-text-1 ${errors.category && touched.category ? 'border-red-500' : 'border-border'}`}>
                                                            <SelectValue placeholder="Select Option" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.values(TicketCategory).map((category) => (
                                                                <SelectItem key={category} value={category}>
                                                                    {category}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                        {touched.category && errors.category && <span className='text-red-500 text-xs'>{errors.category}</span>}
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-text-2 gap-0">Description<span className='text-red-500'>*</span></Label>
                                            <Textarea
                                                placeholder="Describe your issue in detail"
                                                name='description'
                                                className={`h-38 p-4 placeholder:text-text-3 active:border-primary ${errors.description && touched.description ? 'border-red-500' : 'border-border'}`}
                                                value={values.description}
                                                onChange={handleChange} />
                                            {touched.description && errors.description && <span className='text-red-500 text-xs'>{errors.description}</span>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-text-2 gap-0">
                                                Attachments (Optional)
                                            </Label>

                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    multiple
                                                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading}
                                                />

                                                <div className={`flex flex-col items-center justify-center rounded-xl border-2 h-34 p-8 transition-colors
                        ${isUploading ? "border-gray-300 bg-gray-50" : "border-gray-200 hover:bg-gray-50"}`}
                                                >
                                                    <div className="flex flex-col items-center text-center space-y-2">
                                                        {isUploading ? (
                                                            <>
                                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                <span className="text-sm font-medium text-text-1">
                                                                    Uploading files...
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-6 w-6 text-text-2" />
                                                                <span className="text-sm font-medium text-text-1">
                                                                    Click to upload files
                                                                </span>
                                                                <span className="text-sm font-normal text-text-2">
                                                                    Images and PDFs accepted (Max 10MB)
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {uploadedFiles.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <p className="text-sm font-medium text-text-1">Uploaded Files:</p>
                                                    <div className="space-y-2">
                                                        {uploadedFiles.map((file, index) => (
                                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-text-1 truncate">
                                                                        {file.fileName}
                                                                    </p>
                                                                    <p className="text-xs text-text-2">
                                                                        {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFile(index)}
                                                                    disabled={deletingFiles.has(index)}
                                                                    className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {deletingFiles.has(index) ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <X className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {errors.attachments && (
                                                <span className='text-red-500 text-xs'>{errors.attachments}</span>
                                            )}
                                        </div>
                                        <div className='flex items-center justify-end gap-4 text-sm'>
                                            <Button
                                                variant='outline'
                                                className="w-24 font-medium h-10"
                                                type="button"
                                                onClick={() => router.push('/fleet/support')}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                disabled={isSubmitting}
                                                className="w-34 font-medium h-10"
                                                type="submit"
                                            >
                                                {isSubmitting ?
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                    : 'Create Ticket'
                                                }
                                            </Button>

                                        </div>
                                    </div>
                                </Form>
                            </div>
                        )
                    }}
                </Formik>


                {orderLoading ?
                    <div className="min-w-0 h-200 flex-[1.2] flex flex-col space-y-4  bg-background border border-border rounded-[20px] px-4 py-4">
                        <Loader
                            label="Fetching Order Details"
                            description="Please wait while we load orders information..."
                        />
                    </div> :
                    <div className="min-w-0 h-fit flex-[1.2] flex flex-col space-y-4  bg-background border border-border rounded-[20px] px-4 py-4">
                        <div className="space-y-6 px-4 py-4">
                            <h2 className="text-lg font-medium text-text-1">Customer Info</h2>
                            <div className="flex gap-4">
                                <MapPin className="h-6 w-6 text-icon" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase text-icon">Delivery Address</p>
                                    <p className="text-md text-text-1 font-normal mt-3">
                                        {order?.deliveryAddress?.address ? order.deliveryAddress.address.length > 50
                                            ? order.deliveryAddress.address.slice(0, 50) + '...' : order.deliveryAddress?.address : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <User2 className="h-6 w-6 text-icon" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase text-icon">Customer</p>
                                    <p className="text-md font-medium text-text-1 mt-3">{order?.customerName || 'N/A'}</p>
                                    <p className="text-sm text-text-2">{order?.customerPhone || 'N/A'}</p>
                                    <p className="text-sm text-text-2">{order?.customerEmail || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Store className="h-6 w-6 text-icon" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase text-icon">Pickup Location</p>
                                    <p className="text-md text-text-1 font-regular mt-3">
                                        {businessAddress?.address ||
                                            'Business Location'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Separator className="bg-border" />
                        <div className="space-y-4 px-4 py-4">
                            <p className="text-lg font-medium text-text-1">Driver Info</p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <Image src="/uber-icon.svg" alt="uber logo" className="bg-black rounded-[3px]"
                                        width={24} height={24} />
                                    <div className="flex-1">
                                        <p className="text-md font-medium text-text-1">{order?.courier?.name || 'N/A'}</p>
                                        <p className="text-md text-text-2">{order?.courier?.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Separator className="bg-border" />
                        <div className="space-y-4 px-4 py-4">
                            <h2 className="text-lg font-medium text-text-1">Delivery Charge Summary</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between font-regular w-full text-sm text-text-2">
                                    <span>Dispatch Fee</span>
                                    <span>${(Number(order?.deliveryFee) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-regular w-full text-sm text-text-2">
                                    <span>Driver Tip</span>
                                    <span>${(Number(order?.driverTip) || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <Separator className="bg-border" />
                            <div className="flex justify-between w-full font-medium text-text-1">
                                <span className="text-lg font-medium text-text-1">Total</span>
                                <span className="text-lg font-medium text-text-1">
                                    ${(Number(order?.totalAmount) || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <p className="flex justify-center items-center text-xs text-text-1 font-normal text-center gap-0">Powered By
                            <Image src="/Uber_Logo.png" alt="uber direact logo" className="-ml-1 cursor-pointer"
                                width={48} height={32} />
                        </p>
                    </div>
                }

            </div>
        </div>
    )
}
