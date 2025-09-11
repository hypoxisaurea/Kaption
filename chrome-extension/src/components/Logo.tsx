// src/components/MainLogo.tsx

import React from 'react';
import LogoImage from '../assets/images/logo.png'

interface LogoProps {
    width: string;
}

function Logo({ width }: LogoProps) {
    return (
        <img
            src={LogoImage}
            style={{ width }}
            className="h-auto"
        />
    );
}

export default Logo;