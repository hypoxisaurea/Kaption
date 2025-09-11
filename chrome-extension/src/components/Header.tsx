// src/components/Header.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Logo from './Logo';

function Header() {
    return (
        <header className="flex items-center justify-between h-20 p-4 m-50">
            <div className="flex items-center max-w-full space-x-4">
                <Logo width="20%" />
            </div>
        </header>
    );
}

export default Header;