// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from 'components/Logo';

function Header() {
    return (
        <div className="flex items-center justify-center w-full h-[10%] m-[3vh]">
            <Link to='/'>
                <Logo width='7.5%' />
            </Link>
        </div>
    );
}

export default Header;