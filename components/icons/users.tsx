interface UsersIconProps {
    size?: number
    stroke?: string
    isActive?: boolean
}

export function UsersIcon({ size = 24, stroke = '#1877F2', isActive }: UsersIconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" width={size} height={size}
            fill="none" stroke={stroke} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                fill={isActive ? '#1877F2' : ''} />
            <path d="M16 3.128a4 4 0 0 1 0 7.744"
                fill={isActive ? '#1877F2' : ''}
                stroke={isActive ? '#1877F2' : stroke} />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"
                fill={isActive ? '#1877F2' : ''}
                stroke={isActive ? '#1877F2' : stroke} />
            <circle cx="9" cy="7" r="4"
                fill={isActive ? '#1877F2' : ''}
                stroke={isActive ? '#1877F2' : stroke} />
        </svg>
    )
}
