// src/components/Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from 'assets/images/logo/logo.png';
import Menu from 'assets/images/icon/button_menu.png';

function ColorHeader() {
    return (
        <div className="box-border flex w-full items-center justify-between px-10 py-8">
            <div className="flex shrink-0 grow-0 items-center justify-start">
                <Link to='/option' className='block'>
                    <img src={Logo} alt='Logo' className='block h-auto w-[6vw] shrink-0' />
                </Link>
            </div>
            <div className="flex shrink-0 grow-0 items-center justify-end">
                <Link to='/my' className='block'>
                    <img src={Menu} alt='Menu' className='block h-auto w-[6.5vw] shrink-0' />
                </Link>
            </div>
        </div>
    );
}

export default ColorHeader;