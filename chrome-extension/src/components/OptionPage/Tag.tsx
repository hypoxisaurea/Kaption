// src/components/OptionPage/TagSelector.tsx

import React, { useState } from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

interface TagItem {
    id: number;
    label: string;
}

interface TagSelectorProps {
    items: TagItem[];
    value?: number[];
    onChange?: (ids: number[]) => void;
}

function TagSelector({ items, value, onChange }: TagSelectorProps) {
    const [uncontrolledSelected, setUncontrolledSelected] = useState<number[]>([]);
    const isControlled = Array.isArray(value);
    const selectedTags = isControlled ? (value as number[]) : uncontrolledSelected;

    const handleTagClick = (tagId: number) => {
        const next = selectedTags.includes(tagId)
            ? selectedTags.filter((id) => id !== tagId)
            : [...selectedTags, tagId];
        if (onChange) {
            onChange(next);
        } else {
            setUncontrolledSelected(next);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {items.map((item) => {
                const isSelected = selectedTags.includes(item.id);
                return (
                    <Chip
                        key={item.id}
                        label={item.label}
                        clickable
                        variant={isSelected ? 'filled' : 'outlined'}
                        onClick={() => handleTagClick(item.id)}
                        sx={{ borderRadius: '9999px',
                            ...(isSelected
                                ? {
                                    // Chip 기본 변형 스타일보다 우선 적용되도록 강제
                                    backgroundColor: 'rgba(46, 196, 182, 0.45) !important',
                                    color: 'rgb(0, 0, 0) !important',
                                    borderColor: 'rgba(46, 196, 182, 0.45) !important',
                                    '& .MuiChip-label': { color: 'rgb(0, 0, 0) !important' },
                                    '&:hover': { backgroundColor: 'rgba(46, 196, 182, 0.6) !important' },
                                }
                                : {
                                    backgroundColor: 'transparent',
                                    color: 'text.primary',
                                    borderColor: 'grey.300',
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                }),
                        }}
                    />
                );
            })}
        </Box>
    );
}

export default TagSelector;