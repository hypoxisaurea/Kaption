// src/components/Logo.tsx

import React from 'react';
import LogoImage from '../assets/logo.png'

interface LogoProps {
    width: string;
}

function Logo({ width }: LogoProps) {
    return (
        <img
            src={LogoImage}
            alt="Kaption"
            className={`w-[${width}] h-auto`}
        />
    );
}

export default Logo;