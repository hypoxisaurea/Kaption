// src/components/Dropdown.tsx

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// 드롭다운에 표시될 항목들의 타입을 정의합니다.
interface DropdownItem {
    id: number;
    label: string;
}

interface DropdownProps {
    items: DropdownItem[];
    placeholder: string;
    value?: number | null; // selected id
    onChange?: (id: number, item: DropdownItem) => void;
}

function Dropdown({ items, placeholder, value = null, onChange }: DropdownProps) {
    // 드롭다운이 열려 있는지 닫혀 있는지 상태를 관리합니다.
    const [isOpen, setIsOpen] = useState(false);
    // 현재 선택된 항목의 상태를 관리합니다.
    const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(
        value != null ? items.find(i => i.id === value) ?? null : null
    );

    // 드롭다운 버튼 클릭 시 상태를 토글하는 함수
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // 항목 선택 시 상태를 업데이트하고 드롭다운을 닫는 함수
    const handleItemClick = (item: DropdownItem) => {
        setSelectedItem(item);
        setIsOpen(false);
        onChange?.(item.id, item);
    };

    return (
        <div className="relative inline-block w-full text-left">
            <div>
                {/* 드롭다운 버튼 */}
                <motion.button
                    type="button"
                    className='inline-flex w-full h-[5vh] items-center justify-between px-4 py-2 text-sm font-spoqa font-normal text-black bg-white border border-text-dark rounded-md focus:outline-none'
                    onClick={toggleDropdown}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span>{selectedItem ? selectedItem.label : placeholder}</span>
                    {/* 체브론 아이콘 */}
                    <motion.span
                        aria-hidden
                        initial={false}
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="ml-2 text-text-dark"
                    >
                        {/* simple chevron */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.span>
                </motion.button>
            </div>

            {/* 드롭다운 목록 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="dropdown-menu"
                        className="absolute z-10 mt-1 w-full origin-top-right rounded-md bg-white font-spoqa font-light ring-1 ring-black/5 shadow-lg focus:outline-none"
                        role="listbox"
                        initial={{ opacity: 0, scale: 0.98, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -4 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                        <div className="py-1" role="none">
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    className="flex cursor-pointer items-center px-4 py-2 text-sm text-text-dark"
                                    role="option"
                                    whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.04)' }}
                                    whileTap={{ scale: 0.995 }}
                                    onClick={() => handleItemClick(item)}
                                >
                                    {item.label}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Dropdown;