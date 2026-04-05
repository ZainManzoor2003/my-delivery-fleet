import * as Yup from "yup";

const attachmentSchema = Yup.object({
  fileName: Yup.string().required("File name is required"),
  fileSize: Yup.number().nullable().min(1, "File size must be greater than 0"),
  fileUrl: Yup.string().url("Invalid file URL").required("File URL is required"),
  type: Yup.string().oneOf(["IMAGE", "PDF"], "Invalid attachment type").required("Attachment type is required")
});

export const ticketSchema = Yup.object({
  subject: Yup.string()
    .trim()
    .required("Subject is required")
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject must not exceed 150 characters"),

  orderNumber: Yup.string()
    .trim()
    .required('Order number required')
    .min(2, 'Order number must be at least 2 characters')
    .max(255, 'Order number must not exceed 255 characters'),

  priority: Yup.string()
    .required("Priority is required"),

  category: Yup.string()
    .required("Category is required")
    .min(2, "Category must be at least 2 characters"),

  description: Yup.string()
    .trim()
    .required("Description is required")
    .min(1, "Description must be at least 1 characters")
    .max(1000, "Description must not exceed 1000 characters"),

  attachments: Yup.array()
    .of(attachmentSchema)
    .optional()
    .max(5, "Maximum 5 attachments allowed")
    .test(
      "totalSize",
      "Total attachment size must not exceed 10MB",
      (attachments) => {
        if (!attachments || attachments.length === 0) return true;

        const totalSize = attachments.reduce((sum, attachment) => {
          return sum + (attachment.fileSize || 0);
        }, 0);

        return totalSize <= 10 * 1024 * 1024; // 10MB total
      }
    ),
});
