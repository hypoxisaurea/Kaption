// src/components/MainLogo.tsx

import React from 'react';
import LogoImage from 'assets/images/logo.png'

interface LogoProps {
    width: string;
    alt?: string;
}

function Logo({ width, alt }: LogoProps) {
    return (
        <img
            src={LogoImage}
            alt={alt ?? 'Logo'}
            style={{ width }}
            className="block h-auto mx-auto"
        />
    );
}

export default Logo;