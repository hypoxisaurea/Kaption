import React, { ReactNode } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, SxProps, Theme } from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'children'> {
    children: ReactNode;
    bgColor?: string;
    textColor?: string;
    paddingX?: string | number;
    paddingY?: string | number;
    width?: string | number;
    height?: string | number;
    className?: string;
}

function Button({ 
    bgColor = '#1b1b1b', 
    textColor, 
    children, 
    fullWidth, 
    size = 'medium', 
    paddingX, 
    paddingY, 
    width, 
    height, 
    className = '', 
    sx,
    ...muiProps 
}: ButtonProps) {
    const defaultPY = '0.85vh';
    
    const customSx: SxProps<Theme> = {
        ...(fullWidth && { width: '100%' }),
        ...(width && { width }),
        ...(height && { height }),
        ...(paddingX !== undefined && { 
            paddingLeft: String(paddingX), 
            paddingRight: String(paddingX) 
        }),
        ...(paddingY !== undefined && { 
            paddingTop: String(paddingY), 
            paddingBottom: String(paddingY) 
        }),
        ...(paddingY === undefined && { 
            paddingTop: defaultPY, 
            paddingBottom: defaultPY 
        }),
        backgroundColor: bgColor,
        ...(textColor && { color: textColor }),
        borderRadius: '9999px',
        fontFamily: 'Spoqa Han Sans Neo, sans-serif',
        textTransform: 'none',
        ...sx,
    };

    return (
        <MuiButton variant="contained"
            className={className}
            sx={customSx}
            fullWidth={fullWidth}
            size={size}
            {...muiProps}
        >
            {children}
        </MuiButton>
    );
}

export default Button;