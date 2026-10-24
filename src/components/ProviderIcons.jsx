import React from 'react';

/**
 * Official Paystack Brand Favicon / Symbol
 */
export function PaystackIcon({ size = 20, className = '', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 85"
      width={size}
      height={(size * 85) / 100}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      role="img"
      aria-label="Paystack logo"
    >
      <path
        d="M90.2 2.2H9.8c-2.7 0-5 2.3-5 5.1v9.1c0 2.8 2.3 5.1 5 5.1h80.4c2.8 0 5-2.3 5.1-5.1v-9c0-2.9-2.3-5.2-5.1-5.2zm0 50.5H9.8c-1.3 0-2.6.5-3.5 1.5-1 1-1.5 2.2-1.5 3.6v9.1c0 2.8 2.3 5.1 5 5.1h80.4c2.8 0 5-2.2 5.1-5.1v-9.1c-.1-2.9-2.3-5.1-5.1-5.1zm-35.1 25.2H9.8c-1.3 0-2.6.5-3.5 1.5s-1.5 2.2-1.5 3.6v9.1c0 2.8 2.3 5.1 5 5.1h45.2c2.8 0 5-2.3 5-5v-9.1c.1-3-2.1-5.3-4.9-5.2zm40.2-50.5H9.8c-1.3 0-2.6.5-3.5 1.5s-1.5 2.2-1.5 3.6v9.1c0 2.8 2.3 5.1 5 5.1h85.4c2.8 0 5-2.3 5-5.1v-9.1c.1-2.8-2.2-5-4.9-5.1z"
        fill="#00C3F7"
      />
    </svg>
  );
}

/**
 * Official Flutterwave Brand Favicon / Symbol
 */
export function FlutterwaveIcon({ size = 20, className = '', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 273 242"
      width={size}
      height={(size * 242) / 273}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      role="img"
      aria-label="Flutterwave logo"
    >
      <path
        d="M48.2 79.9c0-9.4 2.7-17.4 8.5-23.1l10 10c-11.1 11.1-1.4 45.6 30.3 77.3s66.2 41.4 77.3 30.3l10 10c-18.8 18.8-61.5 5.4-97.3-30.3C62.2 129.2 48.2 101.1 48.2 79.9z"
        fill="#009A46"
      />
      <path
        d="M111.3 193c-9.4 0-17.4-2.7-23.1-8.5l10-10c11.1 11.1 45.6 1.4 77.3-30.3s41.4-66.2 30.3-77.3l10-10c18.8 18.8 5.4 61.5-30.3 97.3C160.6 179 132.5 193 111.3 193z"
        fill="#FF5805"
      />
      <path
        d="M188.8 139.8c-6.1-17.5-18.5-36.2-34.9-52.6-35.8-35.8-78.5-49.1-97.3-30.3-1.3 1.3-.2 4.7 2.6 7.4s6.1 3.9 7.4 2.6c11.1-11.1 45.6-1.4 77.3 30.3 15 15 26.2 31.8 31.6 47.3 4.7 13.6 4.3 24.6-1.2 30.1-1.3 1.3-.2 4.6 2.6 7.4s6.1 3.9 7.4 2.6C193.8 174.9 195.4 159 188.8 139.8z"
        fill="#F5AFCB"
      />
      <path
        d="M215.8 56.9c-9.6-9.6-25.5-11.3-44.7-4.6c-17.5 6.1-36.2 18.5-52.6 34.9c-35.8 35.8-49.1 78.5-30.3 97.3 1.3 1.3 4.7.2 7.4-2.6s3.9-6.1 2.6-7.4c-11.1-11.1-1.4-45.6 30.3-77.3 15-15 31.8-26.2 47.2-31.6 13.6-4.7 24.6-4.3 30.1 1.2 1.3 1.3 4.6.2 7.4-2.6S217.1 58.2 215.8 56.9z"
        fill="#FF9B00"
      />
    </svg>
  );
}
