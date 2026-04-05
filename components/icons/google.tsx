type GoogleIconProps = {
    size?: number
    className?: string
}

export function GoogleIcon({ size = 24, className }: GoogleIconProps) {
    return (
        <svg
            viewBox="0 0 48 48"
            style={{ width: size, height: size, flexShrink: 0 }}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fill="#EA4335" d="M24 9.5c3.1 0 5.7 1.1 7.8 3.2l5.8-5.8C34.1 3.3 29.5 1.5 24 1.5 14.7 1.5 6.9 6.9 3.5 14.8l6.9 5.4C12.1 14.1 17.6 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.6 3-2.4 5.5-5 7.2l7.7 6c4.5-4.2 7.1-10.4 7.1-16.9z" />
            <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6l-6.9-5.4C1.9 17.4 1 20.6 1 24s.9 6.6 2.5 9.6l6.9-5z" />
            <path fill="#34A853" d="M24 46.5c6.5 0 12-2.1 16-5.7l-7.7-6c-2.1 1.4-4.8 2.2-8.3 2.2-6.4 0-11.9-4.3-13.9-10.2l-6.9 5C6.9 41.1 14.7 46.5 24 46.5z" />
        </svg>
    )
}
