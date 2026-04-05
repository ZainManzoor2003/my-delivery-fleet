import * as Yup from "yup";

export const orderSchema = Yup.object({
    orderNumber: Yup.string()
        .trim()
        .notRequired()
        .min(1, 'Order number must be at least 1 characters')
        .max(255, 'Order number must not exceed 255 characters'),

    customerName: Yup.string()
        .trim()
        .required("Customer name is required"),

    phoneNumber: Yup.string().min(14, "Invalid phone number")
        .required("Customer phone is required"),

    customerEmail: Yup.string()
        .email("Invalid email address")
        .notRequired(),

    handoffType: Yup.string()
        .required("Handoff type is required"),

    deliveryInstruction: Yup.string()
        .max(250, "Max 250 characters")
        .optional(),

    customerDeliveryFee: Yup.number()
        .min(0, "Cutomer delivery fee cannot be negative")
        .required("Customer delivery fee is required"),

    customerTip: Yup.number()
        .min(0, "Tip cannot be negative")
        .required("Customer tip is required"),

    driverTip: Yup.number()
        .min(0, "Tip cannot be negative")
        .notRequired(),

    customerSubTotal: Yup.number()
        .typeError('Must be a number')
        .moreThan(0, "Subtotal must be greater than 0")
        .required("Subtotal is required"),

    street: Yup.string()
        .trim()
        .required('Street address is required')
        .min(5, 'Please enter a valid address'),

    apartment: Yup.string()
        .trim()
        .notRequired()
        .min(2, 'Apartment name must be at least 2 characters')
        .max(255, 'Apartment name must not exceed 255 characters'),

    city: Yup.string()
        .trim()
        .required('City is required')
        .min(2, 'City name must be at least 2 characters')
        .max(255, 'City name must not exceed 255 characters'),

    state: Yup.string()
        .trim()
        .required('State is required')
        .min(2, 'State name must be at least 2 characters')
        .max(255, 'State name must not exceed 255 characters'),

    postalCode: Yup.string()
        .trim()
        .required('Postal code is required')
        .matches(/^\d+$/, 'Postal code must contain only digits')
        .min(5, 'Postal code must be at least 5 digits')
        .max(9, 'Postal code must not exceed 9 digits'),

    address: Yup.string()
        .trim()
        .required('Address is required')
        .min(5, 'Please enter a valid address'),
    latitude: Yup.number().required('Latitude is required'),
    longitude: Yup.number().required('Longitude is required'),
    items: Yup.array().of(
        Yup.object().shape({
            name: Yup.string().required("Item name is required"),
            quantity: Yup.number()
                .typeError('Must be number')
                .required("Quantity is required")
                .min(1, "At least 1"),
            unitPrice: Yup.number()
                .typeError('Must be a number')
                .min(0, "Price cannot be negative")
                .notRequired(),
        })
    ).min(1, "Please add at least one item").required("Items are required"),

    deliveryDate: Yup.string()
        .when('deliveryType', {
            is: 'SCHEDULE',
            then: (schema) => schema.required("Delivery date is required"),
            otherwise: (schema) => schema.notRequired(),
        }),

    deliveryTime: Yup.string()
        .when('deliveryType', {
            is: 'SCHEDULE',
            then: (schema) => schema.required("Delivery time is required"),
            otherwise: (schema) => schema.notRequired(),
        }),

    deliveryType: Yup.string().notRequired(),

    isCatering: Yup.boolean()
        .notRequired(),

    containsAlcohol: Yup.boolean()
        .notRequired(),
});
