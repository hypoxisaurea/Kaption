// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from 'assets/images/logo/logo.png';
import Menu from 'assets/images/icon/button_menu.png';

function ColorHeader() {
    return (
        <div className="box-border flex items-center justify-between w-full px-10 py-8">
            <div className="flex items-center justify-start flex-grow-0 shrink-0">
                <Link to='/' className='block'>
                    <img src={Logo} className='w-[6vw] h-auto block shrink-0' />
                </Link>
            </div>
            <div className="flex items-center justify-end flex-grow-0 shrink-0">
                <Link to='/my' className='block'>
                    <img src={Menu} className='w-[6.5vw] h-auto block shrink-0' />
                </Link>
            </div>
        </div>
    );
}

export default ColorHeader;