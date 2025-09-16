// src/components/Dropdown.tsx

import React, { useState } from 'react';

// 드롭다운에 표시될 항목들의 타입을 정의합니다.
interface DropdownItem {
    id: number;
    label: string;
}

interface DropdownProps {
    items: DropdownItem[];
    placeholder: string;
}

function Dropdown({ items, placeholder }: DropdownProps) {
    // 드롭다운이 열려 있는지 닫혀 있는지 상태를 관리합니다.
    const [isOpen, setIsOpen] = useState(false);
    // 현재 선택된 항목의 상태를 관리합니다.
    const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);

    // 드롭다운 버튼 클릭 시 상태를 토글하는 함수
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // 항목 선택 시 상태를 업데이트하고 드롭다운을 닫는 함수
    const handleItemClick = (item: DropdownItem) => {
        setSelectedItem(item);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block w-full text-left">
            <div>
                {/* 드롭다운 버튼 */}
                <button
                    type="button"
                    className="inline-flex w-full justify-between h-[5vh] px-4 py-2 text-sm font-spoqa font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
                    onClick={toggleDropdown}
                >
                    {selectedItem ? selectedItem.label : placeholder}
                </button>
            </div>

            {/* 드롭다운 목록 (isOpen 상태에 따라 조건부 렌더링) */}
            {isOpen && (
                <div
                    className="absolute z-10 w-full mt-1 bg-white shadow-lg origin-top-right rounded-md ring-1 ring-black/5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="block px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                                role="menuitem"
                                onClick={() => handleItemClick(item)}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dropdown;