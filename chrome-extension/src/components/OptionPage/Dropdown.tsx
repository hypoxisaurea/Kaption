// src/components/Dropdown.tsx

import React from 'react';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';

interface DropdownItem {
    id: number;
    label: string;
}

interface DropdownProps {
    items: DropdownItem[];
    value?: number | null;
    onChange?: (id: number, item: DropdownItem) => void;
}

function Dropdown({ items, value = null, onChange }: DropdownProps) {
    const normalizedValue = value ?? '';

    const handleChange = (event: SelectChangeEvent) => {
        const raw = event.target.value as string;
        if (raw === '') return;
        const selectedId = Number(raw);
        const selectedItem = items.find(i => i.id === selectedId);
        if (!selectedItem) return;
        onChange?.(selectedItem.id, selectedItem);
    };

    return (
        <div className="w-full">
            <FormControl variant="standard" fullWidth size="small">
                <Select
                    displayEmpty
                    value={normalizedValue as any}
                    onChange={handleChange}
                    renderValue={(selected) => {
                        const selectedItem = items.find(i => i.id === Number(selected));
                        return selectedItem?.label ?? String(selected);
                    }}
                    inputProps={{ 'aria-label': 'Dropdown select' }}
                >
                    {items.map(item => (
                        <MenuItem sx={{ fontSize: '0.9rem', color: '#1b1b1b' }} key={item.id} value={item.id}>{item.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
}

export default Dropdown;