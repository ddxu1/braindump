import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 4C11.5817 4 8 7.58172 8 12C8 13.5 8.5 14.8 9.3 16C9.3 16 8 18 8 20C8 22.2091 9.79086 24 12 24H13C13 25.6569 14.3431 27 16 27C17.6569 27 19 25.6569 19 24H20C22.2091 24 24 22.2091 24 20C24 18 22.7 16 22.7 16C23.5 14.8 24 13.5 24 12C24 7.58172 20.4183 4 16 4Z"
            fill="#8b5cf6"
            stroke="#7c3aed"
            strokeWidth="1"
          />
          <circle cx="13" cy="11" r="1.5" fill="#12091f" />
          <circle cx="19" cy="11" r="1.5" fill="#12091f" />
          <path
            d="M11 14C11 14 12 15 14 15C16 15 17 14 17 14"
            stroke="#12091f"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M18 14C18 14 19 15 21 15"
            stroke="#12091f"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
