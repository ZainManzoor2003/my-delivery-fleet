import * as Yup from 'yup'

export const emailSchema = Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required('Email is required');


export const signInSchema = Yup.object({
    email: emailSchema,
    password: Yup.string()
        .trim()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
})

export const signUpSchema = Yup.object({
    firstName: Yup.string()
        .trim()
        .required('First Name is required'),
    lastName: Yup.string()
        .trim()
        .required('Last Name is required'),
    email: Yup.string()
        .trim()
        .email('Enter a valid email address')
        .required('Email is required'),
    phoneNumber: Yup.string().min(14, "Invalid phone number")
        .required("Phone number is required"),
})

export const forgotSchema = Yup.object({
    email: emailSchema
})

export const businessInformationSchema = Yup.object({
    businessName: Yup.string()
        .trim()
        .required('Business name is required')
        .min(2, 'Business name must be at least 2 characters')
        .max(255, 'Business name must not exceed 255 characters'),

    pickupInstructions: Yup.string()
        .trim()
        .notRequired()
        .min(1, 'Pickup instructions must be at least 1 characters')
        .max(255, 'Pickup instructions must not exceed 255 characters'),

    phoneNumber: Yup.string().min(14, "Invalid phone number")
        .required("Customer phone is required"),

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
        .min(3, 'Postal code must be at least 3 digits')
        .max(9, 'Postal code must not exceed 9 digits'),

    address: Yup.string()
        .trim()
        .required('Pickup address is required')
        .min(5, 'Please enter a valid address'),

    avgOrdersPerDay: Yup.string()
        .trim()
        .required('Average orders per day is required')
        .test(
            'is-valid-number',
            'Please enter a valid number',
            (value) => !isNaN(Number(value))
        )
        .test(
            'range',
            'Average orders per day must be 0 or greater',
            (value) => Number(value) >= 0
        )
        .test(
            'max',
            'Average orders per day seems too high',
            (value) => Number(value) <= 10000
        ),

    deliveryRadius: Yup.string()
        .trim()
        .required('Delivery radius is required')
        .test(
            'is-valid-number',
            'Please enter a valid number',
            (value) => !isNaN(Number(value))
        )
        .test(
            'range',
            'Delivery radius must be greater than 0',
            (value) => Number(value) > 0
        )
        .test(
            'max',
            'Delivery radius must not exceed 999.99 miles',
            (value) => Number(value) <= 999.99
        ),

    latitude: Yup.number().required('Latitude is required'),
    longitude: Yup.number().required('Longitude is required'),

    businessType: Yup.string()
        .required('Business type is required'),

    logoUrl: Yup.string().notRequired()
})
export const businessUpdateSchema = Yup.object({
    businessName: Yup.string()
        .trim()
        .required('Business name is required')
        .min(2, 'Business name must be at least 2 characters')
        .max(255, 'Business name must not exceed 255 characters'),

    pickupInstructions: Yup.string()
        .trim()
        .notRequired()
        .min(1, 'Pickup instructions must be at least 1 characters')
        .max(255, 'Pickup instructions must not exceed 255 characters'),

    phoneNumber: Yup.string().min(14, "Invalid phone number")
        .required("Phone number is required"),
})



export const paymentMethodSchema = Yup.object({
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
        .min(3, 'Postal code must be at least 3 digits')
        .max(9, 'Postal code must not exceed 9 digits'),

    address: Yup.string()
        .trim()
        .required('Pickup address is required')
        .min(5, 'Please enter a valid address'),
    latitude: Yup.number().required('Latitude is required'),
    longitude: Yup.number().required('Longitude is required'),
});

export const otpSchema = Yup.object({
    otp: Yup.string()
        .length(6, 'Code must be 6 digits')
        .required('Verification code is required'),
})
