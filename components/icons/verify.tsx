interface Props {
    size?: number
}
export function VerifyIcon({ size = 24 }: Props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" width={size} height={size}
            fill="none" stroke="#3194EB" strokeWidth="2">
            <path d="M13.408 16.668s.625 0 1.25 1.333c0 0 1.986-3.333 3.75-4" />
            <path d="M16.943 7.001h.01m-5.01 0h.01m-5.01 0h.01" />
            <path d="M7.892 11.968H5.008a3.004 3.004 0 0 1-3.008-3v-3.97c0-1.657 1.347-3 3.008-3h13.984a3.004 3.004 0 0 1 3.008 3v4.13" />
            <path d="M22 16.001c0-3.314-2.694-6-6.017-6s-6.017 2.686-6.017 6s2.694 6 6.017 6s6.017-2.686 6.017-6Z" /></svg>
    )
}
