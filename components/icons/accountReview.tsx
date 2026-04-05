interface Props {
    size?: number
}
export function AccountReviewIcon({ size = 24 }: Props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" width={size} height={size}
            fill="none" stroke="#3194EB" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 21.5C16.3945 21.5 17.0918 21.5 17.6672 21.3619C19.4955 20.9229 20.9229 19.4955 21.3618 17.6672C21.5 17.0918 21.5 16.3945 21.5 15M9 21.5C7.60547 21.5 6.90821 21.5 6.33277 21.3619C4.50453 20.9229 3.07707 19.4955 2.63815 17.6672C2.5 17.0918 2.5 16.3945 2.5 15M9 2.5C7.60547 2.5 6.90821 2.5 6.33277 2.63815C4.50453 3.07708 3.07707 4.50453 2.63815 6.33278C2.5 6.90821 2.5 7.60548 2.5 9M15 2.5C16.3945 2.5 17.0918 2.5 17.6672 2.63815C19.4955 3.07708 20.9229 4.50453 21.3618 6.33278C21.5 6.90821 21.5 7.60548 21.5 9" stroke="#1877F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 9.5C15 7.84315 13.6569 6.5 12 6.5C10.3431 6.5 9 7.84315 9 9.5C9 11.1569 10.3431 12.5 12 12.5C13.6569 12.5 15 11.1569 15 9.5Z" stroke="#1877F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 17.5C17 14.7386 14.7614 12.5 12 12.5C9.23858 12.5 7 14.7386 7 17.5" stroke="#1877F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

