// src/components/OptionPage/TagSelector.tsx

import React, { useState } from 'react';

// 태그 아이템의 타입을 정의합니다.
interface TagItem {
    id: number;
    label: string;
}

interface TagSelectorProps {
    items: TagItem[];
}

function TagSelector({ items }: TagSelectorProps) {
    // 선택된 태그들의 id를 저장할 배열 상태를 만듭니다.
    const [selectedTags, setSelectedTags] = useState<number[]>([]);

    // 태그를 클릭했을 때 호출될 함수
    const handleTagClick = (tagId: number) => {
        // 이미 선택된 태그인지 확인
        if (selectedTags.includes(tagId)) {
            // 선택된 태그이면 배열에서 제거 (선택 해제)
            setSelectedTags(selectedTags.filter((id) => id !== tagId));
        } else {
            // 선택되지 않았으면 배열에 추가 (선택)
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <button
                    key={item.id}
                    className={`
                        px-4 py-2 rounded-full border border-gray-300
                        font-medium text-sm transition-colors duration-200
                        ${selectedTags.includes(item.id) 
                            ? 'bg-black text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }
                    `}
                    onClick={() => handleTagClick(item.id)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

export default TagSelector;