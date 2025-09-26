import React from 'react';
import { styled } from '@mui/material/styles';
import Rating from '@mui/material/Rating';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface StarRatingProps {
  value: number;
  onChange: (newValue: number | null) => void;
}

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: 'rgba(255, 140, 122)',
  },
  '& .MuiRating-iconHover': {
    color: '#ff3d47',
  },
});

function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex flex-row items-center justify-center space-x-1">
      <StyledRating
        name="customized-color"
        value={value}
        onChange={(_, newValue) => {
          onChange(newValue);
        }}
        getLabelText={(value: number) => `${value} Heart${value !== 1 ? 's' : ''}`}
        precision={1}
        icon={<FavoriteIcon fontSize="inherit" />}
        emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
      />
    </div>
  );
}

export default StarRating;
