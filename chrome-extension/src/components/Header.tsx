// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

function Header() {
    return (
        <header className="flex justify-between items-center p-4 h-20">
            <div className="flex items-center space-x-4">
                <Logo width="1vw" />
                <h1 className="text-xl font-bold font-pretendard">
                    Kaption
                </h1>
            </div>
        </header>
    );
}

export default Header;